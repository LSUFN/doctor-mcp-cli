import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export function expandHome(input: string): string {
  if (input === "~") {
    return os.homedir();
  }
  if (input.startsWith(`~${path.sep}`) || input.startsWith("~/")) {
    return path.join(os.homedir(), input.slice(2));
  }
  return input;
}

export function resolvePath(input: string, baseDir: string): string {
  const expanded = expandHome(input);
  return path.isAbsolute(expanded) ? expanded : path.resolve(baseDir, expanded);
}

export function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

export function isLikelyUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

export function isPathLikeArg(value: string): boolean {
  if (!value || value.startsWith("-") || isLikelyUrl(value)) {
    return false;
  }
  if (/\$\{[^}]+}/.test(value)) {
    return false;
  }
  if (/\.(c?m?js|ts|py|rb|go|jar|json|ya?ml|toml|env)$/i.test(value)) {
    return true;
  }
  return value.includes("/") || value.includes("\\");
}

export function findCommand(command: string): string | undefined {
  if (!command || /\$\{[^}]+}/.test(command)) {
    return undefined;
  }

  const hasPathSeparator = command.includes("/") || command.includes("\\");
  if (hasPathSeparator || path.isAbsolute(command)) {
    const candidate = expandHome(command);
    if (fileExists(candidate)) {
      return candidate;
    }
    if (process.platform === "win32") {
      for (const ext of getWindowsPathExts()) {
        const withExt = `${candidate}${ext}`;
        if (fileExists(withExt)) {
          return withExt;
        }
      }
    }
    return undefined;
  }

  const pathEnv = process.env.PATH ?? "";
  for (const dir of pathEnv.split(path.delimiter)) {
    if (!dir) {
      continue;
    }
    const candidate = path.join(dir, command);
    if (fileExists(candidate)) {
      return candidate;
    }
    if (process.platform === "win32") {
      for (const ext of getWindowsPathExts()) {
        const withExt = `${candidate}${ext}`;
        if (fileExists(withExt)) {
          return withExt;
        }
      }
    }
  }

  return undefined;
}

function getWindowsPathExts(): string[] {
  const raw = process.env.PATHEXT ?? ".COM;.EXE;.BAT;.CMD;.PS1";
  return raw.split(";").filter(Boolean);
}
