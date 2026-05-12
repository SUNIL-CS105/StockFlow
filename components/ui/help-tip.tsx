import { HelpCircle } from "lucide-react";
import type { ReactNode } from "react";

export function HelpTip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <span className="group relative inline-flex items-center align-middle">
      <button
        type="button"
        aria-label={label}
        className="ml-1 inline-flex rounded-full text-blue-500 outline-none ring-blue-200 transition hover:text-blue-700 focus:ring-4"
      >
        <HelpCircle size={16} />
      </button>
      <span className="pointer-events-none absolute left-1/2 top-7 z-30 hidden w-72 -translate-x-1/2 rounded-2xl bg-slate-950 p-3 text-left text-xs font-normal leading-5 text-white shadow-xl group-hover:block group-focus-within:block">
        {children}
      </span>
    </span>
  );
}
