# Changelog

## 0.1.0 - 2026-06-02

Initial public release.

- Add `doctor-mcp` CLI published through the `doctor-mcp-cli` package.
- Discover MCP config files for Claude Desktop, Claude Code, Cursor, and VS Code.
- Parse `mcpServers` and VS Code `servers` configuration shapes.
- Check missing commands, missing environment variables, and missing local paths.
- Probe stdio MCP servers with the official MCP SDK and verify `tools/list`.
- Support `--config`, `--json`, `--no-start`, and `--timeout`.
- Add timeout cleanup for spawned stdio MCP processes.
- Add CI, test fixtures, and release-ready package metadata.
