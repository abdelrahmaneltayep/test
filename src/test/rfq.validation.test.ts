/**
 * The 15 quantity cases, the 9 price cases and the 8 file cases, at their boundaries.
 *
 * The order of the checks is the thing worth pinning: several of these inputs are wrong in
 * more than one way at once, and the message the buyer gets has to be the one they can act
 * on. "Enter numbers only" beats "the minimum is 10" on the text "abc"; the pack multiple
 * beats the special-price threshold on a number that fails both.
 */
import { describe, it, expect } from 'vitest'
import {
  validateQuantity, validatePrice, validateFile, quantityHint, ABSURD_QUANTITY,
} from '@/rfq/domain/validation'
import { MAX_FILE_BYTES, MAX_FILE_NAME_CHARS, MAX_FILES_PER_LINE } from '@/rfq/domain/proof'
import type { Product } from '@/rfq/domain/types'

const P: Product = {
  sku: 'HB-TEST', name: { en: 'Test', ar: 'اختبار' }, brand: 'B',
  category: { en: 'C', ar: 'ج' }, emoji: '📦', packSize: '1',
  unitOfMeasure: { en: 'carton', ar: 'كرتون' }, baseUnit: { en: 'units', ar: 'وحدة' },
  unitsPerCase: 1, listPrice: 10_000, tiers: [], cost: 6_000, floorPrice: 8_000,
  inStock: true, backorderable: true,
  saleUnit: 'carton', minOrderQty: 10, specialPriceMinQty: 20,
  maxRequestQty: 400, stockQty: 120, orderMultiple: 5, excluded: false,
}
const touched = { touched: true }
const q = (raw: string, over: Partial<Product> = {}) => validateQuantity(raw, { ...P, ...over }, touched)

describe('quantity — the fifteen cases', () => {
  it('says nothing before the buyer has tried', () => {
    expect(validateQuantity('', P, { touched: false })).toBeNull()
  })
  it('empty, once they have', () => expect(q('')?.key).toBe('qtyEmpty'))
  it('zero', () => expect(q('0')?.key).toBe('qtyZero'))
  it('letters and symbols, before any arithmetic', () => {
    expect(q('abc')?.key).toBe('qtyNotNumeric')
    expect(q('10 cartons')?.key).toBe('qtyNotNumeric')
    expect(q('1.5')?.key).toBe('qtyNotNumeric')
    expect(q('-5')?.key).toBe('qtyNotNumeric')
  })
  it('absurdly large, before the business cap', () => {
    const f = q(String(ABSURD_QUANTITY + 1))
    expect(f?.key).toBe('qtyTooLarge')
  })
  it('below the minimum order, naming both the number and the unit', () => {
    expect(q('5')).toEqual({ key: 'qtyBelowMinimum', severity: 'error', params: { min: 10, unit: 'unitCartons' } })
  })
  it('above the per-request maximum', () => {
    expect(q('500', { stockQty: 99_999 })?.key).toBe('qtyAboveMaximum')
  })
  it('beyond available stock', () => {
    expect(q('200')).toEqual({ key: 'qtyExceedsStock', severity: 'error', params: { stock: 120, unit: 'unitCartons' } })
  })
  it('off the pack multiple', () => {
    expect(q('22')).toEqual({ key: 'qtyNotMultiple', severity: 'error', params: { multiple: 5, unit: 'unitCartons' } })
  })
  it('ignores the multiple where the product has none', () => {
    expect(q('22', { orderMultiple: 1 })).toBeNull()
  })
  // Orderable, just not enough to negotiate on: a warning, because the way out is a
  // bigger number rather than a different form.
  it('below the special-price threshold warns and does not block', () => {
    const f = q('15')
    expect(f).toEqual({ key: 'qtySpecialPriceMinimum', severity: 'warning', params: { min: 20, unit: 'unitCartons' } })
  })
  it('accepts a quantity that clears every rule', () => expect(q('20')).toBeNull())
  it('refuses outright where the product cannot be supplied', () => {
    expect(q('20', { inStock: false, backorderable: false })?.key).toBe('productUnavailable')
  })
  it('checks availability before it looks at the text at all', () => {
    expect(q('abc', { inStock: false, backorderable: false })?.key).toBe('productUnavailable')
  })

  it('carries the sold-by instruction for every unit kind', () => {
    expect(quantityHint({ ...P, saleUnit: 'carton' })?.key).toBe('soldByCarton')
    expect(quantityHint({ ...P, saleUnit: 'case' })?.key).toBe('soldByCase')
    expect(quantityHint({ ...P, saleUnit: 'pallet' })?.key).toBe('soldByPallet')
    expect(quantityHint({ ...P, saleUnit: 'kg' })?.key).toBe('soldByWeight')
    expect(quantityHint({ ...P, saleUnit: 'litre' })?.key).toBe('soldByVolume')
  })
})

const CURRENT = 4_015
const pr = (raw: string) => validatePrice(raw, CURRENT, touched)

describe('price — the nine cases', () => {
  it('says nothing before the buyer has tried', () => {
    expect(validatePrice('', CURRENT, { touched: false })).toBeNull()
  })
  it('empty, once they have', () => expect(pr('')?.key).toBe('priceEmpty'))
  it('currency symbols and letters are a format problem, not an invalid number', () => {
    expect(pr('BHD 4.0')?.key).toBe('priceFormat')
    expect(pr('4.0 BHD')?.key).toBe('priceFormat')
    expect(pr('$4')?.key).toBe('priceFormat')
  })
  it('unparseable digits are invalid', () => {
    expect(pr('1.2.3')?.key).toBe('priceInvalid')
    expect(pr('.')?.key).toBe('priceInvalid')
  })
  it('more than three decimals', () => {
    expect(pr('3.9999')).toEqual({ key: 'priceDecimals', severity: 'error', params: { max: 3 } })
    expect(pr('3.999')?.key).not.toBe('priceDecimals')
  })
  it('zero or negative', () => expect(pr('0')?.key).toBe('priceNonPositive'))
  it('the same as the current price', () => expect(pr('4.015')?.key).toBe('priceSameAsCurrent'))
  it('not lower, and it names the price to beat', () => {
    expect(pr('5.000')).toEqual({ key: 'priceNotLower', severity: 'error', params: { price: CURRENT } })
  })
  it('outside the allowed range, below a tenth of current', () => {
    expect(pr('0.300')?.key).toBe('priceOutOfRange')
  })
  it('implausibly low warns, and still sends', () => {
    const f = pr('1.500')
    expect(f?.key).toBe('priceTooLow')
    expect(f?.severity).toBe('warning')
  })
  it('accepts a price that clears every rule', () => expect(pr('3.500')).toBeNull())
  // Thousands separators and stray spaces are how people paste a price, not an error.
  it('reads a price with separators and spaces', () => expect(pr(' 3.500 ')).toBeNull())
})

describe('file validation', () => {
  const ok = { name: 'invoice.pdf', size: 200_000, type: 'application/pdf' }
  const fv = (f: Partial<typeof ok>, existing: { name: string; size: number }[] = []) =>
    validateFile({ ...ok, ...f }, existing)

  it('accepts a file that clears every rule', () => expect(fv({})).toBeNull())

  it('rejects an unsupported type', () => {
    expect(fv({ name: 'sheet.xlsx', type: 'application/vnd.ms-excel' })?.key).toBe('fileUnsupportedType')
  })
  // FR-7.1 sniffs contents on the server. A browser that reports nothing is not a refusal.
  it('lets a file with no reported type through to the server check', () => {
    expect(fv({ type: '' })).toBeNull()
  })
  it('rejects a file over the size limit, and names the limit in MB', () => {
    expect(fv({ size: MAX_FILE_BYTES + 1 })).toEqual({
      key: 'fileTooLarge', severity: 'error', params: { max: 10 },
    })
    expect(fv({ size: MAX_FILE_BYTES })).toBeNull()
  })
  it('rejects an empty file before it rejects it for anything else', () => {
    expect(fv({ size: 0, type: 'application/x-msdownload' })?.key).toBe('fileEmptyOrCorrupt')
  })
  it('rejects a name longer than the limit', () => {
    expect(fv({ name: `${'a'.repeat(MAX_FILE_NAME_CHARS)}.pdf` })?.key).toBe('fileNameTooLong')
    expect(fv({ name: `${'a'.repeat(MAX_FILE_NAME_CHARS - 4)}.pdf` })).toBeNull()
  })
  it('rejects the same file twice, by name and size together', () => {
    expect(fv({}, [{ name: 'invoice.pdf', size: 200_000 }])?.key).toBe('fileDuplicate')
    // Same name, different bytes: two pages of a scan, not a repeat.
    expect(fv({}, [{ name: 'invoice.pdf', size: 200_001 }])).toBeNull()
  })
  it('refuses anything once the cap is reached, whatever the file is', () => {
    const full = Array.from({ length: MAX_FILES_PER_LINE }, (_, i) => ({ name: `p${i}.pdf`, size: 10 }))
    expect(fv({ size: MAX_FILE_BYTES + 1 }, full)).toEqual({
      key: 'fileTooMany', severity: 'error', params: { max: MAX_FILES_PER_LINE },
    })
  })
})
