import { createRequire } from 'node:module';
import { expect } from 'chai';

const require = createRequire(import.meta.url);
const { scheduleTimerSlot } = require('../../sockets/timerSchedule.js');
const originalSetTimeout = global.setTimeout;

describe('socket timer slot ownership', function () {
  afterEach(function () {
    global.setTimeout = originalSetTimeout;
  });

  it('clears a slot only while the callback still owns its timer identity', function () {
    let queuedCallback;
    const timers = [];
    let calls = 0;

    global.setTimeout = (callback) => {
      queuedCallback = callback;
      return { id: 'stale' };
    };

    scheduleTimerSlot(
      timers,
      0,
      () => {
        calls++;
      },
      1000,
    );
    const currentTimer = { id: 'current' };
    timers[0] = currentTimer;

    queuedCallback();

    expect(timers[0]).to.equal(currentTimer);
    expect(calls).to.equal(0);
  });

  it('keeps a newer lifecycle array isolated from a queued old callback', function () {
    const scheduled = [];
    const callbacks = [];

    global.setTimeout = (callback) => {
      const timer = { callback };
      scheduled.push(timer);
      return timer;
    };

    let timers = [];
    scheduleTimerSlot(timers, 0, () => callbacks.push('stale'), 1000);
    const staleTimer = scheduled[0];

    timers = [];
    scheduleTimerSlot(timers, 0, () => callbacks.push('current'), 1000);
    const currentTimer = scheduled[1];

    staleTimer.callback();
    expect(timers[0]).to.equal(currentTimer);
    expect(callbacks).to.deep.equal(['stale']);

    currentTimer.callback();
    expect(timers[0]).to.equal(undefined);
    expect(callbacks).to.deep.equal(['stale', 'current']);
  });
});
