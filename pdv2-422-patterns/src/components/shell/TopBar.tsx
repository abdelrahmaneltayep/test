/** Salla dashboard top bar. Dark teal, logo inline-start, account inline-end. */
export function TopBar() {
  return (
    <header
      className="sticky top-0 z-40 flex h-16 items-center gap-6 px-6 text-white"
      style={{ background: 'var(--salla-topbar)' }}
    >
      <span className="flex items-center gap-2 text-[17px] font-bold">
        <span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-md bg-white/15 text-sm">س</span>
        سلة
      </span>
      <nav aria-label="التنقل الرئيسي" className="hidden flex-1 gap-6 text-[13.5px] md:flex">
        {['الرئيسية', 'الطلبات', 'المنتجات', 'التسويق', 'التقارير'].map((t) => (
          <a key={t} href="#" className="text-white/85 hover:text-white">{t}</a>
        ))}
      </nav>
      <span className="ms-auto flex items-center gap-2.5 text-[12.5px] md:ms-0">
        <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-full bg-white/15">و</span>
        <span className="hidden sm:block">
          وليد عيسى
          <span className="block text-[11px] opacity-60">سبيشل</span>
        </span>
      </span>
    </header>
  );
}
