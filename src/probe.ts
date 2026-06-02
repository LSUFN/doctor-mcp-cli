import os from "node:os";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { hasUnresolvedPlaceholder, interpolateValue } from "./interpolate.js";
import { resolvePath } from "./path-utils.js";
import type { CheckResult, ServerDefinition } from "./types.js";

export async function probeServer(server: ServerDefinition, timeoutMs: number): Promise<CheckResult[]> {
  if (server.transport !== "stdio") {
    return [];
  }
  if (!server.command) {
    return [];
  }

  const context = { userHome: os.homedir(), workspaceRoot: server.workspaceRoot };
  const command = interpolateValue(server.command, context);
  const args = server.args.map((arg) => interpolateValue(arg, context));
  const cwd = server.cwd ? resolvePath(interpolateValue(server.cwd, context), path.dirname(server.sourcePath)) : undefined;

  if ([command, ...args].some(hasUnresolvedPlaceholder)) {
    return [
      {
        status: "skip",
        serverId: server.id,
        sourceId: server.sourceId,
        title: `${server.name}: startup skipped`,
        message: "The server config still contains unresolved placeholders.",
        suggestion: "Resolve placeholders before probing startup."
      }
    ];
  }

  const serverEnv = Object.fromEntries(
    Object.entries(server.env).map(([key, value]) => [key, interpolateValue(value, context)])
  );
  const env = {
    ...process.env,
    ...serverEnv
  } as Record<string, string>;

  const transport = new StdioClientTransport({
    command,
    args,
    env,
    cwd
  });
  const client = new Client(
    {
      name: "doctor-mcp",
      version: "0.1.0"
    },
    {
      capabilities: {}
    }
  );

  let timedOut = false;
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<number>((_resolve, reject) => {
    timeoutHandle = setTimeout(() => {
      timedOut = true;
      void closeClient(client, transport);
      reject(new Error(`Timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([listTools(client, transport), timeout]);

    return [
      {
        status: "ok",
        serverId: server.id,
        sourceId: server.sourceId,
        title: `${server.name}: tools/list succeeded`,
        message: `${result} tools available`,
        detail: { toolCount: result }
      }
    ];
  } catch (error) {
    return [
      {
        status: "error",
        serverId: server.id,
        sourceId: server.sourceId,
        title: `${server.name}: startup probe failed`,
        message: timedOut ? `Timed out after ${timeoutMs}ms` : errorMessage(error),
        suggestion: timedOut
          ? "Increase --timeout or check whether the server waits for input before starting."
          : "Run the configured command manually to inspect its startup error."
      }
    ];
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
    await closeClient(client, transport);
  }
}

async function listTools(client: Client, transport: StdioClientTransport): Promise<number> {
  await client.connect(transport);
  const tools = await client.listTools();
  return tools.tools.length;
}

async function closeClient(client: Client, transport: StdioClientTransport): Promise<void> {
  await client.close().catch(() => undefined);
  await transport.close().catch(() => undefined);
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
