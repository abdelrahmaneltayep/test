export type NumeralSystem = 'arabic-indic' | 'western';
export const NUMERALS = 'arabic-indic' as NumeralSystem;
const AR = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
export const n = (v: string | number): string =>
  NUMERALS === 'western' ? String(v) : String(v).replace(/[0-9]/g, (d) => AR[+d]);
export const sar = (v: number | string) => `${n(v)} ر.س`;
