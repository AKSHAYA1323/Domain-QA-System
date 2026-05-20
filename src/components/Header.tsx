import Link from "next/link";
import dynamic from "next/dynamic";
import { Brain, LayoutDashboard } from "lucide-react";

const ThemeToggle = dynamic(
  () => import("./ThemeToggle").then((module) => module.ThemeToggle),
  { ssr: false, loading: () => <div className="w-9 h-9" /> }
);

export function Header() {
  return (
    <header className="flex justify-between items-center py-2 px-2">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-[14px] bg-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
          <Brain className="w-7 h-7" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">DomainQA</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Transformer-powered expert answers</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {/* ── DevOps Dashboard Link ─────────────────────────────── */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                     bg-indigo-50 hover:bg-indigo-100 text-indigo-700
                     dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-300
                     border border-indigo-200 dark:border-indigo-700
                     transition-all duration-200 hover:shadow-sm hover:scale-[1.03]"
        >
          <LayoutDashboard className="w-4 h-4" />
          DevOps Dashboard
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
