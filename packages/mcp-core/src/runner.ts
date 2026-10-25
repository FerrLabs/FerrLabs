import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { startHttpServer } from './transports/http.js';
import { shutdownHttpServer } from './transports/shutdown.js';
import { startStdioServer } from './transports/stdio.js';

export interface RunMcpOptions {
  name: string;
  version: string;
  register: (server: McpServer) => void;
  requireBearer?: boolean;
}

function buildServer(opts: RunMcpOptions): McpServer {
  const server = new McpServer({ name: opts.name, version: opts.version });
  opts.register(server);
  return server;
}

export async function runMcp(opts: RunMcpOptions): Promise<void> {
  if (process.argv.includes('--version') || process.argv.includes('-v')) {
    process.stdout.write(`${opts.name} ${opts.version}\n`);
    return;
  }

  const mode =
    process.env.FERRLABS_MCP_MODE ?? (process.argv.includes('--http') ? 'http' : 'stdio');

  if (mode === 'http') {
    const httpServer = await startHttpServer({
      port: Number(process.env.PORT ?? '3000'),
      host: process.env.HOST,
      stateless: process.env.FERRLABS_MCP_STATEFUL !== '1',
      requireBearer: opts.requireBearer,
      createServer: () => buildServer(opts),
    });
    for (const signal of ['SIGTERM', 'SIGINT'] as const) {
      process.once(signal, () => {
        void shutdownHttpServer(httpServer).then(() => process.exit(0));
      });
    }
    return;
  }

  await startStdioServer(buildServer(opts));
}
