export type Params = Record<string, string | undefined>;
export type Props = {
  params: Params;
  categories: { slug: string; name: string; count: number }[];
  colors: string[];
  sizes: string[];
  total: number;
};

export const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

export const PRICE_BANDS = [
  { label: "Under Rs. 7,500", min: undefined, max: "7499" },
  { label: "Rs. 7,500 – 8,500", min: "7500", max: "8500" },
  { label: "Over Rs. 8,500", min: "8501", max: undefined },
];

export function buildHref(params: Params, patch: Params) {
  const next = { ...params, ...patch };
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) if (v) sp.set(k, v);
  const s = sp.toString();
  return s ? `/shop?${s}` : "/shop";
}
