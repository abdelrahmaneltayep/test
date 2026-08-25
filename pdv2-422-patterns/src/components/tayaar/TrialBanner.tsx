import { AlertBox } from '../ui/AlertBox';
import { Button } from '../ui/Button';
import { useTayaarStore } from '../../store/tayaarStore';
import { n, sar } from '../../lib/num';

/** ST4 — trial lifecycle. `none` renders nothing. */
export function TrialBanner() {
  const { trialPhase, trialDaysLeft, showToast } = useTayaarStore();
  if (trialPhase === 'none') return null;

  const subscribe = () => showToast('تم تفعيل اشتراك طيّار المدفوع');

  if (trialPhase === 'started') {
    return (
      <AlertBox variant="success" icon="✅" live title={`تجربة طيّار فعّالة — تبقّى ${n(trialDaysLeft)} أيام`} className="mb-5">
        مناديبك يستوفون المتطلبات الثلاثة، ووعد الساعتين يظهر لعملائك.
      </AlertBox>
    );
  }
  if (trialPhase === 'ending') {
    return (
      <AlertBox
        variant="warning" icon="⏳" live
        title={`تنتهي تجربة طيّار خلال ${n(trialDaysLeft)} يومين`}
        className="mb-5"
        actions={<Button size="sm" variant="mint" onClick={subscribe}>{`الاستمرار من ${sar(5)}`}</Button>}
      >
        استمر للحفاظ على ظهور وعد الساعتين على فروع مناديبك.
      </AlertBox>
    );
  }
  return (
    <AlertBox
      variant="danger" icon="⏸" live
      title="انتهت تجربة طيّار — وعد الساعتين موقوف"
      className="mb-5"
      actions={<Button size="sm" variant="mint" onClick={subscribe}>إعادة تفعيل طيّار</Button>}
    >
      فروعك ما زالت ضمن التوصيل السريع ولم يتغيّر أي إعداد — فقط وعد «خلال ساعتين» لا يظهر لعميلك.
    </AlertBox>
  );
}
