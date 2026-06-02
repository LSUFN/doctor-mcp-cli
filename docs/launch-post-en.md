# Launch Post - English

Title:

```text
doctor-mcp: Stop guessing why your MCP server is broken
```

Short version:

```text
I built doctor-mcp, a small open-source CLI that diagnoses broken MCP configs for Claude, Cursor, VS Code, and other AI dev tools.

It checks JSON config shape, missing commands, missing env vars, bad local paths, and stdio MCP tools/list startup failures.

Try it:
npx doctor-mcp-cli

GitHub:
https://github.com/LSUFN/doctor-mcp-cli
```

Long version:

```text
MCP is getting popular, but debugging MCP config is still weirdly painful. A server may fail because a token is missing, uvx is not installed, a filesystem path moved, or the server starts but exposes no tools.

doctor-mcp is a zero-config CLI that scans common MCP config locations for Claude Desktop, Claude Code, Cursor, and VS Code, then explains what is broken in plain terminal output.

It can:
- parse mcpServers and VS Code servers configs
- check missing commands and env vars
- catch missing local paths
- start stdio MCP servers and verify tools/list
- output JSON for scripts and CI

Run:
npx doctor-mcp-cli

Repo:
https://github.com/LSUFN/doctor-mcp-cli
```
