import pc from "picocolors";
import type { CheckResult, CheckStatus, DoctorReport } from "./types.js";

export function renderHumanReport(report: DoctorReport): string {
  const lines: string[] = [];

  for (const check of report.checks) {
    lines.push(renderCheck(check));
    if (check.suggestion) {
      lines.push(`       ${pc.dim(check.suggestion)}`);
    }
  }

  if (lines.length === 0) {
    lines.push(`${statusLabel("skip")} No MCP config files found.`);
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
