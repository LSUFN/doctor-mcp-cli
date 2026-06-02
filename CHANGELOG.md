# Changelog

## 0.1.1 - 2026-06-02

- Add `doctor-mcp --version`.
- Add `doctor-mcp --ci` for short warning/error-only logs.
- Add lightweight HTTP/SSE URL reachability checks.
- Add project config discovery for Windsurf, Cline, Roo Code, and Continue.
- Improve startup error messages for missing commands and network failures.
- Update README with npm badges and release notes.

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
