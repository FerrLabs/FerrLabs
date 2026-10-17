# FerrLabs

The unified FerrLabs MCP server and the shared core every FerrLabs MCP server is built on.

| Directory                                | Package                                                                  | What                                                                                            |
| ---------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| [`packages/mcp`](packages/mcp)           | [`@ferrlabs/mcp`](https://www.npmjs.com/package/@ferrlabs/mcp)           | Unified MCP server for `api.ferrlabs.com`: organizations, teams, billing, profile, tokens, docs |
| [`packages/mcp-core`](packages/mcp-core) | [`@ferrlabs/mcp-core`](https://www.npmjs.com/package/@ferrlabs/mcp-core) | Shared core: auth, stdio and Streamable HTTP transports, API client, runner. Node only          |

The server image is published as `ghcr.io/ferrlabs/mcp`.

## Where the other MCP servers live

Each product keeps its own MCP server next to its code, built on `@ferrlabs/mcp-core`.

| Product                                              | Folder                                                         | Package           |
| ---------------------------------------------------- | -------------------------------------------------------------- | ----------------- |
| [FerrVault](https://github.com/FerrLabs/FerrVault)   | [`mcp/`](https://github.com/FerrLabs/FerrVault/tree/main/mcp)  | `@ferrvault/mcp`  |
| [FerrTrack](https://github.com/FerrLabs/FerrTrack)   | [`mcp/`](https://github.com/FerrLabs/FerrTrack/tree/main/mcp)  | `@ferrtrack/mcp`  |
| [FerrGrowth](https://github.com/FerrLabs/FerrGrowth) | [`mcp/`](https://github.com/FerrLabs/FerrGrowth/tree/main/mcp) | `@ferrgrowth/mcp` |
| [FerrFleet](https://github.com/FerrLabs/FerrFleet)   | [`mcp/`](https://github.com/FerrLabs/FerrFleet/tree/main/mcp)  | `@ferrfleet/mcp`  |
| [FerrLens](https://github.com/FerrLabs/FerrLens)     | [`mcp/`](https://github.com/FerrLabs/FerrLens/tree/main/mcp)   | `@ferrlens/mcp`   |

## Development

Node 22 or later and pnpm 12.

```bash
pnpm install
pnpm build
pnpm test
```

`packages/mcp` depends on `packages/mcp-core` through the workspace, so `pnpm build` builds the core first.

## History

This repository replaces [FerrLabs/MCP](https://github.com/FerrLabs/MCP), which is retired. Both packages were imported with their full git history. The old issues stay readable there; the plan that moved each product server next to its product is [FerrLabs/MCP#441](https://github.com/FerrLabs/MCP/issues/441).

## License

Mozilla Public License 2.0, see [LICENSE](LICENSE). Same license as the product repositories (FerrVault, FerrTrack, FerrGrowth, FerrFleet, FerrLens) and as the retired FerrLabs/MCP.
