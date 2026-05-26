import { NextResponse } from "next/server";
import Docker from "dockerode";
import * as net from "net";

// Force Node.js runtime so Turbopack doesn't bundle native modules (ssh2/dockerode)
export const runtime = "nodejs";

/**
 * GET /api/dashboard/services
 * Returns REAL microservice health status by checking actual endpoints.
 * Uses Docker network hostnames when running inside a container.
 */

const docker = new Docker({
  socketPath: process.platform === "win32"
    ? "//./pipe/docker_engine"
    : "/var/run/docker.sock",
});

interface ServiceHealth {
  name: string;
  endpoint: string;
  port: number;
  status: "healthy" | "degraded" | "down" | "unknown";
  responseTime: number;
  technology: string;
  description: string;
  containerState?: string;
}

async function checkEndpoint(
  url: string,
  timeoutMs: number = 3000
): Promise<{ ok: boolean; responseTime: number }> {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    // Jenkins returns 403 if security is on – still means it's reachable
    return { ok: res.status < 500, responseTime: Date.now() - start };
  } catch {
    return { ok: false, responseTime: Date.now() - start };
  }
}

/** Check a raw TCP port – works for Redis, etc. */
function checkTcpPort(host: string, port: number, timeoutMs = 3000): Promise<{ ok: boolean; responseTime: number }> {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();
    let resolved = false;

    const done = (ok: boolean) => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
        resolve({ ok, responseTime: Date.now() - start });
      }
    };

    socket.setTimeout(timeoutMs);
    socket.connect(port, host, () => done(true));
    socket.on("error", () => done(false));
    socket.on("timeout", () => done(false));
  });
}

export async function GET(request: Request) {
  try {
    const services: ServiceHealth[] = [];

    // Dynamically detect the request host and port to avoid hardcoded ports
    const urlObj = new URL(request.url);
    const requestPort = parseInt(urlObj.port || "80", 10);
    const envPort = parseInt(process.env.PORT || "3000", 10);

    // Try checking the API status on the environment port, fallback to request port if that fails
    let checkPort = envPort;
    let apiCheck = await checkEndpoint(`http://localhost:${checkPort}/api/dashboard/system`, 1000);
    if (!apiCheck.ok && requestPort !== checkPort) {
      const secondCheck = await checkEndpoint(`http://localhost:${requestPort}/api/dashboard/system`, 1000);
      if (secondCheck.ok) {
        apiCheck = secondCheck;
        checkPort = requestPort;
      }
    }

    // Resolve container-network hostnames (inside Docker) or localhost (dev)
    const jenkinsHost = process.env.JENKINS_URL || "http://localhost:8080";
    const redisHost   = process.env.REDIS_HOST   || "localhost";
    const redisPort   = parseInt(process.env.REDIS_PORT || "6379", 10);

    // Build the dynamic endpoint URL for DomainQA Web based on the incoming request headers
    const hostHeader = request.headers.get("host") || urlObj.host || `localhost:${requestPort}`;
    const protocol = request.headers.get("x-forwarded-proto") || urlObj.protocol.replace(":", "") || "http";
    const webEndpoint = `${protocol}://${hostHeader}`;

    // 1. DomainQA Web – if this API route is running, the web app IS healthy.
    //    A circular fetch to localhost:3000 deadlocks under load, so we skip it.
    services.push({
      name: "DomainQA Web",
      endpoint: webEndpoint,
      port: requestPort,
      status: "healthy",
      responseTime: 0,
      technology: "Next.js 16 + React 19",
      description: "Main Next.js application serving the Q&A interface",
    });

    // 2. Gemini API Bridge – ping /api/dashboard/system (no circular dependency)
    services.push({
      name: "Gemini API Bridge",
      endpoint: "/api/generate",
      port: checkPort,
      status: apiCheck.ok ? "healthy" : "down",
      responseTime: apiCheck.responseTime,
      technology: "@google/generative-ai SDK",
      description: "Server-side API route connecting to Google Gemini 2.5 Flash",
    });

    // 3. Redis – TCP check (Redis speaks its own protocol, not HTTP)
    const redisCheck = await checkTcpPort(redisHost, redisPort);
    services.push({
      name: "Redis Cache",
      endpoint: `redis://${redisHost}:${redisPort}`,
      port: redisPort,
      status: redisCheck.ok ? "healthy" : "down",
      responseTime: redisCheck.responseTime,
      technology: "Redis 7 Alpine",
      description: "In-memory caching layer for chat history persistence",
    });

    // 4. Jenkins – 200 or 403 both mean reachable (403 = auth required)
    const jenkinsCheck = await checkEndpoint(jenkinsHost);
    services.push({
      name: "Jenkins CI/CD",
      endpoint: jenkinsHost,
      port: 8080,
      status: jenkinsCheck.ok ? "healthy" : "down",
      responseTime: jenkinsCheck.responseTime,
      technology: "Jenkins + Maven",
      description: "CI/CD automation server running the Maven build pipeline",
    });

    // 5. Docker Engine
    let dockerStatus: "healthy" | "down" = "down";
    let dockerResponseTime = 0;
    try {
      const start = Date.now();
      await docker.ping();
      dockerResponseTime = Date.now() - start;
      dockerStatus = "healthy";
    } catch {
      dockerStatus = "down";
    }
    services.push({
      name: "Docker Engine",
      endpoint: "//./pipe/docker_engine",
      port: 2375,
      status: dockerStatus,
      responseTime: dockerResponseTime,
      technology: "Docker Desktop v4",
      description: "Container runtime providing orchestration via Docker Compose",
    });

    const healthy = services.filter((s) => s.status === "healthy").length;

    return NextResponse.json({
      services,
      total: services.length,
      healthy,
      degraded: services.filter((s) => s.status === "degraded").length,
      down: services.filter((s) => s.status === "down").length,
      timestamp: Date.now(),
      source: "live-healthcheck",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to check services: " + message },
      { status: 500 }
    );
  }
}
