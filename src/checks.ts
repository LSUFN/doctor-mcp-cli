import os from "node:os";
import path from "node:path";
import { findEnvPlaceholders, hasUnresolvedPlaceholder, interpolateValue } from "./interpolate.js";
import { fileExists, findCommand, isPathLikeArg, resolvePath } from "./path-utils.js";
import type { CheckResult, ServerDefinition } from "./types.js";

export function runStaticChecks(server: ServerDefinition): CheckResult[] {
  const checks: CheckResult[] = [];

  if (server.transport === "http" || server.transport === "sse") {
    checks.push({
      status: "skip",
      serverId: server.id,
      sourceId: server.sourceId,
      title: `${server.name}: ${server.transport.toUpperCase()} server`,
      message: server.url ? `Found URL ${server.url}` : "URL server detected.",
      suggestion: "v1 only performs full protocol probing for stdio MCP servers."
    });
    return checks;
  }

  if (server.transport !== "stdio") {
    checks.push({
      status: "warn",
      serverId: server.id,
      sourceId: server.sourceId,
      title: `${server.name}: unknown transport`,
      message: "No command or URL was found.",
      suggestion: "Add a stdio command or a supported URL configuration."
    });
    return checks;
  }

  if (!server.command) {
    checks.push({
      status: "error",
      serverId: server.id,
      sourceId: server.sourceId,
      title: `${server.name}: missing command`,
      message: "stdio servers need a command field.",
      suggestion: "Add command, for example node, npx, python, uvx, or an absolute executable path."
    });
    return checks;
  }

  const valuesToInspect = [server.command, ...server.args, ...Object.values(server.env)];
  const missingEnvNames = findEnvPlaceholders(valuesToInspect).filter((name) => !process.env[name]);
  for (const name of missingEnvNames) {
    checks.push({
      status: "error",
      serverId: server.id,
      sourceId: server.sourceId,
      title: `${server.name}: missing environment variable ${name}`,
      message: `The config references \${env:${name}}, but ${name} is not set in this shell.`,
      suggestion: `Set ${name} before launching your MCP client.`
    });
  }

  const command = interpolateValue(server.command, interpolationContext(server));
  if (hasUnresolvedPlaceholder(command)) {
    checks.push({
      status: "warn",
      serverId: server.id,
      sourceId: server.sourceId,
      title: `${server.name}: unresolved command placeholder`,
      message: server.command,
      suggestion: "Replace unsupported placeholders with concrete values."
    });
  } else {
    const commandPath = findCommand(command);
    checks.push({
      status: commandPath ? "ok" : "error",
      serverId: server.id,
      sourceId: server.sourceId,
      title: `${server.name}: command ${commandPath ? "found" : "not found"}`,
      message: commandPath ?? command,
      suggestion: commandPath ? undefined : "Install the command or use an absolute path in the MCP config."
    });
  }

  checks.push(...checkLocalPathArgs(server));

  return checks;
}

function checkLocalPathArgs(server: ServerDefinition): CheckResult[] {
  const checks: CheckResult[] = [];
  const sourceDir = path.dirname(server.sourcePath);
  const baseDir = server.cwd ? resolvePath(server.cwd, sourceDir) : sourceDir;
  const context = interpolationContext(server);

  for (const arg of server.args) {
    const interpolated = interpolateValue(arg, context);
    if (!isPathLikeArg(interpolated)) {
      continue;
    }
    const resolved = resolvePath(interpolated, baseDir);
    const exists = fileExists(resolved);
    checks.push({
      status: exists ? "ok" : "error",
      serverId: server.id,
      sourceId: server.sourceId,
      title: `${server.name}: path ${exists ? "exists" : "does not exist"}`,
      message: resolved,
      suggestion: exists ? undefined : "Fix the path or move the file/directory to the configured location."
    });
  }

  return checks;
}

function interpolationContext(server: ServerDefinition): { userHome: string; workspaceRoot?: string } {
  return {
    userHome: os.homedir(),
    workspaceRoot: server.workspaceRoot
  };
}
