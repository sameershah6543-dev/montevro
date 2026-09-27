import Link from "next/link";
import clsx from "clsx";

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <Link href="/" aria-label="Montevro home" className={clsx("group inline-flex flex-col items-center leading-none", className)}>
      <span className={clsx("font-display text-[26px] font-medium tracking-[0.32em] sm:text-[30px]", light ? "text-ivory" : "text-ink")}>
        MONTEVRO
      </span>
      <span className={clsx("mt-1 text-[8.5px] uppercase tracking-[0.45em]", light ? "text-ivory/70" : "text-stone")}>
        The Leather Specialist
      </span>
    </Link>
  );
}
