const async = require('async');
const delegatesHandler = require('../api/lib/adamant/handlers/delegates');
const statisticsHandler = require('../api/lib/adamant/handlers/statistics');
const blocks = require('../api/lib/adamant/requests/blocks');
const delegates = require('../api/lib/adamant/requests/delegates');
const {
  ACTIVE_DELEGATES,
  BLOCK_INTERVAL_MILLISECONDS,
  BLOCK_INTERVAL_SECONDS,
} = require('../api/lib/adamant/constants');
const logger = require('../utils/log');
const {
  getForgingSchedule,
  getRound,
  getRoundDelegates,
  moveForgingScheduleToSlot,
} = require('./delegateMonitorSchedule');
const {
  getDelegateObservationState,
  parseActiveDelegateState,
  serializeActiveDelegateState,
} = require('./delegateMonitorState');

const STATUS_REFRESH_INTERVAL = BLOCK_INTERVAL_MILLISECONDS;
const STATUS_REFRESH_GRACE_MILLISECONDS = 25;
const FORGED_REFRESH_INTERVAL = 300000;
const FORGED_REQUEST_CONCURRENCY = 10;
const ACTIVE_DELEGATE_STATE_KEY = 'adamant-explorer:delegate-monitor:active:v1';

module.exports = function (app, connectionHandler, socket) {
  let timers = [];
  let monitoring = false;
  let unsubscribeFromBlocks = null;
  new connectionHandler('Delegate Monitor:', socket, this);
  const data = {};
  // Internal scheduling data that is not emitted directly
  const tmpData = {};

  const running = {
    getActive: false,
    getLastBlock: false,
    getRegistrations: false,
    getVotes: false,
    getNextForgers: false,
  };

  this.onInit = function () {
    monitoring = true;
    this.onConnect();

    async.parallel(
      [
        getLastBlock,
        getActive,
        getRegistrations,
        getVotes,
        getNextForgers,
        restoreActiveDelegateState,
      ],
      function (err, res) {
        if (err) {
          // A failed request must not leave the monitor empty forever
          log('error', 'Error retrieving: ' + err + '. Retrying in 10 seconds');
          scheduleRetry();
        } else {
          tmpData.nextForgers = getForgingSchedule(
            res[1].delegates.map((delegate) => delegate.publicKey),
            res[4],
          );

          data.lastBlock = res[0];
          data.active = updateActive(res[1]);
          data.registrations = res[2];
          data.votes = res[3];
          data.nextForgers = cutNextForgers(10);

          // Status data is emitted by the first coherent schedule/block refresh.
          socket.emit('data', {
            registrations: data.registrations,
            votes: data.votes,
          });

          newSerializedLoop(0, BLOCK_INTERVAL_MILLISECONDS, refreshMetadata, 'metadata');
          startMonitorUpdates();
        }
      }.bind(this),
    );
  };

  this.onConnect = function () {
    log('info', 'Emitting existing data');
    socket.emit('data', data);
  };

  this.onDisconnect = function () {
    monitoring = false;

    for (const timer of timers) {
      clearInterval(timer);
    }

    timers = [];

    unsubscribeFromBlocks?.();
    unsubscribeFromBlocks = null;
    tmpData.statusRefreshQueued = false;
  };

  // Private

  const log = function (level, msg) {
    logger[level]('Delegate Monitor:' + msg);
  };

  /** Starts a polling loop whose delay begins after the previous run finishes. */
  const newSerializedLoop = function (index, delay, callback, label) {
    if (timers[index] !== undefined) {
      return null;
    }

    const run = async () => {
      if (!monitoring) {
        return;
      }

      try {
        await callback();
      } catch (error) {
        log('error', `Error retrieving ${label}: ${error}`);
      }

      if (monitoring) {
        timers[index] = setTimeout(run, delay);
      }
    };

    timers[index] = setTimeout(run, delay);
    return timers[index];
  };

  const scheduleRetry = function () {
    if (timers[3] !== undefined) {
      return;
    }

    timers[3] = setTimeout(() => {
      timers[3] = undefined;

      if (monitoring) {
        this.onInit();
      }
    }, 10000);
  }.bind(this);

  /** Loads status first, then starts bounded serialized refresh loops. */
  const startMonitorUpdates = async function () {
    try {
      await statisticsHandler.ensureBlockStatistics();
      await refreshRecentBlocks();
    } catch (error) {
      log('error', 'Error retrieving recent blocks: ' + error);
    }

    if (!monitoring) {
      return;
    }

    if (!unsubscribeFromBlocks) {
      unsubscribeFromBlocks = statisticsHandler.subscribeBlockStatistics(
        handleBlockStatisticsUpdate,
      );
    }

    scheduleNextStatusRefresh();

    try {
      await refreshForgedAmounts();
    } catch (error) {
      log('error', 'Error retrieving forged amounts: ' + error);
    }

    if (monitoring) {
      newSerializedLoop(2, FORGED_REFRESH_INTERVAL, refreshForgedAmounts, 'forged amounts');
    }
  };

  /** Align the next status refresh just after the next five-second slot boundary. */
  const getNextStatusRefreshDelay = function () {
    const nodeTimestamp = tmpData.nextForgers?.nodeTimestamp;

    if (!Number.isInteger(nodeTimestamp)) {
      return STATUS_REFRESH_INTERVAL;
    }

    const elapsedInSlot = (nodeTimestamp % BLOCK_INTERVAL_SECONDS) * 1000 + (Date.now() % 1000);

    return Math.max(
      STATUS_REFRESH_GRACE_MILLISECONDS,
      STATUS_REFRESH_INTERVAL - elapsedInSlot + STATUS_REFRESH_GRACE_MILLISECONDS,
    );
  };

  /** Schedule one slot-aligned refresh; block events may bring it forward. */
  const scheduleNextStatusRefresh = function () {
    if (!monitoring || timers[1] !== undefined) {
      return;
    }

    timers[1] = setTimeout(() => {
      timers[1] = undefined;
      emitPredictedSlot((tmpData.nextForgers?.currentSlot ?? -1) + 1);
      requestStatusRefresh('slot');
    }, getNextStatusRefreshDelay());
  };

  /**
   * Emit the deterministic slot transition immediately, then let REST confirm it.
   * @param {number} currentSlot Slot derived from the local timer or socket block
   */
  const emitPredictedSlot = function (currentSlot) {
    if (
      !Number.isInteger(currentSlot) ||
      !tmpData.nextForgers?.orderedDelegates?.length ||
      currentSlot <= tmpData.nextForgers.currentSlot ||
      !data.active?.delegates?.length
    ) {
      return;
    }

    tmpData.nextForgers = moveForgingScheduleToSlot(tmpData.nextForgers, currentSlot);
    tmpData.roundDelegates = getRoundDelegates(
      tmpData.nextForgers,
      statisticsHandler.getCachedBlocks(),
    );
    data.active.delegates.forEach((delegate) => updateDelegate(delegate, false));
    data.nextForgers = cutNextForgers(10);

    socket.emit('data', {
      active: data.active,
      lastBlock: data.lastBlock,
      nextForgers: data.nextForgers,
    });
  };

  /**
   * Coalesce slot and block triggers into one serialized status refresh.
   * A trigger received during a request causes exactly one follow-up refresh.
   */
  const requestStatusRefresh = function (source) {
    if (!monitoring) {
      return Promise.resolve();
    }

    if (timers[1] !== undefined) {
      clearTimeout(timers[1]);
      timers[1] = undefined;
    }

    if (tmpData.statusRefreshPromise) {
      tmpData.statusRefreshQueued = true;
      return tmpData.statusRefreshPromise;
    }

    const run = async () => {
      do {
        tmpData.statusRefreshQueued = false;

        try {
          await refreshRecentBlocks();
        } catch (error) {
          log('error', `Error retrieving recent blocks after ${source}: ${error}`);
        }
      } while (monitoring && tmpData.statusRefreshQueued);
    };

    const promise = run().finally(() => {
      if (tmpData.statusRefreshPromise === promise) {
        tmpData.statusRefreshPromise = null;
      }

      scheduleNextStatusRefresh();
    });

    tmpData.statusRefreshPromise = promise;
    return promise;
  };

  /** Refresh immediately when the shared accumulator receives a socket block. */
  const handleBlockStatisticsUpdate = function (update) {
    if (!monitoring || update.source?.startsWith('delegate-rest')) {
      return;
    }

    const blockSlot = Math.floor(Number(update.lastBlock?.timestamp ?? 0) / BLOCK_INTERVAL_SECONDS);
    emitPredictedSlot(blockSlot);
    requestStatusRefresh(update.source ?? 'block');
  };

  const getNextForgerPublicKeys = function () {
    return tmpData.nextForgers?.delegates ?? [];
  };

  /** Restore delegate observation boundaries before comparing the active roster. */
  const restoreActiveDelegateState = async function () {
    if (tmpData.activeDelegateStateLoaded) {
      return;
    }

    tmpData.activeDelegateStateLoaded = true;

    try {
      const json = await app.locals.redis?.get(ACTIVE_DELEGATE_STATE_KEY);
      const restored = json ? parseActiveDelegateState(json) : null;

      if (restored) {
        tmpData.activeDelegateState = restored;
        tmpData.activeRosterKnown = true;
        tmpData.activeDelegateStateJson = json;
      }
    } catch (error) {
      log('warn', ` Failed to restore active delegate state: ${error}`);
    }
  };

  /** Persist only roster changes and schedule transitions, without an expiry. */
  const persistActiveDelegateState = function (activeDelegates) {
    const json = serializeActiveDelegateState(activeDelegates);

    tmpData.activeDelegateState = new Map(
      activeDelegates.map((delegate) => [
        delegate.publicKey,
        {
          activeSinceRound: delegate.activeSinceRound ?? null,
          scheduledSinceRound: delegate.scheduledSinceRound ?? null,
          isScheduled: delegate.isScheduled === true,
        },
      ]),
    );
    tmpData.activeRosterKnown = true;

    if (!app.locals.redis || json === tmpData.activeDelegateStateJson) {
      return;
    }

    tmpData.activeDelegateStateJson = json;
    app.locals.redis.set(ACTIVE_DELEGATE_STATE_KEY, json).catch((error) => {
      if (tmpData.activeDelegateStateJson === json) {
        tmpData.activeDelegateStateJson = null;
      }

      log('warn', ` Failed to persist active delegate state: ${error}`);
    });
  };

  const cutNextForgers = function (count) {
    return getNextForgerPublicKeys().slice(0, count).map(findActiveByPublicKey).filter(Boolean);
  };

  const getActive = function (cb) {
    if (running.getActive) {
      return cb('getActive (already running)');
    }

    running.getActive = true;
    delegatesHandler.getActive(
      () => {
        running.getActive = false;
        cb('Active');
      },
      (res) => {
        running.getActive = false;
        cb(null, res);
      },
      { includeForged: false },
    );
  };

  /** Load parsed active delegates through the callback-based handler. */
  const getActiveState = function () {
    return new Promise((resolve, reject) => {
      getActive((error, result) => {
        if (error) {
          reject(new Error(error));
        } else {
          resolve(result);
        }
      });
    });
  };

  const findActive = function (delegate) {
    return data.active?.delegates?.find((item) => item.publicKey === delegate.publicKey);
  };

  const findActiveByPublicKey = function (publicKey) {
    return data.active?.delegates?.find((delegate) => delegate.publicKey === publicKey);
  };

  const findActiveByBlock = function (block) {
    return data.active?.delegates?.find(
      (delegate) => delegate.publicKey === block.generatorPublicKey,
    );
  };

  const updateDelegate = function (delegate, updateForgingTime) {
    if (updateForgingTime) {
      delegate.forgingTime =
        getNextForgerPublicKeys().indexOf(delegate.publicKey) * BLOCK_INTERVAL_SECONDS;
    }

    const wasScheduled = delegate.isScheduled;
    const isScheduled = getNextForgerPublicKeys().includes(delegate.publicKey);
    const networkRound = getRound(data.lastBlock?.block?.height ?? 0);

    delegate.isRoundDelegate = (tmpData.roundDelegates ?? []).includes(delegate.publicKey);
    delegate.isScheduled = isScheduled;

    if (!isScheduled) {
      delegate.scheduledSinceRound = null;
    } else if (wasScheduled === false) {
      // A delegate that has just entered the forging schedule needs its own
      // observation window instead of inheriting older cached rounds.
      delegate.scheduledSinceRound = networkRound;
    }

    return delegate;
  };

  const updateActive = function (results) {
    const hadActiveSnapshot = Boolean(data.active?.delegates) || tmpData.activeRosterKnown;
    const networkRound = getRound(data.lastBlock?.block?.height ?? 0);

    tmpData.roundDelegates = getRoundDelegates(
      tmpData.nextForgers,
      statisticsHandler.getCachedBlocks(),
    );

    results.delegates = results.delegates.map((delegate) => {
      const existing = findActive(delegate);
      const persisted = tmpData.activeDelegateState?.get(delegate.publicKey);

      delegate.forged = existing?.forged ?? delegate.forged ?? 0;
      Object.assign(
        delegate,
        getDelegateObservationState(existing, persisted, hadActiveSnapshot, networkRound),
      );

      if (existing?.blocksAt) {
        delegate.blocks = existing.blocks;
        delegate.blocksAt = existing.blocksAt;
      }

      return updateDelegate(delegate, true);
    });

    persistActiveDelegateState(results.delegates);

    return results;
  };

  const getLastBlock = function (cb) {
    if (running.getLastBlock) {
      return cb('getLastBlock (already running)');
    }

    running.getLastBlock = true;
    delegatesHandler.getLastBlock(
      () => {
        running.getLastBlock = false;
        cb('LastBlock');
      },
      (res) => {
        running.getLastBlock = false;
        cb(null, res);
      },
    );
  };

  const getRegistrations = function (cb) {
    if (running.getRegistrations) {
      return cb('getRegistrations (already running)');
    }

    running.getRegistrations = true;
    delegatesHandler.getLatestRegistrations(
      () => {
        running.getRegistrations = false;
        cb('Registrations');
      },
      (res) => {
        running.getRegistrations = false;
        cb(null, res);
      },
    );
  };

  const getVotes = function (cb) {
    if (running.getVotes) {
      return cb('getVotes (already running)');
    }

    running.getVotes = true;
    delegatesHandler.getLatestVotes(
      () => {
        running.getVotes = false;
        cb('Votes');
      },
      (res) => {
        running.getVotes = false;
        cb(null, res);
      },
    );
  };

  const getNextForgers = function (cb) {
    if (running.getNextForgers) {
      return cb('getNextForgers (already running)');
    }

    running.getNextForgers = true;
    delegatesHandler.getNextForgers(
      () => {
        running.getNextForgers = false;
        cb('NextForgers');
      },
      (res) => {
        running.getNextForgers = false;
        cb(null, res);
      },
    );
  };

  /**
   * Read schedule timing and blocks until both responses describe one height.
   * @returns {Promise<{nextForgers: Object, latestBlocks: Array<Object>}>} Coherent snapshot
   */
  const getForgingSnapshot = async function () {
    for (let attempt = 0; attempt < 3; attempt++) {
      const [nextForgers, latestBlocks] = await Promise.all([
        delegates.getNextForgersState(),
        blocks.getBlocks(0, 2),
      ]);

      if (!latestBlocks.length) {
        throw new Error('No recent blocks returned by the node');
      }

      if (Number(nextForgers.currentBlock) === Number(latestBlocks[0].height)) {
        return { nextForgers, latestBlocks };
      }
    }

    throw new Error('Could not obtain matching schedule and block heights');
  };

  /** Refresh forging state from one schedule, roster, and block snapshot. */
  const refreshRecentBlocks = async function () {
    const [{ nextForgers, latestBlocks }, activeResults] = await Promise.all([
      getForgingSnapshot(),
      getActiveState(),
    ]);

    await statisticsHandler.ingestBlocks(latestBlocks, 'delegate-rest');

    // A socket block may arrive after the snapshot. Keep this emission on the
    // matched height; the queued socket refresh will immediately advance it.
    const recentBlocks = statisticsHandler
      .getCachedBlocks()
      .filter((block) => block.height <= latestBlocks[0].height);

    if (!monitoring || !recentBlocks.length) {
      return;
    }

    const fetchedAt = new Date().toISOString();
    const latestBlock = recentBlocks[0];
    const oldestBlock = recentBlocks[recentBlocks.length - 1];
    const oldestRound = getRound(oldestBlock.height);

    tmpData.nextForgers = {
      ...getForgingSchedule(
        activeResults.delegates.map((delegate) => delegate.publicKey),
        nextForgers,
      ),
      success: true,
    };

    data.lastBlock = {
      success: true,
      block: latestBlock,
    };
    data.active = updateActive(activeResults);

    tmpData.roundDelegates = getRoundDelegates(tmpData.nextForgers, recentBlocks);
    data.active.delegates.forEach((delegate) => updateDelegate(delegate, false));

    const lastBlockDelegate = findActiveByBlock(latestBlock);
    data.lastBlock = {
      success: true,
      block: {
        ...latestBlock,
        delegate: lastBlockDelegate
          ? {
              username: lastBlockDelegate.username,
              address: lastBlockDelegate.address,
            }
          : {
              username: latestBlock.generatorId,
              address: latestBlock.generatorId,
            },
      },
    };

    const latestByGenerator = new Map();

    for (const block of recentBlocks) {
      if (!latestByGenerator.has(block.generatorPublicKey)) {
        latestByGenerator.set(block.generatorPublicKey, block);
      }
    }

    for (const delegate of data.active.delegates) {
      const knownSinceRound = Math.max(
        oldestRound,
        delegate.activeSinceRound ?? oldestRound,
        delegate.scheduledSinceRound ?? oldestRound,
      );
      const knownSinceHeight = Math.max(
        oldestBlock.height,
        (knownSinceRound - 1) * ACTIVE_DELEGATES + 1,
      );
      const observedBlockCount = latestBlock.height - knownSinceHeight + 1;
      const historyRoundCount = delegate.isScheduled
        ? Math.max(0, Math.ceil(observedBlockCount / ACTIVE_DELEGATES))
        : 0;
      const block = latestByGenerator.get(delegate.publicKey);
      const isBlockInKnownHistory = block && getRound(block.height) >= knownSinceRound;

      delegate.blocks = isBlockInKnownHistory ? [block] : [];
      delegate.blocksAt = fetchedAt;
      delegate.historyRoundCount = historyRoundCount;
    }

    data.nextForgers = cutNextForgers(10);

    log('info', 'Emitting coherent status data');
    socket.emit('data', data);
  };

  /** Refreshes forged totals separately so status updates are never blocked by 101 requests. */
  const refreshForgedAmounts = async function () {
    const activeDelegates = data.active?.delegates ?? [];

    if (!activeDelegates.length) {
      return;
    }

    const forgedAmounts = await async.mapLimit(
      activeDelegates,
      FORGED_REQUEST_CONCURRENCY,
      async (delegate) => ({
        publicKey: delegate.publicKey,
        forged: await delegates.getForged(delegate.publicKey),
      }),
    );

    if (!monitoring || !data.active?.delegates) {
      return;
    }

    const forgedByPublicKey = new Map(
      forgedAmounts.map((delegate) => [delegate.publicKey, delegate.forged]),
    );

    data.active.delegates = data.active.delegates.map((delegate) => ({
      ...delegate,
      forged: forgedByPublicKey.get(delegate.publicKey) ?? delegate.forged,
    }));

    socket.emit('data', { active: data.active });
  };

  /** Refresh page metadata without replacing the atomic forging state. */
  const refreshMetadata = function () {
    return new Promise((resolve, reject) => {
      async.parallel([getRegistrations, getVotes], function (err, res) {
        if (err) {
          reject(new Error(err));
        } else {
          data.registrations = res[0];
          data.votes = res[1];

          socket.emit('data', {
            registrations: data.registrations,
            votes: data.votes,
          });
          resolve();
        }
      });
    });
  };
};
