import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("CLI", () => {
  it("prints JSON for a custom config", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-doctor-"));
    const configPath = path.join(dir, "mcp.json");
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        mcpServers: {
          demo: { command: "node", args: ["missing.js"] }
        }
      })
    );

    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", "src/cli.ts", "--config", configPath, "--json", "--no-start"],
      { cwd: path.resolve("."), encoding: "utf8" }
    );

    const report = JSON.parse(result.stdout);
    expect(report.servers).toHaveLength(1);
    expect(report.summary.error).toBeGreaterThan(0);
    expect(result.status).toBe(1);
  });
});
