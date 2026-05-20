"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ScrollText, Trash2, Download, Filter, AlertTriangle } from "lucide-react";

interface LogEntry {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  service: string;
  message: string;
}

interface ContainerInfo {
  id: string;
  name: string;
  state: string;
}

export function LogsTab() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [containers, setContainers] = useState<ContainerInfo[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [serviceFilter, setServiceFilter] = useState<string>("ALL");
  const [autoScroll, setAutoScroll] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [source, setSource] = useState<string>("loading");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch containers for the service filter dropdown
  const fetchContainers = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/containers");
      if (res.ok) {
        const data = await res.json();
        setContainers(data.containers || []);
      }
    } catch {
      // silently fail
    }
  }, []);

  // Fetch real Docker logs
  const fetchLogs = useCallback(async () => {
    try {
      const url =
        serviceFilter !== "ALL"
          ? `/api/dashboard/logs?container=${serviceFilter}&tail=100`
          : "/api/dashboard/logs?tail=100";

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSource(data.source || "unknown");
        if (data.logs && data.logs.length > 0) {
          setLogs(data.logs);
        }
      }
    } catch (err) {
      console.error("Log fetch error:", err);
      setSource("error");
    }
  }, [serviceFilter]);

  useEffect(() => {
    fetchContainers();
  }, [fetchContainers]);

  useEffect(() => {
    fetchLogs();
    if (!isLive) return;
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [fetchLogs, isLive]);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case "ERROR":
        return "text-red-500";
      case "WARN":
        return "text-yellow-500";
      case "DEBUG":
        return "text-slate-400";
      default:
        return "text-green-500";
    }
  };

  const getServiceColor = (service: string) => {
    // Assign colors based on hash of service name
    const colors = [
      "text-blue-400",
      "text-red-400",
      "text-purple-400",
      "text-emerald-400",
      "text-amber-400",
      "text-cyan-400",
    ];
    let hash = 0;
    for (let i = 0; i < service.length; i++) {
      hash = (hash << 5) - hash + service.charCodeAt(i);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const filteredLogs = logs.filter((log) => {
    if (filter !== "ALL" && log.level !== filter) return false;
    return true;
  });

  const services = Array.from(new Set(containers.map((c) => c.name)));

  const handleDownload = () => {
    const text = filteredLogs
      .map((l) => `[${l.timestamp}] ${l.level} [${l.service}] ${l.message}`)
      .join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `domainqa-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-200px)]">
      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ScrollText className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Docker Logs
          </h2>
          {isLive && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Live from Docker
              </span>
            </div>
          )}
          {source === "error" && (
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                No running containers to fetch logs from
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Level filter */}
          <div className="flex items-center gap-1 text-xs">
            <Filter className="w-3 h-3 text-slate-400" />
            {["ALL", "INFO", "WARN", "ERROR", "DEBUG"].map((level) => (
              <button
                key={level}
                onClick={() => setFilter(level)}
                className={`px-2 py-1 rounded-lg font-semibold transition-colors ${
                  filter === level
                    ? "bg-indigo-500 text-white"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          {/* Service filter */}
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="ALL">All Containers</option>
            {services.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsLive((p) => !p)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${
              isLive
                ? "border-green-300 dark:border-green-700 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10"
                : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
            }`}
          >
            {isLive ? "Live ON" : "Live OFF"}
          </button>

          <button
            onClick={() => setAutoScroll((p) => !p)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${
              autoScroll
                ? "border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10"
                : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
            }`}
          >
            Auto-scroll {autoScroll ? "ON" : "OFF"}
          </button>

          <button
            onClick={() => setLogs([])}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Clear logs"
          >
            <Trash2 className="w-3 h-3" />
          </button>
          <button
            onClick={handleDownload}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Download logs"
          >
            <Download className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ── Log Console ─────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 bg-slate-900 dark:bg-slate-950 rounded-2xl p-4 overflow-y-auto font-mono text-[12px] leading-6 border border-slate-700/50 shadow-inner"
      >
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log, i) => {
            let timeStr: string;
            try {
              timeStr = new Date(log.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              });
            } catch {
              timeStr = log.timestamp?.slice(11, 19) || "--:--:--";
            }

            return (
              <div
                key={i}
                className="flex gap-3 hover:bg-slate-800/50 px-2 py-0.5 rounded transition-colors"
              >
                <span className="text-slate-600 shrink-0">{timeStr}</span>
                <span
                  className={`font-bold shrink-0 w-12 ${getLevelColor(
                    log.level
                  )}`}
                >
                  {log.level.padEnd(5)}
                </span>
                <span className={`shrink-0 ${getServiceColor(log.service)}`}>
                  [{log.service}]
                </span>
                <span className="text-slate-300 break-all">{log.message}</span>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-500">
            <ScrollText className="w-10 h-10 text-slate-600" />
            <p className="text-sm">No logs available</p>
            <p className="text-xs text-slate-600 text-center max-w-sm">
              Start some Docker containers to see their real-time logs here.
              Logs are fetched directly from the Docker Engine.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
