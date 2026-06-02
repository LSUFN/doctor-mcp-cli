import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runDoctor } from "../src/doctor.js";

describe("doctor orchestration", () => {
  it("skips startup probing when static checks find blocking errors", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-doctor-"));
    const configPath = path.join(dir, "mcp.json");
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        mcpServers: {
          broken: { command: "mcp-doctor-command-that-does-not-exist" }
        }
      })
    );

    const report = await runDoctor({
      cwd: dir,
      configPath,
      json: true,
      start: true,
      timeoutMs: 100
    });

    expect(report.checks.some((check) => check.title === "broken: startup skipped")).toBe(true);
    expect(report.checks.some((check) => check.title === "broken: startup probe failed")).toBe(false);
  });
});
