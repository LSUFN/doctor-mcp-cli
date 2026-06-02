# doctor-mcp

Stop guessing why your MCP server is broken.

`doctor-mcp` scans common MCP client configuration files, checks commands,
environment variables, local paths, and can start stdio MCP servers to verify
that `tools/list` works.

```bash
npx doctor-mcp-cli
```

Example output:

```text
OK     Claude Desktop config found
ERROR  github: missing environment variable GITHUB_TOKEN
ERROR  filesystem: path does not exist: D:\work\missing
OK     playwright: 12 tools available

Summary: 2 OK, 0 WARN, 2 ERROR, 0 SKIP
```

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

- Claude Desktop, Claude Code, Cursor, and VS Code MCP config locations
- JSON parse errors
- `mcpServers` and VS Code `servers` config shapes
- missing commands
- missing environment variables such as `${env:GITHUB_TOKEN}`
- local path arguments that do not exist
- stdio MCP startup and `tools/list`

HTTP/SSE servers are recognized in v1, but are not protocol-probed yet.
`doctor-mcp` never edits your config.

## Development

```bash
npm install
npm run build
npm test
npm run dev -- --json
```
