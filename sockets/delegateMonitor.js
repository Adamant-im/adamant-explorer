const async = require('async');
const delegatesHandler = require('../api/lib/adamant/handlers/delegates');
const statisticsHandler = require('../api/lib/adamant/handlers/statistics');
const forgingStatistics = require('../api/lib/adamant/helpers/forgingStatistics');
const blocks = require('../api/lib/adamant/requests/blocks');
const delegates = require('../api/lib/adamant/requests/delegates');
const {
  ACTIVE_DELEGATES,
  BLOCK_INTERVAL_MILLISECONDS,
  BLOCK_INTERVAL_SECONDS,
} = require('../api/lib/adamant/constants.mjs');
const logger = require('../utils/log');
const {
  getForgingSchedule,
  getNextSlotRefreshDelay,
  getRound,
  getRoundDelegates,
  moveForgingScheduleToSlot,
} = require('./delegateMonitorSchedule');
const {
  getDelegateObservationState,
  parseActiveDelegateState,
  serializeActiveDelegateState,
} = require('./delegateMonitorState');
const { getRetryDelay } = require('./retrySchedule');

const STATUS_REFRESH_GRACE_MILLISECONDS = 25;
const ACTIVE_DELEGATE_STATE_KEY = 'adamant-explorer:delegate-monitor:active:v1';

module.exports = function (app, connectionHandler, socket) {
  let timers = [];
  let monitoring = false;
  let generation = 0;
  let retryAttempt = 0;
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
    getForgingBaseline: false,
  };

  this.onInit = function () {
    const initializedAt = Date.now();
    monitoring = true;
    generation++;
    retryAttempt = 0;

    // Do not expose the previous page session while a fresh coherent
    // schedule/block snapshot is loading for the first connected client.
    for (const key of Object.keys(data)) {
      delete data[key];
    }

    initialize(generation, initializedAt);
  };

  this.onConnect = function (client = socket) {
    log('debug', `Emitted cached data; height=${data.lastBlock?.block?.height ?? 'unknown'}`);
    client.emit('data', data);
  };

  this.onDisconnect = function () {
    monitoring = false;
    generation++;
    retryAttempt = 0;

    for (const timer of timers) {
      clearTimeout(timer);
    }

    timers = [];

    unsubscribeFromBlocks?.();
    unsubscribeFromBlocks = null;
    tmpData.statusRefreshQueued = null;
  };

  // Private

  const log = function (level, msg) {
    logger[level](`Delegate Monitor: ${msg}`);
  };

  const isActive = function (expectedGeneration) {
    return monitoring && generation === expectedGeneration;
  };

  /**
   * Load the minimum schedule and roster snapshot needed by the live monitor.
   * Metadata and lifetime totals start independently so their failure cannot
   * hold back forging status.
   * @param {number} expectedGeneration Active namespace lifecycle generation
   * @param {number} initializedAt Start timestamp used for diagnostics
   */
  const initialize = function (expectedGeneration, initializedAt) {
    if (!isActive(expectedGeneration)) {
      return;
    }

    async.parallel(
      [getLastBlock, getActive, getNextForgers, restoreActiveDelegateState],
      function (err, res) {
        if (!isActive(expectedGeneration)) {
          return;
        }

        if (err) {
          scheduleRetry(expectedGeneration, initializedAt, err);
          return;
        }

        try {
          tmpData.nextForgers = getForgingSchedule(res[2]);

          data.lastBlock = res[0];
          data.active = updateActive(res[1]);
          data.nextForgers = cutNextForgers(10);
          retryAttempt = 0;
        } catch (error) {
          scheduleRetry(expectedGeneration, initializedAt, error);
          return;
        }

        startMetadataUpdates(expectedGeneration);
        initializeForgingTotals(expectedGeneration);
        startMonitorUpdates(expectedGeneration)
          .then((statusReady) => {
            if (!isActive(expectedGeneration)) {
              return;
            }

            const label = statusReady ? 'Initialized' : 'Core initialized; status pending';
            log(
              statusReady ? 'info' : 'warn',
              `${label}; activeDelegates=${data.active?.delegates?.length ?? 0}; ` +
                `scheduledDelegates=${tmpData.nextForgers?.delegates?.length ?? 0}; ` +
                `height=${data.lastBlock?.block?.height ?? 'unknown'}; ` +
                `initialLoadMs=${Date.now() - initializedAt}`,
            );
          })
          .catch((error) => {
            if (isActive(expectedGeneration)) {
              log('warn', `Status monitor initialization failed: ${error}`);
              scheduleNextStatusRefresh(expectedGeneration);
            }
          });
      },
    );
  };

  /** Starts a polling loop whose delay begins after the previous run finishes. */
  const newSerializedLoop = function (index, delay, callback, label, expectedGeneration) {
    if (timers[index] !== undefined) {
      return null;
    }

    const run = async () => {
      if (!isActive(expectedGeneration)) {
        return;
      }

      try {
        await callback(expectedGeneration);
      } catch (error) {
        log('warn', `${label} refresh failed; next attempt in ${delay}ms: ${error}`);
      }

      if (isActive(expectedGeneration)) {
        timers[index] = setTimeout(run, delay);
      }
    };

    timers[index] = setTimeout(run, delay);
    return timers[index];
  };

  const scheduleRetry = function (expectedGeneration, initializedAt, error) {
    if (timers[3] !== undefined) {
      return;
    }

    const delay = getRetryDelay(retryAttempt++);
    log('warn', `Initial core data load failed (${error}); retrying in ${delay}ms`);
    timers[3] = setTimeout(() => {
      timers[3] = undefined;

      if (isActive(expectedGeneration)) {
        initialize(expectedGeneration, initializedAt);
      }
    }, delay);
  };

  /** Start optional metadata immediately, then continue in one serialized loop. */
  const startMetadataUpdates = async function (expectedGeneration) {
    try {
      await refreshMetadata(expectedGeneration);
    } catch (error) {
      if (isActive(expectedGeneration)) {
        log('warn', `Initial metadata refresh failed; successful sources remain active: ${error}`);
      }
    }

    if (isActive(expectedGeneration)) {
      newSerializedLoop(
        0,
        BLOCK_INTERVAL_MILLISECONDS,
        refreshMetadata,
        'metadata',
        expectedGeneration,
      );
    }
  };

  /** Loads status first, then starts bounded serialized refresh loops. */
  const startMonitorUpdates = async function (expectedGeneration) {
    let statusReady = false;

    try {
      await statisticsHandler.ensureBlockStatistics();

      if (!isActive(expectedGeneration)) {
        return false;
      }

      statusReady = await requestStatusRefresh('initial', expectedGeneration);
    } catch (error) {
      log(
        'warn',
        `Initial recent-block refresh failed; slot-aligned retry remains active: ${error}`,
      );
    }

    if (!isActive(expectedGeneration)) {
      return false;
    }

    if (!unsubscribeFromBlocks) {
      unsubscribeFromBlocks = statisticsHandler.subscribeBlockStatistics(
        handleBlockStatisticsUpdate,
      );
    }

    scheduleNextStatusRefresh(expectedGeneration);
    return statusReady;
  };

  /** Align the next status refresh just after the absolute five-second slot boundary. */
  const getNextStatusRefreshDelay = function () {
    return getNextSlotRefreshDelay(Date.now(), STATUS_REFRESH_GRACE_MILLISECONDS);
  };

  /** Schedule one slot-aligned refresh; block events may bring it forward. */
  const scheduleNextStatusRefresh = function (expectedGeneration) {
    if (!isActive(expectedGeneration) || timers[1] !== undefined) {
      return;
    }

    timers[1] = setTimeout(() => {
      timers[1] = undefined;

      if (!isActive(expectedGeneration)) {
        return;
      }

      emitPredictedSlot((tmpData.nextForgers?.currentSlot ?? -1) + 1, expectedGeneration);
      requestStatusRefresh('slot', expectedGeneration);
    }, getNextStatusRefreshDelay());
  };

  /**
   * Emit the deterministic slot transition immediately, then let REST confirm it.
   * @param {number} currentSlot Slot derived from the local timer or socket block
   * @param {number} expectedGeneration Active namespace lifecycle generation
   */
  const emitPredictedSlot = function (currentSlot, expectedGeneration) {
    if (
      !isActive(expectedGeneration) ||
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
    log(
      'debug',
      `Emitted predicted slot; slot=${currentSlot}; height=${data.lastBlock?.block?.height ?? 'unknown'}`,
    );
  };

  /**
   * Coalesce slot and block triggers into one serialized status refresh.
   * A trigger received during a request replaces any older queued trigger, so
   * bursts cause at most one follow-up refresh.
   * @param {string} source Trigger name used for diagnostics
   * @param {number} expectedGeneration Active namespace lifecycle generation
   * @returns {Promise<boolean>} Whether an active refresh completed successfully
   */
  const requestStatusRefresh = function (source, expectedGeneration) {
    if (!isActive(expectedGeneration)) {
      return Promise.resolve(false);
    }

    if (timers[1] !== undefined) {
      clearTimeout(timers[1]);
      timers[1] = undefined;
    }

    if (tmpData.statusRefreshPromise) {
      tmpData.statusRefreshQueued = { generation: expectedGeneration, source };
      return tmpData.statusRefreshPromise;
    }

    const run = async () => {
      let request = { generation: expectedGeneration, source };
      let refreshed = false;
      let lastProcessedGeneration = null;

      while (request) {
        tmpData.statusRefreshQueued = null;

        if (isActive(request.generation)) {
          lastProcessedGeneration = request.generation;

          try {
            refreshed = (await refreshRecentBlocks(request.generation)) || refreshed;
          } catch (error) {
            log(
              'warn',
              `Recent-block refresh triggered by ${request.source} failed; next slot refresh remains scheduled: ${error}`,
            );
          }
        }

        request = tmpData.statusRefreshQueued;
      }

      return { lastProcessedGeneration, refreshed };
    };

    const promise = run()
      .then(({ lastProcessedGeneration, refreshed }) => {
        if (lastProcessedGeneration !== null && isActive(lastProcessedGeneration)) {
          scheduleNextStatusRefresh(lastProcessedGeneration);
        }

        return refreshed;
      })
      .finally(() => {
        if (tmpData.statusRefreshPromise === promise) {
          tmpData.statusRefreshPromise = null;
        }
      });

    tmpData.statusRefreshPromise = promise;
    return promise;
  };

  /** Refresh immediately when the shared accumulator receives a socket block. */
  const handleBlockStatisticsUpdate = function (update) {
    const expectedGeneration = generation;

    if (!isActive(expectedGeneration) || update.source?.startsWith('delegate-rest')) {
      return;
    }

    const blockSlot = Math.floor(Number(update.lastBlock?.timestamp ?? 0) / BLOCK_INTERVAL_SECONDS);
    emitPredictedSlot(blockSlot, expectedGeneration);
    requestStatusRefresh(update.source ?? 'block', expectedGeneration);
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
      log(
        'warn',
        `Failed to restore active delegate state from Redis; observation starts will reset: ${error}`,
      );
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

      log(
        'warn',
        `Failed to persist active delegate state to Redis; in-memory state remains active: ${error}`,
      );
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

  /**
   * Load all delegate account totals around one stable completed-round height.
   * Four bounded delegate pages replace one request per delegate.
   * @returns {Promise<{baseline: Object, transactionFees: string}>} Fee baseline and current total
   */
  const refreshForgingBaseline = async function () {
    if (running.getForgingBaseline) {
      throw new Error('getForgingBaseline (already running)');
    }

    running.getForgingBaseline = true;

    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        const before = await blocks.getBlockStatus();
        const [allDelegates, status, recentBlocks] = await Promise.all([
          delegates.getAll(),
          blocks.getBlockStatus(),
          blocks.getBlocksWindow(ACTIVE_DELEGATES),
        ]);

        if (
          forgingStatistics.getCreditedHeight(before.height) !==
            forgingStatistics.getCreditedHeight(status.height) ||
          Number(recentBlocks[0]?.height) !== Number(status.height)
        ) {
          continue;
        }

        const baseline = forgingStatistics.createForgingBaseline(
          allDelegates.delegates,
          status,
          recentBlocks,
        );
        const transactionFees = forgingStatistics.projectTransactionFees(
          baseline,
          recentBlocks,
          status.height,
        );

        return { baseline, transactionFees };
      }

      throw new Error('Could not obtain a stable all-delegate forging baseline');
    } finally {
      running.getForgingBaseline = false;
    }
  };

  /**
   * Load optional lifetime forging totals without blocking live status.
   * Consecutive failures back off with jitter instead of repeating the
   * all-delegate request burst every network slot.
   */
  const initializeForgingTotals = async function (expectedGeneration, attempt = 0) {
    try {
      const result = await refreshForgingBaseline();

      if (!isActive(expectedGeneration)) {
        return;
      }

      tmpData.forgingBaseline = result.baseline;
      data.forgingTotals = {
        success: true,
        transactionFees: result.transactionFees,
      };
      socket.emit('data', { forgingTotals: data.forgingTotals });
    } catch (error) {
      if (!isActive(expectedGeneration) || timers[2] !== undefined) {
        return;
      }

      const delay = getRetryDelay(attempt);
      log('warn', `Initial all-delegate forging totals failed; retrying in ${delay}ms: ${error}`);
      timers[2] = setTimeout(() => {
        timers[2] = undefined;

        if (isActive(expectedGeneration)) {
          initializeForgingTotals(expectedGeneration, attempt + 1);
        }
      }, delay);
    }
  };

  /** Project lifetime fees through the latest cached block. */
  const updateTransactionFees = function (recentBlocks, height) {
    if (!tmpData.forgingBaseline) {
      return;
    }

    data.forgingTotals = {
      success: true,
      transactionFees: forgingStatistics.projectTransactionFees(
        tmpData.forgingBaseline,
        recentBlocks,
        height,
      ),
    };
  };

  /** Refresh account-level totals after Node credits a completed round. */
  const refreshCompletedRoundBaseline = async function (expectedGeneration) {
    try {
      const result = await refreshForgingBaseline();

      if (!isActive(expectedGeneration)) {
        return;
      }

      tmpData.forgingBaseline = result.baseline;
      data.forgingTotals = {
        success: true,
        transactionFees: result.transactionFees,
      };
      socket.emit('data', { forgingTotals: data.forgingTotals });
    } catch (error) {
      if (isActive(expectedGeneration)) {
        log(
          'warn',
          `All-delegate forging totals refresh failed; previous totals remain active: ${error}`,
        );
      }
    }
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

      delegate.forged = delegate.forged ?? existing?.forged ?? 0;
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

  /**
   * Refresh forging state from one schedule, roster, and block snapshot.
   * @param {number} expectedGeneration Active namespace lifecycle generation
   */
  const refreshRecentBlocks = async function (expectedGeneration) {
    const [{ nextForgers, latestBlocks }, activeResults] = await Promise.all([
      getForgingSnapshot(),
      getActiveState(),
    ]);

    if (!isActive(expectedGeneration)) {
      return false;
    }

    await statisticsHandler.ingestBlocks(latestBlocks, 'delegate-rest');

    if (!isActive(expectedGeneration)) {
      return false;
    }

    // A socket block may arrive after the snapshot. Keep this emission on the
    // matched height; the queued socket refresh will immediately advance it.
    const recentBlocks = statisticsHandler
      .getCachedBlocks()
      .filter((block) => block.height <= latestBlocks[0].height);

    if (!recentBlocks.length) {
      return false;
    }

    const fetchedAt = new Date().toISOString();
    const latestBlock = recentBlocks[0];
    const oldestBlock = recentBlocks[recentBlocks.length - 1];
    const oldestRound = getRound(oldestBlock.height);

    tmpData.nextForgers = {
      ...getForgingSchedule(nextForgers),
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
    updateTransactionFees(recentBlocks, latestBlock.height);

    if (
      latestBlock.height % ACTIVE_DELEGATES === 0 &&
      tmpData.forgingBaseline?.creditedHeight < latestBlock.height &&
      !running.getForgingBaseline
    ) {
      refreshCompletedRoundBaseline(expectedGeneration);
    }

    log(
      'debug',
      `Emitted coherent status; height=${latestBlock.height}; activeDelegates=${data.active.delegates.length}; ` +
        `nextForgers=${data.nextForgers.length}; historyBlocks=${recentBlocks.length}`,
    );
    socket.emit('data', data);
    return true;
  };

  /** Resolve a callback-style source without failing its independent peers. */
  const loadSettled = function (loader) {
    return new Promise((resolve) => {
      let settled = false;
      const done = (error, result) => {
        if (settled) {
          return;
        }

        settled = true;
        resolve({ error, result });
      };

      try {
        loader(done);
      } catch (error) {
        done(error);
      }
    });
  };

  /**
   * Refresh page metadata without replacing the atomic forging state.
   * A failed registrations or votes source preserves the other source.
   * @param {number} expectedGeneration Active namespace lifecycle generation
   */
  const refreshMetadata = async function (expectedGeneration) {
    const [registrations, votes] = await Promise.all([
      loadSettled(getRegistrations),
      loadSettled(getVotes),
    ]);

    if (!isActive(expectedGeneration)) {
      return;
    }

    const payload = {};
    const failures = [];

    if (registrations.error) {
      failures.push(`registrations (${registrations.error})`);
    } else {
      data.registrations = registrations.result;
      payload.registrations = data.registrations;
    }

    if (votes.error) {
      failures.push(`votes (${votes.error})`);
    } else {
      data.votes = votes.result;
      payload.votes = data.votes;
    }

    if (Object.keys(payload).length) {
      socket.emit('data', payload);
      log(
        'debug',
        `Emitted metadata; registrations=${data.registrations?.transactions?.length ?? 0}; ` +
          `votes=${data.votes?.transactions?.length ?? 0}`,
      );
    }

    if (failures.length) {
      throw new Error(failures.join(', '));
    }
  };
};
