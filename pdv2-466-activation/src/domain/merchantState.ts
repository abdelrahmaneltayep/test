/**
 * The merchant's store configuration as the activation flow sees it.
 * These seven axes are the entire input surface — everything the UI shows
 * and every step the activation runs is derived from this object.
 */

export type MrsoolStatus =
  | 'inactive'            // courier not on the store — must be activated in-flow
  | 'active'              // already active — activation step is skipped
  | 'conflicting-routes'; // active, but existing routes clash with the QD defaults

export interface Branch {
  id: string;
  name: string;
  city: string;
  country: 'SA' | 'AE' | 'KW';   // non-SA branches are filtered out of the flow
  linkedToSaudiMarket: boolean;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
}

export interface MerchantState {
  mrsool: MrsoolStatus;
  /** Store has the Multi-Markets feature. Decides link-market vs enable-multi-branch. */
  multiMarkets: boolean;
  branches: Branch[];
  /** Partnerships has not answered whether activation carries a fee.
   *  Off by default — this is a conditional variant, not the baseline. */
  feesRequireConsent: boolean;
  /** Harness-only: forces the partial-failure path so it can be demonstrated. */
  forcePartialFailure: boolean;
}

/* ── Derivations ─────────────────────────────────────────────── */

export const ksaBranches = (s: MerchantState) => s.branches.filter((b) => b.country === 'SA');
export const excludedBranches = (s: MerchantState) => s.branches.filter((b) => b.country !== 'SA');

/** Ticket rule: pickup + delivery auto-enable when MORE THAN ONE branch is selected. */
export const autoEnablesFulfilment = (s: MerchantState) => ksaBranches(s).length > 1;

export const unlinkedKsaBranches = (s: MerchantState) =>
  ksaBranches(s).filter((b) => !b.linkedToSaudiMarket);

/** Can the merchant proceed at all? */
export type Blocker = 'no-ksa-branches' | 'routes-conflict' | 'fees-unconsented' | null;

export function blockerFor(s: MerchantState, feesConsented: boolean, routesResolved: boolean): Blocker {
  if (ksaBranches(s).length === 0) return 'no-ksa-branches';
  if (s.mrsool === 'conflicting-routes' && !routesResolved) return 'routes-conflict';
  if (s.feesRequireConsent && !feesConsented) return 'fees-unconsented';
  return null;
}
