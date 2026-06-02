import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function readPackageVersion(): string {
  const packagePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "package.json");
  try {
    const parsed = JSON.parse(fs.readFileSync(packagePath, "utf8")) as { version?: unknown };
    return typeof parsed.version === "string" ? parsed.version : "0.0.0";
  } catch {
    return "0.0.0";
  }
}
