/**
 * PRD v1.4 §7 specifies Arabic-Indic numerals everywhere, and reference #1
 * confirms it ("٢٣ مدينة"). Note the live production dashboard uses Western
 * digits — the two disagree. This prototype follows the PRD.
 * Flip NUMERALS to 'western' to compare; every string routes through n().
 */
export type NumeralSystem = 'arabic-indic' | 'western';
export const NUMERALS = 'arabic-indic' as NumeralSystem;

const AR = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
export const n = (v: string | number): string =>
  NUMERALS === 'western' ? String(v) : String(v).replace(/[0-9]/g, (d) => AR[+d]);
export const sar = (v: number | string) => `${n(v)} ر.س`;
