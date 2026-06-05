// LocalStorage-backed store for e-Cagraray
import { useEffect, useState, useSyncExternalStore } from "react";

export const STORAGE_KEY_PREFIX = "ecagraray:";
export const SESSION_KEY = `${STORAGE_KEY_PREFIX}session`;
export const THEME_KEY = `${STORAGE_KEY_PREFIX}theme`;

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
  createdAt: string;
}
