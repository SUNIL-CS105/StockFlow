import { BarChart3, FileSpreadsheet, Home, Images, Settings, UploadCloud } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/batches/new", label: "Upload", icon: UploadCloud },
  { href: "/dashboard#batches", label: "Batches", icon: Images },
  { href: "/dashboard#workflow", label: "Workflow", icon: FileSpreadsheet },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-white/80 bg-white/80 p-5 backdrop-blur lg:block">
        <Link href="/" className="flex items-center gap-3 rounded-2xl px-3 py-2">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-500 p-2 text-white">
            <BarChart3 size={24} />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-950">StockFlow</p>
            <p className="text-xs text-slate-500">Stock metadata studio</p>
          </div>
        </Link>
        <nav className="mt-8 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <header className="sticky top-0 z-20 border-b border-white/80 bg-white/80 px-5 py-4 backdrop-blur lg:hidden">
        <Link href="/dashboard" className="text-lg font-bold text-slate-950">
          StockFlow
        </Link>
      </header>
      <main className="px-5 py-8 lg:ml-72 lg:px-10">{children}</main>
    </div>
  );
}
