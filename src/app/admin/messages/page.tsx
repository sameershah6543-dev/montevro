import { Download, Mail, MessageCircle, Phone, Trash2 } from "lucide-react";
import clsx from "clsx";
import { Card, EmptyState, PageHeader, Pill, smallBtn } from "@/components/admin/ui";
import { ConfirmSubmit } from "@/components/admin/forms";
import { deleteSubscriber, toggleMessageHandled } from "@/lib/actions/admin-misc";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { normalisePhone } from "@/lib/notify/whatsapp";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const [messages, subscribers] = await Promise.all([
    db.contactMessage.findMany({ orderBy: [{ handled: "asc" }, { createdAt: "desc" }], take: 200 }),
    db.subscriber.findMany({ orderBy: { createdAt: "desc" } }),
  ]);
  const open = messages.filter((m) => !m.handled).length;

  return (
    <>
      <PageHeader title="Messages" description={`${open} open contact message${open === 1 ? "" : "s"} · ${subscribers.length} newsletter subscriber${subscribers.length === 1 ? "" : "s"}`} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="Contact form" className="xl:col-span-2" bodyClassName="p-0 sm:p-0">
          {messages.length === 0 ? (
            <EmptyState title="No messages yet">Messages sent from the Contact page appear here.</EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {messages.map((m) => (
                <li key={m.id} className={clsx("px-4 py-4 sm:px-5", m.handled && "opacity-60")}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium">{m.name} {m.handled ? <Pill>Handled</Pill> : <Pill tone="warn">Open</Pill>}</p>
                      <p className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone">
                        {m.phone && (
                          <>
                            <a href={`tel:${m.phone}`} className="inline-flex items-center gap-1 hover:text-ink"><Phone className="size-3" /> {m.phone}</a>
                            <a href={`https://wa.me/${normalisePhone(m.phone)}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1 hover:text-ink"><MessageCircle className="size-3" /> WhatsApp</a>
                          </>
                        )}
                        {m.email && <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1 break-all hover:text-ink"><Mail className="size-3" /> {m.email}</a>}
                        <span>{formatDateTime(m.createdAt)}</span>
                      </p>
                    </div>
                    <form action={toggleMessageHandled}>
                      <input type="hidden" name="id" value={m.id} />
                      <button className={smallBtn}>{m.handled ? "Reopen" : "Mark handled"}</button>
                    </form>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm text-ink-soft">{m.message}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Newsletter subscribers"
          action={subscribers.length > 0 ? <a href="/api/admin/export/subscribers?format=csv" className="inline-flex items-center gap-1 text-xs text-stone hover:text-ink"><Download className="size-3" /> CSV</a> : null}
          bodyClassName="p-0 sm:p-0"
        >
          {subscribers.length === 0 ? (
            <EmptyState title="No subscribers yet" />
          ) : (
            <ul className="max-h-[560px] divide-y divide-line overflow-y-auto">
              {subscribers.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm sm:px-5">
                  <span className="min-w-0">
                    <span className="block truncate">{s.email}</span>
                    <span className="text-xs text-stone">{formatDateTime(s.createdAt)}</span>
                  </span>
                  <form action={deleteSubscriber}>
                    <input type="hidden" name="id" value={s.id} />
                    <ConfirmSubmit message={`Remove ${s.email}?`} className="p-1.5 text-stone hover:text-danger" aria-label={`Remove ${s.email}`}><Trash2 className="size-3.5" /></ConfirmSubmit>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
