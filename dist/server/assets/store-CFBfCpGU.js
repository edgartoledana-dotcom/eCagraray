import { useSyncExternalStore } from "react";
const STORAGE_KEY_PREFIX = "ecagraray:";
const SESSION_KEY = `${STORAGE_KEY_PREFIX}session`;
const THEME_KEY = `${STORAGE_KEY_PREFIX}theme`;
const listeners = /* @__PURE__ */ new Map();
function notify(key) {
  listeners.get(key)?.forEach((l) => l());
}
function getItem(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function setItem(key, value) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  notify(key);
}
function useStored(key, fallback) {
  const subscribe = (cb) => {
    if (!listeners.has(key)) listeners.set(key, /* @__PURE__ */ new Set());
    listeners.get(key).add(cb);
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY_PREFIX + key) cb();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.get(key).delete(cb);
      window.removeEventListener("storage", onStorage);
    };
  };
  const getSnap = () => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY_PREFIX + key) : null;
    return raw ?? "__null__";
  };
  const serverSnap = () => "__null__";
  useSyncExternalStore(subscribe, getSnap, serverSnap);
  const value = getItem(key, fallback);
  const setValue = (v) => {
    const next = typeof v === "function" ? v(value) : v;
    setItem(key, next);
  };
  return [value, setValue];
}
function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
const ROLE_LABELS = {
  super_admin: "Super Admin",
  captain: "Barangay Captain",
  secretary: "Barangay Secretary",
  sk_officer: "SK Officer",
  disaster: "Disaster Response",
  resident: "Resident"
};
const ROLE_PERMISSIONS = {
  announcements: ["super_admin", "captain", "secretary"],
  alerts: ["super_admin", "captain", "disaster"],
  documentsReview: ["super_admin", "secretary"],
  incidentsManage: ["super_admin", "captain", "disaster"],
  surveysManage: ["super_admin", "sk_officer", "captain"],
  eventsManage: ["super_admin", "sk_officer", "captain"],
  emergencyManage: ["super_admin", "captain", "disaster"],
  volunteersManage: ["super_admin", "sk_officer", "disaster"],
  youthManage: ["super_admin", "sk_officer"],
  complaintsManage: ["super_admin", "secretary", "captain"],
  barangayInfo: ["super_admin", "captain", "secretary"],
  userManagement: ["super_admin"],
  residentsManage: ["super_admin", "secretary"],
  householdsManage: ["super_admin", "secretary"]
};
function canRole(role, permission) {
  return role ? ROLE_PERMISSIONS[permission].includes(role) : false;
}
function hasPermission(role, permission) {
  if (!role) return false;
  if (Array.isArray(permission)) return permission.some((p) => canRole(role, p));
  return canRole(role, permission);
}
export {
  ROLE_LABELS as R,
  SESSION_KEY as S,
  THEME_KEY as T,
  uid as a,
  canRole as c,
  getItem as g,
  hasPermission as h,
  setItem as s,
  useStored as u
};
