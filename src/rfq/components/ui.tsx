/**
 * Shared primitives for the three surfaces.
 *
 * FR-11.5 is the governing rule here: status is conveyed by text *and* colour, never by
 * colour alone, and every disabled control states its reason (E-2) somewhere a keyboard
 * user can reach.
 */

import type { ReactNode } from 'react'
import { formatCountdown, remainingMs } from '../domain/clocks'
import { formatMoney } from '../domain/money'
import { STATE_META, type RequestState } from '../domain/states'
import type { Lang } from '../domain/i18n'
import type { CheckSeverity, Minor } from '../domain/types'

export function Money({ value, lang, withCurrency }: { value: Minor | null; lang?: Lang; withCurrency?: boolean }) {
  // AC-9.2 — a missing value renders "—", never a fabricated or inferred number.
  if (value === null) return <span className="hb-num hb-muted">—</span>
  return <span className="hb-num">{formatMoney(value, { withCurrency, lang })}</span>
}

export function StatusPill({ state, viewer, lang }: { state: RequestState; viewer: 'buyer' | 'seller'; lang: Lang }) {
  const meta = STATE_META[state]
  const label = viewer === 'buyer' ? meta.buyerLabel : meta.sellerLabel
  if (!label) return null
  const tone =
    meta.terminal && (state === 'accepted' || state === 'accepted_as_template') ? 'good'
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

export function Modal({ title, onClose, children, footer, wide }: {
  title: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  return (
    <div className="hb-overlay" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={`hb-modal${wide ? ' hb-modal--wide' : ''}`}>
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
