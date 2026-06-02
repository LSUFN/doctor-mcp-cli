import path from "node:path";
import { describe, expect, it } from "vitest";
import { probeServer } from "../src/probe.js";
import type { ServerDefinition } from "../src/types.js";

describe("MCP probing", () => {
  it("lists tools from a fake stdio server", async () => {
    const dir = process.cwd();
    const serverPath = path.join(dir, "tests", "fixtures", "fake-server.mjs");

    const checks = await probeServer(makeServer(dir, serverPath), 5000);

    expect(checks[0]?.status).toBe("ok");
    expect(checks[0]?.message).toBe("1 tools available");
  });

  it("times out and closes a non-responsive process", async () => {
    const dir = process.cwd();
    const serverPath = path.join(dir, "tests", "fixtures", "hanging-server.mjs");

    const checks = await probeServer(makeServer(dir, serverPath), 100);

    expect(checks[0]?.status).toBe("error");
    expect(checks[0]?.message).toBe("Timed out after 100ms");
  });
});

function makeServer(dir: string, serverPath: string): ServerDefinition {
  return {
    id: "source:fake",
    name: "fake",
    sourceId: "source",
    sourcePath: path.join(dir, "mcp.json"),
    client: "Custom",
    transport: "stdio",
    raw: {},
    command: "node",
    args: [serverPath],
    env: {},
    workspaceRoot: dir
  };
}
