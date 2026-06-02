# 发布文案 - 中文

标题：

```text
doctor-mcp：一条命令诊断 MCP 配置为什么坏了
```

短版：

```text
我做了一个开源 CLI：doctor-mcp，用来诊断 Claude、Cursor、VS Code 等工具里的 MCP 配置问题。

它可以检查 JSON 配置、命令是否存在、环境变量是否缺失、本地路径是否错误，并能启动 stdio MCP server 验证 tools/list 是否正常。

直接运行：
npx doctor-mcp-cli

GitHub：
https://github.com/LSUFN/doctor-mcp-cli
```

长版：

```text
MCP 越来越火，但配置坏掉时经常很难定位原因：可能是 token 没设置，uvx/node/python 不在 PATH，本地路径不存在，或者 server 启动了但工具列表为空。

doctor-mcp 是一个零配置开源 CLI，会自动扫描 Claude Desktop、Claude Code、Cursor、VS Code 的常见 MCP 配置位置，并把问题翻译成可读的终端诊断报告。

当前支持：
- 解析 mcpServers 和 VS Code servers 配置
- 检查缺失命令和环境变量
- 检查本地路径是否存在
- 启动 stdio MCP server 并验证 tools/list
- 输出 JSON，方便脚本或 CI 使用

试用：
npx doctor-mcp-cli

仓库：
https://github.com/LSUFN/doctor-mcp-cli
```
