"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { X } from "lucide-react";
import { toggleWishlist } from "@/lib/actions/wishlist";

export function WishlistRemoveButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await toggleWishlist(productId);
          router.refresh();
        })
      }
      aria-label="Remove from wishlist"
      className="grid size-8 place-items-center bg-ivory/90 text-ink transition hover:bg-ink hover:text-ivory disabled:opacity-50"
    >
      <X className="size-4" />
    </button>
  );
}
