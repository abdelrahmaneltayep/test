import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { LAYOUT_BY_ID } from '../layouts';
import { FLOWS, FLOW_BY_ID, FLOW_FAMILIES } from '../lib/flows';
import { ActivationPage } from '../components/Shell';
import { Tag } from '../components/ui';
import { useStore } from '../store/store';

export default function LayoutRoute() {
  const { layoutId } = useParams();
  const layout = LAYOUT_BY_ID[(layoutId || '').toUpperCase()];
  const [flowId, setFlowId] = useState('F1');
  const applyFlow = useStore((s) => s.applyFlow);

  // Re-apply on every layout/flow change so each pairing starts from the same state.
  useEffect(() => {
    const f = FLOW_BY_ID[flowId];
    if (f) applyFlow(f.state);
  }, [flowId, layoutId, applyFlow]);

  if (!layout) return <Navigate to="/" replace />;
  const flow = FLOW_BY_ID[flowId];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 border-b border-salla-border bg-white px-6 py-3">
        <div className="min-w-[180px]">
          <p className="flex flex-wrap items-center gap-2 text-[14px] font-bold">
            <span className="rounded bg-salla-primary px-1.5 py-0.5 text-[11px] text-white">{layout.id}</span>
            {layout.name}
          </p>
          <p className="text-[11.5px] text-salla-text-2">{layout.en} · {layout.rationale}</p>
        </div>
        <div className="ms-auto flex flex-wrap items-center gap-2">
          <label htmlFor="flow" className="text-[11.5px] font-bold text-salla-text-2">محاكي التدفق</label>
          <select id="flow" value={flowId} onChange={(e) => setFlowId(e.target.value)}
            className="salla-select max-w-[280px] appearance-none rounded-md border border-salla-border bg-white px-3 py-1.5 text-[12.5px]">
            {(['A', 'B', 'C', 'D'] as const).map((fam) => (
              <optgroup key={fam} label={`${fam} · ${FLOW_FAMILIES[fam]}`}>
                {FLOWS.filter((f) => f.family === fam).map((f) => (
                  <option key={f.id} value={f.id}>{f.id} — {f.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {flow && (
        <p className="flex flex-wrap items-center gap-2 border-b border-salla-border bg-salla-soft px-6 py-2 text-[11.5px] text-salla-text-2">
          <b className="text-salla-text">{flow.id}</b> · {flow.desc} · نقطة الدخول: {flow.state.entry}
          {flow.state.plan === 'basic' && <Tag v="muted">Basic</Tag>}
          {!flow.state.countryAvailable && <Tag v="danger">دولة غير مدعومة</Tag>}
          {flow.state.promo && <Tag v="credit">عرض ترويجي</Tag>}
          {flow.state.perBranch && <Tag v="info">تخصيص لكل فرع</Tag>}
          {flow.state.forcedError !== 'none' && <Tag v="danger">خطأ مفروض: {flow.state.forcedError}</Tag>}
        </p>
      )}

      <ActivationPage slot={layout.slot}>{layout.render()}</ActivationPage>
    </div>
  );
}
