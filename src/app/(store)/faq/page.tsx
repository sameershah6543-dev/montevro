import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { PageHeader } from "@/components/store/PageHeader";
import { pkr } from "@/lib/format";
import { site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = { title: "FAQ", description: "Answers about ordering, delivery, payment, sizing, exchanges and leather care at Montevro." };

const FAQS: { group: string; items: { q: string; a: React.ReactNode }[] }[] = [
  {
    group: "Orders & payment",
    items: [
      { q: "How do I pay?", a: "We offer Cash on Delivery across Pakistan — you pay the courier when your shoes arrive. Bank transfer is also available at checkout." },
      { q: "Can I order on WhatsApp?", a: <>Yes. Message us on <a href={whatsappLink("Hi Montevro, I'd like to place an order.")} target="_blank" rel="noopener">{site.whatsappDisplay}</a> with the style and size and we'll confirm your order.</> },
      { q: "How do I track my order?", a: <>Use our <Link href="/track">order tracking page</Link> with your order number and phone number. If you have an account, your orders are also listed under My Account.</> },
    ],
  },
  {
    group: "Delivery",
    items: [
      { q: "How long does delivery take?", a: "Orders are delivered within 3–5 working days across Pakistan. Remote areas may take a little longer." },
      { q: "How much is delivery?", a: `Delivery is free on orders over ${pkr(site.freeShippingThreshold)}. Below that, a flat ${pkr(site.shippingFee)} applies.` },
    ],
  },
  {
    group: "Sizing & exchanges",
    items: [
      { q: "What sizes do you offer?", a: <>Our shoes come in EU sizes 39–45. See the <Link href="/size-guide">size guide</Link> for UK/US conversions and how to measure your foot.</> },
      { q: "What if they don't fit?", a: <>Unworn pairs in original packaging can be exchanged for another size within 7 days of delivery. See <Link href="/shipping-returns">shipping & returns</Link>.</> },
      { q: "I'm between sizes — which should I choose?", a: "We recommend sizing up. Leather softens and moulds to your foot with wear, and you can always add an insole. Message us on WhatsApp if you're unsure." },
    ],
  },
  {
    group: "Leather & care",
    items: [
      { q: "Is the leather genuine?", a: "Yes — every Montevro shoe is made from genuine cow leather." },
      { q: "How should I care for my shoes?", a: "Wipe with a soft dry cloth after wear, condition the leather every few weeks, polish as needed, and keep them on shoe trees. Avoid drying wet leather near direct heat." },
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <PageHeader eyebrow="Help" title="Frequently asked questions" />
      <div className="container-x py-14 sm:py-20">
        <div className="mx-auto max-w-3xl space-y-14">
          {FAQS.map((g) => (
            <section key={g.group}>
              <h2 className="eyebrow mb-4">{g.group}</h2>
              <div className="border-t border-line">
                {g.items.map((f) => (
                  <details key={f.q} className="group border-b border-line">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 font-display text-xl sm:text-2xl [&::-webkit-details-marker]:hidden">
                      {f.q}
                      <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" strokeWidth={1.5} />
                    </summary>
                    <div className="pb-6 leading-relaxed text-ink-soft [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-4">{f.a}</div>
                  </details>
                ))}
              </div>
            </section>
          ))}
          <div className="bg-cream p-8 text-center">
            <p className="font-display text-2xl">Still have a question?</p>
            <Link href="/contact" className="btn-primary mt-5">Contact us</Link>
          </div>
        </div>
      </div>
    </>
  );
}
