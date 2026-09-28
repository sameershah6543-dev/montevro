import { CheckCircle2, CircleDashed } from "lucide-react";
import { Card, PageHeader, Pill, adminInput, td, th } from "@/components/admin/ui";
import { ActionForm, SubmitButton } from "@/components/admin/forms";
import { setUserRole, testWhatsApp } from "@/lib/actions/admin-misc";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { site } from "@/lib/site";

export const metadata = { title: "Settings" };

function Status({ ok, label, detail }: { ok: boolean; label: string; detail?: string }) {
  return (
    <li className="flex items-start gap-3 py-2.5">
      {ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden /> : <CircleDashed className="mt-0.5 size-4 shrink-0 text-stone" aria-hidden />}
      <span className="text-sm">
        {label} <span className="text-stone">— {ok ? "configured" : "not set"}</span>
        {detail && <span className="block text-xs text-stone">{detail}</span>}
      </span>
    </li>
  );
}

export default async function SettingsPage() {
  const me = await requireAdmin();
  const env = process.env;
  const provider = (env.WHATSAPP_PROVIDER || "callmebot").toLowerCase();
  const waReady = provider === "meta" ? !!(env.META_WA_TOKEN && env.META_WA_PHONE_NUMBER_ID) : provider === "callmebot" ? !!env.CALLMEBOT_API_KEY : false;
  const adminNumber = env.WHATSAPP_ADMIN_NUMBER || site.whatsapp;
  const masked = adminNumber.replace(/^(\d{4})\d+(\d{3})$/, "$1•••••$2");

  const [logs, staff] = await Promise.all([
    db.notificationLog.findMany({ orderBy: { createdAt: "desc" }, take: 50, include: { order: { select: { id: true, number: true } } } }),
    db.user.findMany({ orderBy: [{ role: "asc" }, { createdAt: "asc" }], take: 200, select: { id: true, name: true, email: true, role: true, createdAt: true } }),
  ]);

  return (
    <>
      <PageHeader title="Settings" description="Order alerts, integrations and team access." />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Order alerts">
          <ul className="divide-y divide-line">
            <Status ok={waReady} label={`WhatsApp alerts via ${provider === "meta" ? "Meta Cloud API" : provider === "callmebot" ? "CallMeBot" : "— disabled"}`} detail={`Sends every new order to ${masked}`} />
            <Status ok={!!env.RESEND_API_KEY} label="Email (Resend)" detail="Customer receipts & status emails" />
            <Status ok={!!env.ADMIN_NOTIFY_EMAIL} label="Admin email copy" detail={env.ADMIN_NOTIFY_EMAIL ? "New orders are also emailed to the admin address" : undefined} />
            <Status ok={!!env.BLOB_READ_WRITE_TOKEN} label="Cloud image storage (Vercel Blob)" detail="Needed for photo/receipt uploads on the live site" />
          </ul>
          <ActionForm action={testWhatsApp} className="mt-4">
            <SubmitButton pendingText="Sending…">Send test WhatsApp</SubmitButton>
          </ActionForm>
        </Card>

        <Card title="Set up WhatsApp alerts (free, 2 minutes)">
          <ol className="list-decimal space-y-2 pl-5 text-sm text-ink-soft">
            <li>Save <b className="text-ink">+34 644 78 13 70</b> in the phone that uses WhatsApp number <b className="text-ink">{site.whatsappDisplay}</b>.</li>
            <li>Send it this exact WhatsApp message: <code className="bg-cream px-1.5 py-0.5 text-xs">I allow callmebot to send me messages</code></li>
            <li>You&apos;ll get a reply with your personal <b className="text-ink">API key</b>.</li>
            <li>In your hosting dashboard (Vercel → Project → Settings → Environment Variables) set <code className="bg-cream px-1 text-xs">CALLMEBOT_API_KEY</code> to that key and <code className="bg-cream px-1 text-xs">WHATSAPP_ADMIN_NUMBER</code> to <code className="bg-cream px-1 text-xs">923349024848</code>, then redeploy.</li>
            <li>Press <b className="text-ink">Send test WhatsApp</b>. Every new order will now arrive on WhatsApp with items, total, customer and address.</li>
          </ol>
          <p className="mt-3 text-xs text-stone">For higher volume, switch <code>WHATSAPP_PROVIDER</code> to <code>meta</code> and add Meta WhatsApp Cloud API credentials — no code changes needed.</p>
        </Card>
      </div>

      <Card className="mt-4" title="Notification log (latest 50)" bodyClassName="p-0 sm:p-0">
        {logs.length === 0 ? (
          <p className="px-5 py-6 text-sm text-stone">Nothing sent yet.</p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-line">
                <tr>
                  <th className={th}>When</th>
                  <th className={th}>Channel</th>
                  <th className={th}>Event</th>
                  <th className={th}>Order</th>
                  <th className={th}>Status</th>
                  <th className={th}>Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td className={`${td} text-stone`}>{formatDateTime(l.createdAt)}</td>
                    <td className={`${td} capitalize`}>{l.channel}</td>
                    <td className={td}>{l.event}</td>
                    <td className={td}>{l.order ? <a className="underline hover:text-cognac" href={`/admin/orders/${l.order.id}`}>{l.order.number}</a> : "—"}</td>
                    <td className={td}><Pill tone={l.status === "sent" ? "good" : l.status === "failed" ? "bad" : "neutral"}>{l.status}</Pill></td>
                    <td className={`${td} max-w-[320px] truncate text-xs text-stone`} title={l.error ?? undefined}>{l.error ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="mt-4" title="Team & access" bodyClassName="p-0 sm:p-0">
        <p className="border-b border-line px-5 py-3 text-xs text-stone">
          <b className="text-ink">Staff</b> can use the whole admin; <b className="text-ink">Admin</b> can also change roles. To add a team member, ask them to create an account on the store, then promote them here.
        </p>
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="border-b border-line">
              <tr>
                <th className={th}>Name</th>
                <th className={th}>Email</th>
                <th className={th}>Joined</th>
                <th className={th}>Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {staff.map((u) => (
                <tr key={u.id}>
                  <td className={td}>{u.name}{u.id === me.id && <span className="ml-2 text-xs text-stone">(you)</span>}</td>
                  <td className={`${td} text-stone`}>{u.email}</td>
                  <td className={`${td} text-stone`}>{formatDateTime(u.createdAt)}</td>
                  <td className={td}>
                    {me.role === "ADMIN" && u.id !== me.id ? (
                      <ActionForm action={setUserRole} className="flex items-center gap-2">
                        <input type="hidden" name="userId" value={u.id} />
                        <select name="role" defaultValue={u.role} className={`${adminInput} w-32 py-1.5`} aria-label={`Role for ${u.name}`}>
                          <option value="CUSTOMER">Customer</option>
                          <option value="STAFF">Staff</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        <SubmitButton variant="small">Save</SubmitButton>
                      </ActionForm>
                    ) : (
                      <Pill tone={u.role === "CUSTOMER" ? "neutral" : "good"}>{u.role.toLowerCase()}</Pill>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
