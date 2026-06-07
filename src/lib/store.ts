// LocalStorage-backed store for e-Cagraray
import { useEffect, useState, useRef, useCallback, useSyncExternalStore } from "react";
import { toast } from "sonner";

export const STORAGE_KEY_PREFIX = "ecagraray:";
export const SESSION_KEY = `${STORAGE_KEY_PREFIX}session`;
export const THEME_KEY = `${STORAGE_KEY_PREFIX}theme`;

/**
 * Read the stored session token from localStorage or sessionStorage.
 * Returns null if no session exists or the token is malformed.
 */
/**
 * Check if an error message indicates the session has expired or is invalid.
 */
export function isSessionExpiredError(err: any): boolean {
  if (!err) return false;
  const msg = typeof err === "string" ? err : err?.message ?? "";
  return (
    msg.includes("Session expired") ||
    msg.includes("session has expired") ||
    msg.includes("Authentication required") ||
    msg.includes("Please sign in again")
  );
}

/**
 * Clear the stored session (both localStorage and sessionStorage) and redirect
 * the user to the login page. Call this when an API response indicates the
 * session has expired.
 *
 * Uses a module-level guard to prevent multiple redirects when several parallel
 * requests fail simultaneously.
 */
let _sessionExpiredRedirecting = false;

export function handleSessionExpired(
  redirectTo = "/login",
  options?: { onBeforeRedirect?: () => void },
): void {
  if (_sessionExpiredRedirecting) return;
  _sessionExpiredRedirecting = true;

  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  } catch {}

  // Allow caller to show feedback (e.g., toast) before redirect
  options?.onBeforeRedirect?.();

  // Small delay to let any feedback render before navigating
  setTimeout(() => {
    window.location.href = redirectTo;
  }, 200);
}

export function getSessionToken(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.token === "string" && parsed.token.length > 0) {
      return parsed.token;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Wraps data with the stored session token for authenticated server function calls.
 * Only injects the token if one is available (e.g., dashboard pages that are
 * already inside AuthProvider).
 */
export function withToken<T extends Record<string, any>>(data: T): T & { token?: string } {
  if ((data as any).token) return data as T & { token?: string };
  const token = getSessionToken();
  if (token) {
    return { ...data, token };
  }
  return data as T & { token?: string };
}

type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();

function notify(key: string) {
  listeners.get(key)?.forEach((l) => l());
}

export function getItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function setItem<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  notify(key);
}

export function useStored<T>(key: string, fallback: T): [T, (v: T | ((p: T) => T)) => void] {
  const subscribe = (cb: Listener) => {
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key)!.add(cb);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_PREFIX + key) cb();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.get(key)!.delete(cb);
      window.removeEventListener("storage", onStorage);
    };
  };
  const getSnap = () => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY_PREFIX + key) : null;
    return raw ?? "__null__";
  };
  const serverSnap = () => "__null__";
  useSyncExternalStore(subscribe, getSnap, serverSnap);
  const value = getItem<T>(key, fallback);
  const setValue = (v: T | ((p: T) => T)) => {
    const next = typeof v === "function" ? (v as (p: T) => T)(value) : v;
    setItem(key, next);
  };
  return [value, setValue];
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function useSyncable<T>(
  table: string,
  fallback: T,
  opts?: { refreshInterval?: number },
): [T, (v: T | ((p: T) => T)) => void, (nextItems: T) => Promise<void>, () => Promise<void>] {
  const [items, setItems] = useStored<T>(table, fallback);
  const seqRef = useRef(0);

  const updateItemsAndSync = useCallback(async (nextItems: T) => {
    setItems(nextItems);
    const seq = ++seqRef.current;
    try {
      const { saveTableData } = await import("./api/auth.functions");
      await saveTableData({ data: withToken({ table, data: nextItems as any[] }) });
    } catch (err) {
      console.error(`[syncable] Failed to save ${table}:`, err);
      toast.error(`Failed to save changes. Please try again.`);
    }
  }, [table, setItems]);

  const refreshFromServer = useCallback(async () => {
    try {
      const { getTableData } = await import("./api/auth.functions");
      const serverData = await getTableData({ data: withToken({ table }) });
      if (serverData && Array.isArray(serverData)) {
        setItems(serverData as T);
      }
    } catch {}
  }, [table, setItems]);

  useEffect(() => {
    if (!opts?.refreshInterval) return;
    const id = setInterval(refreshFromServer, opts.refreshInterval);
    return () => clearInterval(id);
  }, [opts?.refreshInterval, refreshFromServer]);

  return [items, setItems, updateItemsAndSync, refreshFromServer];
}

// Domain types
export type Role =
  | "super_admin"
  | "captain"
  | "secretary"
  | "sk_officer"
  | "disaster"
  | "resident";

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  captain: "Barangay Captain",
  secretary: "Barangay Secretary",
  sk_officer: "SK Officer",
  disaster: "Disaster Response",
  resident: "Resident",
};

export const ROLE_PERMISSIONS = {
  announcements: ["super_admin","captain","secretary"] as Role[],
  alerts: ["super_admin","captain","disaster"] as Role[],
  documentsReview: ["super_admin","secretary"] as Role[],
  incidentsManage: ["super_admin","captain","disaster"] as Role[],
  surveysManage: ["super_admin","sk_officer","captain"] as Role[],
  eventsManage: ["super_admin","sk_officer","captain"] as Role[],
  emergencyManage: ["super_admin","captain","disaster"] as Role[],
  volunteersManage: ["super_admin","sk_officer","disaster"] as Role[],
  youthManage: ["super_admin","sk_officer"] as Role[],
  complaintsManage: ["super_admin","secretary","captain"] as Role[],
  barangayInfo: ["super_admin","captain","secretary"] as Role[],
  userManagement: ["super_admin"] as Role[],
  residentsManage: ["super_admin","secretary"] as Role[],
  householdsManage: ["super_admin","secretary"] as Role[],
  officialsManage: ["super_admin"] as Role[],
  contactMessages: ["super_admin","secretary"] as Role[],
  evacuationManage: ["super_admin","disaster","captain"] as Role[],
  notificationsManage: ["super_admin","captain","secretary"] as Role[],
  complaintsFile: ["super_admin","captain","secretary","resident"] as Role[],
  emergencyRequest: ["super_admin","disaster","captain","resident"] as Role[],
  incidentsReport: ["super_admin","captain","disaster","resident"] as Role[],
} as const;

export type PermissionKey = keyof typeof ROLE_PERMISSIONS;
export type PermissionConfig = PermissionKey | PermissionKey[];

export function canRole(role: Role | null | undefined, permission: PermissionKey) {
  return role ? ROLE_PERMISSIONS[permission].includes(role) : false;
}

export function hasPermission(role: Role | null | undefined, permission: PermissionConfig) {
  if (!role) return false;
  if (Array.isArray(permission)) return permission.some((p) => canRole(role, p));
  return canRole(role, permission);
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  contact?: string;
  address?: string;
  birthdate?: string;
  gender?: string;
  role: Role;
  approved?: boolean;
  occupation?: string;
  isPwd?: string;
  civilStatus?: string;
  bloodType?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  purok?: string;
  religion?: string;
  nationality?: string;
  educationLevel?: string;
  philhealthNo?: string;
  tinNo?: string;
  voterIdNo?: string;
  createdAt: string;
  passwordHash?: string;
}
