export function SubNav({ items, active }: { items: string[]; active: string }) {
  return (
    <nav aria-label="أقسام الصفحة" className="flex h-13 items-center gap-6 border-b border-salla-border bg-white px-6">
      <div className="flex flex-1 gap-6 overflow-x-auto text-[13.5px]">
        {items.map((t) => (
          <a
            key={t}
            href="#"
            aria-current={t === active ? 'page' : undefined}
            className={`whitespace-nowrap border-b-2 py-4 ${
              t === active
                ? 'border-salla-primary font-bold text-salla-primary'
                : 'border-transparent text-salla-text-secondary hover:text-salla-text-primary'
            }`}
          >
            {t}
          </a>
        ))}
      </div>
      <span className="hidden whitespace-nowrap rounded-md border border-salla-border-strong px-2.5 py-1 text-xs text-salla-text-secondary lg:block">
        ؟ مركز المساعدة
      </span>
    </nav>
  );
}
