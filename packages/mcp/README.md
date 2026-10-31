# FerrLabs MCP

**Let your AI assistant drive your FerrLabs account.**

[Model Context Protocol](https://modelcontextprotocol.io) server for the unified FerrLabs API (`api.ferrlabs.com`): organizations, teams, billing, profile, tokens, public stats and docs.

[![npm](https://img.shields.io/npm/v/@ferrlabs/mcp)](https://www.npmjs.com/package/@ferrlabs/mcp)

Runs locally over stdio, or over Streamable HTTP behind a gateway (`mcp.ferrlabs.com`). The first tool call that needs auth opens a browser for an OAuth loopback flow and saves the token, so there is no environment variable to set up front.

## Quick start

Add to your MCP client configuration (Claude Code, Cursor, etc.):

```json
{
  "mcpServers": {
    "ferrlabs": {
      "command": "npx",
      "args": ["-y", "@ferrlabs/mcp"]
    }
  }
}
```

The first time you call a tool that needs auth, the MCP opens `auth.ferrlabs.com` in your default browser (OAuth 2.0 loopback PKCE). After you click Allow, the token is saved locally and reused for future sessions. No env var required.

### CI / scripted / headless use

Bypass the browser flow by injecting a token directly:

```json
{
  "mcpServers": {
    "ferrlabs": {
      "command": "npx",
      "args": ["-y", "@ferrlabs/mcp"],
      "env": { "FERRLABS_API_TOKEN": "fft_..." }
    }
  }
}
```

Create the token from `app.ferrlabs.com`, Settings, API Tokens. It is forwarded as `x-api-token` to `api.ferrlabs.com`.

## Where the other servers live

This package is `@ferrlabs/mcp`, the unified entrypoint. The product servers live next to their product, and the shared core every server is built on is `@ferrlabs/mcp-core`, in the sibling [`packages/mcp-core`](../mcp-core). Add only the servers you need to your client config.

| Package              | Repo                                                               | Targets                      | Base URL env         |
| -------------------- | ------------------------------------------------------------------ | ---------------------------- | -------------------- |
| `@ferrlabs/mcp`      | this package                                                       | `api.ferrlabs.com` (unified) | `API_URL`            |
| `@ferrvault/mcp`     | [FerrVault](https://github.com/FerrLabs/FerrVault/tree/main/mcp)   | `api.ferrvault.com`          | `FERRVAULT_API_URL`  |
| `@ferrtrack/mcp`     | [FerrTrack](https://github.com/FerrLabs/FerrTrack/tree/main/mcp)   | `api.ferrtrack.com`          | `FERRTRACK_API_URL`  |
| `@ferrgrowth/mcp`    | [FerrGrowth](https://github.com/FerrLabs/FerrGrowth/tree/main/mcp) | `api.ferrgrowth.com`         | `FERRGROWTH_API_URL` |
| `@ferrfleet/mcp`     | [FerrFleet](https://github.com/FerrLabs/FerrFleet/tree/main/mcp)   | `api.ferrfleet.com`          | `FERRFLEET_API_URL`  |
| `@ferrlens/mcp`      | [FerrLens](https://github.com/FerrLabs/FerrLens/tree/main/mcp)     | `api.ferrlens.com`           | `FERRLENS_API_URL`   |
| `@ferrlabs/mcp-core` | [`packages/mcp-core`](../mcp-core)                                 | shared core                  | n/a                  |

All servers except `@ferrlens/mcp` and `@ferrvault/mcp` share the auth resolution described below. `@ferrvault/mcp` talks to the FerrVault API, which refuses `fft_*` API tokens; its auth is documented in its own README. `@ferrlens/mcp` is anonymous: it never sends a token and never opens the OAuth flow. Register several at once:

```json
{
  "mcpServers": {
    "ferrlabs": { "command": "npx", "args": ["-y", "@ferrlabs/mcp"] },
    "ferrvault": { "command": "npx", "args": ["-y", "@ferrvault/mcp"] },
    "ferrtrack": { "command": "npx", "args": ["-y", "@ferrtrack/mcp"] },
    "ferrgrowth": { "command": "npx", "args": ["-y", "@ferrgrowth/mcp"] },
    "ferrfleet": { "command": "npx", "args": ["-y", "@ferrfleet/mcp"] },
    "ferrlens": { "command": "npx", "args": ["-y", "@ferrlens/mcp"] }
  }
}
```

## Tools

Tools marked **destructive** are irreversible or high-impact. MCP clients should gate them behind a confirmation.

| Tool                                                                                               | Scope  | Notes                                                                                                            |
| -------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| `get_stats`, `health_check`, `fetch_docs`                                                          | public | No auth required                                                                                                 |
| `get_me`, `update_me`, `export_my_account`, `list_my_sessions`, `revoke_my_session`                | auth   | Current user                                                                                                     |
| `list_orgs`, `get_org`, `get_org_overview`, `get_org_usage`, `update_org`, `list_org_audit`        | auth   | Organizations                                                                                                    |
| `list_org_members`, `invite_org_member`, `remove_org_member`, `update_org_member_role`             | auth   | `invite_org_member` emails an invitation the invitee must accept; `remove_org_member` is **destructive**         |
| `list_teams`, `create_team`, `update_team`, `delete_team`, `add_team_member`, `remove_team_member` | auth   | `delete_team` is **destructive**                                                                                 |
| `list_projects`, `list_vaults`, `list_issues`                                                      | auth   | Cross-product lists                                                                                              |
| `list_subscriptions`, `activate_subscription`, `update_subscription`, `cancel_subscription`        | auth   | `cancel_subscription` is **destructive**                                                                         |
| `list_tokens`, `create_token`, `revoke_token`                                                      | auth   | `create_token` is disabled unless `FERRLABS_MCP_ALLOW_TOKEN_REVEAL=1`; `revoke_token` is **destructive**         |
| `list_org_tokens`, `create_org_token`, `revoke_org_token`                                          | auth   | `create_org_token` is disabled unless `FERRLABS_MCP_ALLOW_TOKEN_REVEAL=1`; `revoke_org_token` is **destructive** |

FerrFlow CLI-specific tools (`dry_run`, `validate_config`, `read_config`, `read_changelog`, `list_release_tags`, `record_event`) were removed in v4.0.0. They required either a local FerrFlow CLI install or HMAC signing the MCP doesn't do. Use the FerrFlow CLI directly or fetch docs via `fetch_docs("ferrflow", "docs/...")`.

## Resources

Tools are not the only surface. A resource is content a client attaches once and keeps, instead of spending a turn on a tool call and leaving a blob in the transcript.

| Resource                         | What it holds                                                                    |
| -------------------------------- | -------------------------------------------------------------------------------- |
| `ferrlabs://org/{slug}/overview` | member count, active subscriptions per product, pending invites, recent activity |
| `ferrlabs://org/{slug}/usage`    | current-period metered usage per product, with the tier limit                    |

The org resources enumerate themselves, so a client can browse them. Resource handlers call the same fetch functions the tools use, so a path is defined once. Capabilities are declared by the SDK when a resource or prompt is registered, so a server that exposes neither advertises neither.

## Stack

| Component | Technology                         |
| --------- | ---------------------------------- |
| Runtime   | Node.js 22+                        |
| Language  | TypeScript                         |
| MCP SDK   | @modelcontextprotocol/sdk          |
| Transport | stdio (default) or Streamable HTTP |

## Configuration

| Variable                          | Description                                                                                                                                                                                                                                                         | Default                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `API_URL`                         | FerrLabs API base URL (no `/v1` suffix, paths are prefixed in code)                                                                                                                                                                                                 | `https://api.ferrlabs.com`                                                    |
| `FERRLABS_AUTH_URL`               | Auth SPA base URL (where the OAuth browser flow lands)                                                                                                                                                                                                              | `https://auth.ferrlabs.com`                                                   |
| `FERRLABS_API_TOKEN`              | Pre-provisioned token. Bypasses the OAuth flow. Use for CI / scripted environments.                                                                                                                                                                                 | _(unset)_                                                                     |
| `FERRFLOW_API_TOKEN`              | **Deprecated**, accepted as a fallback for backward compatibility with v3.x.                                                                                                                                                                                        | _(unset)_                                                                     |
| `FERRLABS_MCP_NO_OAUTH`           | Set to `1` to disable the OAuth fallback. Then `FERRLABS_API_TOKEN` becomes required.                                                                                                                                                                               | unset                                                                         |
| `FERRLABS_MCP_TOKEN_PATH`         | Override the path where the OAuth-acquired token is persisted.                                                                                                                                                                                                      | `%APPDATA%\ferrlabs\mcp\token.json` / `~/.config/ferrlabs/mcp/token.json`     |
| `FERRLABS_MCP_NO_PERSIST`         | Set to `1` to keep the token in memory only (re-auth on every cold start).                                                                                                                                                                                          | unset                                                                         |
| `FERRLABS_MCP_ALLOWED_API_HOSTS`  | Extra hosts a token may be sent to, comma separated. The FerrLabs product APIs are allowed by default; anything else is refused. Loopback is always allowed.                                                                                                        | unset                                                                         |
| `FERRLABS_MCP_ALLOW_TOKEN_REVEAL` | Set to `1` to let `create_token` mint a token (and `create_server_token` in `@ferrgrowth/mcp`) and return its secret. Off by default: the secret is shown once, so the tool has to put it in its response, and tool results are persisted to the client transcript. | unset                                                                         |
| `FERRLABS_MCP_MAX_TOOL_BYTES`     | Ceiling on a single tool response, in bytes. Beyond it the payload is cut and explicitly marked as incomplete.                                                                                                                                                      | `100000`                                                                      |
| `FERRLABS_MCP_MODE`               | Transport: `stdio` (default) or `http` (Streamable HTTP). `--http` also selects http.                                                                                                                                                                               | `stdio`                                                                       |
| `PORT`                            | Port for the HTTP transport (`FERRLABS_MCP_MODE=http`).                                                                                                                                                                                                             | `3000`                                                                        |
| `HOST`                            | Bind address for the HTTP transport.                                                                                                                                                                                                                                | `127.0.0.1` (`0.0.0.0` in the Docker image or with `FERRLABS_MCP_BIND_ALL=1`) |
| `FERRLABS_MCP_PUBLIC_URL`         | URL clients reach the HTTP transport at. Advertised as the OAuth `resource` and in the 401 challenge; request headers are never used for it. Required when `HOST` is not loopback.                                                                                  | `http://127.0.0.1:$PORT` on loopback                                          |
| `FERRLABS_MCP_ALLOWED_HOSTS`      | Host headers the HTTP transport answers, comma separated, ports ignored. Anything else gets a 421, except the health endpoints.                                                                                                                                     | the host of `FERRLABS_MCP_PUBLIC_URL`, or the loopback names                  |

### Checking the version

Every server binary prints its name and version and exits when passed `--version` (or `-v`), without starting a transport:

```bash
npx -y @ferrtrack/mcp --version
# ferrtrack 9.5.0
```

Clients get the same value at runtime in the `serverInfo` of the MCP `initialize` response.

### HTTP transport

By default the server runs over stdio. Set `FERRLABS_MCP_MODE=http` (or pass `--http`) to expose the MCP over Streamable HTTP on `HOST:PORT` (`0.0.0.0:3000` by default), which is the mode the Docker image runs. Requests carry the bearer token in the `Authorization` header. Run the HTTP transport behind a gateway (e.g. Traefik) that terminates TLS and applies rate limiting / request-size caps; do not expose it directly on an untrusted network.

Bound to anything other than loopback, the server refuses to start without `FERRLABS_MCP_PUBLIC_URL`. That URL is the only source of the OAuth resource identifier, so a forged `Host` or `X-Forwarded-Host` cannot make the server advertise someone else's host, and its hostname is the default `Host` allowlist:

```bash
FERRLABS_MCP_MODE=http HOST=0.0.0.0 FERRLABS_MCP_PUBLIC_URL=https://mcp.ferrlabs.com npx -y @ferrlabs/mcp
```

### How auth resolution works

On the first authenticated tool call, the MCP looks for a token in this order:

1. In-memory cache (set during this MCP process's lifetime)
2. `FERRLABS_API_TOKEN` (or `FERRFLOW_API_TOKEN`) env var
3. Persisted token file (`FERRLABS_MCP_TOKEN_PATH`)
4. **OAuth 2.0 loopback PKCE flow**: opens the user's browser at `FERRLABS_AUTH_URL` (`auth.ferrlabs.com`, the login SPA), captures the callback on `http://127.0.0.1:54321/cb`, then exchanges the code for a session token via `POST /v1/auth/exchange` on `API_URL` (`api.ferrlabs.com`). Token is persisted to step 3 for future sessions.

If you set `FERRLABS_MCP_NO_OAUTH=1`, step 4 is skipped, which is what you want in CI where opening a browser would hang.

> **Auth host split.** `auth.ferrlabs.com` is the user-facing login SPA (where the browser `authorize` step lands); `api.ferrlabs.com` performs the token exchange and serves the OAuth discovery metadata used by the HTTP transport. Configure `FERRLABS_AUTH_URL` for the former and `API_URL` for the latter. They are not interchangeable.

## Smoke test

`pnpm smoke` (run it from the repo root) builds the server, spawns it over stdio, runs the MCP `initialize`/`tools/list` handshake, then calls `health_check` and `get_stats` against the real `api.ferrlabs.com`. Useful to confirm the server boots, registers all tools, and the API is reachable. Exits non-zero on any failure.

```
[PASS] initialize handshake, serverInfo: ferrlabs@6.5.0
[PASS] tools/list, N tools registered
[PASS] tools/call health_check, {"status":"ready", ...}
[PASS] tools/call get_stats, total_releases=N

Smoke: 4/4 OK
```

## Development

```bash
pnpm install
pnpm build
pnpm test
```

Run from the repo root. `@ferrlabs/mcp-core` is linked from `packages/mcp-core` through the workspace, so `pnpm build` builds the core first.

## Releases

FerrFlow releases this package on `mcp-v{version}` tags. Publishing a release runs `.github/workflows/publish.yml`, which publishes `@ferrlabs/mcp` to npm and pushes `ghcr.io/ferrlabs/mcp`.

## Migrating the sub-MCP package names

The four product sub-MCPs moved to their product's npm scope in 8.0.0. The unified server and the shared core did not move.

| Old name               | New name          |
| ---------------------- | ----------------- |
| `@ferrlabs/mcp-vault`  | `@ferrvault/mcp`  |
| `@ferrlabs/mcp-track`  | `@ferrtrack/mcp`  |
| `@ferrlabs/mcp-growth` | `@ferrgrowth/mcp` |
| `@ferrlabs/mcp-fleet`  | `@ferrfleet/mcp`  |
| `@ferrlabs/mcp`        | unchanged         |
| `@ferrlabs/mcp-core`   | unchanged         |

Update the package name in your MCP client config; nothing else changes. Tools, arguments and environment variables are identical, and the servers still target the same product APIs.

npm has no redirect for a renamed package. The old names stay installable at 7.0.2 forever and are deprecated with a pointer here, but they receive no further releases, security fixes included. Move off them.

The binaries were renamed to match, so `ferrlabs-mcp-track` is now `ferrtrack-mcp`. That matters only if you invoke them directly rather than through `npx`. The GHCR images moved the same way, from `ghcr.io/ferrlabs/mcp-track` to `ghcr.io/ferrlabs/ferrtrack-mcp`; the old image tags stay published but stop receiving new versions.

## Migrating from `@ferrflow/mcp` v3.x

v4.0.0 renames the package and points the MCP at the unified FerrLabs API. To migrate:

1. Replace `@ferrflow/mcp` with `@ferrlabs/mcp` in your MCP client config.
2. Rename `FERRFLOW_API_TOKEN` to `FERRLABS_API_TOKEN` (the old name still works for one release).
3. If you were overriding `API_URL=https://api.ferrflow.com`, drop the override. The default is now `https://api.ferrlabs.com`.

Tokens issued by the legacy FerrFlow-only API are not valid against the unified API. Create a fresh one from `app.ferrlabs.com`.

## License

Mozilla Public License 2.0, see the [LICENSE](../../LICENSE) at the repo root.
