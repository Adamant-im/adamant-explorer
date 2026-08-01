import { expect } from 'chai';
import { createBlockRefreshTrigger } from '../../src/lib/blockRefresh.js';

function deferred() {
  let resolve;
  const promise = new Promise((promiseResolve) => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
}

describe('block-driven page refresh', function () {
  it('refreshes the first known block when none was known during the initial request', async function () {
    let refreshes = 0;
    const trigger = createBlockRefreshTrigger(async () => {
      refreshes++;
    });

    expect(await trigger(null)).to.equal(false);
    expect(await trigger({ id: 'block-100', height: 100 })).to.equal(true);
    expect(await trigger({ id: 'block-100', height: 100 })).to.equal(false);
    expect(await trigger({ id: 'block-101', height: 101 })).to.equal(true);
    expect(refreshes).to.equal(2);
  });

  it('waits for a new block when the initial request already had one', async function () {
    let refreshes = 0;
    const trigger = createBlockRefreshTrigger(
      async () => {
        refreshes++;
      },
      { id: 'block-100', height: 100 },
    );

    expect(await trigger({ id: 'block-100', height: 100 })).to.equal(false);
    expect(await trigger({ id: 'block-101', height: 101 })).to.equal(true);
    expect(refreshes).to.equal(1);
  });

  it('collapses block events received during a slow request into one follow-up refresh', async function () {
    const firstRefresh = deferred();
    let refreshes = 0;
    const trigger = createBlockRefreshTrigger(
      async () => {
        refreshes++;

        if (refreshes === 1) {
          await firstRefresh.promise;
        }
      },
      { id: 'block-100', height: 100 },
    );

    const running = trigger({ id: 'block-101', height: 101 });
    await Promise.resolve();

    trigger({ id: 'block-102', height: 102 });
    trigger({ id: 'block-103', height: 103 });
    expect(refreshes).to.equal(1);

    firstRefresh.resolve();
    expect(await running).to.equal(true);
    expect(refreshes).to.equal(2);
  });

  it('refreshes a same-height fork replacement with a different block id', async function () {
    let refreshes = 0;
    const trigger = createBlockRefreshTrigger(
      async () => {
        refreshes++;
      },
      { id: 'original', height: 100 },
    );

    expect(await trigger({ id: 'replacement', height: 100 })).to.equal(true);
    expect(refreshes).to.equal(1);
  });
});
