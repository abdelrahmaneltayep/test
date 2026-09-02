/**
 * Field validation for the match request — the quantity and the price.
 *
 * Pure, and deliberately outside the component. The rules are the part of this form that
 * has to be exactly right: they decide whether a buyer can send at all, and every one of
 * them is a sentence someone will read at the worst moment. A table of cases can be tested
 * against every boundary; the same rules spread through JSX cannot.
 *
 * Each check returns a **case id and its parameters**, never a sentence. The words live in
 * i18n like every other string (FR-11.3), so the two languages cannot drift apart and a
 * copy change never touches the logic.
 *
 * Severity matters as much as the case. An `error` blocks the send; a `warning` does not —
 * EC-8's implausible ask is deliberately sendable, flagged to the seller — and a `hint` is
 * neither, just the instruction the field needs before anything is typed.
 */

import { IMPLAUSIBLE_ASK_RATIO } from './guardrails'
import { ACCEPTED_MIME_TYPES, MAX_FILE_BYTES, MAX_FILE_NAME_CHARS, MAX_FILES_PER_LINE } from './proof'
import type { Minor, Product, SaleUnit } from './types'

export type Severity = 'error' | 'warning' | 'hint'

export interface Finding {
  /** The i18n key. Named for the case, not for the field it happens to sit under. */
  key: string
  severity: Severity
  params: Record<string, string | number>
}

const err = (key: string, params: Finding['params'] = {}): Finding => ({ key, severity: 'error', params })
const warn = (key: string, params: Finding['params'] = {}): Finding => ({ key, severity: 'warning', params })
const hint = (key: string, params: Finding['params'] = {}): Finding => ({ key, severity: 'hint', params })

/**
 * Beyond this a number has stopped being a quantity and become a typo or an overflow. It
 * is checked before the business caps so the message is about the number rather than
 * offering to sell someone nine hundred million cartons if only they had asked for fewer.
 */
export const ABSURD_QUANTITY = 1_000_000

/** The unit noun each message counts in, keyed for i18n. */
export const SALE_UNIT_KEY: Record<SaleUnit, string> = {
  carton: 'unitCartons', case: 'unitCases', pallet: 'unitPallets',
  kg: 'unitKg', g: 'unitGrams', litre: 'unitLitres', ml: 'unitMillilitres',
}

/** The "this product is sold by …" instruction, where the unit has one. */
const SOLD_BY_KEY: Partial<Record<SaleUnit, string>> = {
  carton: 'soldByCarton', case: 'soldByCase', pallet: 'soldByPallet',
  kg: 'soldByWeight', g: 'soldByWeight', litre: 'soldByVolume', ml: 'soldByVolume',
}

/** The instruction the field carries before the buyer has typed anything. */
export function quantityHint(product: Product): Finding | null {
  const key = SOLD_BY_KEY[product.saleUnit]
  return key ? hint(key, { unit: SALE_UNIT_KEY[product.saleUnit] }) : null
}

/**
 * Validate the requested quantity.
 *
 * Order is the design here, not an implementation detail. Cheapest and most specific
 * first: whether the product can be asked about at all, then whether the text is a number,
 * then what the number is, then what the business says about it. Reversing any pair
 * produces a true sentence that is not the one the buyer needs — "the minimum is 10" on
 * the text "abc" being the clearest example.
 */
export function validateQuantity(raw: string, product: Product, opts: { touched: boolean }): Finding | null {
  if (!product.inStock && !product.backorderable) return err('productUnavailable')

  const text = raw.trim()
  if (text === '') return opts.touched ? err('qtyEmpty') : null
  // Letters and symbols are their own case: "enter a whole number" does not tell someone
  // who typed "10 cartons" which half of that to remove.
  if (!/^\d+$/.test(text)) return err('qtyNotNumeric')

  const qty = Number(text)
  if (qty === 0) return err('qtyZero')
  if (qty > ABSURD_QUANTITY) return err('qtyTooLarge')

  const unit = SALE_UNIT_KEY[product.saleUnit]
  if (qty < product.minOrderQty) return err('qtyBelowMinimum', { min: product.minOrderQty, unit })
  if (qty > product.maxRequestQty) return err('qtyAboveMaximum', { max: product.maxRequestQty, unit })
  if (qty > product.stockQty) return err('qtyExceedsStock', { stock: product.stockQty, unit })
  if (product.orderMultiple > 1 && qty % product.orderMultiple !== 0) {
    return err('qtyNotMultiple', { multiple: product.orderMultiple, unit })
  }
  /*
   * Last, and a warning rather than a block. The quantity is orderable — it simply does not
   * reach the threshold a special price needs, and the buyer is better told that than
   * refused: the way out is to raise the number, not to abandon the form.
   */
  if (qty < product.specialPriceMinQty) {
    return warn('qtySpecialPriceMinimum', { min: product.specialPriceMinQty, unit })
  }
  return null
}

/** Below this share of the current price the ask is out of range and blocked. */
export const PRICE_RANGE_MIN_RATIO = 0.1
/**
 * Below this share it is merely implausible: a warning, and still sendable (EC-8).
 * Taken from the guardrail rather than restated, so the sentence the buyer reads and the
 * rule that flags the request for the seller can never disagree about where the line is.
 */
export const PRICE_IMPLAUSIBLE_RATIO = IMPLAUSIBLE_ASK_RATIO
/** BHD is a three-decimal currency (A5), so a fourth decimal is a mistake, not precision. */
export const PRICE_DECIMALS = 3

/**
 * Validate the requested price against the price it is asking to beat.
 *
 * `current` is in minor units, and so is the returned `price` parameter — formatting is
 * the caller's business, because only the caller knows the locale it is rendering into.
 */
export function validatePrice(
  raw: string, current: Minor, opts: { touched: boolean },
): Finding | null {
  const text = raw.trim()
  if (text === '') return opts.touched ? err('priceEmpty') : null

  // A currency symbol or a letter is a formatting mistake with its own fix — telling
  // someone who typed "BHD 4.0" that their price is not a number is not that fix.
  if (/[^\d.,\s]/.test(text)) return err('priceFormat')

  const normalised = text.replace(/[\s,]/g, '')
  if (!/^\d*\.?\d*$/.test(normalised) || normalised === '' || normalised === '.') {
    return err('priceInvalid')
  }
  const decimals = normalised.split('.')[1]?.length ?? 0
  if (decimals > PRICE_DECIMALS) return err('priceDecimals', { max: PRICE_DECIMALS })

  // Minor units, rounded rather than truncated: 4.0155 already failed the decimal check,
  // so anything reaching here is exact to three places and the rounding is a formality.
  const price = Math.round(Number(normalised) * 1000)
  if (price <= 0) return err('priceNonPositive')
  if (price === current) return err('priceSameAsCurrent')
  if (price > current) return err('priceNotLower', { price: current })
  if (price < current * PRICE_RANGE_MIN_RATIO) return err('priceOutOfRange')
  if (price < current * PRICE_IMPLAUSIBLE_RATIO) return warn('priceTooLow')
  return null
}

/** The value a valid price parses to, for the caller that has already validated it. */
export function parsePriceMinor(raw: string): Minor | null {
  const normalised = raw.trim().replace(/[\s,]/g, '')
  if (!/^\d*\.?\d+$/.test(normalised) && !/^\d+\.?\d*$/.test(normalised)) return null
  const n = Number(normalised)
  return Number.isFinite(n) ? Math.round(n * 1000) : null
}

/**
 * Validate one offered file against the rules and against what is already attached.
 *
 * `existing` is the list it would join, so the two rules that are about the *set* rather
 * than the file — the cap and the duplicate — can be answered here with everything else
 * instead of being left to the component to remember.
 *
 * The cap is checked first because it is the one answer that does not depend on the file:
 * at three attachments the fix is to remove one, whatever the fourth one happens to be.
 */
export function validateFile(
  file: { name: string; size: number; type: string },
  existing: { name: string; size: number }[],
): Finding | null {
  if (existing.length >= MAX_FILES_PER_LINE) return err('fileTooMany', { max: MAX_FILES_PER_LINE })
  if (file.name.length > MAX_FILE_NAME_CHARS) return err('fileNameTooLong', { max: MAX_FILE_NAME_CHARS })
  // A zero-byte file is the shape a cancelled scan or an interrupted copy arrives in.
  if (file.size === 0) return err('fileEmptyOrCorrupt')
  if (file.size > MAX_FILE_BYTES) return err('fileTooLarge', { max: MAX_FILE_BYTES / (1024 * 1024) })
  // An empty type is what some browsers report for a file they could not sniff; it is not
  // by itself a rejection, and the server checks contents rather than trusting this (FR-7.1).
  if (file.type && !(ACCEPTED_MIME_TYPES as readonly string[]).includes(file.type)) {
    return err('fileUnsupportedType')
  }
  /*
   * Name and size, not contents. A hash would be exact, and the server takes one (FR-1.6,
   * EC-32) — but this check has to answer before the upload, and "same name, same bytes"
   * is what a buyer means when they attach the same invoice twice by accident.
   */
  if (existing.some((e) => e.name === file.name && e.size === file.size)) return err('fileDuplicate')
  return null
}
