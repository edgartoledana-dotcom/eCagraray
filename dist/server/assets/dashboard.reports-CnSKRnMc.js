import { jsxs, jsx } from "react/jsx-runtime";
import { u as useStored } from "./store-CFBfCpGU.js";
import { P as PageHeader, B as Button, C as Card } from "./ui-kit-wmGkfm9P.js";
import { Printer, Download } from "lucide-react";
import "react";
function toCSV(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}
function download(name, content) {
  const blob = new Blob([content], {
    type: "text/csv"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
function Page() {
  const [residents] = useStored("residents", []);
  const [incidents] = useStored("incidents", []);
  const [events] = useStored("events", []);
  const [alerts] = useStored("alerts", []);
  const sets = [{
    key: "residents",
    label: "Resident Report",
    rows: residents
  }, {
    key: "incidents",
    label: "Incident Report",
    rows: incidents
  }, {
    key: "events",
    label: "Event Report",
    rows: events
  }, {
    key: "alerts",
    label: "Disaster Report",
    rows: alerts
  }];
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(PageHeader, { title: "Reports", subtitle: "Generate and export operational reports.", action: /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: () => window.print(), children: [
      /* @__PURE__ */ jsx(Printer, { className: "h-4 w-4" }),
      " Print page"
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "grid gap-4 md:grid-cols-2", children: sets.map((s) => /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "font-semibold", children: s.label }),
        /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground", children: [
          s.rows.length,
          " records"
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Button, { onClick: () => download(`${s.key}-${Date.now()}.csv`, toCSV(s.rows)), disabled: !s.rows.length, children: [
        /* @__PURE__ */ jsx(Download, { className: "h-4 w-4" }),
        " Export CSV"
      ] })
    ] }) }, s.key)) })
  ] });
}
export {
  Page as component
};
