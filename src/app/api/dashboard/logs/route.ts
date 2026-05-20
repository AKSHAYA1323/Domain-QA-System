import { NextResponse } from "next/server";
import Docker from "dockerode";

// Force Node.js runtime so Turbopack doesn't bundle native modules (ssh2/dockerode)
export const runtime = "nodejs";

/**
 * GET /api/dashboard/logs?container=<name>&tail=100
 * Fetches REAL logs from a Docker container via the Docker socket.
 */

const docker = new Docker({
  socketPath: process.platform === "win32"
    ? "//./pipe/docker_engine"
    : "/var/run/docker.sock",
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const containerName = searchParams.get("container");
    const tail = parseInt(searchParams.get("tail") || "50", 10);

    if (containerName) {
      // Get logs from a specific container
      const container = docker.getContainer(containerName);
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail: tail,
        timestamps: true,
      });

      const logText = typeof logs === "string" ? logs : logs.toString("utf-8");

      const logEntries = logText
        .split("\n")
        .filter((line: string) => line.trim().length > 0)
        .map((line: string) => {
          // Docker log lines often have 8-byte header prefix, strip it
          const cleanLine = line.replace(/^[\x00-\x1f]{8}/, "").trim();

          // Try to parse timestamp from Docker format
          const tsMatch = cleanLine.match(
            /^(\d{4}-\d{2}-\d{2}T[\d:.]+Z?\+?\d*:?\d*)\s*(.*)/
          );

          let timestamp = new Date().toISOString();
          let message = cleanLine;
          if (tsMatch) {
            timestamp = tsMatch[1];
            message = tsMatch[2];
          }

          // Detect log level from message content
          let level: "INFO" | "WARN" | "ERROR" | "DEBUG" = "INFO";
          const upperMsg = message.toUpperCase();
          if (upperMsg.includes("ERROR") || upperMsg.includes("ERR"))
            level = "ERROR";
          else if (
            upperMsg.includes("WARN") ||
            upperMsg.includes("WARNING")
          )
            level = "WARN";
          else if (upperMsg.includes("DEBUG")) level = "DEBUG";

          return { timestamp, level, service: containerName, message };
        });

      return NextResponse.json({
        logs: logEntries,
        container: containerName,
        source: "docker-live",
      });
    } else {
      // Get logs from ALL running containers
      const containers = await docker.listContainers();
      const allLogs: Array<{
        timestamp: string;
        level: string;
        service: string;
        message: string;
      }> = [];

      for (const c of containers) {
        const name = c.Names[0]?.replace(/^\//, "") || c.Id.slice(0, 12);
        try {
          const container = docker.getContainer(c.Id);
          const logs = await container.logs({
            stdout: true,
            stderr: true,
            tail: 15,
            timestamps: true,
          });

          const logText =
            typeof logs === "string" ? logs : logs.toString("utf-8");

          logText
            .split("\n")
            .filter((line: string) => line.trim().length > 0)
            .forEach((line: string) => {
              const cleanLine = line.replace(/^[\x00-\x1f]{8}/, "").trim();
              const tsMatch = cleanLine.match(
                /^(\d{4}-\d{2}-\d{2}T[\d:.]+Z?\+?\d*:?\d*)\s*(.*)/
              );

              let timestamp = new Date().toISOString();
              let message = cleanLine;
              if (tsMatch) {
                timestamp = tsMatch[1];
                message = tsMatch[2];
              }

              let level: "INFO" | "WARN" | "ERROR" | "DEBUG" = "INFO";
              const upperMsg = message.toUpperCase();
              if (upperMsg.includes("ERROR") || upperMsg.includes("ERR"))
                level = "ERROR";
              else if (
                upperMsg.includes("WARN") ||
                upperMsg.includes("WARNING")
              )
                level = "WARN";
              else if (upperMsg.includes("DEBUG")) level = "DEBUG";

              allLogs.push({ timestamp, level, service: name, message });
            });
        } catch {
          // Skip containers that can't provide logs
        }
      }

      // Sort by timestamp
      allLogs.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      return NextResponse.json({
        logs: allLogs,
        source: "docker-live-all",
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({
      logs: [],
      source: "error",
      error: "Could not fetch logs: " + message,
    });
  }
}
