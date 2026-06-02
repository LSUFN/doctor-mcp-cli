#!/usr/bin/env node
import { Command } from "commander";
import { runDoctor } from "./doctor.js";
import { renderHumanReport, renderJsonReport } from "./render.js";
import { readPackageVersion } from "./version.js";

const program = new Command();

program
  .name("doctor-mcp")
  .version(readPackageVersion())
  .description("Diagnose MCP client configuration and stdio server startup problems.")
  .option("--config <path>", "check one config file instead of auto-discovery")
  .option("--json", "print a machine-readable JSON report", false)
  .option("--ci", "print only warnings and errors for CI logs", false)
  .option("--no-start", "only run static checks, do not start MCP servers")
  .option("--timeout <ms>", "stdio server probe timeout in milliseconds", parseTimeout, 8000)
  .action(async (options: { config?: string; json: boolean; ci: boolean; start: boolean; timeout: number }) => {
    const report = await runDoctor({
      cwd: process.cwd(),
      configPath: options.config,
      json: options.json,
      ci: options.ci,
      start: options.start,
      timeoutMs: options.timeout
    });

    const output = options.json ? renderJsonReport(report) : renderHumanReport(report, { ci: options.ci });
    console.log(output);
    process.exitCode = report.summary.error > 0 ? 1 : 0;
  });

program.parseAsync().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

function parseTimeout(value: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("--timeout must be a positive integer.");
  }
  return parsed;
}
