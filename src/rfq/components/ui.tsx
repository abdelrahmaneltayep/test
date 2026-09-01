/**
 * Shared primitives for the three surfaces.
 *
 * FR-11.5 is the governing rule here: status is conveyed by text *and* colour, never by
 * colour alone, and every disabled control states its reason (E-2) somewhere a keyboard
 * user can reach.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { formatCountdown, remainingMs } from '../domain/clocks'
import { formatMoney } from '../domain/money'
import { STATE_META, type RequestState } from '../domain/states'
import type { Lang } from '../domain/i18n'
import { t } from '../domain/i18n'
import type { CheckSeverity, Minor, Product, RequestLine } from '../domain/types'

/**
 * Inline marks for the compact card CTA.
 *
 * Drawn rather than typed: an emoji would carry its own colour into a button that changes
 * ground with its state, and at 15px the difference between a tag and a price tag emoji is
 * the difference between a legible affordance and a smudge. `currentColor` keeps them in
 * step with the label they sit beside.
 */
export function TagMark({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <path
        d="M8.6 1.6H14.4V7.4L7.7 14.1a1 1 0 0 1-1.4 0L1.9 9.7a1 1 0 0 1 0-1.4L8.6 1.6Z"
        stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"
      />
      <circle cx="11.3" cy="4.7" r="1.15" fill="currentColor" />
    </svg>
  )
}

export function EyeMark({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <path
        d="M1 8s2.6-4.3 7-4.3S15 8 15 8s-2.6 4.3-7 4.3S1 8 1 8Z"
        stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"
      />
      <circle cx="8" cy="8" r="1.9" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

export function CartMark({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <path
        d="M1 1.6h1.9l1.6 7.7h7.2l1.4-5.4H4"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
      />
      <circle cx="6.2" cy="13" r="1.2" fill="currentColor" />
      <circle cx="11.6" cy="13" r="1.2" fill="currentColor" />
    </svg>
  )
}

export function Money({ value, lang, withCurrency }: { value: Minor | null; lang?: Lang; withCurrency?: boolean }) {
  // AC-9.2 — a missing value renders "—", never a fabricated or inferred number.
  if (value === null) return <span className="hb-num hb-muted">—</span>
  return <span className="hb-num">{formatMoney(value, { withCurrency, lang })}</span>
}

/**
 * Feature Flow Draft §1 — which of the two routes a request took, on the row.
 *
 * One item per request (§2) means one route per request in practice. It is still derived
 * from the lines rather than assumed, and still renders both where both appear, because
 * FR-1.9 keeps a many-line request reachable and a row that lied about it would be worse
 * than a row with two tags.
 */
/**
 * The product, as a two-line list item.
 *
 * A request is about one item (draft §2), and the buyer opened this from a card. Repeating
 * the card's own three facts — the image, the name, the price — is what tells them the
 * form is pointed at the thing they clicked, before they type a target price against it.
 * The second line carries the identifiers that matter when the seller reads it back: the
 * SKU and the pack size, which is the unit the quantity field is counting.
 */
export function ProductListItem({ product, price, lang }: {
  product: Product
  /** FR-8.5 — an agreed price replaces the list price wherever the product is shown. */
  price?: Minor | null
  lang: Lang
}) {
  return (
    <div className="hb-listitem">
      <span className="hb-listitem-media" aria-hidden="true">{product.emoji}</span>
      <span className="hb-listitem-text">
        <b className="hb-listitem-title">{product.name[lang]}</b>
        <span className="hb-listitem-sub">{product.sku} · {product.packSize}</span>
      </span>
      <span className="hb-listitem-price">
        <small>{t(lang, 'listPrice')}</small>
        <Money value={price ?? product.listPrice} lang={lang} withCurrency />
      </span>
    </div>
  )
}

export function RouteTags({ lines, lang }: { lines: RequestLine[]; lang: Lang }) {
  const hasCase1 = lines.some((l) => l.route === 'case_1')
  const hasCase2 = lines.some((l) => l.route === 'case_2')
  return (
    <span className="hb-routetags">
      {hasCase1 && <span className="hb-pill hb-pill--info">{t(lang, 'tabSpecialPrice')}</span>}
      {hasCase2 && <span className="hb-pill hb-pill--neutral">{t(lang, 'tabRfq')}</span>}
    </span>
  )
}

export function StatusPill({ state, viewer, lang }: { state: RequestState; viewer: 'buyer' | 'seller'; lang: Lang }) {
  const meta = STATE_META[state]
  const label = viewer === 'buyer' ? meta.buyerLabel : meta.sellerLabel
  if (!label) return null
  const tone =
    meta.terminal && state === 'accepted' ? 'good'
      : meta.terminal && state === 'declined' ? 'bad'
        : meta.terminal ? 'neutral'
          : viewer === 'buyer' && meta.buyerActionRequired ? 'action'
            : state === 'submitted' ? 'info'
              : 'neutral'
  return <span className={`hb-pill hb-pill--${tone}`}>{label[lang]}</span>
}

/**
 * EC-18 — the countdown is interpolated client-side from a server-supplied reference
 * time. Both surfaces call this with the same `now`, which is what makes FR-4.6's
 * "consistent to the minute" hold.
 */
export function Countdown({ dueAt, now, lang, escalate }: { dueAt: string | null; now: Date; lang: Lang; escalate?: boolean }) {
  const ms = remainingMs(dueAt, now)
  if (ms === null) return <span className="hb-muted">—</span>
  const text = formatCountdown(ms, lang)
  if (ms <= 0) return <span className="hb-pill hb-pill--bad">{text}</span>
  if (escalate) return <span className="hb-pill hb-pill--warn">{text}</span>
  return <span className="hb-num">{text}</span>
}

const CHECK_TONE: Record<CheckSeverity, string> = {
  pass: 'good', warn: 'warn', fail: 'bad', not_run: 'neutral',
}

const CHECK_WORD: Record<CheckSeverity, { en: string; ar: string }> = {
  pass: { en: 'Pass', ar: 'مطابق' },
  warn: { en: 'Warn', ar: 'تنبيه' },
  fail: { en: 'Fail', ar: 'غير مطابق' },
  not_run: { en: 'Not run', ar: 'لم يُنفَّذ' },
}

/** AC-16.2 — pass / warn / fail with the specific reason, never a bare icon. */
export function CheckBadge({ severity, lang }: { severity: CheckSeverity; lang: Lang }) {
  return <span className={`hb-pill hb-pill--${CHECK_TONE[severity]}`}>{CHECK_WORD[severity][lang]}</span>
}

export function Modal({ title, onClose, children, footer, wide, drawer }: {
  title: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
  /**
   * A drawer rather than a centred dialog: anchored to the inline-end edge, full height,
   * with the head and the footer pinned and only the body scrolling. Long forms belong
   * here — the send button stays reachable however far the buyer has scrolled, and the
   * marketplace stays visible behind, which is where they came from. Short confirmations
   * do not: a dialog that asks one question should sit in the middle and be dismissed.
   */
  drawer?: boolean
}) {
  const shape = drawer ? ' hb-modal--drawer' : wide ? ' hb-modal--wide' : ''
  return (
    <div
      className={`hb-overlay${drawer ? ' hb-overlay--drawer' : ''}`}
      role="dialog" aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`hb-modal${shape}`}>
        <div className="hb-modal-head">
          <div>{title}</div>
          <button type="button" className="hb-btn hb-btn--quiet" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="hb-modal-body">{children}</div>
        {footer && <div className="hb-modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

export function Field({ label, hint, error, warning, children }: {
  label: string
  hint?: string
  error?: string | null
  warning?: string | null
  children: ReactNode
}) {
  return (
    <label className="hb-field">
      <span className="hb-label">{label}</span>
      {children}
      {hint && <div className="hb-hint">{hint}</div>}
      {/* E-1 — the constraint and the value that breached it, not "invalid input". */}
      {error && <div className="hb-error" role="alert">{error}</div>}
      {warning && <div className="hb-warning">{warning}</div>}
    </label>
  )
}

/** The live product's empty state: an orange outline icon above an orange subject line. */
export function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="hb-empty">
      <div className="hb-empty-icon" aria-hidden="true">🗂</div>
      <h3>{title}</h3>
      <p className="hb-sub">{body}</p>
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  )
}

/**
 * The incentive tooltip on the product card.
 *
 * A `title` attribute would have been one line of code and wrong: it never appears on a
 * touch device, it cannot be reached from the keyboard on most browsers, and it is the
 * only place this feature tells a buyer what they get for the trouble of finding an
 * invoice. So it is a real disclosure — a button that toggles a panel, dismissible with
 * Escape or a click outside, and labelled with the question it answers rather than "info".
 *
 * It opens on click rather than hover for the same reason: on a phone there is no hover,
 * and a card is exactly where a hover-only affordance goes unnoticed.
 */
export function InfoTip({ lang, title, body }: { lang: Lang; title?: string; body: string }) {
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open])

  return (
    <span className="hb-tip" ref={wrap}>
      <button
        type="button" className="hb-tip-btn"
        aria-expanded={open}
        aria-label={t(lang, 'incentiveAria')}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
      >
        <span aria-hidden="true">i</span>
      </button>
      {open && (
        <span className="hb-tip-panel" role="dialog" aria-label={t(lang, 'incentiveAria')}>
          {title && <strong>{title}</strong>}
          <span>{body}</span>
          <button type="button" className="hb-btn hb-btn--quiet hb-btn--sm" onClick={() => setOpen(false)}>
            {t(lang, 'incentiveClose')}
          </button>
        </span>
      )}
    </span>
  )
}
