"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import clsx from "clsx";

type Img = { id: string; url: string; alt: string | null };

export function Gallery({ images, name }: { images: Img[]; name: string }) {
  const [active, setActive] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);

  const goTo = (i: number) => {
    setActive(i);
    const el = scroller.current;
    if (el) el.scrollTo({ left: el.clientWidth * i, behavior: "smooth" });
  };

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== active) setActive(i);
  };

  if (!images.length) return <div className="aspect-[4/5] bg-cream" />;

  return (
    <div className="flex flex-col-reverse gap-3 lg:flex-row lg:gap-4">
      {images.length > 1 && (
        <div className="flex gap-2 relative overflow-x-auto lg:w-20 lg:shrink-0 lg:flex-col lg:overflow-visible" role="tablist" aria-label="Product images">
          {images.map((im, i) => (
            <button
              key={im.id}
              role="tab"
              aria-selected={i === active}
              aria-label={`Image ${i + 1}`}
              onClick={() => goTo(i)}
              className={clsx(
                "relative aspect-[4/5] w-16 shrink-0 overflow-hidden bg-cream transition-opacity lg:w-full",
                i === active ? "opacity-100 ring-1 ring-ink" : "opacity-60 hover:opacity-100",
              )}
            >
              <Image src={im.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="relative min-w-0 flex-1">
        <div
          ref={scroller}
          onScroll={onScroll}
          className="flex snap-x snap-mandatory relative overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((im, i) => (
            <div key={im.id} className="relative aspect-[4/5] w-full shrink-0 snap-center overflow-hidden bg-cream">
              <Image
                src={im.url}
                alt={im.alt ?? name}
                fill
                priority={i === 0}
                sizes="(min-width:1024px) 55vw, 100vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center gap-1.5 lg:hidden">
            {images.map((im, i) => (
              <span key={im.id} className={clsx("h-[3px] w-6 transition-colors", i === active ? "bg-ink" : "bg-ink/25")} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
