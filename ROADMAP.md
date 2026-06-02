# Roadmap

These are small, contributor-friendly improvements planned after v0.1.0.

## HTTP and SSE reachability checks

- Validate URL shape.
- Check basic reachability with a short timeout.
- Report DNS, TLS, connection refused, and timeout failures clearly.
- Keep full protocol probing out of scope for the first pass.

## More MCP client config locations

- Add Windsurf MCP config detection.
- Add additional VS Code user-level config detection.
- Improve Claude Code global project map parsing.

## Better diagnostics

- Group repeated failures by root cause.
- Explain common package manager commands such as `uvx`, `npx`, and `bunx`.
- Add suggestions for PATH issues on Windows, macOS, and Linux.

## Release and publish polish

- Add a real terminal GIF once npm is published.
- Add GitHub issue templates.
- Add `doctor-mcp --version`.
- Add npm provenance once the package is published through CI.
