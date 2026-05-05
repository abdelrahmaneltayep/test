import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { type PlanTier, PLAN_BRANCH_LIMITS } from './config/planLimits'
import { BranchesPage } from './components/branches/BranchesPage'
import './demo.css'

const PLANS: PlanTier[] = ['basic', 'plus', 'pro', 'special']

const PLAN_LABELS: Record<PlanTier, string> = {
  basic: 'Basic (5 فروع)',
  plus: 'Plus (10 فروع)',
  pro: 'Pro (20 فروع)',
  special: 'Special (∞)',
}

function makeBranches(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `b${i}`,
    name: i === 0 ? 'مكة المكرمة' : i === 1 ? 'الرياض' : `فرع ${i + 1}`,
    type: (i % 3 === 2 ? 'warehouse' : 'branch') as 'branch' | 'warehouse',
    city: ['مكة المكرمة', 'الرياض', 'جدة'][i % 3],
    country: 'السعودية',
    district: ['مكة المكرمة', 'العليا', 'البلد'][i % 3],
    status: (i % 4 === 3 ? 'closed' : 'open') as 'open' | 'closed',
  }))
}

type Scenario = '0%' | '60%' | '80%' | '100%'

const SCENARIO_LABELS: Record<Scenario, string> = {
  '0%':   '0% — فارغ',
  '60%':  '60% — عادي',
  '80%':  '80% — تحذير',
  '100%': '100% — حد أقصى',
}

function getInitialCount(plan: PlanTier, scenario: Scenario): number {
  const limit = PLAN_BRANCH_LIMITS[plan]
  if (limit === null) return 3
  const pct = { '0%': 0, '60%': 0.6, '80%': 0.8, '100%': 1.0 }[scenario]
  return Math.floor(limit * pct)
}

function Demo() {
  const [plan, setPlan] = useState<PlanTier>('basic')
  const [scenario, setScenario] = useState<Scenario>('80%')
  const [key, setKey] = useState(0)

  function apply(newPlan: PlanTier, newScenario: Scenario) {
    setPlan(newPlan)
    setScenario(newScenario)
    setKey((k) => k + 1)
  }

  const initialCount = getInitialCount(plan, scenario)

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#f0f4f8' }}>
      <div className="demo-panel">
        <div className="demo-panel-inner">
          <span className="demo-label">🎛 لوحة التحكم</span>

          <div className="demo-group">
            <span className="demo-group-label">الباقة</span>
            {PLANS.map((p) => (
              <button
                key={p}
                className={`demo-btn ${plan === p ? 'demo-btn--active' : ''}`}
                onClick={() => apply(p, scenario)}
                type="button"
              >
                {PLAN_LABELS[p]}
              </button>
            ))}
          </div>

          <div className="demo-group">
            <span className="demo-group-label">الاستخدام</span>
            {(Object.keys(SCENARIO_LABELS) as Scenario[]).map((s) => (
              <button
                key={s}
                className={`demo-btn ${scenario === s ? 'demo-btn--active' : ''}`}
                onClick={() => apply(plan, s)}
                type="button"
              >
                {SCENARIO_LABELS[s]}
              </button>
            ))}
          </div>

          <span className="demo-hint">
            {PLAN_BRANCH_LIMITS[plan] === null
              ? `Special → لا حدود`
              : `${initialCount} / ${PLAN_BRANCH_LIMITS[plan]} فروع مبدئياً`}
          </span>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <BranchesPage
          key={key}
          plan={plan}
          initialBranches={makeBranches(initialCount)}
        />
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><Demo /></StrictMode>,
)
