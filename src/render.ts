import pc from "picocolors";
import type { CheckResult, CheckStatus, DoctorReport } from "./types.js";

export function renderHumanReport(report: DoctorReport, options: { ci?: boolean } = {}): string {
  const lines: string[] = [];
  const checks = options.ci
    ? report.checks.filter((check) => check.status === "error" || check.status === "warn")
    : report.checks;

  for (const check of checks) {
    lines.push(renderCheck(check));
    if (check.suggestion) {
      lines.push(`       ${pc.dim(check.suggestion)}`);
    }
  }

  if (lines.length === 0) {
    lines.push(options.ci ? `${statusLabel("ok")} No warnings or errors found.` : `${statusLabel("skip")} No MCP config files found.`);
  }

  lines.push("");
  lines.push(
    `Summary: ${report.summary.ok} OK, ${report.summary.warn} WARN, ${report.summary.error} ERROR, ${report.summary.skip} SKIP`
  );

  return lines.join("\n");
}

export function renderJsonReport(report: DoctorReport): string {
  return JSON.stringify(report, null, 2);
}

function renderCheck(check: CheckResult): string {
  return `${statusLabel(check.status)} ${check.title}\n       ${check.message}`;
}

function statusLabel(status: CheckStatus): string {
  const label = status.toUpperCase().padEnd(5);
  switch (status) {
    case "ok":
      return pc.green(label);
    case "warn":
      return pc.yellow(label);
    case "error":
      return pc.red(label);
    case "skip":
      return pc.gray(label);
  }
}
