"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Container,
  ScrollText,
  GitBranch,
  Server,
  Brain,
  ArrowLeft,
} from "lucide-react";
import dynamic from "next/dynamic";

const ThemeToggle = dynamic(
  () => import("@/components/ThemeToggle").then((m) => m.ThemeToggle),
  { ssr: false, loading: () => <div className="w-9 h-9" /> }
);

/* ── Lazy-load each tab panel ─────────────────────────────────── */
import { OverviewTab } from "@/components/dashboard/OverviewTab";
import { ContainersTab } from "@/components/dashboard/ContainersTab";
import { LogsTab } from "@/components/dashboard/LogsTab";
import { PipelineTab } from "@/components/dashboard/PipelineTab";
import { ServicesTab } from "@/components/dashboard/ServicesTab";

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "containers", label: "Containers", icon: Container },
  { id: "logs", label: "Logs", icon: ScrollText },
  { id: "pipeline", label: "Pipeline", icon: GitBranch },
  { id: "services", label: "Services", icon: Server },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Top Header ──────────────────────────────────────────── */}
      <header className="flex justify-between items-center py-3 px-4 border-b border-slate-200 dark:border-slate-700/50">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to QA
          </Link>
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                DomainQA DevOps
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Real-time infrastructure monitoring
              </p>
            </div>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {/* ── Tab Navbar ──────────────────────────────────────────── */}
      <nav className="flex items-center gap-1 px-4 py-2 border-b border-slate-200 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* ── Tab Content ─────────────────────────────────────────── */}
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "containers" && <ContainersTab />}
        {activeTab === "logs" && <LogsTab />}
        {activeTab === "pipeline" && <PipelineTab />}
        {activeTab === "services" && <ServicesTab />}
      </main>
    </div>
  );
}
