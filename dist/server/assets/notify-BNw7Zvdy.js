import { g as getItem, a as uid, s as setItem } from "./store-CFBfCpGU.js";
function pushNotification(n) {
  const list = getItem("notifications", []);
  const next = { ...n, id: uid(), read: false, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
  setItem("notifications", [next, ...list].slice(0, 200));
}
export {
  pushNotification as p
};
