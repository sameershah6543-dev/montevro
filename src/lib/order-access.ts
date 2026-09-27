import "server-only";

/** Compares two phone numbers by their last 10 digits (handles 03xx / +923xx / 923xx). */
export function phonesMatch(a: string | null | undefined, b: string | null | undefined) {
  const norm = (s: string) => s.replace(/\D/g, "").slice(-10);
  if (!a || !b) return false;
  const x = norm(a);
  return x.length === 10 && x === norm(b);
}

export function normaliseOrderNumber(raw: string) {
  const s = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (/^\d+$/.test(s)) return `MV-${s}`;
  if (/^MV\d+$/.test(s)) return `MV-${s.slice(2)}`;
  return s;
}
