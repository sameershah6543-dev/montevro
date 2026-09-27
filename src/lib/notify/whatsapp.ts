import "server-only";

export type SendResult = { ok: true } | { ok: false; error: string; skipped?: boolean };

/** Normalises Pakistani numbers to international format without "+": 03xx → 923xx. */
export function normalisePhone(raw: string) {
  let n = raw.replace(/[^\d]/g, "");
  if (n.startsWith("00")) n = n.slice(2);
  if (n.startsWith("0")) n = "92" + n.slice(1);
  return n;
}

async function viaCallMeBot(to: string, text: string): Promise<SendResult> {
  const apikey = process.env.CALLMEBOT_API_KEY;
  if (!apikey) return { ok: false, skipped: true, error: "CALLMEBOT_API_KEY not configured" };
  const url = `https://api.callmebot.com/whatsapp.php?phone=${normalisePhone(to)}&text=${encodeURIComponent(text)}&apikey=${apikey}`;
  const res = await fetch(url, { cache: "no-store" });
  const body = await res.text();
  if (!res.ok || /error|invalid/i.test(body.slice(0, 300))) return { ok: false, error: `CallMeBot ${res.status}: ${body.slice(0, 200)}` };
  return { ok: true };
}

async function viaMeta(to: string, text: string): Promise<SendResult> {
  const token = process.env.META_WA_TOKEN;
  const phoneId = process.env.META_WA_PHONE_NUMBER_ID;
  if (!token || !phoneId) return { ok: false, skipped: true, error: "Meta WhatsApp credentials not configured" };
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: normalisePhone(to), type: "text", text: { body: text } }),
  });
  if (!res.ok) return { ok: false, error: `Meta ${res.status}: ${(await res.text()).slice(0, 200)}` };
  return { ok: true };
}

export async function sendWhatsApp(to: string, text: string): Promise<SendResult> {
  const provider = (process.env.WHATSAPP_PROVIDER || "callmebot").toLowerCase();
  try {
    if (provider === "meta") return await viaMeta(to, text);
    if (provider === "callmebot") return await viaCallMeBot(to, text);
    return { ok: false, skipped: true, error: "WhatsApp provider disabled" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
