# doctor-mcp-cli v0.1.0

Initial public release of `doctor-mcp-cli`, a CLI for diagnosing broken MCP client configuration and stdio server startup problems.

## Highlights

- Discover MCP config files for Claude Desktop, Claude Code, Cursor, and VS Code.
- Parse `mcpServers` and VS Code `servers` configuration shapes.
- Check missing commands, missing environment variables, and missing local paths.
- Probe stdio MCP servers with the official MCP SDK and verify `tools/list`.
- Support `--config`, `--json`, `--no-start`, and `--timeout`.
- Clean up spawned stdio MCP processes on startup timeout.
- Add CI, test fixtures, release metadata, roadmap, and launch assets.

## Install

```bash
npx doctor-mcp-cli
```

or:

```bash
npm install -g doctor-mcp-cli
doctor-mcp
```

## Links

- npm: https://www.npmjs.com/package/doctor-mcp-cli
- GitHub: https://github.com/LSUFN/doctor-mcp-cli
