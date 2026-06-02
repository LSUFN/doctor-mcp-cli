# doctor-mcp

[![CI](https://github.com/LSUFN/doctor-mcp-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/LSUFN/doctor-mcp-cli/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Stop guessing why your MCP server is broken.

`doctor-mcp` is a zero-config CLI that scans MCP client config files, checks
commands, environment variables, and local paths, then starts stdio MCP servers
to verify that `tools/list` actually works.

```bash
npx doctor-mcp-cli
```

```text
OK     Claude Desktop: config found
ERROR  github: missing environment variable GITHUB_TOKEN
ERROR  filesystem: path does not exist: D:\work\missing
OK     playwright: tools/list succeeded

Summary: 2 OK, 0 WARN, 2 ERROR, 0 SKIP
```

## Why

MCP config failures are often boring but painful: a missing token, a bad path,
a command that is not on `PATH`, or a server that starts but exposes no tools.
`doctor-mcp` turns those failures into a short diagnosis you can act on.

## Supported Clients

| Client | Config support | Startup probe |
| --- | --- | --- |
| Claude Desktop | Platform-specific desktop config | stdio |
| Claude Code | Project `.mcp.json`, global settings | stdio |
| Cursor | Project and global `mcp.json` | stdio |
| VS Code | Workspace `.vscode/mcp.json` | stdio |

HTTP/SSE servers are recognized in v1, but are not protocol-probed yet.
`doctor-mcp` never edits your config.

## Install

```bash
npm install -g doctor-mcp-cli
doctor-mcp
```

Or run without installing:

```bash
npx doctor-mcp-cli
```

## Usage

```bash
doctor-mcp [options]

Options:
  --config <path>      check one config file instead of auto-discovery
  --json               print a machine-readable JSON report
  --no-start           only run static checks, do not start MCP servers
  --timeout <ms>       stdio server probe timeout in milliseconds (default: 8000)
```

## What It Checks

- JSON parse errors
- `mcpServers` and VS Code `servers` config shapes
- missing commands such as `node`, `python`, `uvx`, or `npx`
- missing environment variables such as `${env:GITHUB_TOKEN}`
- local path arguments that do not exist
- stdio MCP startup and `tools/list`
- startup timeouts, with cleanup for the spawned process

## JSON Output

```bash
doctor-mcp --json
```

The JSON report includes `sources`, `servers`, `checks`, and `summary`, making
it usable from scripts or CI.

## Development

```bash
npm install
npm run build
npm test
npm run dev -- --json
```
