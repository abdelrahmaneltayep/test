import { FAMILY_A } from './familyA';
import { FAMILY_B } from './familyB';
import { FAMILY_C } from './familyC';
import { FAMILY_D } from './familyD';
import type { LayoutDef } from './types';

export const LAYOUT_FAMILIES = {
  A: 'أشرطة كاملة العرض',
  B: 'مضمّن داخل قسم المزود',
  C: 'بطاقات وأدوات جانبية',
  D: 'تراكبات وحركة',
} as const;

export const LAYOUTS: LayoutDef[] = [...FAMILY_A, ...FAMILY_B, ...FAMILY_C, ...FAMILY_D];
export const LAYOUT_BY_ID = Object.fromEntries(LAYOUTS.map((l) => [l.id, l]));
export type { LayoutDef };
