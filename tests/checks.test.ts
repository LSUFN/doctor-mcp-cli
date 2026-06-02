import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runStaticChecks } from "../src/checks.js";
import type { ServerDefinition } from "../src/types.js";

describe("static checks", () => {
  it("detects missing env placeholders and missing local paths", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-doctor-"));
    const server = makeServer(dir, {
      args: ["missing.js"],
      env: { TOKEN: "${env:MCP_DOCTOR_TEST_TOKEN_THAT_SHOULD_NOT_EXIST}" }
    });

    const checks = runStaticChecks(server);

    expect(checks.some((check) => check.title.includes("missing environment variable"))).toBe(true);
    expect(checks.some((check) => check.title.includes("path does not exist"))).toBe(true);
  });

  it("recognizes URL servers for reachability checks", () => {
    const server = makeServer(process.cwd(), {
      transport: "http",
      command: undefined,
      url: "https://example.com/mcp"
    });

    const checks = runStaticChecks(server);

    expect(checks[0]?.status).toBe("ok");
    expect(checks[0]?.suggestion).toContain("reachability");
  });
});

function makeServer(
  dir: string,
  override: Partial<ServerDefinition> = {}
): ServerDefinition {
  return {
    id: "source:demo",
    name: "demo",
    sourceId: "source",
    sourcePath: path.join(dir, "mcp.json"),
    client: "Custom",
    transport: "stdio",
    raw: {},
    command: "node",
    args: [],
    env: {},
    workspaceRoot: dir,
    ...override
  };
}
