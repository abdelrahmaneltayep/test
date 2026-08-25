import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { AlertBox } from '../ui/AlertBox';
import { REQUIREMENTS, TAYAAR_CAPABILITIES } from '../../data/mock';
import { n, sar } from '../../lib/num';
import type { CardState } from '../../store/tayaarStore';

interface Props {
  state: CardState;
  onActivate: () => void;
  onDecline?: () => void;
  branchCount?: number;
  compact?: boolean;
}

/** ST1 — the contextual card, in every state the brief calls for. */
export function TayaarCard({ state, onActivate, onDecline, branchCount = 3, compact }: Props) {
  if (state === 'unavailable') {
    return (
      <AlertBox variant="info" icon="ℹ️" className="mt-3.5" title="غير متاح في بلدك حاليًا">
        طيّار متاح للمتاجر في السعودية. سيبقى فرعك ضمن التوصيل السريع بدون وعد الساعتين.
      </AlertBox>
    );
  }

  const met = state === 'activated';

  return (
    <div className={`mt-3.5 overflow-hidden rounded-lg border ${met ? 'border-[#B6F2DF] bg-salla-secondary-50' : 'border-[#F0D8AE] bg-salla-warning-50'}`}>
      {/* The requirement framing — not a pitch. */}
      <div className="flex items-start gap-3 p-4">
        <span aria-hidden="true" className="shrink-0 text-lg leading-6">{met ? '✅' : '⚠️'}</span>
        <div>
          <h4 className={`mb-1 text-sm font-bold ${met ? 'text-salla-success-700' : 'text-salla-warning-700'}`}>
            {met
              ? 'مناديبك يستوفون متطلبات وعد الساعتين'
              : `مناديبك لا يستوفون متطلبات وعد الساعتين${branchCount > 1 ? ` (${n(branchCount)} فروع)` : ''}`}
          </h4>
          <p className={`text-[12.5px] leading-relaxed ${met ? 'text-salla-success-700/85' : 'text-salla-warning-700/85'}`}>
            {met
              ? 'المتطلبات الثلاثة مغطّاة عبر طيّار — يظهر وعد التوصيل خلال ساعتين لعملائك.'
              : 'وعد التوصيل تعرضه سلة للعميل عند الدفع، ولذلك نحتاج أن نتحقّق منه. مناديبك يحتاجون:'}
          </p>
        </div>
      </div>

      <ul className="grid gap-2 px-4 pb-3.5">
        {REQUIREMENTS.map((r) => (
          <li key={r.id} className="flex items-start gap-2.5 rounded-md bg-white/70 p-2.5 text-[13px]">
            <span
              aria-hidden="true"
              className={`mt-0.5 grid h-[19px] w-[19px] shrink-0 place-items-center rounded-full text-[11px] font-bold
                ${met ? 'bg-[#C7F3E1] text-salla-success-700' : 'bg-[#F5E0BC] text-salla-warning-700'}`}
            >
              {met ? '✓' : '!'}
            </span>
            <span>
              <span className="block font-semibold">{r.title}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-salla-text-tertiary">{r.desc}</span>
            </span>
          </li>
        ))}
      </ul>

      {!met && (
        <div className="mx-4 mb-4 rounded-lg border border-salla-border bg-white p-4 shadow-sm">
          {state === 'error' && (
            <AlertBox variant="danger" icon="⚠️" live title="تعذّر تفعيل التجربة" className="mb-3.5">
              لم يتغيّر أي شيء في إعداداتك ولم نسجّل أي اشتراك.
            </AlertBox>
          )}

          <div className="mb-3.5 flex items-start gap-3">
            <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-gradient-to-bl from-salla-primary to-[#348D9D] text-lg font-bold text-white">ط</span>
            <div className="flex-1">
              <h5 className="mb-1 flex flex-wrap items-center gap-2 text-[15px] font-bold">
                طيّار يوفّر هذه المتطلبات الثلاثة
                {state === 'locked'
                  ? <Chip tone="feature">برو والخاصة</Chip>
                  : <Chip tone="mint">أسبوع مجاني</Chip>}
              </h5>
              <p className="text-[12.5px] leading-relaxed text-salla-text-tertiary">
                تطبيق من سلة لإدارة مناديبك — يعمل داخل لوحة تحكمك، بدون أي إعداد خارجي.
              </p>
            </div>
          </div>

          {!compact && (
            <ul className={`mb-4 grid gap-2 sm:grid-cols-2 ${state === 'locked' ? 'select-none blur-[3px]' : ''}`} aria-hidden={state === 'locked'}>
              {TAYAAR_CAPABILITIES.map((c) => (
                <li key={c} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-salla-text-secondary">
                  <span aria-hidden="true" className="shrink-0 font-bold text-salla-success-500">✓</span>{c}
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-2.5 border-t border-salla-border pt-3.5">
            {state === 'locked' ? (
              <>
                <Button variant="feature" onClick={onActivate}>👑 ترقية الباقة</Button>
                {onDecline && <Button variant="link" onClick={onDecline}>المتابعة بدون وعد الساعتين</Button>}
              </>
            ) : (
              <>
                <Button variant="mint" loading={state === 'loading'} onClick={onActivate}>
                  {state === 'loading' ? 'جارٍ التفعيل…' : state === 'error' ? 'إعادة المحاولة' : 'ابدأ أسبوع مجاني'}
                </Button>
                {onDecline && <Button variant="link" onClick={onDecline}>المتابعة بدون طيّار</Button>}
              </>
            )}
          </div>

          <p className="mt-2.5 text-[11.5px] leading-relaxed text-salla-text-tertiary">
            {state === 'locked'
              ? 'التوصيل السريع عبر مناديبك متاح في باقتَي برو والخاصة، مثل بقية تجربة التوصيل السريع.'
              : `الأسبوع المجاني يشمل تجهيز الطلب والتوصيل. بعده يستمر طيّار من ${sar(5)} شهريًا — بدون خصم تلقائي، القرار لك.`}
          </p>
        </div>
      )}
    </div>
  );
}
