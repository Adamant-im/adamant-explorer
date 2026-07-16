/** Build a stable identity for a block received from the network store. */
function getBlockKey(block) {
  const height = Number(block?.height);

  if (!Number.isSafeInteger(height) || height < 1) {
    return null;
  }

  return `${height}:${block.id ?? ''}`;
}

/**
 * Create a serialized refresh trigger keyed by block identity.
 *
 * The first observed block triggers a refresh only when no block was known
 * during the page's initial request. Repeated blocks are ignored, including
 * REST fallback updates, and events received during a slow request collapse
 * into one follow-up refresh.
 *
 * @param {() => Promise<unknown>} refresh Page data loader
 * @param {{id?: string, height: number}|null} [initialBlock=null] Initial block
 * @returns {(block: {id?: string, height: number}|null) => Promise<boolean>} Block observer
 */
export function createBlockRefreshTrigger(refresh, initialBlock = null) {
  let observedBlockKey = getBlockKey(initialBlock);
  let running = false;
  let queued = false;
  let refreshPromise = Promise.resolve(false);

  return function refreshForBlock(block) {
    const nextBlockKey = getBlockKey(block);

    if (nextBlockKey === null || nextBlockKey === observedBlockKey) {
      return Promise.resolve(false);
    }

    observedBlockKey = nextBlockKey;

    if (running) {
      queued = true;
      return refreshPromise;
    }

    refreshPromise = (async () => {
      running = true;

      try {
        do {
          queued = false;
          await refresh();
        } while (queued);

        return true;
      } finally {
        running = false;
      }
    })();

    return refreshPromise;
  };
}
