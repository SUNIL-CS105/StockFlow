import type { ReactNode } from "react";

export function Badge({
  children,
  tone = "blue",
}: {
  children: ReactNode;
  tone?: "blue" | "green" | "yellow" | "red" | "slate";
}) {
  const tones = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-emerald-100 text-emerald-700",
    yellow: "bg-amber-100 text-amber-800",
    red: "bg-rose-100 text-rose-700",
    slate: "bg-slate-100 text-slate-700",
  };

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}
