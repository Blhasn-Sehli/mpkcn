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
