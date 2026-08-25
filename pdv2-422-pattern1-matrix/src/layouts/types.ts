import type { ReactNode } from 'react';

export type Slot = 'top' | 'belowHeader' | 'sectionHeader' | 'betweenRadios'
  | 'insidePrivate' | 'belowDropdown' | 'sectionDivider' | 'launch'
  | 'stickyBottom' | 'rail' | 'edge' | 'overlay' | 'dropdownOption';

export interface LayoutDef {
  id: string;                 // L1..L20
  family: 'A' | 'B' | 'C' | 'D';
  name: string;               // Arabic
  en: string;
  slot: Slot;
  footprint: string;
  visibility: 'منخفضة' | 'متوسطة' | 'عالية' | 'عالية جداً';
  mobile: 'نعم' | 'تكديس' | 'لا';
  effort: 'XS' | 'S' | 'M';
  verdict: 'MVP' | 'ship' | 'ab' | 'nice' | 'defer';
  rationale: string;
  render: () => ReactNode;
}
