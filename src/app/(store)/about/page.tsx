import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Our Craft",
  description: "Montevro makes genuine leather Chelsea boots, Oxfords and loafers by hand in Pakistan.",
};

const STEPS = [
  { title: "Selecting the leather", text: "Every pair starts with genuine full-grain cow leather, chosen for strength, suppleness and the way it ages." },
  { title: "Cutting & lasting", text: "Uppers are cut, stitched and stretched over the last by hand — the step that gives a shoe its shape and fit." },
  { title: "Soling & finishing", text: "Durable soles and stacked heels are fitted, then each pair is burnished and polished to a deep, even shine." },
  { title: "Final inspection", text: "Before it's boxed, every pair is checked by hand. If it isn't right, it doesn't leave the workshop." },
];

export default function AboutPage() {
  return (
    <>
      <section className="relative h-[70svh] min-h-[440px] overflow-hidden bg-ink">
        <Image src="/products/pattern-oxford-2.jpg" alt="Montevro Oxfords in the workshop" fill priority sizes="100vw" className="object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
        <div className="container-x relative flex h-full flex-col justify-end pb-14">
          <p className="eyebrow !text-ivory/80">Our craft</p>
          <h1 className="h-display mt-4 max-w-3xl text-5xl text-ivory sm:text-7xl">The Leather Specialist.</h1>
        </div>
      </section>

      <section className="container-x grid gap-12 py-20 lg:grid-cols-2 lg:gap-20 lg:py-28">
        <div>
          <p className="eyebrow">Who we are</p>
          <h2 className="h-display mt-4 text-4xl sm:text-5xl">Honest shoes, made properly.</h2>
        </div>
        <div className="space-y-5 leading-relaxed text-ink-soft">
          <p>
            Montevro was started with a simple belief: a good pair of leather shoes shouldn't be a luxury you only buy once in a decade. It should be
            well-made, fairly priced and built to be worn every day.
          </p>
          <p>
            We work alongside skilled craftsmen in Pakistan, where shoemaking is a generations-old trade. Every Chelsea boot, Oxford and loafer we make is
            cut from genuine leather and finished by hand — considered down to the last stitch.
          </p>
        </div>
      </section>

      <section className="bg-cream">
        <div className="grid lg:grid-cols-2">
          <div className="relative aspect-[4/5] lg:aspect-auto lg:min-h-[640px]">
            <Image src="/products/penny-loafers-4.jpg" alt="Penny loafers on the workbench" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
          </div>
          <div className="px-6 py-16 sm:px-12 lg:px-20 lg:py-24">
            <p className="eyebrow">How a pair is made</p>
            <ol className="mt-8 space-y-8">
              {STEPS.map((s, i) => (
                <li key={s.title} className="grid grid-cols-[auto_1fr] gap-5">
                  <span className="font-display text-2xl text-cognac">0{i + 1}</span>
                  <div>
                    <h3 className="font-display text-2xl">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="container-x py-20 text-center lg:py-28">
        <h2 className="h-display mx-auto max-w-2xl text-4xl sm:text-5xl">Find the pair you'll keep for years.</h2>
        <Link href="/shop" className="btn-primary mt-10">Shop the collection</Link>
      </section>
    </>
  );
}
