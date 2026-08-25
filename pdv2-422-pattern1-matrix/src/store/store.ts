import { create } from 'zustand';
import { COPY } from '../lib/copy';

export type Plan = 'pro' | 'basic';
export type Surface = 'default' | 'loading' | 'success' | 'error' | 'locked' | 'hidden' | 'expired' | 'already';
export type ErrKind = 'none' | 'network' | 'server' | 'partial';

export interface BranchState { id: string; name: string; eligible: boolean; provider: 'salla' | 'private'; activated: boolean; failed?: boolean }

export interface FlowState {
  plan: Plan;
  countryAvailable: boolean;
  alreadyActive: boolean;
  trialExpired: boolean;
  returnVisit: boolean;
  promo: boolean;
  perBranch: boolean;
  branches: BranchState[];
  forcedError: ErrKind;
  entry: string;               // human label for where the merchant came from
  note?: string;               // flow-specific banner shown above the layout
}

interface Store extends FlowState {
  activated: boolean;
  activating: boolean;
  error: ErrKind;
  toast: { id: number; msg: string; tone: 'success' | 'error' } | null;
  confetti: boolean;
  dismissed: boolean;
  failureRate: number;
  justActivatedAt: number | null;   // drives the 5s rollback window (F19)

  applyFlow: (f: FlowState) => void;
  activate: (branchIds?: string[]) => Promise<boolean>;
  rollback: () => void;
  setFailureRate: (r: number) => void;
  dismiss: () => void;
  showToast: (msg: string, tone?: 'success' | 'error') => void;
  clearToast: () => void;
  stopConfetti: () => void;
  reset: () => void;
}

export const BASE_BRANCHES: BranchState[] = [
  { id: 'r', name: 'فرع الرياض',      eligible: true,  provider: 'private', activated: false },
  { id: 'j', name: 'فرع جدة',         eligible: true,  provider: 'private', activated: false },
  { id: 'm', name: 'فرع مكة المكرمة', eligible: true,  provider: 'private', activated: false },
];

const BASE: FlowState = {
  plan: 'pro', countryAvailable: true, alreadyActive: false, trialExpired: false,
  returnVisit: false, promo: false, perBranch: false,
  branches: BASE_BRANCHES.map((b) => ({ ...b })), forcedError: 'none', entry: 'صفحة التوصيل السريع',
};

export const useStore = create<Store>((set, get) => ({
  ...BASE,
  activated: false, activating: false, error: 'none',
  toast: null, confetti: false, dismissed: false,
  failureRate: 0, justActivatedAt: null,

  applyFlow: (f) => set({
    ...f,
    branches: f.branches.map((b) => ({ ...b })),
    activated: f.alreadyActive, activating: false, error: 'none',
    toast: null, confetti: false, dismissed: false, justActivatedAt: null,
  }),

  /** The one-click activation. PRD §2: no drawer, no confirm step. */
  activate: async (branchIds) => {
    const s = get();
    if (s.plan === 'basic' || !s.countryAvailable) return false;
    set({ activating: true, error: 'none' });
    await new Promise((r) => setTimeout(r, 900));

    const forced = s.forcedError;
    const rolled = Math.random() < s.failureRate;
    const kind: ErrKind = forced !== 'none' ? forced : rolled ? 'network' : 'none';

    if (kind === 'network' || kind === 'server') {
      set({ activating: false, error: kind });
      get().showToast(kind === 'network' ? COPY.errNetwork : COPY.errServer, 'error');
      return false;
    }

    const targets = branchIds ?? s.branches.filter((b) => b.provider === 'private' && b.eligible).map((b) => b.id);
    const branches = s.branches.map((b) => {
      if (!targets.includes(b.id)) return b;
      // F18 — partial success: the third eligible branch fails
      const partialFail = kind === 'partial' && b.id === 'm';
      return { ...b, activated: !partialFail, failed: partialFail };
    });

    set({
      activating: false, activated: true, error: kind === 'partial' ? 'partial' : 'none',
      branches, confetti: true, justActivatedAt: Date.now(),
    });
    get().showToast(COPY.toastSuccess);
    return true;
  },

  /** F19 — 5-second undo window after activation. */
  rollback: () => {
    set((s) => ({
      activated: false, justActivatedAt: null, error: 'none',
      branches: s.branches.map((b) => ({ ...b, activated: false, failed: false })),
    }));
    get().showToast(COPY.toastRollback);
  },

  setFailureRate: (failureRate) => set({ failureRate }),
  dismiss: () => set({ dismissed: true }),

  showToast: (msg, tone = 'success') => {
    const id = Date.now();
    set({ toast: { id, msg, tone } });
    setTimeout(() => { if (get().toast?.id === id) set({ toast: null }); }, 4000);
  },
  clearToast: () => set({ toast: null }),
  stopConfetti: () => set({ confetti: false }),
  reset: () => set({ ...BASE, branches: BASE_BRANCHES.map((b) => ({ ...b })), activated: false, activating: false, error: 'none', toast: null, confetti: false, dismissed: false, justActivatedAt: null }),
}));

/** Which visual state should a layout render right now? */
export function surfaceOf(s: Store): Surface {
  if (!s.countryAvailable) return 'hidden';
  if (s.alreadyActive && !s.activating) return 'already';
  if (s.activated) return 'success';
  if (s.activating) return 'loading';
  if (s.error !== 'none') return 'error';
  if (s.plan === 'basic') return 'locked';
  if (s.trialExpired) return 'expired';
  return 'default';
}
