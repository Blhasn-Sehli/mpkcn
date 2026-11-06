import { CodeBlock } from "./code-block";
import { Tabs } from "./tabs";

const ARGS = ["-y", "mpkcn@latest", "mcp"];
const server = (extra: Record<string, unknown> = {}) => ({ ...extra, command: "npx", args: ARGS });
const json = (value: unknown) => JSON.stringify(value, null, 2);

function Note({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 text-sm leading-6 text-mpk-dim [&_code]:font-mpk-mono [&_code]:text-[0.85em] [&_code]:text-mpk-ink">{children}</p>;
}

/** One-line MCP setup for each assistant, with copy buttons. */
export function McpSetupTabs() {
  const desktopConfig = json({ mcpServers: { mpkcn: server() } });
  return (
    <div className="not-prose my-6 min-w-0">
      <Tabs
        ariaLabel="Set up the mpkcn MCP server"
        listClassName="flex-wrap border-b border-mpk-line"
        items={[
          {
            label: "Claude Code",
            content: (
              <>
                <Note>Run this once in your project folder:</Note>
                <CodeBlock code="claude mcp add mpkcn -- npx -y mpkcn@latest mcp" lang="bash" className="!mt-3 !mb-0" />
                <Note>
                  Add <code>--scope project</code> after <code>add</code> to share it with your team through{" "}
                  <code>.mcp.json</code>.
                </Note>
              </>
            ),
          },
          {
            label: "Cursor",
            content: (
              <>
                <Note>
                  Create <code>.cursor/mcp.json</code> in your project (or <code>~/.cursor/mcp.json</code> for every project):
                </Note>
                <CodeBlock
                  code={json({ mcpServers: { mpkcn: server({ type: "stdio" }) } })}
                  lang="json"
                  title=".cursor/mcp.json"
                  className="!mt-3 !mb-0"
                />
              </>
            ),
          },
          {
            label: "VS Code",
            content: (
              <>
                <Note>
                  Create <code>.vscode/mcp.json</code> in your project. VS Code uses <code>servers</code>, not{" "}
                  <code>mcpServers</code>:
                </Note>
                <CodeBlock
                  code={json({ servers: { mpkcn: server({ type: "stdio" }) } })}
                  lang="json"
                  title=".vscode/mcp.json"
                  className="!mt-3 !mb-0"
                />
                <Note>Or add it to your user profile from a terminal:</Note>
                <CodeBlock
                  code={`code --add-mcp '{"name":"mpkcn","type":"stdio","command":"npx","args":["-y","mpkcn@latest","mcp"]}'`}
                  lang="bash"
                  className="!mt-3 !mb-0"
                />
              </>
            ),
          },
          {
            label: "Windsurf",
            content: (
              <>
                <Note>
                  Add it to <code>~/.codeium/windsurf/mcp_config.json</code> (Cascade, MCP servers, view raw config):
                </Note>
                <CodeBlock code={desktopConfig} lang="json" title="mcp_config.json" className="!mt-3 !mb-0" />
              </>
            ),
          },
          {
            label: "Claude Desktop",
            content: (
              <>
                <Note>
                  Settings, Developer, Edit Config opens <code>claude_desktop_config.json</code>. Add the server, then
                  restart Claude Desktop:
                </Note>
                <CodeBlock code={desktopConfig} lang="json" title="claude_desktop_config.json" className="!mt-3 !mb-0" />
                <Note>
                  Claude Desktop does not start in your project folder, so name the project in your prompt (for example
                  &ldquo;in ~/code/my-site&rdquo;). The assistant passes it to the tools as <code>cwd</code>.
                </Note>
              </>
            ),
          },
        ]}
      />
    </div>
  );
}
