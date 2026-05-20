"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Cpu,
  MemoryStick,
  Container,
  GitBranch,
  Clock,
  Activity,
  HardDrive,
  Gauge,
} from "lucide-react";

interface SystemData {
  cpu: { usage: number; cores: number; model: string; perCore: number[] };
  memory: { total: number; used: number; free: number; usagePercent: number };
  uptime: number;
  platform: string;
  hostname: string;
  timestamp: number;
}

interface ContainerData {
  total: number;
  running: number;
  stopped: number;
}

interface PipelineData {
  latest: { number: number; result: string; duration: number } | null;
  successRate: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(0) + " KB";
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
  return (bytes / 1073741824).toFixed(2) + " GB";
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

/* ── Mini Sparkline Chart (Pure CSS + JS) ──────────────────────── */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[2px] h-10">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm transition-all duration-300"
          style={{
            height: `${Math.max((v / max) * 100, 4)}%`,
            backgroundColor: color,
            opacity: 0.4 + (i / data.length) * 0.6,
          }}
        />
      ))}
    </div>
  );
}

export function OverviewTab() {
  const [system, setSystem] = useState<SystemData | null>(null);
  const [containers, setContainers] = useState<ContainerData | null>(null);
  const [pipeline, setPipeline] = useState<PipelineData | null>(null);
  const [cpuHistory, setCpuHistory] = useState<number[]>([]);
  const [memHistory, setMemHistory] = useState<number[]>([]);
  const [isLive, setIsLive] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [sysRes, conRes, pipRes] = await Promise.all([
        fetch("/api/dashboard/system"),
        fetch("/api/dashboard/containers"),
        fetch("/api/dashboard/pipeline"),
      ]);

      if (sysRes.ok) {
        const sysData = await sysRes.json();
        setSystem(sysData);
        setCpuHistory((prev) => [...prev.slice(-19), sysData.cpu.usage]);
        setMemHistory((prev) => [...prev.slice(-19), sysData.memory.usagePercent]);
      }
      if (conRes.ok) {
        const conData = await conRes.json();
        setContainers(conData);
      }
      if (pipRes.ok) {
        const pipData = await pipRes.json();
        setPipeline(pipData);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    if (!isLive) return;
    const interval = setInterval(fetchAll, 3000);
    return () => clearInterval(interval);
  }, [fetchAll, isLive]);

  return (
    <div className="flex flex-col gap-6">
      {/* ── Live Indicator ──────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isLive ? "bg-green-500 animate-pulse" : "bg-slate-400"
            }`}
          />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {isLive ? "Live — Polling every 3s" : "Paused"}
          </span>
        </div>
        <button
          onClick={() => setIsLive((p) => !p)}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
        >
          {isLive ? "Pause" : "Resume"}
        </button>
      </div>

      {/* ── Summary Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU Card */}
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col gap-3 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                CPU Usage
              </span>
            </div>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">
            {system ? `${system.cpu.usage}%` : "—"}
          </div>
          <Sparkline data={cpuHistory.length ? cpuHistory : [0]} color="#3b82f6" />
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {system ? `${system.cpu.cores} cores · ${system.cpu.model.slice(0, 30)}` : "Loading..."}
          </p>
        </div>

        {/* Memory Card */}
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col gap-3 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center">
                <MemoryStick className="w-5 h-5 text-purple-500" />
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Memory
              </span>
            </div>
            <Gauge className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">
            {system ? `${system.memory.usagePercent}%` : "—"}
          </div>
          <Sparkline data={memHistory.length ? memHistory : [0]} color="#a855f7" />
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {system
              ? `${formatBytes(system.memory.used)} / ${formatBytes(system.memory.total)}`
              : "Loading..."}
          </p>
        </div>

        {/* Containers Card */}
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col gap-3 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center">
                <Container className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Containers
              </span>
            </div>
            <HardDrive className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">
            {containers ? containers.running : "—"}
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{
                width: containers
                  ? `${(containers.running / Math.max(containers.total, 1)) * 100}%`
                  : "0%",
              }}
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {containers
              ? `${containers.running} running · ${containers.stopped} stopped`
              : "Loading..."}
          </p>
        </div>

        {/* Pipeline Card */}
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col gap-3 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Pipeline
              </span>
            </div>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              #{pipeline?.latest?.number || "—"}
            </span>
            {pipeline?.latest && (
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  pipeline.latest.result === "SUCCESS"
                    ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400"
                    : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"
                }`}
              >
                {pipeline.latest.result}
              </span>
            )}
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
            <div
              className="bg-amber-500 h-2 rounded-full transition-all duration-500"
              style={{ width: pipeline ? `${pipeline.successRate}%` : "0%" }}
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {pipeline
              ? `${pipeline.successRate}% success rate · ${formatDuration(pipeline.latest?.duration || 0)}`
              : "Loading..."}
          </p>
        </div>
      </div>

      {/* ── System Info ─────────────────────────────────────────── */}
      {system && (
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50 transition-colors">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
            System Information
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">Hostname</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {system.hostname}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">Platform</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {system.platform}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">Uptime</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {formatUptime(system.uptime)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">CPU Cores</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {system.cpu.cores}
              </p>
            </div>
          </div>

          {/* ── Per-Core CPU Bars ──────────────────────────────── */}
          <div className="mt-5">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">Per-Core Usage</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {system.cpu.perCore.map((usage, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-16 relative overflow-hidden">
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-blue-500/70 rounded-full transition-all duration-500"
                      style={{ height: `${usage}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">C{i}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
