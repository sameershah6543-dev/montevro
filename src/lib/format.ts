export const TZ = "Asia/Karachi";

export function pkr(amount: number) {
  return "Rs. " + Math.round(amount).toLocaleString("en-PK");
}

export function compactPkr(amount: number) {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `Rs. ${(amount / 1_000_000).toFixed(abs >= 10_000_000 ? 1 : 2)}M`;
  if (abs >= 1_000) return `Rs. ${(amount / 1_000).toFixed(abs >= 100_000 ? 0 : 1)}k`;
  return pkr(amount);
}

export function formatDate(d: Date | string, opts: Intl.DateTimeFormatOptions = { dateStyle: "medium" }) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, ...opts }).format(new Date(d));
}

export function formatDateTime(d: Date | string) {
  return formatDate(d, { dateStyle: "medium", timeStyle: "short" });
}

export function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function pct(n: number | null) {
  if (n === null || !Number.isFinite(n)) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}
