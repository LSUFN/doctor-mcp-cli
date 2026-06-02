import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { discoverConfigSources, extractServers, loadConfigs } from "../src/config.js";
import type { ConfigSource } from "../src/types.js";

describe("config loading", () => {
  it("loads mcpServers from a custom config", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-doctor-"));
    const configPath = path.join(dir, "mcp.json");
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        mcpServers: {
          demo: {
            command: "node",
            args: ["server.js"],
            env: { API_KEY: "${env:API_KEY}" }
          }
        }
      })
    );

    const result = loadConfigs(dir, configPath);

    expect(result.servers).toHaveLength(1);
    expect(result.servers[0]?.name).toBe("demo");
    expect(result.servers[0]?.transport).toBe("stdio");
    expect(result.checks.some((check) => check.status === "ok")).toBe(true);
  });

  it("reports invalid JSON", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-doctor-"));
    const configPath = path.join(dir, "bad.json");
    fs.writeFileSync(configPath, "{");

    const result = loadConfigs(dir, configPath);

    expect(result.servers).toHaveLength(0);
    expect(result.checks.some((check) => check.status === "error" && check.title.includes("invalid JSON"))).toBe(true);
  });

  it("converts VS Code servers", () => {
    const source: ConfigSource = {
      id: "vscode",
      client: "VS Code",
      label: "VS Code workspace config",
      path: "/repo/.vscode/mcp.json",
      exists: true,
      workspaceRoot: "/repo"
    };

    const result = extractServers(source, {
      servers: {
        demo: {
          type: "stdio",
          command: "node",
          args: ["server.js"]
        }
      }
    });

    expect(result.servers).toHaveLength(1);
    expect(result.servers[0]?.client).toBe("VS Code");
    expect(result.servers[0]?.transport).toBe("stdio");
  });

  it("discovers newer MCP client project configs", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-doctor-"));
    const sources = discoverConfigSources(dir);

    expect(sources.some((source) => source.client === "Windsurf" && source.path.includes(".windsurf"))).toBe(true);
    expect(sources.some((source) => source.client === "Cline" && source.path.includes(".cline"))).toBe(true);
    expect(sources.some((source) => source.client === "Roo Code" && source.path.includes(".roo"))).toBe(true);
    expect(sources.some((source) => source.client === "Continue" && source.path.includes(".continue"))).toBe(true);
  });
});
