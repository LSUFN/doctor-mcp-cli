export type ClientName = "Claude Desktop" | "Claude Code" | "Cursor" | "VS Code" | "Custom";

export type ServerTransport = "stdio" | "http" | "sse" | "unknown";

export type CheckStatus = "ok" | "warn" | "error" | "skip";

export interface ConfigSource {
  id: string;
  client: ClientName;
  label: string;
  path: string;
  exists: boolean;
  workspaceRoot?: string;
}

export interface ServerDefinition {
  id: string;
  name: string;
  sourceId: string;
  sourcePath: string;
  client: ClientName;
  transport: ServerTransport;
  raw: unknown;
  command?: string;
  args: string[];
  env: Record<string, string>;
  url?: string;
  cwd?: string;
  workspaceRoot?: string;
}

export interface CheckResult {
  status: CheckStatus;
  sourceId?: string;
  serverId?: string;
  title: string;
  message: string;
  suggestion?: string;
  detail?: unknown;
}

export interface DoctorReport {
  sources: ConfigSource[];
  servers: ServerDefinition[];
  checks: CheckResult[];
  summary: Record<CheckStatus, number>;
}

export interface DoctorOptions {
  cwd: string;
  configPath?: string;
  json: boolean;
  start: boolean;
  timeoutMs: number;
}
