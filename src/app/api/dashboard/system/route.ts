import { NextResponse } from "next/server";
import os from "os";

/**
 * GET /api/dashboard/system
 * Returns real-time system metrics (CPU, Memory) for the dashboard.
 * This is a NEW endpoint — does not affect any existing API routes.
 */
export async function GET() {
  try {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    // Calculate CPU usage per core
    const cpuUsage = cpus.map((cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      const idle = cpu.times.idle;
      return ((total - idle) / total) * 100;
    });

    const avgCpu = cpuUsage.reduce((a, b) => a + b, 0) / cpuUsage.length;

    return NextResponse.json({
      cpu: {
        usage: Math.round(avgCpu * 100) / 100,
        cores: cpus.length,
        model: cpus[0]?.model || "Unknown",
        perCore: cpuUsage.map((u) => Math.round(u * 100) / 100),
      },
      memory: {
        total: totalMemory,
        used: usedMemory,
        free: freeMemory,
        usagePercent: Math.round((usedMemory / totalMemory) * 10000) / 100,
      },
      uptime: os.uptime(),
      platform: os.platform(),
      hostname: os.hostname(),
      timestamp: Date.now(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to get system metrics: " + message },
      { status: 500 }
    );
  }
}
