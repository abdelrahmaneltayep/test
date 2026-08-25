import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { PatternNavigator } from './components/shell/PatternNavigator';
import { ToastHost } from './components/ui/Toast';
import { Confetti } from './components/ui/Confetti';
import { useTayaarStore } from './store/tayaarStore';

const Pattern1 = lazy(() => import('./routes/Pattern1_ContextualCard'));
const Pattern2 = lazy(() => import('./routes/Pattern2_MarketplaceSlot'));
const Pattern2Detail = lazy(() => import('./routes/Pattern2_MarketplaceDetail'));
const Pattern3 = lazy(() => import('./routes/Pattern3_OnboardingWizard'));
const Pattern4 = lazy(() => import('./routes/Pattern4_DashboardBanner'));
const Pattern5 = lazy(() => import('./routes/Pattern5_EmptyStatePrompt'));

function Loading() {
  return <div className="p-10 text-sm text-salla-text-tertiary">جارٍ التحميل…</div>;
}

export default function App() {
  const confetti = useTayaarStore((s) => s.confetti);
  const stopConfetti = useTayaarStore((s) => s.stopConfetti);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <PatternNavigator />
      <div className="min-w-0 flex-1">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Navigate to="/pattern-1" replace />} />
            <Route path="/pattern-1" element={<Pattern1 />} />
            <Route path="/pattern-2" element={<Pattern2 />} />
            <Route path="/pattern-2/app/:appId" element={<Pattern2Detail />} />
            <Route path="/pattern-3" element={<Pattern3 />} />
            <Route path="/pattern-4" element={<Pattern4 />} />
            <Route path="/pattern-5" element={<Pattern5 />} />
            <Route path="*" element={<Navigate to="/pattern-1" replace />} />
          </Routes>
        </Suspense>
      </div>
      <ToastHost />
      <Confetti fire={confetti} onDone={stopConfetti} />
    </div>
  );
}
