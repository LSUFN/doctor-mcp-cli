import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { z } from "zod";
import type { CheckResult, ClientName, ConfigSource, ServerDefinition, ServerTransport } from "./types.js";

const serverSchema = z
  .object({
    type: z.string().optional(),
    command: z.string().optional(),
    args: z.array(z.string()).optional(),
    env: z.record(z.string()).optional(),
    url: z.string().optional(),
    cwd: z.string().optional()
  })
  .passthrough();

type ServerRecord = z.infer<typeof serverSchema>;

export interface LoadConfigResult {
  sources: ConfigSource[];
  servers: ServerDefinition[];
  checks: CheckResult[];
}

export function discoverConfigSources(cwd: string, explicitPath?: string): ConfigSource[] {
  if (explicitPath) {
    const resolved = path.resolve(cwd, explicitPath);
    return [
      {
        id: sourceId("Custom", resolved),
        client: "Custom",
        label: "Custom config",
        path: resolved,
        exists: fs.existsSync(resolved),
        workspaceRoot: cwd
      }
    ];
  }

  const home = os.homedir();
  const appData = process.env.APPDATA;
  const sources: ConfigSource[] = [];

  if (process.platform === "win32") {
    addSource(sources, "Claude Desktop", "Claude Desktop config", appData ? path.join(appData, "Claude", "claude_desktop_config.json") : "");
  } else if (process.platform === "darwin") {
    addSource(sources, "Claude Desktop", "Claude Desktop config", path.join(home, "Library", "Application Support", "Claude", "claude_desktop_config.json"));
  } else {
    addSource(sources, "Claude Desktop", "Claude Desktop config", path.join(home, ".config", "Claude", "claude_desktop_config.json"));
  }
  addSource(sources, "Claude Code", "Claude Code project config", path.join(cwd, ".mcp.json"), cwd);
  addSource(sources, "Claude Code", "Claude Code global project map", path.join(home, ".claude.json"));
  addSource(sources, "Claude Code", "Claude Code settings", path.join(home, ".claude", "settings.json"));
  addSource(sources, "Cursor", "Cursor project config", path.join(cwd, ".cursor", "mcp.json"), cwd);
  addSource(sources, "Cursor", "Cursor global config", path.join(home, ".cursor", "mcp.json"));
  addSource(sources, "VS Code", "VS Code workspace config", path.join(cwd, ".vscode", "mcp.json"), cwd);
  addSource(sources, "Windsurf", "Windsurf project config", path.join(cwd, ".windsurf", "mcp.json"), cwd);
  addSource(sources, "Windsurf", "Windsurf global config", path.join(home, ".windsurf", "mcp.json"));
  addSource(sources, "Cline", "Cline project config", path.join(cwd, ".cline", "mcp.json"), cwd);
  addSource(sources, "Roo Code", "Roo Code project config", path.join(cwd, ".roo", "mcp.json"), cwd);
  addSource(sources, "Continue", "Continue project config", path.join(cwd, ".continue", "mcp.json"), cwd);
  addSource(sources, "Continue", "Continue global config", path.join(home, ".continue", "config.json"));

  return dedupeSources(sources);
}

export function loadConfigs(cwd: string, explicitPath?: string): LoadConfigResult {
  const sources = discoverConfigSources(cwd, explicitPath);
  const checks: CheckResult[] = [];
  const servers: ServerDefinition[] = [];

  for (const source of sources) {
    if (!source.exists) {
      checks.push({
        status: "skip",
        sourceId: source.id,
        title: `${source.client}: config not found`,
        message: source.path
      });
      continue;
    }

    checks.push({
      status: "ok",
      sourceId: source.id,
      title: `${source.client}: config found`,
      message: source.path
    });

    const text = fs.readFileSync(source.path, "utf8");
    const parsed = safeParseJson(text);
    if (!parsed.ok) {
      checks.push({
        status: "error",
        sourceId: source.id,
        title: `${source.client}: invalid JSON`,
        message: parsed.error,
        suggestion: "Fix the JSON syntax, then run mcp-doctor again."
      });
      continue;
    }

    const extracted = extractServers(source, parsed.value);
    if (extracted.checks.length > 0) {
      checks.push(...extracted.checks);
    }
    servers.push(...extracted.servers);
  }

  return { sources, servers, checks };
}

export function extractServers(
  source: ConfigSource,
  config: unknown
): { servers: ServerDefinition[]; checks: CheckResult[] } {
  const checks: CheckResult[] = [];
  const records = findServerRecords(source, config);

  if (records.length === 0) {
    checks.push({
      status: "warn",
      sourceId: source.id,
      title: `${source.client}: no MCP servers found`,
      message: "No mcpServers or VS Code servers object was found.",
      suggestion: "Add at least one MCP server config, or pass --config to inspect another file."
    });
    return { servers: [], checks };
  }

  const servers: ServerDefinition[] = [];
  for (const [name, raw] of records) {
    const parsed = serverSchema.safeParse(raw);
    if (!parsed.success) {
      checks.push({
        status: "error",
        sourceId: source.id,
        title: `${name}: invalid server shape`,
        message: parsed.error.issues.map((issue) => issue.message).join("; "),
        suggestion: "Check that command, args, env, and url use the expected JSON types."
      });
      continue;
    }

    servers.push(toServerDefinition(source, name, parsed.data));
  }

  return { servers, checks };
}

function findServerRecords(source: ConfigSource, config: unknown): Array<[string, unknown]> {
  if (!isRecord(config)) {
    return [];
  }

  const direct = source.client === "VS Code" ? config.servers : config.mcpServers;
  if (isRecord(direct)) {
    return Object.entries(direct);
  }

  if (isRecord(config.mcpServers)) {
    return Object.entries(config.mcpServers);
  }

  if (isRecord(config.servers)) {
    return Object.entries(config.servers);
  }

  if (isRecord(config.mcp) && isRecord(config.mcp.servers)) {
    return Object.entries(config.mcp.servers);
  }

  if (isRecord(config.mcp) && isRecord(config.mcp.mcpServers)) {
    return Object.entries(config.mcp.mcpServers);
  }

  if (source.client === "Claude Code") {
    const projectServers = extractClaudeCodeProjectServers(config);
    if (projectServers.length > 0) {
      return projectServers;
    }
  }

  return [];
}

function extractClaudeCodeProjectServers(config: Record<string, unknown>): Array<[string, unknown]> {
  if (isRecord(config.projects)) {
    for (const project of Object.values(config.projects)) {
      if (isRecord(project) && isRecord(project.mcpServers)) {
        return Object.entries(project.mcpServers);
      }
    }
  }
  return [];
}

function toServerDefinition(source: ConfigSource, name: string, record: ServerRecord): ServerDefinition {
  const transport = getTransport(record);
  return {
    id: `${source.id}:${name}`,
    name,
    sourceId: source.id,
    sourcePath: source.path,
    client: source.client,
    transport,
    raw: record,
    command: record.command,
    args: record.args ?? [],
    env: record.env ?? {},
    url: record.url,
    cwd: record.cwd,
    workspaceRoot: source.workspaceRoot
  };
}

function getTransport(record: ServerRecord): ServerTransport {
  const type = record.type?.toLowerCase();
  if (type === "stdio" || record.command) {
    return "stdio";
  }
  if (type === "http" || type === "streamable-http" || record.url?.startsWith("http")) {
    return "http";
  }
  if (type === "sse") {
    return "sse";
  }
  return "unknown";
}

function safeParseJson(text: string): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function addSource(sources: ConfigSource[], client: ClientName, label: string, configPath: string, workspaceRoot?: string): void {
  if (!configPath) {
    return;
  }
  sources.push({
    id: sourceId(client, configPath),
    client,
    label,
    path: configPath,
    exists: fs.existsSync(configPath),
    workspaceRoot
  });
}

function sourceId(client: ClientName, configPath: string): string {
  return `${client}:${configPath}`;
}

function dedupeSources(sources: ConfigSource[]): ConfigSource[] {
  const seen = new Set<string>();
  return sources.filter((source) => {
    const key = source.path.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
