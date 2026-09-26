/**
 * One-command dev for the combined project.
 *
 * Starts the Express API (backend/index.ts, port 4000) and the Vite dev server
 * (port 3000) side by side. Vite already proxies /api -> localhost:4000, so the
 * browser only ever talks to a single origin and no CORS preflight is involved.
 *
 * `npm run dev` and `npm run dev:api` still work exactly as they did before --
 * this script just runs both of them together.
 */
import { spawn } from "node:child_process";

process.env.NODE_ENV ??= "development";

const children = [];
let shuttingDown = false;

function run(label, command, args, color) {
  const child = spawn(command, args, {
    stdio: ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32",
    env: process.env,
  });

  const prefix = `\x1b[${color}m[${label}]\x1b[0m `;
  const pipe = (stream, target) => {
    let buffer = "";
    stream.setEncoding("utf8");
    stream.on("data", (chunk) => {
      buffer += chunk;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) target.write(prefix + line + "\n");
    });
    stream.on("end", () => {
      if (buffer) target.write(prefix + buffer + "\n");
    });
  };

  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);

  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    console.log(`${prefix}exited (${signal ?? code}) - stopping the other process.`);
    shutdown(typeof code === "number" ? code : 1);
  });

  children.push(child);
  return child;
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  setTimeout(() => process.exit(code), 250).unref();
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

// API first so the Vite proxy has something to talk to on first request.
run("api", "npx", ["tsx", "backend/index.ts"], "36");
// Same flags as the existing `npm run dev` script -- unchanged behaviour.
run("web", "npx", ["vite", "--host", "0.0.0.0", "--port", "3000"], "35");
