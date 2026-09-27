import Image from "next/image";

export function AuthShell({ eyebrow, title, image, children }: { eyebrow: string; title: string; image: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-[calc(100dvh-110px)] lg:grid-cols-2">
      <div className="relative hidden bg-cream lg:block">
        <Image src={image} alt="" fill sizes="50vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent" />
        <p className="absolute bottom-12 left-12 max-w-sm font-display text-4xl leading-tight text-ivory">
          Considered down to the last stitch.
        </p>
      </div>
      <div className="flex items-center justify-center px-4 py-14 sm:px-8">
        <div className="w-full max-w-md">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="h-display mt-3 text-4xl sm:text-5xl">{title}</h1>
          <div className="mt-10">{children}</div>
        </div>
      </div>
    </div>
  );
}
