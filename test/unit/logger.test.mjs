import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { expect } from 'chai';

const require = createRequire(import.meta.url);
const { LOG_LEVELS, createLogger } = require('../../utils/logger.js');
const METHODS = ['error', 'warn', 'info', 'log', 'debug'];
const FIXED_TIME = new Date(2026, 0, 2, 3, 4, 5).getTime();

describe('Explorer logger', function () {
  const temporaryDirectories = [];

  afterEach(async function () {
    await Promise.all(
      temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
    );
  });

  it('exposes every supported output method', async function () {
    const logDirectory = await mkdtemp(join(tmpdir(), 'adamant-explorer-logger-'));
    temporaryDirectories.push(logDirectory);
    const logger = createLogger({ level: 'none', logDirectory, now: () => FIXED_TIME });

    expect(Object.keys(logger)).to.deep.equal(METHODS);
    await logger.close();
  });

  it('applies the complete threshold order through debug', async function () {
    for (const level of LOG_LEVELS) {
      const logDirectory = await mkdtemp(join(tmpdir(), 'adamant-explorer-logger-'));
      temporaryDirectories.push(logDirectory);
      const calls = [];
      const logger = createLogger({
        level,
        logDirectory,
        consoleOutput: { log: (...args) => calls.push(args) },
        now: () => FIXED_TIME,
      });

      for (const method of METHODS) {
        logger[method](`${method} message`);
      }

      await logger.close();

      const expectedMethods = METHODS.slice(0, LOG_LEVELS.indexOf(level));
      const emittedMethods = calls.map((args) => args[1].split('|')[0]);
      expect(emittedMethods, `configured level ${level}`).to.deep.equal(expectedMethods);
    }
  });

  it('falls back to log for an unknown configured level', async function () {
    const logDirectory = await mkdtemp(join(tmpdir(), 'adamant-explorer-logger-'));
    temporaryDirectories.push(logDirectory);
    const calls = [];
    const logger = createLogger({
      level: 'verbose',
      logDirectory,
      consoleOutput: { log: (...args) => calls.push(args) },
      now: () => FIXED_TIME,
    });

    for (const method of METHODS) {
      logger[method](`${method} message`);
    }

    await logger.close();
    expect(calls.map((args) => args[1].split('|')[0])).to.deep.equal(METHODS.slice(0, 4));

    const contents = await readFile(join(logDirectory, '2026-01-02.log'), 'utf8');
    expect(contents).to.include('logLevel=log');
    expect(contents).not.to.include('logLevel=verbose');
  });

  it('writes debug output to an isolated log file', async function () {
    const logDirectory = await mkdtemp(join(tmpdir(), 'adamant-explorer-logger-'));
    temporaryDirectories.push(logDirectory);
    const logger = createLogger({
      level: 'debug',
      logDirectory,
      consoleOutput: { log() {} },
      now: () => FIXED_TIME,
    });

    logger.debug('socket diagnostics');
    await logger.close();

    const contents = await readFile(join(logDirectory, '2026-01-02.log'), 'utf8');
    expect(contents).to.include('[Explorer process started] time=2026-01-02 03:04:05;');
    expect(contents).to.include('logLevel=debug');
    expect(contents).to.include('debug|2026-01-02 03:04:05|socket diagnostics');
  });
});
