import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, useRouter, Link, Outlet, HeadContent, Scripts, createFileRoute, lazyRouteComponent, createRouter } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect, createContext, useContext } from "react";
import { Toaster } from "sonner";
import { S as SESSION_KEY, T as THEME_KEY } from "./store-CFBfCpGU.js";
import { T as TSS_SERVER_FUNCTION, g as getServerFnById, c as createServerFn } from "./server-D33WmEg_.js";
import { z } from "zod";
const appCss = "/assets/styles-Bs5sEsB3.css";
function reportLovableError(error, context = {}) {
  if (typeof window === "undefined") return;
  window.__lovableEvents?.captureException?.(
    error,
    {
      source: "react_error_boundary",
      route: window.location.pathname,
      ...context
    },
    {
      mechanism: "react_error_boundary",
      handled: false,
      severity: "error"
    }
  );
}
var createSsrRpc = (functionId) => {
  const url = "/_serverFn/" + functionId;
  const serverFnMeta = { id: functionId };
  const fn = async (...args) => {
    return (await getServerFnById(functionId))(...args);
  };
  return Object.assign(fn, {
    url,
    serverFnMeta,
    [TSS_SERVER_FUNCTION]: true
  });
};
const loginUser = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  username: z.string().min(1),
  password: z.string().min(1)
})).handler(createSsrRpc("07fd746ed5ac20e1b8ea1aa3717bc499703f6cbd93934e8807c3cae6171ed915"));
const registerUser = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  username: z.string().min(1),
  password: z.string().min(8),
  fullName: z.string().min(1),
  email: z.string().email(),
  contact: z.string().optional(),
  address: z.string().optional(),
  birthdate: z.string().optional(),
  gender: z.string().optional(),
  role: z.string().optional()
})).handler(createSsrRpc("a4d5f5a4f2ec96c748880357232e2f30c2244ab48f011829d405ab7974704abe"));
const fetchUserById = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string().min(1)
})).handler(createSsrRpc("53f20a07b833da260adfb175220b11595a2c3924f25fec110c43847e02fd1a6b"));
const getUsers = createServerFn({
  method: "POST"
}).handler(createSsrRpc("8845ac478586285554d771cbf1fa8649a2393ffffb67f7701638eb58b3d3d28b"));
const createUser = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  username: z.string().min(1),
  password: z.string().min(8),
  fullName: z.string().min(1),
  email: z.string().email(),
  role: z.string().optional(),
  contact: z.string().optional(),
  address: z.string().optional(),
  birthdate: z.string().optional(),
  gender: z.string().optional()
})).handler(createSsrRpc("7c32f1a232999d4fc237299afb9601b9632936941d92344e932993f290f24292"));
const updateUser = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string().min(1),
  username: z.string().min(1),
  fullName: z.string().min(1),
  email: z.string().email(),
  role: z.string().min(1),
  contact: z.string().optional(),
  address: z.string().optional(),
  birthdate: z.string().optional(),
  gender: z.string().optional(),
  password: z.string().min(8).optional()
})).handler(createSsrRpc("106acd4476525a06d341ab5771303b58c4c1ce7280b4a14212cdd8fa7fe6c178"));
const deleteUser = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string().min(1)
})).handler(createSsrRpc("4ee61fedef4b9d403e6bb2e6d0bd270ff7f6e42ab4a6b5e27c3a43b9e32c2626"));
const getBarangayInfo = createServerFn({
  method: "POST"
}).handler(createSsrRpc("872b2fabe1d0c8390ead52530860cef4f4b112210fc576de3d06f5487714e9d0"));
const saveBarangayInfo = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  name: z.string().optional(),
  municipality: z.string().optional(),
  province: z.string().optional(),
  address: z.string().optional(),
  contact: z.string().optional(),
  email: z.string().optional(),
  captain: z.string().optional()
})).handler(createSsrRpc("fa550cc94fba4ef4334e9b1dfa9d23295b0fc64ed037453cc2b68e2d69b32f62"));
const getDashboardStats = createServerFn({
  method: "POST"
}).handler(createSsrRpc("34738005489fde5aa6d7b80c64d12e87441b51878ed082a1ec30b39b12976a27"));
const updateUserProfile = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string().min(1),
  fullName: z.string().min(1),
  email: z.string().email(),
  contact: z.string().optional(),
  address: z.string().optional(),
  birthdate: z.string().optional(),
  gender: z.string().optional()
})).handler(createSsrRpc("834df8808103af5bf7d20233dde3c064d6e3366b832d9ac1ec0d1c56e45a73cf"));
const Ctx = createContext(null);
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const id = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    if (!id) return;
    void fetchUserById({ data: { id } }).then((found) => {
      if (found) setUser(found);
    });
  }, []);
  const login = async (username, password, remember) => {
    const normalizedUsername = username.trim();
    const normalizedPassword = password.trim();
    const found = await loginUser({ data: { username: normalizedUsername, password: normalizedPassword } });
    if (found) {
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
  const register = async (data) => {
    const created = await registerUser({ data });
    return created;
  };
  const updateUser2 = (updatedUser) => {
    setUser(updatedUser);
  };
  return /* @__PURE__ */ jsx(Ctx.Provider, { value: { user, login, logout, register, updateUser: updateUser2 }, children });
}
function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
function useTheme() {
  const [theme, setThemeState] = useState("light");
  useEffect(() => {
    const t = localStorage.getItem(THEME_KEY) || "light";
    setThemeState(t);
    document.documentElement.classList.toggle("dark", t === "dark");
  }, []);
  const setTheme = (t) => {
    setThemeState(t);
    localStorage.setItem(THEME_KEY, t);
    document.documentElement.classList.toggle("dark", t === "dark");
  };
  return { theme, setTheme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") };
}
function NotFoundComponent() {
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-7xl font-bold text-foreground", children: "404" }),
    /* @__PURE__ */ jsx("h2", { className: "mt-4 text-xl font-semibold", children: "Page not found" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "The page you're looking for doesn't exist." }),
    /* @__PURE__ */ jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsx(Link, { to: "/", className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90", children: "Go home" }) })
  ] }) });
}
function ErrorComponent({ error, reset }) {
  const router2 = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold", children: "This page didn't load" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Something went wrong." }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 flex justify-center gap-2", children: [
      /* @__PURE__ */ jsx("button", { onClick: () => {
        router2.invalidate();
        reset();
      }, className: "rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground", children: "Try again" }),
      /* @__PURE__ */ jsx("a", { href: "/", className: "rounded-md border px-4 py-2 text-sm", children: "Go home" })
    ] })
  ] }) });
}
const Route$m = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "e-Cagraray — Smart Barangay Management System" },
      { name: "description", content: "Smart Governance, Disaster Preparedness, and Community Engagement for Barangay Cagraray." }
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" },
      { rel: "stylesheet", href: appCss }
    ]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  const { queryClient } = Route$m.useRouteContext();
  useEffect(() => {
    const t = localStorage.getItem("ecagraray:theme") || "light";
    document.documentElement.classList.toggle("dark", t === "dark");
  }, []);
  return /* @__PURE__ */ jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsxs(AuthProvider, { children: [
    /* @__PURE__ */ jsx(Outlet, {}),
    /* @__PURE__ */ jsx(Toaster, { position: "top-right", richColors: true })
  ] }) });
}
const $$splitComponentImporter$l = () => import("./register-ZN-SStD8.js");
const Route$l = createFileRoute("/register")({
  head: () => ({
    meta: [{
      title: "Register · e-Cagraray"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$l, "component")
});
const $$splitComponentImporter$k = () => import("./login-gQxEt0e0.js");
const Route$k = createFileRoute("/login")({
  head: () => ({
    meta: [{
      title: "Login · e-Cagraray"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$k, "component")
});
const $$splitComponentImporter$j = () => import("./dashboard-Drs4UZOi.js");
const Route$j = createFileRoute("/dashboard")({
  component: lazyRouteComponent($$splitComponentImporter$j, "component")
});
const $$splitComponentImporter$i = () => import("./index-Cv3qFbXx.js");
const Route$i = createFileRoute("/")({
  head: () => ({
    meta: [{
      title: "e-Cagraray — Smart Barangay Management System"
    }, {
      name: "description",
      content: "Smart Governance, Disaster Preparedness, and Community Engagement for a Better Barangay."
    }, {
      property: "og:title",
      content: "e-Cagraray"
    }, {
      property: "og:description",
      content: "Smart Barangay Management, Disaster Response & Community Engagement."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$i, "component")
});
const $$splitComponentImporter$h = () => import("./dashboard.index-DPcDfYQy.js");
const Route$h = createFileRoute("/dashboard/")({
  component: lazyRouteComponent($$splitComponentImporter$h, "component")
});
const $$splitComponentImporter$g = () => import("./dashboard.youth-D2lsJDun.js");
const Route$g = createFileRoute("/dashboard/youth")({
  component: lazyRouteComponent($$splitComponentImporter$g, "component")
});
const $$splitComponentImporter$f = () => import("./dashboard.volunteers-BU6mbkR7.js");
const Route$f = createFileRoute("/dashboard/volunteers")({
  component: lazyRouteComponent($$splitComponentImporter$f, "component")
});
const $$splitComponentImporter$e = () => import("./dashboard.users-D21FJqSZ.js");
const Route$e = createFileRoute("/dashboard/users")({
  component: lazyRouteComponent($$splitComponentImporter$e, "component")
});
const $$splitComponentImporter$d = () => import("./dashboard.surveys-BcTG9MSy.js");
const Route$d = createFileRoute("/dashboard/surveys")({
  component: lazyRouteComponent($$splitComponentImporter$d, "component")
});
const $$splitComponentImporter$c = () => import("./dashboard.settings-c3iCzFAW.js");
const Route$c = createFileRoute("/dashboard/settings")({
  component: lazyRouteComponent($$splitComponentImporter$c, "component")
});
const $$splitComponentImporter$b = () => import("./dashboard.residents-CxY6hlVO.js");
const Route$b = createFileRoute("/dashboard/residents")({
  component: lazyRouteComponent($$splitComponentImporter$b, "component")
});
const $$splitComponentImporter$a = () => import("./dashboard.reports-CnSKRnMc.js");
const Route$a = createFileRoute("/dashboard/reports")({
  component: lazyRouteComponent($$splitComponentImporter$a, "component")
});
const $$splitComponentImporter$9 = () => import("./dashboard.notifications-DZG2jMeM.js");
const Route$9 = createFileRoute("/dashboard/notifications")({
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const $$splitComponentImporter$8 = () => import("./dashboard.incidents-CGy9OALG.js");
const Route$8 = createFileRoute("/dashboard/incidents")({
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("./dashboard.households-D32hW5MR.js");
const Route$7 = createFileRoute("/dashboard/households")({
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./dashboard.events-DdA4ZBDn.js");
const Route$6 = createFileRoute("/dashboard/events")({
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./dashboard.evacuation-C2Y6Mxrz.js");
const Route$5 = createFileRoute("/dashboard/evacuation")({
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./dashboard.emergency-DFoTQn1R.js");
const Route$4 = createFileRoute("/dashboard/emergency")({
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./dashboard.documents-Dm1r0Til.js");
const Route$3 = createFileRoute("/dashboard/documents")({
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./dashboard.complaints-otoihbP2.js");
const Route$2 = createFileRoute("/dashboard/complaints")({
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./dashboard.announcements-BpSX3-w2.js");
const Route$1 = createFileRoute("/dashboard/announcements")({
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./dashboard.alerts-DXnQyYSI.js");
const Route = createFileRoute("/dashboard/alerts")({
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const RegisterRoute = Route$l.update({
  id: "/register",
  path: "/register",
  getParentRoute: () => Route$m
});
const LoginRoute = Route$k.update({
  id: "/login",
  path: "/login",
  getParentRoute: () => Route$m
});
const DashboardRoute = Route$j.update({
  id: "/dashboard",
  path: "/dashboard",
  getParentRoute: () => Route$m
});
const IndexRoute = Route$i.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$m
});
const DashboardIndexRoute = Route$h.update({
  id: "/",
  path: "/",
  getParentRoute: () => DashboardRoute
});
const DashboardYouthRoute = Route$g.update({
  id: "/youth",
  path: "/youth",
  getParentRoute: () => DashboardRoute
});
const DashboardVolunteersRoute = Route$f.update({
  id: "/volunteers",
  path: "/volunteers",
  getParentRoute: () => DashboardRoute
});
const DashboardUsersRoute = Route$e.update({
  id: "/users",
  path: "/users",
  getParentRoute: () => DashboardRoute
});
const DashboardSurveysRoute = Route$d.update({
  id: "/surveys",
  path: "/surveys",
  getParentRoute: () => DashboardRoute
});
const DashboardSettingsRoute = Route$c.update({
  id: "/settings",
  path: "/settings",
  getParentRoute: () => DashboardRoute
});
const DashboardResidentsRoute = Route$b.update({
  id: "/residents",
  path: "/residents",
  getParentRoute: () => DashboardRoute
});
const DashboardReportsRoute = Route$a.update({
  id: "/reports",
  path: "/reports",
  getParentRoute: () => DashboardRoute
});
const DashboardNotificationsRoute = Route$9.update({
  id: "/notifications",
  path: "/notifications",
  getParentRoute: () => DashboardRoute
});
const DashboardIncidentsRoute = Route$8.update({
  id: "/incidents",
  path: "/incidents",
  getParentRoute: () => DashboardRoute
});
const DashboardHouseholdsRoute = Route$7.update({
  id: "/households",
  path: "/households",
  getParentRoute: () => DashboardRoute
});
const DashboardEventsRoute = Route$6.update({
  id: "/events",
  path: "/events",
  getParentRoute: () => DashboardRoute
});
const DashboardEvacuationRoute = Route$5.update({
  id: "/evacuation",
  path: "/evacuation",
  getParentRoute: () => DashboardRoute
});
const DashboardEmergencyRoute = Route$4.update({
  id: "/emergency",
  path: "/emergency",
  getParentRoute: () => DashboardRoute
});
const DashboardDocumentsRoute = Route$3.update({
  id: "/documents",
  path: "/documents",
  getParentRoute: () => DashboardRoute
});
const DashboardComplaintsRoute = Route$2.update({
  id: "/complaints",
  path: "/complaints",
  getParentRoute: () => DashboardRoute
});
const DashboardAnnouncementsRoute = Route$1.update({
  id: "/announcements",
  path: "/announcements",
  getParentRoute: () => DashboardRoute
});
const DashboardAlertsRoute = Route.update({
  id: "/alerts",
  path: "/alerts",
  getParentRoute: () => DashboardRoute
});
const DashboardRouteChildren = {
  DashboardAlertsRoute,
  DashboardAnnouncementsRoute,
  DashboardComplaintsRoute,
  DashboardDocumentsRoute,
  DashboardEmergencyRoute,
  DashboardEvacuationRoute,
  DashboardEventsRoute,
  DashboardHouseholdsRoute,
  DashboardIncidentsRoute,
  DashboardNotificationsRoute,
  DashboardReportsRoute,
  DashboardResidentsRoute,
  DashboardSettingsRoute,
  DashboardSurveysRoute,
  DashboardUsersRoute,
  DashboardVolunteersRoute,
  DashboardYouthRoute,
  DashboardIndexRoute
};
const DashboardRouteWithChildren = DashboardRoute._addFileChildren(
  DashboardRouteChildren
);
const rootRouteChildren = {
  IndexRoute,
  DashboardRoute: DashboardRouteWithChildren,
  LoginRoute,
  RegisterRoute
};
const routeTree = Route$m._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const queryClient = new QueryClient();
  const router2 = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  useTheme as a,
  getBarangayInfo as b,
  getUsers as c,
  deleteUser as d,
  createUser as e,
  updateUser as f,
  getDashboardStats as g,
  updateUserProfile as h,
  router as r,
  saveBarangayInfo as s,
  useAuth as u
};
