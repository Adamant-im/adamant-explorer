import { spawn } from 'node:child_process';
import console from 'node:console';
import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const viteEntrypoint = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url));

const services = [
  {
    name: 'backend',
    args: ['app.js'],
  },
  {
    name: 'frontend',
    args: [viteEntrypoint],
  },
];

const children = new Map();
let shuttingDown = false;

/**
 * Stops every development service and preserves the triggering exit code.
 * @param {number} exitCode Process exit code to report after both children stop
 */
function shutdown(exitCode) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  process.exitCode = exitCode;

  for (const child of children.values()) {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGTERM');
    }
  }
}

for (const service of services) {
  const child = spawn(process.execPath, service.args, {
    cwd: projectRoot,
    env: process.env,
    stdio: 'inherit',
  });

  children.set(service.name, child);

  child.once('error', (error) => {
    console.error(`[dev] Failed to start ${service.name}: ${error.message}`);
    shutdown(1);
  });

  child.once('exit', (exitCode, signal) => {
    if (shuttingDown) {
      return;
    }

    const reason = signal ? `signal ${signal}` : `code ${exitCode ?? 1}`;
    console.error(`[dev] ${service.name} exited with ${reason}; stopping all services`);
    shutdown(exitCode ?? 1);
  });
}

process.once('SIGINT', () => shutdown(0));
process.once('SIGTERM', () => shutdown(0));
