import type { Metadata } from "next";
import { PageHeader, Prose } from "@/components/store/PageHeader";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Privacy policy" />
      <Prose>
        <p>This policy explains what information Montevro collects when you use {site.url.replace(/^https?:\/\//, "")} and how we use it.</p>
        <h2>What we collect</h2>
        <ul>
          <li>Details you give us when you order: name, phone number, email, and delivery address.</li>
          <li>Account details if you create one: name, email, phone and an encrypted password.</li>
          <li>Messages you send us through the contact form, WhatsApp or email.</li>
          <li>Your bag contents, stored in your own browser so they persist between visits.</li>
        </ul>
        <h2>How we use it</h2>
        <ul>
          <li>To process, deliver and support your orders — including sharing your delivery details with our courier partners.</li>
          <li>To send order confirmations and delivery updates.</li>
          <li>To send newsletters, only if you subscribe. You can unsubscribe at any time.</li>
        </ul>
        <p>We never sell your personal information.</p>
        <h2>Security</h2>
        <p>Passwords are stored encrypted, and our site is served over HTTPS. Access to order data is restricted to Montevro staff.</p>
        <h2>Your choices</h2>
        <p>
          To access, update or delete your information, contact us at <a href={`mailto:${site.email}`}>{site.email}</a>.
        </p>
      </Prose>
    </>
  );
}
