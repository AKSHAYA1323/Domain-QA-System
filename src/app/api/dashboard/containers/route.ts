import { NextResponse } from "next/server";
import Docker from "dockerode";

// Force Node.js runtime so Turbopack doesn't bundle native modules (ssh2/dockerode)
export const runtime = "nodejs";

/**
 * GET /api/dashboard/containers
 * Connects to Docker via the correct socket for the current OS.
 * - Linux/Container: /var/run/docker.sock  (mounted in docker-compose)
 * - Windows host dev:  //./pipe/docker_engine
 */

function createDockerClient(): Docker {
  if (process.platform === "win32") {
    return new Docker({ socketPath: "//./pipe/docker_engine" });
  }
  return new Docker({ socketPath: "/var/run/docker.sock" });
}

const docker = createDockerClient();

export async function GET() {
  try {
    const containers = await docker.listContainers({ all: true });

    const containerData = containers.map((c) => ({
      id: c.Id.slice(0, 12),
      name: (c.Names[0] || "").replace(/^\//, ""),
      image: c.Image,
      state: c.State,
      status: c.Status,
      ports:
        c.Ports.filter((p) => p.PublicPort)
          .map((p) => `${p.PublicPort}:${p.PrivatePort}/${p.Type}`)
          .join(", ") || "—",
      created: new Date(c.Created * 1000).toISOString(),
      health: c.State === "running" ? "healthy" : "unhealthy",
    }));

    return NextResponse.json({
      containers: containerData,
      total: containerData.length,
      running: containerData.filter((c) => c.state === "running").length,
      stopped: containerData.filter((c) => c.state !== "running").length,
      timestamp: Date.now(),
      source: "docker-live",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Docker connection error:", message);

    return NextResponse.json({
      containers: [],
      total: 0,
      running: 0,
      stopped: 0,
      timestamp: Date.now(),
      source: "error",
      error: "Could not connect to Docker: " + message,
    });
  }
}

/**
 * POST /api/dashboard/containers
 * Perform actions on containers (start, stop, restart)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { containerId, action } = body as {
      containerId: string;
      action: "start" | "stop" | "restart";
    };

    if (!containerId || !action) {
      return NextResponse.json(
        { error: "containerId and action are required" },
        { status: 400 }
      );
    }

    const container = docker.getContainer(containerId);

    switch (action) {
      case "start":
        await container.start();
        break;
      case "stop":
        await container.stop();
        break;
      case "restart":
        await container.restart();
        break;
      default:
        return NextResponse.json(
          { error: "Invalid action. Use start, stop, or restart" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Container ${containerId} ${action}ed successfully`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to perform action: " + message },
      { status: 500 }
    );
  }
}
