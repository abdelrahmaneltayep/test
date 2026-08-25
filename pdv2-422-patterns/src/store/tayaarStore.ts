import { create } from 'zustand';

export type Plan = 'pro' | 'basic';
export type TrialPhase = 'none' | 'started' | 'ending' | 'ended';
export type CardState = 'default' | 'loading' | 'error' | 'locked' | 'unavailable' | 'activated';

export interface Toast { id: number; message: string; tone: 'success' | 'error' }

const SNOOZE_KEY = 'pdv2422.banner.snoozeUntil';
const SNOOZE_MS = 24 * 60 * 60 * 1000;

interface State {
  /* Merchant context (mocked) */
  plan: Plan;
  countryAvailable: boolean;

  /* Tayaar activation */
  activated: boolean;
  activating: boolean;
  activationError: string | null;
  couriersCount: number;

  /* ST4 trial lifecycle */
  trialPhase: TrialPhase;
  trialDaysLeft: number;

  /* Chrome */
  toast: Toast | null;
  confetti: boolean;
  bannerDismissed: boolean;

  /* Dev toggle — demo the error state on cue */
  failureRate: number;

  setPlan: (p: Plan) => void;
  setCountryAvailable: (v: boolean) => void;
  setFailureRate: (r: number) => void;
  setTrialPhase: (p: TrialPhase) => void;

  activate: () => Promise<boolean>;
  reset: () => void;

  showToast: (message: string, tone?: 'success' | 'error') => void;
  clearToast: () => void;
  stopConfetti: () => void;

  dismissBanner: () => void;
  snoozeBanner: () => void;
  isBannerSnoozed: () => boolean;
}

export const useTayaarStore = create<State>((set, get) => ({
  plan: 'pro',
  countryAvailable: true,

  activated: false,
  activating: false,
  activationError: null,
  couriersCount: 3,

  trialPhase: 'none',
  trialDaysLeft: 7,

  toast: null,
  confetti: false,
  bannerDismissed: false,

  failureRate: 0.1,

  setPlan: (plan) => set({ plan }),
  setCountryAvailable: (countryAvailable) => set({ countryAvailable }),
  setFailureRate: (failureRate) => set({ failureRate }),
  setTrialPhase: (trialPhase) =>
    set({ trialPhase, trialDaysLeft: trialPhase === 'ending' ? 2 : trialPhase === 'ended' ? 0 : 7 }),

  /** Mock activation: 900ms, configurable failure rate. No network anywhere. */
  activate: async () => {
    set({ activating: true, activationError: null });
    await new Promise((r) => setTimeout(r, 900));
    const failed = Math.random() < get().failureRate;
    if (failed) {
      set({
        activating: false,
        activationError: 'تعذّر تفعيل التجربة. لم يتغيّر أي شيء في إعداداتك.',
      });
      get().showToast('تعذّر تفعيل طيّار — أعد المحاولة', 'error');
      return false;
    }
    set({
      activating: false,
      activated: true,
      activationError: null,
      trialPhase: 'started',
      trialDaysLeft: 7,
      confetti: true,
    });
    get().showToast('تم تفعيل طيّار — أسبوعك المجاني بدأ');
    return true;
  },

  reset: () =>
    set({
      activated: false,
      activating: false,
      activationError: null,
      trialPhase: 'none',
      trialDaysLeft: 7,
      confetti: false,
      toast: null,
      bannerDismissed: false,
    }),

  showToast: (message, tone = 'success') => {
    const id = Date.now();
    set({ toast: { id, message, tone } });
    setTimeout(() => { if (get().toast?.id === id) set({ toast: null }); }, 4200);
  },
  clearToast: () => set({ toast: null }),
  stopConfetti: () => set({ confetti: false }),

  dismissBanner: () => set({ bannerDismissed: true }),

  snoozeBanner: () => {
    try { localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS)); } catch { /* private mode */ }
    set({ bannerDismissed: true });
    get().showToast('سنذكّرك بعد 24 ساعة');
  },

  isBannerSnoozed: () => {
    try {
      const until = Number(localStorage.getItem(SNOOZE_KEY) || 0);
      return Number.isFinite(until) && until > Date.now();
    } catch { return false; }
  },
}));
