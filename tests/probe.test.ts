import path from "node:path";
import http from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { probeServer } from "../src/probe.js";
import type { ServerDefinition } from "../src/types.js";

const servers: http.Server[] = [];

afterEach(async () => {
  await Promise.all(servers.map((server) => new Promise<void>((resolve) => server.close(() => resolve()))));
  servers.length = 0;
});

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

  it("checks HTTP server reachability", async () => {
    const url = await startHttpServer();
    const checks = await probeServer(makeHttpServer(url), 1000);

    expect(checks[0]?.status).toBe("ok");
    expect(checks[0]?.title).toBe("web: URL reachable");
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

function makeHttpServer(url: string): ServerDefinition {
  return {
    id: "source:web",
    name: "web",
    sourceId: "source",
    sourcePath: path.join(process.cwd(), "mcp.json"),
    client: "Custom",
    transport: "http",
    raw: {},
    args: [],
    env: {},
    url,
    workspaceRoot: process.cwd()
  };
}

async function startHttpServer(): Promise<string> {
  const server = http.createServer((_request, response) => {
    response.writeHead(200);
    response.end();
  });
  servers.push(server);

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Expected TCP address");
  }
  return `http://127.0.0.1:${address.port}`;
}
