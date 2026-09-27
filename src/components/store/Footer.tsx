import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import { Logo } from "./Logo";
import { site, whatsappLink } from "@/lib/site";
import { NewsletterForm } from "./NewsletterForm";

const COLS = [
  {
    title: "Shop",
    links: [
      ["All Shoes", "/shop"],
      ["Chelsea Boots", "/shop?category=chelsea-boots"],
      ["Oxfords", "/shop?category=oxfords"],
      ["Loafers", "/shop?category=loafers"],
      ["New Arrivals", "/shop?sort=newest"],
    ],
  },
  {
    title: "Customer Care",
    links: [
      ["Track Your Order", "/track"],
      ["Size Guide", "/size-guide"],
      ["Shipping & Returns", "/shipping-returns"],
      ["FAQ", "/faq"],
      ["Contact Us", "/contact"],
    ],
  },
  {
    title: "Montevro",
    links: [
      ["Our Craft", "/about"],
      ["My Account", "/account"],
      ["Privacy Policy", "/privacy"],
      ["Terms of Service", "/terms"],
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 bg-ink text-ivory">
      <div className="container-x grid gap-12 py-16 lg:grid-cols-[1.3fr_2fr] lg:gap-20 lg:py-20">
        <div>
          <Logo light className="!items-start" />
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-ivory/70">
            Genuine leather footwear, handcrafted in Pakistan. Considered down to the last stitch — for men who choose well.
          </p>
          <div className="mt-8">
            <p className="eyebrow !text-ivory/60">Join the list</p>
            <p className="mt-2 text-sm text-ivory/70">New releases and private offers, first.</p>
            <NewsletterForm />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          {COLS.map((c) => (
            <div key={c.title}>
              <p className="eyebrow !text-ivory/60">{c.title}</p>
              <ul className="mt-5 space-y-3 text-sm">
                {c.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="text-ivory/80 transition-colors hover:text-ivory">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <p className="eyebrow !text-ivory/60">Get in touch</p>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <a href={whatsappLink()} target="_blank" rel="noopener" className="inline-flex items-center gap-2 text-ivory/80 hover:text-ivory">
                  <MessageCircle className="size-4" /> {site.whatsappDisplay}
                </a>
              </li>
              <li>
                <a href={`mailto:${site.email}`} className="inline-flex items-center gap-2 break-all text-ivory/80 hover:text-ivory">
                  <Mail className="size-4 shrink-0" /> {site.email}
                </a>
              </li>
              <li>
                <a href={site.instagram} target="_blank" rel="noopener" className="inline-flex items-center gap-2 text-ivory/80 hover:text-ivory">
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" /></svg> @montevro
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-ivory/10">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-6 text-[11px] uppercase tracking-[0.18em] text-ivory/50 sm:flex-row">
          <p>© {new Date().getFullYear()} Montevro. All rights reserved.</p>
          <p>Cash on Delivery · Bank Transfer</p>
        </div>
      </div>
    </footer>
  );
}
