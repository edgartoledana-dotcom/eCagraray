import { getItem, setItem, uid, withToken } from "./store";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "alert" | "request" | "incident" | "event";
  read: boolean;
  createdAt: string;
  recipientId?: string;
  recipientEmail?: string;
  recipientPhone?: string;
}

export function pushNotification(n: Omit<Notification, "id" | "read" | "createdAt">) {
  const list = getItem<Notification[]>("notifications", []);
  const next: Notification = { ...n, id: uid(), read: false, createdAt: new Date().toISOString() };
  const updated = [next, ...list].slice(0, 200);
  setItem("notifications", updated);

  // Persist to server (fire-and-forget)
  if (typeof window !== "undefined") {
    import("./api/auth.functions").then(({ saveTableData }) => {
      saveTableData({ data: withToken({ table: "notifications", data: updated }) }).catch(() => {});
    }).catch(() => {});
  }

  // Offline notification: log for SMS/email dispatch
  const outgoing = getItem<any[]>("outgoing_notifications", []);
  outgoing.push({
    id: next.id,
    title: n.title,
    message: n.message,
    type: n.type,
    recipientId: n.recipientId,
    recipientEmail: n.recipientEmail,
    recipientPhone: n.recipientPhone,
    createdAt: next.createdAt,
    sent: false,
  });
  setItem("outgoing_notifications", outgoing.slice(-100));

  return next;
}

export function notifyRecipients(
  title: string,
  message: string,
  type: Notification["type"],
  recipients: Array<{ id: string; email?: string; phone?: string }>
) {
  recipients.forEach((r) => {
    pushNotification({ title, message, type, recipientId: r.id, recipientEmail: r.email, recipientPhone: r.phone });
  });
}
