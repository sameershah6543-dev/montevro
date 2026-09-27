import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Prose } from "@/components/store/PageHeader";
import { pkr } from "@/lib/format";
import { site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = { title: "Shipping & Returns", description: "Delivery times, charges and our 7-day exchange policy." };

export default function ShippingReturnsPage() {
  return (
    <>
      <PageHeader eyebrow="Customer care" title="Shipping & returns" />
      <Prose>
        <h2>Delivery</h2>
        <ul>
          <li>We deliver nationwide across Pakistan.</li>
          <li>Orders are delivered within 3–5 working days of confirmation. Remote areas may take slightly longer.</li>
          <li>Delivery is free on orders over {pkr(site.freeShippingThreshold)}. Below that, a flat fee of {pkr(site.shippingFee)} applies.</li>
          <li>
            Once your order ships, you can follow it on our <Link href="/track">order tracking page</Link>.
          </li>
        </ul>

        <h2>Payment</h2>
        <p>Pay with Cash on Delivery when your order arrives, or by bank transfer — details are shared after you place your order.</p>

        <h2>Exchanges</h2>
        <ul>
          <li>Unworn shoes in their original box can be exchanged for another size or style within 7 days of delivery.</li>
          <li>
            To start an exchange, message us on <a href={whatsappLink("Hi Montevro, I'd like to exchange my order.")} target="_blank" rel="noopener">WhatsApp</a> or email{" "}
            <a href={`mailto:${site.email}`}>{site.email}</a> with your order number.
          </li>
          <li>Shoes that show signs of wear, or that are returned without their original packaging, can't be exchanged.</li>
        </ul>

        <h2>Damaged or incorrect items</h2>
        <p>
          If your order arrives damaged or isn't what you ordered, contact us within 48 hours of delivery with photos and we'll make it right at no cost to you.
        </p>
      </Prose>
    </>
  );
}
