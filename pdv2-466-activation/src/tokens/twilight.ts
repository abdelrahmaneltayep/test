/**
 * Salla Twilight token map.
 *
 * Source of truth: the Salla DS component kit (abdelrahmaneltayep/salla-ds),
 * which mirrors the live merchant dashboard runtime.
 *
 * ── WHAT IS REAL ───────────────────────────────────────────────
 * These are the ONLY colour custom properties the kit publishes:
 *   --primary --primary-100 --primary-400
 *   --secondary --secondary-100
 *   --gray-100 --gray-200 --gray-400 --gray-500
 *   --dark --dark-100 --dark-200
 *   --danger --success
 *
 * ── WHAT IS NOT ────────────────────────────────────────────────
 * `warning` and `info` exist ONLY as component theme values
 * (<s-tag theme="warning">, <s-alert-box theme="info">, <s-button theme="warning">).
 * The kit publishes NO hex for either.
 *
 *   → Engineering rule: never hard-code a warning/info colour.
 *     Pass theme="warning" / theme="info" to the Twilight component and let
 *     the runtime resolve it. This file exposes them as THEME NAMES only,
 *     with no value, so a hex literal cannot leak in by accident.
 *
 * Anything below marked UNMAPPED needs a decision from the DS owner before
 * this ships. It is flagged, not guessed.
 */

export const TOKEN_HEX = {
  /** Brand primary. Abdelrahman confirmed #004956; the kit ships #004A57.
   *  A 1-digit delta — almost certainly a transcription variance between
   *  Figma and the runtime CSS. Using the confirmed value; see UNMAPPED below. */
  primary: '#004956',
  'primary-100': '#F1F8F9',
  'primary-400': '#348D9D',
  secondary: '#A3FFE5',
  'secondary-100': '#F0FFFB',
  'gray-100': '#FCFCFC',
  'gray-200': '#F7F7F7',
  'gray-400': '#EDEDED',
  'gray-500': '#DEDEDE',
  dark: '#333333',
  'dark-100': '#737373',
  'dark-200': '#666666',
  danger: '#F55157',
  success: '#00AD6B',
} as const;

export const RADIUS = { lg: '8px', xl: '12px' } as const;
export const SHADOW = { sm: '0 2px 4px 0 rgba(0,0,0,.08)' } as const;
export const FONT_STACK = "'PingARLT','IBM Plex Sans Arabic','PT Sans',system-ui,-apple-system,'Segoe UI',sans-serif";

/** Theme names with no published hex — resolved by the Twilight runtime. */
export type RuntimeTheme =
  | 'default' | 'secondary' | 'success' | 'danger'
  | 'warning' | 'info' | 'feature' | 'transparent' | 'white' | 'mahally';

/** Which components actually accept which theme. Verified against the kit. */
export const THEME_SUPPORT = {
  button:   ['default','primary','secondary','danger','warning','info','feature','transparent','white','mahally'],
  tag:      ['default','secondary','success','danger','warning','info','feature','transparent','white','mahally'],
  alertBox: ['default','secondary','danger','warning','info'],
} as const;

/**
 * Open items for the design-system owner. Each blocks a colour decision.
 */
export const UNMAPPED = [
  {
    item: 'brand primary value',
    detail: 'Confirmed as #004956; the DS kit runtime ships #004A57. One-digit delta.',
    impact: 'Cosmetic but systemic — every primary surface. Pick one and correct the other source.',
    owner: 'DS owner',
  },
  {
    item: 'warning colour',
    detail: 'No published hex. Exists only as theme="warning" on button / tag / alert-box.',
    impact: 'Route-conflict and fees-consent surfaces. Handled by passing the theme; no hex used.',
    owner: 'DS owner — publish a token, or confirm theme-only is intended',
  },
  {
    item: 'info colour',
    detail: 'No published hex. Exists only as theme="info".',
    impact: 'Multi-Branch enablement notice. Handled by passing the theme.',
    owner: 'DS owner — same as above',
  },
  {
    item: 'success as a Button theme',
    detail: '--success has a hex (#00AD6B) and <s-tag theme="success"> works, but <s-button> has NO success theme — the kit marks it Figma-only.',
    impact: 'The activation success CTA cannot be a green button. Uses theme="default".',
    owner: 'DS owner',
  },
  {
    item: '--dark-100 on --gray-200',
    detail: 'Measured 4.43 — fails WCAG AA for small text. --dark-100 is safe on white (4.74) and --gray-100 (4.62) only.',
    impact: 'All secondary body text. This build uses --dark-200 (5.36 on gray-200), which is also a real token — no invented value.',
    owner: 'DS owner — worth documenting the surface restriction on --dark-100',
  },
  {
    item: 'per-step progress list',
    detail: '<s-progress-bar> is a single bar with label/desc/percentage. There is no Twilight stepper/checklist component in the kit.',
    impact: 'The per-step activation list is composed from Panel + Tag + Icon. Flagged as a composition, not a component.',
    owner: 'DS owner — is a stepper planned?',
  },
] as const;
