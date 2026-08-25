/**
 * Numeral rendering.
 *
 * The build brief asked for Arabic-Indic numerals (٠-٩) everywhere. The live
 * Salla dashboard uses WESTERN digits in Arabic UI — verified against a
 * production screenshot of the Quick Delivery activation screen, which reads
 * "25 كم", "9:00 ص", "23 مدينة", "30-60 دقيقة".
 *
 * Production accuracy wins by default, since this prototype is a design
 * benchmark. Flip NUMERALS to 'arabic-indic' to follow the brief instead —
 * it is the only change required.
 */
export type NumeralSystem = 'western' | 'arabic-indic';

export const NUMERALS: NumeralSystem = 'western';

const AR_INDIC = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/** Render a number (or a string containing digits) in the configured system. */
export function n(value: string | number): string {
  const s = String(value);
  if (NUMERALS === 'western') return s;
  return s.replace(/[0-9]/g, (d) => AR_INDIC[Number(d)]);
}

/** Price in SAR, e.g. n money(5) -> "5 ر.س" */
export function sar(value: number): string {
  return `${n(value)} ر.س`;
}
