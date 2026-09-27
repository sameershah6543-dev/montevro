import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { CartDrawer } from "@/components/store/CartDrawer";
import { WhatsAppFloat } from "@/components/store/WhatsAppFloat";
import { getSession } from "@/lib/auth";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-ink focus:px-4 focus:py-2 focus:text-ivory">
        Skip to content
      </a>
      <Header signedIn={!!session} />
      <main id="main">{children}</main>
      <Footer />
      <CartDrawer />
      <WhatsAppFloat />
    </>
  );
}
