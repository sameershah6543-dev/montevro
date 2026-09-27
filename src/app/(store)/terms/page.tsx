import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Prose } from "@/components/store/PageHeader";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Terms of service" />
      <Prose>
        <p>By using this website or placing an order with Montevro, you agree to the following terms.</p>
        <h2>Orders</h2>
        <ul>
          <li>All orders are subject to availability and confirmation. We may contact you by phone or WhatsApp to confirm your order before dispatch.</li>
          <li>We reserve the right to cancel an order if an item is out of stock, if details can't be verified, or if a pricing error has occurred. You won't be charged for cancelled orders.</li>
        </ul>
        <h2>Prices</h2>
        <p>Prices are shown in Pakistani Rupees (PKR) and include applicable taxes. Delivery charges, if any, are shown at checkout.</p>
        <h2>Products</h2>
        <p>
          Our shoes are made from genuine leather, a natural material — small variations in grain and colour are part of its character and not defects.
          Product photos are as accurate as possible, but colours can vary slightly between screens.
        </p>
        <h2>Exchanges</h2>
        <p>
          Exchanges are handled as described in our <Link href="/shipping-returns">Shipping & Returns</Link> policy.
        </p>
        <h2>Contact</h2>
        <p>
          Questions about these terms? Email <a href={`mailto:${site.email}`}>{site.email}</a>.
        </p>
      </Prose>
    </>
  );
}
