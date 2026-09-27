"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  size: string;
  price: number;
  image?: string;
  quantity: number;
  maxStock: number;
};

type CartState = {
  items: CartItem[];
  open: boolean;
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      open: false,
      add: (item, qty = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.variantId === item.variantId);
          const items = existing
            ? s.items.map((i) => (i.variantId === item.variantId ? { ...i, quantity: Math.min(i.quantity + qty, item.maxStock, 10) } : i))
            : [...s.items, { ...item, quantity: Math.min(qty, item.maxStock, 10) }];
          return { items, open: true };
        }),
      setQty: (variantId, qty) =>
        set((s) => ({
          items: s.items.map((i) => (i.variantId === variantId ? { ...i, quantity: Math.max(1, Math.min(qty, i.maxStock, 10)) } : i)),
        })),
      remove: (variantId) => set((s) => ({ items: s.items.filter((i) => i.variantId !== variantId) })),
      clear: () => set({ items: [] }),
      setOpen: (open) => set({ open }),
    }),
    { name: "montevro-cart", partialize: (s) => ({ items: s.items }) },
  ),
);

export const cartCount = (items: CartItem[]) => items.reduce((s, i) => s + i.quantity, 0);
export const cartSubtotal = (items: CartItem[]) => items.reduce((s, i) => s + i.price * i.quantity, 0);
