export const site = {
  name: "Montevro",
  tagline: "The Leather Specialist",
  description:
    "Handcrafted genuine leather Chelsea boots, Oxfords and loafers — made in Pakistan for men who choose well.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.montevro.com",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "923349024848",
  whatsappDisplay: "+92 334 9024848",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hassanshah1748@gmail.com",
  instagram: "https://www.instagram.com/montevro/",
  currency: "PKR",
  freeShippingThreshold: 10000,
  shippingFee: 250,
  sizes: ["39", "40", "41", "42", "43", "44", "45"],
};

export function whatsappLink(text?: string) {
  const base = `https://wa.me/${site.whatsapp}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function shippingFor(subtotal: number) {
  return subtotal >= site.freeShippingThreshold || subtotal === 0 ? 0 : site.shippingFee;
}
