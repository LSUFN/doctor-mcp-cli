export interface InterpolationContext {
  workspaceRoot?: string;
  userHome: string;
}

export function findEnvPlaceholders(values: string[]): string[] {
  const names = new Set<string>();
  const pattern = /\$\{env:([A-Za-z_][A-Za-z0-9_]*)}/g;
  for (const value of values) {
    for (const match of value.matchAll(pattern)) {
      names.add(match[1]);
    }
  }
  return [...names].sort();
}

export function interpolateValue(value: string, context: InterpolationContext): string {
  return value
    .replaceAll("${userHome}", context.userHome)
    .replaceAll("${workspaceFolder}", context.workspaceRoot ?? "")
    .replaceAll("${workspaceFolderBasename}", basename(context.workspaceRoot ?? ""))
    .replaceAll("${pathSeparator}", pathSeparator())
    .replaceAll("${/}", pathSeparator())
    .replace(/\$\{env:([A-Za-z_][A-Za-z0-9_]*)}/g, (_match, name: string) => process.env[name] ?? "");
}

export function hasUnresolvedPlaceholder(value: string): boolean {
  return /\$\{[^}]+}/.test(value);
}

function basename(value: string): string {
  return value.split(/[\\/]/).filter(Boolean).at(-1) ?? "";
}

function pathSeparator(): string {
  return process.platform === "win32" ? "\\" : "/";
}
