import { NextResponse } from "next/server";

/**
 * GET /api/dashboard/pipeline
 *
 * Real-time Jenkins pipeline detection:
 * 1. Lists ALL jobs from Jenkins automatically (no hardcoded job name)
 * 2. For each Pipeline job, fetches stage data via /wfapi/runs
 * 3. For freestyle jobs, falls back to the regular builds API
 * 4. Returns live data, properly authenticated via JENKINS_USER + JENKINS_TOKEN
 */

export const runtime = "nodejs";

const JENKINS_URL  = process.env.JENKINS_URL  || "http://localhost:8080";
const JENKINS_USER  = process.env.JENKINS_USER  || "admin";
const JENKINS_TOKEN = process.env.JENKINS_TOKEN || "";

// ── Helpers ───────────────────────────────────────────────────────────────

function authHeader(): Record<string, string> {
  if (!JENKINS_TOKEN) return {};
  const creds = Buffer.from(`${JENKINS_USER}:${JENKINS_TOKEN}`).toString("base64");
  return { Authorization: `Basic ${creds}` };
}

async function jenkinsGet(path: string): Promise<{ ok: boolean; status: number; data: unknown }> {
  try {
    const res = await fetch(`${JENKINS_URL}${path}`, {
      headers: { ...authHeader(), "Accept": "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { ok: false, status: res.status, data: null };
    const data = await res.json();
    return { ok: true, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

// ── Types ─────────────────────────────────────────────────────────────────

interface JenkinsJob {
  name: string;
  url: string;
  color: string;          // "blue" = success, "red" = failed, "notbuilt" = never run
  _class: string;
}

interface WfapiStage {
  name: string;
  status: string;
  durationMillis: number;
}

interface WfapiRun {
  id: string;
  status: string;
  startTimeMillis: number;
  durationMillis: number;
  stages: WfapiStage[];
  _links: { self: { href: string } };
}

interface JenkinsBuild {
  number: number;
  result: string | null;
  timestamp: number;
  duration: number;
  building: boolean;
  url: string;
}

// ── Main detection logic ─────────────────────────────────────────────────

async function discoverAllJobs(): Promise<{
  jobs: ProcessedJob[];
  source: string;
  connectionStatus: string;
  error?: string;
}> {
  // Step 1: Fetch all jobs
  const jobsResp = await jenkinsGet(
    "/api/json?tree=jobs[name,url,color,_class,lastBuild[number,result,timestamp,duration,building]]"
  );

  if (!jobsResp.ok) {
    if (jobsResp.status === 401 || jobsResp.status === 403) {
      return {
        jobs: [],
        source: "jenkins-auth-error",
        connectionStatus: "auth-failed",
        error: `Jenkins authentication failed (${jobsResp.status}). Check JENKINS_USER and JENKINS_TOKEN in docker-compose.yml. Current user: ${JENKINS_USER}`,
      };
    }
    return {
      jobs: [],
      source: "jenkins-unavailable",
      connectionStatus: "unreachable",
      error: `Jenkins not reachable at ${JENKINS_URL} (status: ${jobsResp.status})`,
    };
  }

  const allJobs = ((jobsResp.data as { jobs?: JenkinsJob[] }).jobs || []);
  
  if (allJobs.length === 0) {
    return {
      jobs: [],
      source: "jenkins-no-jobs",
      connectionStatus: "connected",
      error: undefined,
    };
  }

  // Step 2: Fetch builds for every job in parallel
  const processed = await Promise.all(
    allJobs.map(async (job) => fetchJobBuilds(job))
  );

  return {
    jobs: processed,
    source: "jenkins-live",
    connectionStatus: "connected",
    error: undefined,
  };
}

interface ProcessedJob {
  name: string;
  url: string;
  color: string;
  type: "pipeline" | "freestyle" | "folder" | "unknown";
  builds: ProcessedBuild[];
  totalBuilds: number;
  successRate: number;
  lastBuildStatus: string;
  lastBuildTime: number | null;
}

interface ProcessedBuild {
  id: string | number;
  number: number;
  result: string;
  timestamp: number;
  duration: number;
  building: boolean;
  url: string;
  stages: { name: string; status: string; durationMs: number }[];
}

function classifyJob(cls: string): "pipeline" | "freestyle" | "folder" | "unknown" {
  if (!cls) return "unknown";
  if (cls.includes("WorkflowJob")) return "pipeline";
  if (cls.includes("FreeStyle")) return "freestyle";
  if (cls.includes("Folder")) return "folder";
  return "unknown";
}

function colorToStatus(color: string): string {
  if (color === "blue" || color === "blue_anime") return "SUCCESS";
  if (color === "red" || color === "red_anime") return "FAILURE";
  if (color === "yellow" || color === "yellow_anime") return "UNSTABLE";
  if (color === "notbuilt" || color === "notbuilt_anime") return "NOT_BUILT";
  if (color === "aborted" || color === "aborted_anime") return "ABORTED";
  if (color?.endsWith("_anime")) return "IN_PROGRESS";
  return "UNKNOWN";
}

async function fetchJobBuilds(job: JenkinsJob): Promise<ProcessedJob> {
  const type = classifyJob(job._class);
  const builds: ProcessedBuild[] = [];

  if (type === "folder") {
    return {
      name: job.name,
      url: job.url,
      color: job.color,
      type,
      builds: [],
      totalBuilds: 0,
      successRate: 0,
      lastBuildStatus: "FOLDER",
      lastBuildTime: null,
    };
  }

  if (type === "pipeline") {
    // Use wfapi for rich stage data
    const wfResp = await jenkinsGet(`/job/${encodeURIComponent(job.name)}/wfapi/runs`);
    if (wfResp.ok) {
      const runs = (wfResp.data as WfapiRun[]).slice(0, 10);
      for (const run of runs) {
        builds.push({
          id: run.id,
          number: parseInt(run.id, 10) || 0,
          result: run.status === "IN_PROGRESS" ? "IN_PROGRESS" : run.status,
          timestamp: run.startTimeMillis,
          duration: run.durationMillis,
          building: run.status === "IN_PROGRESS",
          url: run._links?.self?.href
            ? `${JENKINS_URL}${run._links.self.href}`
            : `${JENKINS_URL}/job/${job.name}/${run.id}`,
          stages: (run.stages || []).map((s) => ({
            name: s.name,
            status: s.status,
            durationMs: s.durationMillis,
          })),
        });
      }
    }
  }

  // Fallback for freestyle or if wfapi failed
  if (builds.length === 0) {
    const buildsResp = await jenkinsGet(
      `/job/${encodeURIComponent(job.name)}/api/json?tree=builds[number,result,timestamp,duration,building,url]{0,10}`
    );
    if (buildsResp.ok) {
      const rawBuilds = ((buildsResp.data as { builds?: JenkinsBuild[] }).builds || []);
      for (const b of rawBuilds) {
        builds.push({
          id: b.number,
          number: b.number,
          result: b.building ? "IN_PROGRESS" : (b.result || "UNKNOWN"),
          timestamp: b.timestamp,
          duration: b.duration,
          building: b.building,
          url: b.url,
          stages: [],
        });
      }
    }
  }

  const doneBuilds = builds.filter((b) => !b.building);
  const successRate = doneBuilds.length
    ? Math.round(
        (doneBuilds.filter((b) => b.result === "SUCCESS" || b.result === "BLUE").length /
          doneBuilds.length) *
          100
      )
    : 0;

  return {
    name: job.name,
    url: job.url,
    color: job.color,
    type,
    builds,
    totalBuilds: builds.length,
    successRate,
    lastBuildStatus: builds[0]?.result || colorToStatus(job.color),
    lastBuildTime: builds[0]?.timestamp || null,
  };
}

export async function GET() {
  try {
    const result = await discoverAllJobs();

    // Also do a quick ping to confirm connectivity
    const pingResp = await jenkinsGet("/api/json?tree=numExecutors,nodeName");
    const isConnected = pingResp.ok;

    // Calculate primary pipeline stats for Overview tab
    const visibleJobs = result.jobs.filter((j) => j.type !== "folder");
    const jobName = process.env.JENKINS_JOB_NAME;
    const targetJob = jobName ? visibleJobs.find((j) => j.name === jobName) : null;
    const primaryJob = targetJob || visibleJobs[0] || null;

    let successRate = 0;
    let latest = null;

    if (primaryJob) {
      successRate = primaryJob.successRate;
      const latestBuild = primaryJob.builds[0] || null;
      if (latestBuild) {
        latest = {
          number: latestBuild.number,
          result: latestBuild.result,
          duration: latestBuild.duration,
        };
      }
    }

    return NextResponse.json({
      ...result,
      successRate,
      latest,
      jenkinsUrl: JENKINS_URL,
      authenticatedAs: JENKINS_TOKEN ? JENKINS_USER : "anonymous",
      isConnected,
      timestamp: Date.now(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        jobs: [],
        source: "error",
        connectionStatus: "error",
        error: message,
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
