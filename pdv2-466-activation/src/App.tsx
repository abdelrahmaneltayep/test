import { useState } from 'react';
import { QuickDeliveryActivation } from './components/activation/QuickDeliveryActivation';
import { DevHarness } from './harness/DevHarness';
import { SCENARIOS } from './harness/scenarios';

export default function App() {
  const [scenarioId, setScenarioId] = useState('happy');
  const scenario = SCENARIOS.find((s) => s.id === scenarioId)!;

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-400 bg-white px-5 py-3">
        <div className="mx-auto flex max-w-3xl flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-[15px] font-bold">تفعيل التوصيل السريع — تأكيد لا إعداد</h1>
          <p className="text-[11.5px] text-dark-200">PDV2-466 · مرجع تنفيذ React</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-5 py-6">
        {/* Dev harness — outside the component under test. */}
        <DevHarness scenarioId={scenarioId} onPick={setScenarioId} state={scenario.state} />
        <p className="text-[11.5px] text-dark-200">↓ المكوّن تحت الاختبار — يستقبل حالة المتجر فقط</p>

        {/* key= remounts on scenario change so each run starts clean. */}
        <QuickDeliveryActivation key={scenarioId} state={scenario.state} />
      </main>
    </div>
  );
}
