# @ferrlabs/mcp-core

Shared core for the FerrLabs MCP servers: auth, transports (stdio and Streamable HTTP), API client and runner.

Consumed from npm by `@ferrlabs/mcp` and by the `mcp/` folders of the FerrLabs products.

```bash
pnpm --filter @ferrlabs/mcp-core build
pnpm --filter @ferrlabs/mcp-core typecheck
```

Released independently from `@ferrlabs/mcp`, tagged `mcp-core@v{version}`.
