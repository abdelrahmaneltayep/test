import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BranchesPage } from './components/branches/BranchesPage'

const DEMO_PLAN = (import.meta.env.VITE_DEMO_PLAN ?? 'basic') as 'basic' | 'plus' | 'pro' | 'special'
const DEMO_COUNT = parseInt(import.meta.env.VITE_DEMO_COUNT ?? '4', 10)

const sampleBranches = Array.from({ length: DEMO_COUNT }, (_, i) => ({
  id: `b${i}`,
  name: i === 0 ? 'مكة المكرمة' : `فرع ${i + 1}`,
  type: (i % 3 === 2 ? 'warehouse' : 'branch') as 'branch' | 'warehouse',
  city: 'مكة المكرمة',
  country: 'السعودية',
  district: 'مكة المكرمة',
  status: 'open' as const,
}))

const root = document.getElementById('root')!
createRoot(root).render(
  <StrictMode>
    <BranchesPage
      plan={DEMO_PLAN}
      merchantId="demo-merchant-001"
      initialBranches={sampleBranches}
    />
  </StrictMode>,
)
