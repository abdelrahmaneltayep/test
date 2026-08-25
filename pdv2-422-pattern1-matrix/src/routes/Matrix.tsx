import { Link } from 'react-router-dom';
import { LAYOUTS } from '../layouts';
import { FLOWS, FLOW_FAMILIES } from '../lib/flows';
import { Tag } from '../components/ui';
import { n } from '../lib/num';

const VERDICT: Record<string, { t: string; v: 'rec' | 'info' | 'muted' }> = {
  MVP:   { t: '⭐ MVP',        v: 'rec' },
  ship:  { t: 'للشحن',        v: 'rec' },
  ab:    { t: 'اختبار A/B',   v: 'info' },
  nice:  { t: 'جيد أن يوجد',  v: 'muted' },
  defer: { t: 'مؤجّل',        v: 'muted' },
};

export default function Matrix() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-[22px] font-bold">النمط ١ — مصفوفة المقارنة</h1>
      <p className="mt-1 text-[13px] text-salla-text-2">
        {n(20)} تخطيطاً × {n(20)} تدفقاً · كل تخطيط يستخدم نفس نداء التفعيل بنقرة واحدة، ونفس نقطة النهاية:
        تنبيه نجاح + شريط ملخّص في المكان.
      </p>

      <section className="mt-6 overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full min-w-[820px] text-[12.5px]">
          <caption className="sr-only">مقارنة {n(20)} تخطيطاً عبر سبعة معايير</caption>
          <thead>
            <tr className="bg-salla-soft text-[11px] uppercase tracking-wide text-salla-text-2">
              {['#', 'التخطيط', 'العائلة', 'الظهور', 'البصمة', 'الجوال', 'الجهد', 'الترشيح'].map((h) => (
                <th key={h} scope="col" className="p-3 text-start font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LAYOUTS.map((l) => (
              <tr key={l.id} className="border-t border-salla-border hover:bg-salla-soft/60">
                <td className="p-3 font-bold"><Link to={`/${l.id.toLowerCase()}`} className="text-salla-primary underline">{l.id}</Link></td>
                <td className="p-3"><span className="font-semibold">{l.name}</span><span className="block text-[11px] text-salla-text-2">{l.en}</span></td>
                <td className="p-3 text-salla-text-2">{l.family}</td>
                <td className="p-3">{l.visibility}</td>
                <td className="p-3 text-salla-text-2">{l.footprint}</td>
                <td className="p-3">{l.mobile}</td>
                <td className="p-3">{l.effort}</td>
                <td className="p-3"><Tag v={VERDICT[l.verdict].v}>{VERDICT[l.verdict].t}</Tag></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <section className="rounded-lg bg-white p-5 shadow-sm">
          <h2 className="mb-2.5 text-[15px] font-bold">التركيبة الموصى بها لـ MVP</h2>
          <ul className="space-y-2 text-[12.5px] leading-relaxed">
            <li><b>L6</b> — مربع اختيار مضمّن · السطح الافتراضي لكل تجار Pro/Special</li>
            <li><b>L3</b> — شريط على ترويسة القسم · تعزيز خفيف</li>
            <li><b>L15</b> — بطاقة قبل الإطلاق · شبكة أمان لمن تجاوز L6</li>
          </ul>
          <p className="mt-3 text-[12px] text-salla-text-2">اختبارات A/B لاحقاً: L1 مقابل L6 · L16 مقابل L18.</p>
        </section>

        <section className="rounded-lg bg-white p-5 shadow-sm">
          <h2 className="mb-2.5 text-[15px] font-bold">القيد الثابت</h2>
          <p className="text-[12.5px] leading-relaxed text-salla-text-2">
            التفعيل <b className="text-salla-text">بنقرة واحدة</b> في كل التخطيطات — بدون لوحة جانبية، بدون خطوة تأكيد،
            وبدون تحويل خارجي. التأكيد يحدث بعد التفعيل: تنبيه + شريط ملخّص، مع نافذة تراجع {n(5)} ثوانٍ.
            الأخطاء تظهر مضمّنة مكان الزر، لا في نافذة منبثقة.
          </p>
        </section>
      </div>

      <section className="mt-6 rounded-lg bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-[15px] font-bold">التدفقات العشرون</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(['A', 'B', 'C', 'D'] as const).map((fam) => (
            <div key={fam}>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-salla-text-2">{fam} · {FLOW_FAMILIES[fam]}</p>
              <ul className="space-y-1.5">
                {FLOWS.filter((f) => f.family === fam).map((f) => (
                  <li key={f.id} className="text-[12px] leading-snug">
                    <b className="text-salla-primary">{f.id}</b> — {f.name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-lg bg-white p-5 shadow-sm">
        <h2 className="mb-2 text-[15px] font-bold">عن هذا النموذج الأولي</h2>
        <p className="text-[12.5px] leading-relaxed text-salla-text-2">
          نموذج تصميمي — ليس كوداً للإنتاج. لا واجهات برمجية حقيقية ولا مصادقة ولا فوترة.
          كل تفعيل محاكاة ٩٠٠ مللي ثانية. عرض «٥٠ ر.س رصيد مجاني» مأخوذ من صورة مرجعية
          ويحتاج تأكيداً من فريق الشراكات قبل الإطلاق.
        </p>
      </section>
    </main>
  );
}
