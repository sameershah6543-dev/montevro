import type { Metadata } from "next";
import { Mail, MessageCircle } from "lucide-react";
import { PageHeader } from "@/components/store/PageHeader";
import { site, whatsappLink } from "@/lib/site";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact Us",
  description: `Reach Montevro on WhatsApp ${site.whatsappDisplay} or email ${site.email}.`,
};

export default function ContactPage() {
  return (
    <>
      <PageHeader eyebrow="Customer care" title="Contact us" intro="Questions about sizing, an order or a custom request? WhatsApp is the quickest way to reach us." />
      <div className="container-x grid gap-14 py-16 lg:grid-cols-[1fr_1.3fr] lg:gap-24 lg:py-24">
        <div className="space-y-4">
          <a href={whatsappLink("Hi Montevro!")} target="_blank" rel="noopener" className="flex items-start gap-4 border border-line bg-white/60 p-6 transition-colors hover:border-ink">
            <MessageCircle className="mt-0.5 size-5 shrink-0 text-cognac" strokeWidth={1.5} />
            <div>
              <p className="label !mb-1">WhatsApp — fastest</p>
              <p className="font-display text-2xl">{site.whatsappDisplay}</p>
              <p className="mt-1 text-sm text-stone">Tap to start a chat</p>
            </div>
          </a>
          <a href={`mailto:${site.email}`} className="flex items-start gap-4 border border-line bg-white/60 p-6 transition-colors hover:border-ink">
            <Mail className="mt-0.5 size-5 shrink-0 text-cognac" strokeWidth={1.5} />
            <div className="min-w-0">
              <p className="label !mb-1">Email</p>
              <p className="break-all font-display text-xl sm:text-2xl">{site.email}</p>
            </div>
          </a>
          <a href={site.instagram} target="_blank" rel="noopener" className="flex items-start gap-4 border border-line bg-white/60 p-6 transition-colors hover:border-ink">
            <svg viewBox="0 0 24 24" className="mt-0.5 size-5 shrink-0 text-cognac" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
            </svg>
            <div>
              <p className="label !mb-1">Instagram</p>
              <p className="font-display text-2xl">@montevro</p>
            </div>
          </a>
        </div>

        <div>
          <h2 className="h-display text-3xl sm:text-4xl">Send us a message</h2>
          <p className="mb-8 mt-3 text-sm text-stone">Include your order number if your question is about an order.</p>
          <ContactForm />
        </div>
      </div>
    </>
  );
}
