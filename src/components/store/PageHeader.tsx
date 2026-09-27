export function PageHeader({ eyebrow, title, intro }: { eyebrow?: string; title: string; intro?: string }) {
  return (
    <header className="border-b border-line bg-cream">
      <div className="container-x py-14 text-center sm:py-20">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="h-display mt-3 text-4xl sm:text-6xl">{title}</h1>
        {intro && <p className="mx-auto mt-4 max-w-xl text-ink-soft">{intro}</p>}
      </div>
    </header>
  );
}

/** Long-form copy wrapper for policy pages. */
export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-x py-14 sm:py-20">
      <div className="mx-auto max-w-2xl space-y-5 leading-relaxed text-ink-soft [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-4 [&_h2]:pt-6 [&_h2]:font-display [&_h2]:text-3xl [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">
        {children}
      </div>
    </div>
  );
}
