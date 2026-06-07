import { createContext, useContext, useEffect, useState, useRef, useCallback, type ReactNode } from "react";
import { SESSION_KEY, type User, type Role } from "./store";
import { fetchUserById, loginUser, registerUser, validateSession, logoutUser } from "./api/auth.functions";

interface RegisterPayload {
  username: string;
  password: string;
  fullName: string;
  email: string;
  contact?: string;
  address?: string;
  birthdate?: string;
  gender?: string;
  role?: User["role"];
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
}

interface SessionData {
  token: string;
  userId: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  login: (username: string, password: string, remember: boolean) => Promise<User | null>;
  logout: () => void;
  register: (data: RegisterPayload) => Promise<User>;
  updateUser: (user: User) => void;
}

const Ctx = createContext<AuthState | null>(null);

// ---------------------------------------------------------------------------
// Inactivity timer — auto-logout after 30 minutes of no user interaction
// Uses setTimeout so the callback fires exactly once after inactivity.
// ---------------------------------------------------------------------------
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

function useInactivityAutoLogout(onTimeout: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onTimeoutRef.current();
    }, INACTIVITY_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    const events = ["mousedown", "keydown", "touchstart", "scroll", "click"] as const;
    const handler = () => resetTimer();

    events.forEach((ev) => window.addEventListener(ev, handler));
    resetTimer();

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handler));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetTimer]);
}

// ---------------------------------------------------------------------------
// Role-aware dashboard redirects
// ---------------------------------------------------------------------------
const ROLE_HOME_PAGE: Record<Role, string> = {
  super_admin: "/dashboard",
  captain: "/dashboard",
  secretary: "/dashboard",
  sk_officer: "/dashboard",
  disaster: "/dashboard",
  resident: "/dashboard",
};

export function getHomePageForRole(role: Role): string {
  return ROLE_HOME_PAGE[role] || "/dashboard";
}

// ---------------------------------------------------------------------------
// AuthProvider
// ---------------------------------------------------------------------------
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // On mount: attempt to restore session from storage, then mark hydrated
  useEffect(() => {
    const finish = () => {
      if (!hydrated) setHydrated(true);
    };

    const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    if (!raw) {
      finish();
      return;
    }

    let sessionData: SessionData;
    try {
      sessionData = JSON.parse(raw);
    } catch {
      // Invalid session data, clear it
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      finish();
      return;
    }

    // Validate the session token with the server
    void validateSession({ data: { token: sessionData.token } })
      .then((result) => {
        if (result && result.user && result.token) {
          // Update storage with refreshed token if provided
          const updatedSession: SessionData = {
            token: result.token,
            userId: result.user.id,
          };
          const storage = localStorage.getItem(SESSION_KEY)
            ? localStorage
            : sessionStorage;
          storage.setItem(SESSION_KEY, JSON.stringify(updatedSession));

          setUser(result.user);
        } else {
          // Session expired or invalid
          localStorage.removeItem(SESSION_KEY);
          sessionStorage.removeItem(SESSION_KEY);
        }
      })
      .catch(() => {
        localStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(SESSION_KEY);
      })
      .finally(() => finish());
  }, []);

  // -----------------------------------------------------------------------
  // Logout
  // -----------------------------------------------------------------------
  const logout = useCallback(() => {
    const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      try {
        const sessionData: SessionData = JSON.parse(raw);
        void logoutUser({ data: { token: sessionData.token } }).catch(() => {});
      } catch {}
    }
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  // Auto-logout on inactivity (only when logged in)
  const handleInactivityTimeout = useCallback(() => {
    logout();
  }, [logout]);

  useInactivityAutoLogout(handleInactivityTimeout);

  // -----------------------------------------------------------------------
  // Login
  // -----------------------------------------------------------------------
  const login: AuthState["login"] = async (username, password, remember) => {
    const normalizedUsername = username.trim();
    const result = await loginUser({ data: { username: normalizedUsername, password, remember } });

    if (result) {
      const { user: found, token } = result;

      if (found.approved === false || found.approved === undefined) {
        throw new Error(
          "Account pending LGU verification. An email activation link will be dispatched once reviewed by the Secretariat desk.",
        );
      }

      // Store session token (userId included for quick reference)
      const sessionData: SessionData = { token, userId: found.id };
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem(SESSION_KEY, JSON.stringify(sessionData));

      if (!remember) {
        localStorage.removeItem(SESSION_KEY);
      }

      setUser(found);
      return found;
    }
    return null;
  };

  // -----------------------------------------------------------------------
  // Register
  // -----------------------------------------------------------------------
  const register: AuthState["register"] = async (data) => {
    const created = await registerUser({ data });
    return created;
  };

  // -----------------------------------------------------------------------
  // Update user
  // -----------------------------------------------------------------------
  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const isAuthenticated = user !== null;

  return (
    <Ctx.Provider value={{ user, isAuthenticated, hydrated, login, logout, register, updateUser }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}

export function useTheme() {
  const [theme, setThemeState] = useState<"light" | "dark">("light");
  useEffect(() => {
    const t = (localStorage.getItem("ecagraray:theme") as "light" | "dark") || "light";
    setThemeState(t);
    document.documentElement.classList.toggle("dark", t === "dark");
  }, []);
  const setTheme = (t: "light" | "dark") => {
    setThemeState(t);
    localStorage.setItem("ecagraray:theme", t);
    document.documentElement.classList.toggle("dark", t === "dark");
  };
  return { theme, setTheme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") };
}
