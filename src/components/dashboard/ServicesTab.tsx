"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Server,
  Globe,
  Database,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Cpu,
  Container,
  RotateCcw,
} from "lucide-react";

interface ServiceHealth {
  name: string;
  endpoint: string;
  port: number;
  status: "healthy" | "degraded" | "down" | "unknown";
  responseTime: number;
  technology: string;
  description: string;
}

const getServiceIcon = (name: string) => {
  if (name.includes("Web"))
    return <Globe className="w-6 h-6 text-blue-500" />;
  if (name.includes("Gemini") || name.includes("API"))
    return <Cpu className="w-6 h-6 text-indigo-500" />;
  if (name.includes("Redis"))
    return <Database className="w-6 h-6 text-red-500" />;
  if (name.includes("Jenkins"))
    return <Activity className="w-6 h-6 text-amber-500" />;
  if (name.includes("Docker"))
    return <Container className="w-6 h-6 text-blue-400" />;
  return <Server className="w-6 h-6 text-purple-500" />;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "healthy":
      return (
        <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400">
          <CheckCircle2 className="w-3 h-3" />
          HEALTHY
        </span>
      );
    case "degraded":
      return (
        <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">
          <AlertTriangle className="w-3 h-3" />
          DEGRADED
        </span>
      );
    case "down":
      return (
        <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400">
          <XCircle className="w-3 h-3" />
          DOWN
        </span>
      );
    default:
      return (
        <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
          UNKNOWN
        </span>
      );
  }
};

export function ServicesTab() {
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ healthy: 0, down: 0, total: 0 });

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/services");
      if (res.ok) {
        const data = await res.json();
        setServices(data.services || []);
        setStats({
          healthy: data.healthy || 0,
          down: data.down || 0,
          total: data.total || 0,
        });
      }
    } catch (err) {
      console.error("Services fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
    const interval = setInterval(fetchServices, 10000);
    return () => clearInterval(interval);
  }, [fetchServices]);

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
          <Server className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Microservices
          </h2>
          <span className="bg-green-50 dark:bg-green-500/20 text-green-600 dark:text-green-400 text-xs font-bold px-2.5 py-0.5 rounded-full">
            {stats.healthy}/{stats.total} Healthy
          </span>
          <div className="flex items-center gap-1.5 ml-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Live health checks
            </span>
          </div>
        </div>
        <button
          onClick={fetchServices}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium flex items-center gap-1.5"
        >
          <RotateCcw className="w-3 h-3" />
          Recheck
        </button>
      </div>

      {/* ── Service Cards ───────────────────────────────────────── */}
      <div className="grid gap-4">
        {services.map((service) => (
          <div
            key={service.name}
            className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50 transition-colors hover:shadow-md"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left: Info */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                  {getServiceIcon(service.name)}
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {service.name}
                    </span>
                    {getStatusBadge(service.status)}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {service.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-mono text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded">
                      {service.endpoint}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Port: {service.port}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Metrics */}
              <div className="grid grid-cols-2 gap-4 lg:gap-6">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
                    Latency
                  </span>
                  <span
                    className={`text-sm font-bold ${
                      service.status === "healthy"
                        ? "text-slate-900 dark:text-white"
                        : "text-red-500"
                    }`}
                  >
                    {service.status === "down"
                      ? "timeout"
                      : `${service.responseTime}ms`}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
                    Stack
                  </span>
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    {service.technology}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Architecture Note ───────────────────────────────────── */}
      <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-500/20">
        <div className="flex items-start gap-3">
          <ExternalLink className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 mb-1">
              Architecture Overview
            </h3>
            <p className="text-xs text-indigo-600/80 dark:text-indigo-400/70 leading-relaxed">
              DomainQA uses a microservices architecture orchestrated via Docker
              Compose. All health checks shown above are performed in real-time
              by pinging the actual endpoints. Services marked as
              &quot;DOWN&quot; are not currently running — start them using the
              Containers tab or Docker Desktop.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
