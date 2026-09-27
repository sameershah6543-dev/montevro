import type { Metadata } from "next";
import { PageHeader } from "@/components/store/PageHeader";
import { whatsappLink } from "@/lib/site";

export const metadata: Metadata = { title: "Size Guide", description: "Montevro shoe size chart: EU, UK, US and foot length in centimetres." };

const ROWS = [
  { eu: "39", uk: "5.5", us: "6.5", cm: "24.5" },
  { eu: "40", uk: "6.5", us: "7.5", cm: "25.2" },
  { eu: "41", uk: "7", us: "8", cm: "25.8" },
  { eu: "42", uk: "8", us: "9", cm: "26.5" },
  { eu: "43", uk: "9", us: "10", cm: "27.2" },
  { eu: "44", uk: "9.5", us: "10.5", cm: "27.8" },
  { eu: "45", uk: "10.5", us: "11.5", cm: "28.5" },
];

export default function SizeGuidePage() {
  return (
    <>
      <PageHeader eyebrow="Fit" title="Size guide" intro="Our shoes are made in EU sizes and fit true to size. Use the chart below, or measure your foot for the best fit." />
      <div className="container-x py-14 sm:py-20">
        <div className="mx-auto grid max-w-5xl gap-14 lg:grid-cols-[1.2fr_1fr]">
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[320px] border-collapse text-center text-sm">
              <caption className="eyebrow mb-4 text-left">Men's size conversion</caption>
              <thead>
                <tr className="border-b border-ink text-[11px] uppercase tracking-[0.16em]">
                  <th scope="col" className="py-3 font-medium">EU</th>
                  <th scope="col" className="py-3 font-medium">UK</th>
                  <th scope="col" className="py-3 font-medium">US</th>
                  <th scope="col" className="py-3 font-medium">Foot length (cm)</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.eu} className="border-b border-line">
                    <th scope="row" className="py-3.5 font-display text-lg font-medium">{r.eu}</th>
                    <td className="py-3.5">{r.uk}</td>
                    <td className="py-3.5">{r.us}</td>
                    <td className="py-3.5">{r.cm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-xs text-stone">Conversions are approximate and can vary slightly between brands.</p>
          </div>

          <div>
            <h2 className="h-display text-3xl">How to measure</h2>
            <ol className="mt-6 space-y-5 text-sm leading-relaxed text-ink-soft">
              {[
                "Measure in the evening — feet are slightly larger at the end of the day.",
                "Stand on a sheet of paper against a wall, wearing the socks you'd normally wear.",
                "Mark the tip of your longest toe, then measure from the wall to the mark in centimetres.",
                "Measure both feet and use the larger measurement. Match it to the foot length column.",
              ].map((s, i) => (
                <li key={s} className="grid grid-cols-[auto_1fr] gap-4">
                  <span className="font-display text-xl text-cognac">{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
            <div className="mt-10 bg-cream p-6 text-sm leading-relaxed">
              <p className="font-display text-xl">Between sizes?</p>
              <p className="mt-2 text-ink-soft">Choose the larger size — leather softens and moulds to your foot. Still unsure? We're happy to help.</p>
              <a href={whatsappLink("Hi Montevro, can you help me with sizing?")} target="_blank" rel="noopener" className="btn-outline mt-5">
                Ask on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
