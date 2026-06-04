import { getItem, setItem, uid } from "./store";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "alert" | "request" | "incident" | "event";
  read: boolean;
  createdAt: string;
}

export function pushNotification(n: Omit<Notification, "id" | "read" | "createdAt">) {
  const list = getItem<Notification[]>("notifications", []);
  const next: Notification = { ...n, id: uid(), read: false, createdAt: new Date().toISOString() };
  setItem("notifications", [next, ...list].slice(0, 200));
}
