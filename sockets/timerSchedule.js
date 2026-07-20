/**
 * Schedule one owned timeout in an indexed socket lifecycle slot.
 *
 * The callback captures both the slot array and timer identity. A timeout that
 * was already queued before disconnect therefore cannot clear a newer
 * lifecycle slot after the module replaces its timer array. The module-level
 * generation guard remains responsible for suppressing its stale work.
 *
 * @param {Array<*>} timers Lifecycle-local timer slots
 * @param {number} index Slot index
 * @param {Function} callback Work to run while the timer still owns the slot
 * @param {number} delay Delay in milliseconds
 * @returns {*} Timer handle, or the existing handle when the slot is occupied
 */
function scheduleTimerSlot(timers, index, callback, delay) {
  if (timers[index] !== undefined) {
    return timers[index];
  }

  const timer = setTimeout(() => {
    if (timers[index] !== timer) {
      return;
    }

    timers[index] = undefined;
    callback();
  }, delay);

  timers[index] = timer;
  return timer;
}

module.exports = {
  scheduleTimerSlot,
};
