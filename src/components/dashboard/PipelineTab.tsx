"use client";

import { useState, useEffect, useCallback } from "react";
import {
  GitBranch, CheckCircle2, XCircle, Clock, Loader2,
  MinusCircle, RotateCcw, ChevronDown, ChevronUp,
  AlertTriangle, Wifi, WifiOff, Activity, Timer, Check
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────

interface Stage {
  name: string;
  status: string;
  durationMs: number;
}

interface Build {
  id: string | number;
  number: number;
  result: string;
  timestamp: number;
  duration: number;
  building: boolean;
  url: string;
  stages: Stage[];
}

interface Job {
  name: string;
  url: string;
  color: string;
  type: "pipeline" | "freestyle" | "folder" | "unknown";
  builds: Build[];
  totalBuilds: number;
  successRate: number;
  lastBuildStatus: string;
  lastBuildTime: number | null;
}

interface PipelineData {
  jobs: Job[];
  source: string;
  connectionStatus: string;
  error?: string;
  jenkinsUrl: string;
  authenticatedAs: string;
  isConnected: boolean;
  timestamp: number;
}

// ── Formatters ────────────────────────────────────────────────────────────

function fmt(ms: number): string {
  if (!ms || ms === 0) return "—";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

function fmtTime(ts: number): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString([], {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Blue Ocean Styled Stage ───────────────────────────────────────────────

function BlueOceanStage({ stage, isLast, isFirst }: { stage: Stage, isLast: boolean, isFirst: boolean }) {
  const isSuccess = stage.status === "SUCCESS";
  const isFailure = stage.status === "FAILURE";
  const isRunning = stage.status === "IN_PROGRESS";

  return (
    <div className="flex items-center group">
      {/* The Pipe/Line Segment Before (except first) */}
      {!isFirst && (
        <div className={`h-1 w-8 sm:w-12 transition-colors duration-500 ${isSuccess || isRunning ? "bg-green-500" : isFailure ? "bg-red-500" : "bg-slate-300 dark:bg-slate-700"}`} />
      )}

      {/* The Stage Circle */}
      <div className="flex flex-col items-center relative">
        <div className={`
          w-10 h-10 rounded-full flex items-center justify-center z-10 border-4 transition-all duration-500
          ${isSuccess ? "bg-green-500 border-green-200 dark:border-green-900" : 
            isFailure ? "bg-red-500 border-red-200 dark:border-red-900" : 
            isRunning ? "bg-white dark:bg-slate-800 border-green-500 animate-pulse" : 
            "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"}
        `}>
          {isSuccess && <Check className="w-5 h-5 text-white" strokeWidth={3} />}
          {isFailure && <XCircle className="w-5 h-5 text-white" />}
          {isRunning && <Loader2 className="w-5 h-5 text-green-500 animate-spin" />}
          {!isSuccess && !isFailure && !isRunning && <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />}
        </div>
        
        {/* Stage Name Label */}
        <div className="absolute top-12 whitespace-nowrap text-center">
          <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 max-w-[80px] truncate group-hover:max-w-none transition-all">
            {stage.name}
          </p>
          <p className="text-[9px] text-slate-400 font-mono">{fmt(stage.durationMs)}</p>
        </div>
      </div>

      {/* The Pipe/Line Segment After (except last) */}
      {!isLast && (
        <div className={`h-1 w-8 sm:w-12 transition-colors duration-500 ${isSuccess ? "bg-green-500" : isRunning ? "bg-slate-300 dark:bg-slate-700 overflow-hidden relative" : isFailure ? "bg-slate-300 dark:bg-slate-700" : "bg-slate-300 dark:bg-slate-700"}`}>
          {isRunning && <div className="absolute inset-0 bg-green-500 animate-[progress_2s_infinite_linear]" style={{width: '50%'}} />}
        </div>
      )}
    </div>
  );
}

// ── Pipeline Diagram ──────────────────────────────────────────────────────

function StageDiagram({ stages }: { stages: Stage[] }) {
  if (!stages.length) return (
    <div className="flex items-center justify-center py-6 text-xs text-slate-400 italic">
      No stage data available yet.
    </div>
  );

  return (
    <div className="py-10 px-4 overflow-x-auto custom-scrollbar">
      <div className="flex items-center justify-center min-w-max pb-4">
        {stages.map((stage, i) => (
          <BlueOceanStage 
            key={i} 
            stage={stage} 
            isFirst={i === 0} 
            isLast={i === stages.length - 1} 
          />
        ))}
      </div>
    </div>
  );
}

// ── Build Row ─────────────────────────────────────────────────────────────

function BuildRow({ build, isOpen, onToggle }: {
  build: Build;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const isSuccess = build.result === "SUCCESS";
  const isFailure = build.result === "FAILURE";
  const isRunning = build.building;

  return (
    <div className="border-t border-slate-100 dark:border-slate-800/50">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSuccess ? "bg-green-100 dark:bg-green-500/10 text-green-600" : isFailure ? "bg-red-100 dark:bg-red-500/10 text-red-600" : "bg-blue-100 dark:bg-blue-500/10 text-blue-600"}`}>
             <span className="text-xs font-bold">#{build.number}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${isSuccess ? "bg-green-500 text-white" : isFailure ? "bg-red-500 text-white" : "bg-blue-500 text-white animate-pulse"}`}>
                {isRunning ? "Running" : build.result}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {fmtTime(build.timestamp)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-slate-400 text-xs font-mono">
            <Timer className="w-3 h-3" />
            {fmt(build.duration)}
          </div>
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {isOpen && (
        <div className="bg-slate-50/50 dark:bg-slate-900/30">
          <StageDiagram stages={build.stages} />
        </div>
      )}
    </div>
  );
}

// ── Job Card ──────────────────────────────────────────────────────────────

function JobCard({ job }: { job: Job }) {
  const [openBuild, setOpenBuild] = useState<number | null>(job.builds[0]?.number ?? null);

  if (job.type === "folder") return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden mb-6">
      <div className="p-5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <GitBranch className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {job.name}
              <span className="text-[10px] font-black px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded uppercase">
                {job.type}
              </span>
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">Success Rate: <span className="font-bold text-slate-700 dark:text-slate-200">{job.successRate}%</span></span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Total Builds: <span className="font-bold text-slate-700 dark:text-slate-200">{job.totalBuilds}</span></span>
            </div>
          </div>
        </div>
        <a href={job.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1">
          Open Jenkins ↗
        </a>
      </div>

      <div className="flex flex-col">
        {job.builds.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm italic">No build history found.</div>
        ) : (
          job.builds.slice(0, 5).map(build => (
            <BuildRow 
              key={build.id} 
              build={build} 
              isOpen={openBuild === build.number}
              onToggle={() => setOpenBuild(openBuild === build.number ? null : build.number)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────

export function PipelineTab() {
  const [data, setData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("/api/dashboard/pipeline");
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const t = setInterval(() => fetchData(), 15000);
    return () => clearInterval(t);
  }, [fetchData]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      <p className="text-sm text-slate-500 animate-pulse">Loading Jenkins Data...</p>
    </div>
  );

  const visibleJobs = (data?.jobs || []).filter(j => j.type !== "folder");

  return (
    <div className="max-w-5xl mx-auto py-2">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            Pipeline Infrastructure
            {data?.isConnected ? (
              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-100 dark:bg-green-500/10 text-green-600 text-[10px] font-black uppercase rounded">
                <Wifi className="w-3 h-3" /> Live
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-red-100 dark:bg-red-500/10 text-red-600 text-[10px] font-black uppercase rounded">
                <WifiOff className="w-3 h-3" /> Offline
              </span>
            )}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Monitoring {visibleJobs.length} active Jenkins jobs</p>
        </div>
        <button 
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
        >
          <RotateCcw className={`w-5 h-5 text-slate-500 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {visibleJobs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-12 text-center">
          <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Jobs Detected</h3>
          <p className="text-slate-500 max-w-sm mx-auto mt-2 text-sm">Jenkins is connected but no pipeline jobs were found. Create a new Pipeline job in Jenkins to see it here.</p>
        </div>
      ) : (
        visibleJobs.map(job => <JobCard key={job.name} job={job} />)
      )}

      {data?.isConnected && (
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400 uppercase font-black tracking-widest">
          <div className="flex items-center gap-4">
             <span>SERVER: {data.jenkinsUrl}</span>
             <span>USER: {data.authenticatedAs}</span>
          </div>
          <span>Auto-Sync: 15s</span>
        </div>
      )}

      <style jsx global>{`
        @keyframes progress {
          from { transform: translateX(-100%); }
          to { transform: translateX(200%); }
        }
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
      `}</style>
    </div>
  );
}
