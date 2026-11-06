import { spawn } from "node:child_process";

/** Runs a program in `cwd` with the output streamed to the terminal; resolves to its exit code. */
export type Runner = (cmd: string, args: string[], opts: { cwd: string }) => Promise<number>;

/**
 * Default runner. On Windows, npm, pnpm and yarn are `.cmd` shims that only start
 * through a shell; arguments are validated package specs, so joining them is safe.
 */
export const spawnRunner: Runner = (cmd, args, { cwd }) =>
  new Promise((resolve) => {
    const useShell = process.platform === "win32" && cmd !== "bun";
    const child = useShell
      ? spawn([cmd, ...args].join(" "), { cwd, stdio: "inherit", shell: true })
      : spawn(cmd, args, { cwd, stdio: "inherit" });
    child.on("error", () => resolve(127));
    child.on("close", (code) => resolve(code ?? 1));
  });

/**
 * Like spawnRunner, but never touches this process's stdin or stdout: the child gets no
 * stdin and its output goes to `onOutput` (the MCP server sends it to stderr, because
 * stdout carries the protocol).
 */
export function pipedRunner(onOutput: (chunk: string) => void): Runner {
  return (cmd, args, { cwd }) =>
    new Promise((resolve) => {
      const useShell = process.platform === "win32" && cmd !== "bun";
      const child = useShell
        ? spawn([cmd, ...args].join(" "), { cwd, stdio: ["ignore", "pipe", "pipe"], shell: true })
        : spawn(cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
      child.stdout.on("data", (b: Buffer) => onOutput(b.toString("utf8")));
      child.stderr.on("data", (b: Buffer) => onOutput(b.toString("utf8")));
      child.on("error", () => resolve(127));
      child.on("close", (code) => resolve(code ?? 1));
    });
}
