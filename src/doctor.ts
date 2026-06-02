import { loadConfigs } from "./config.js";
import { probeServer } from "./probe.js";
import { runStaticChecks } from "./checks.js";
import type { CheckStatus, DoctorOptions, DoctorReport } from "./types.js";

export async function runDoctor(options: DoctorOptions): Promise<DoctorReport> {
  const loaded = loadConfigs(options.cwd, options.configPath);
  const checks = [...loaded.checks];

  for (const server of loaded.servers) {
    const staticChecks = runStaticChecks(server);
    checks.push(...staticChecks);
    if (options.start && server.transport === "stdio") {
      if (shouldSkipStartupProbe(staticChecks)) {
        checks.push({
          status: "skip",
          serverId: server.id,
          sourceId: server.sourceId,
          title: `${server.name}: startup skipped`,
          message: "Static checks found blocking issues.",
          suggestion: "Fix the static errors, then run mcp-doctor again."
        });
      } else {
        checks.push(...(await probeServer(server, options.timeoutMs)));
      }
    } else if (!options.start && server.transport === "stdio") {
      checks.push({
        status: "skip",
        serverId: server.id,
        sourceId: server.sourceId,
        title: `${server.name}: startup skipped`,
        message: "--no-start was provided."
      });
    }
  }

  return {
    sources: loaded.sources,
    servers: loaded.servers,
    checks,
    summary: summarize(checks)
  };
}

function shouldSkipStartupProbe(checks: Array<{ status: CheckStatus; title: string }>): boolean {
  return checks.some((check) => check.status === "error" || check.title.includes("unresolved"));
}

function summarize(checks: Array<{ status: CheckStatus }>): Record<CheckStatus, number> {
  return checks.reduce<Record<CheckStatus, number>>(
    (acc, check) => {
      acc[check.status] += 1;
      return acc;
    },
    { ok: 0, warn: 0, error: 0, skip: 0 }
  );
}
