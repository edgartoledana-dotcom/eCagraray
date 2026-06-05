import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { SESSION_KEY, THEME_KEY, type User } from "./store";
import { fetchUserById, loginUser, registerUser } from "./api/auth.functions";

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
}

interface AuthState {
  user: User | null;
  login: (username: string, password: string, remember: boolean) => Promise<User | null>;
  logout: () => void;
  register: (data: RegisterPayload) => Promise<User>;
  updateUser: (user: User) => void;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const id = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    if (!id) return;
    void fetchUserById({ data: { id } }).then((found) => {
      if (found) setUser(found);
    });
  }, []);

  const login: AuthState["login"] = async (username, password, remember) => {
    const normalizedUsername = username.trim();
    const normalizedPassword = password.trim();
    const found = await loginUser({ data: { username: normalizedUsername, password: normalizedPassword } });
    if (found) {
      if (found.approved === false) {
        throw new Error("Account pending LGU verification. An email activation link will be dispatched once reviewed by the Secretariat desk.");
      }
      (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, found.id);
      if (!remember) localStorage.removeItem(SESSION_KEY);
      setUser(found);
      return found;
    }
    return null;
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  const register: AuthState["register"] = async (data) => {
    const created = await registerUser({ data });
    return created;
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return <Ctx.Provider value={{ user, login, logout, register, updateUser }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}

export function useTheme() {
  const [theme, setThemeState] = useState<"light" | "dark">("light");
  useEffect(() => {
    const t = (localStorage.getItem(THEME_KEY) as "light" | "dark") || "light";
    setThemeState(t);
    document.documentElement.classList.toggle("dark", t === "dark");
  }, []);
  const setTheme = (t: "light" | "dark") => {
    setThemeState(t);
    localStorage.setItem(THEME_KEY, t);
    document.documentElement.classList.toggle("dark", t === "dark");
  };
  return { theme, setTheme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") };
}
