import { expect } from 'chai';
import state from '../../sockets/delegateMonitorState.js';

const { getDelegateObservationState, parseActiveDelegateState, serializeActiveDelegateState } =
  state;

describe('Delegate Monitor state', function () {
  it('preserves calculated history across active-list refreshes', function () {
    const observation = getDelegateObservationState(
      {
        activeSinceRound: null,
        scheduledSinceRound: null,
        isScheduled: true,
        historyRoundCount: 7,
      },
      null,
      true,
      100,
    );

    expect(observation.historyRoundCount).to.equal(7);
    expect(observation.isScheduled).to.equal(true);
  });

  it('starts a new delegate observation at the current round', function () {
    const observation = getDelegateObservationState(null, null, true, 100);

    expect(observation.activeSinceRound).to.equal(100);
  });

  it('restores a new delegate observation boundary after restart', function () {
    const json = serializeActiveDelegateState([
      {
        publicKey: 'new-delegate',
        activeSinceRound: 100,
        scheduledSinceRound: 101,
        isScheduled: true,
      },
    ]);
    const restored = parseActiveDelegateState(json);
    const observation = getDelegateObservationState(null, restored.get('new-delegate'), true, 102);

    expect(observation.activeSinceRound).to.equal(100);
    expect(observation.scheduledSinceRound).to.equal(101);
  });

  it('treats the first uncached roster as an established baseline', function () {
    const observation = getDelegateObservationState(null, null, false, 100);

    expect(observation.activeSinceRound).to.equal(null);
  });
});
