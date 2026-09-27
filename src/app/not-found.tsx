import Link from "next/link";
import { Logo } from "@/components/store/Logo";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-ivory px-6 text-center">
      <Logo />
      <p className="eyebrow mt-16">Error 404</p>
      <h1 className="h-display mt-4 text-5xl sm:text-6xl">This page has walked off.</h1>
      <p className="mt-4 max-w-md text-ink-soft">The page you're looking for doesn't exist or has moved.</p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="btn-primary">Shop the collection</Link>
        <Link href="/" className="btn-outline">Back home</Link>
      </div>
    </main>
  );
}
