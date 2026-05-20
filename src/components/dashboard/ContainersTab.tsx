"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Container,
  Play,
  Square,
  RotateCcw,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
} from "lucide-react";

interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
  ports: string;
  created: string;
  health: string;
}

export function ContainersTab() {
  const [containers, setContainers] = useState<ContainerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchContainers = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/containers");
      if (res.ok) {
        const data = await res.json();
        setContainers(data.containers || []);
        setError(data.error || null);
      }
    } catch (err) {
      console.error("Container fetch error:", err);
      setError("Failed to connect to container API");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContainers();
    const interval = setInterval(fetchContainers, 5000);
    return () => clearInterval(interval);
  }, [fetchContainers]);

  const handleAction = async (
    containerId: string,
    action: "start" | "stop" | "restart"
  ) => {
    setActionLoading(`${containerId}-${action}`);
    try {
      const res = await fetch("/api/dashboard/containers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ containerId, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Error: ${data.error}`);
      }
      // Refresh container list after action
      setTimeout(fetchContainers, 1000);
    } catch (err) {
      console.error("Action error:", err);
      alert("Failed to perform action");
    } finally {
      setActionLoading(null);
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case "running":
        return "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400";
      case "exited":
        return "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400";
      case "paused":
        return "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400";
      case "created":
        return "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400";
      default:
        return "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400";
    }
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case "running":
        return <CheckCircle2 className="w-4 h-4" />;
      case "exited":
        return <XCircle className="w-4 h-4" />;
      case "created":
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Container className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Docker Containers
          </h2>
          <span className="bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold px-2.5 py-0.5 rounded-full">
            {containers.length} total
          </span>
          <div className="flex items-center gap-1.5 ml-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Live from Docker Desktop
            </span>
          </div>
        </div>
        <button
          onClick={fetchContainers}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium flex items-center gap-1.5"
        >
          <RotateCcw className="w-3 h-3" />
          Refresh
        </button>
      </div>

      {/* ── Error Banner ────────────────────────────────────────── */}
      {error && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">
              Docker Connection Issue
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400/70 mt-1">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* ── Empty State ─────────────────────────────────────────── */}
      {containers.length === 0 && !error && (
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-12 shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col items-center justify-center gap-4">
          <Container className="w-12 h-12 text-slate-300 dark:text-slate-600" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No Containers Found
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-md">
            No Docker containers are detected. Start some containers using{" "}
            <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-xs font-mono">
              docker-compose up
            </code>{" "}
            or the Docker Desktop UI.
          </p>
        </div>
      )}

      {/* ── Container Cards ─────────────────────────────────────── */}
      <div className="grid gap-4">
        {containers.map((container) => (
          <div
            key={container.id}
            className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50 transition-colors hover:shadow-md"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Left: Info */}
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                  <Container className="w-6 h-6 text-indigo-500" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {container.name}
                    </span>
                    <span
                      className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${getStateColor(
                        container.state
                      )}`}
                    >
                      {getStateIcon(container.state)}
                      {container.state.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {container.image}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>ID: {container.id}</span>
                    <span>·</span>
                    <span>Ports: {container.ports}</span>
                    <span>·</span>
                    <span>{container.status}</span>
                  </div>
                </div>
              </div>

              {/* Right: Actions — These now actually work! */}
              <div className="flex items-center gap-2 shrink-0">
                {container.state === "running" ? (
                  <button
                    onClick={() => handleAction(container.id, "stop")}
                    disabled={actionLoading !== null}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === `${container.id}-stop` ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Square className="w-3 h-3" />
                    )}
                    Stop
                  </button>
                ) : (
                  <button
                    onClick={() => handleAction(container.id, "start")}
                    disabled={actionLoading !== null}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === `${container.id}-start` ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Play className="w-3 h-3" />
                    )}
                    Start
                  </button>
                )}
                <button
                  onClick={() => handleAction(container.id, "restart")}
                  disabled={actionLoading !== null}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {actionLoading === `${container.id}-restart` ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RotateCcw className="w-3 h-3" />
                  )}
                  Restart
                </button>
                <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <ExternalLink className="w-3 h-3" />
                  Logs
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
