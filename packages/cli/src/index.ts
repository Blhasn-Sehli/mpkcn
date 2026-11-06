#!/usr/bin/env node
import { run } from "./cli.js";

const code = await run(process.argv.slice(2), {
  cwd: process.cwd(),
  stdout: (line) => console.log(line),
  stderr: (line) => console.error(line),
});
process.exitCode = code;
