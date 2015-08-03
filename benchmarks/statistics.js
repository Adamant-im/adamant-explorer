'use strict';

module.exports = function (app, api) {
    var statistics = new api.statistics(app);

    this.getBlocks = function (deferred) {
        statistics.getBlocks(
              function (data) {
                  deferred.resolve();
                  console.log('statistics.getBlocks ~>', 'Error retrieving blocks:', data.error);
              },
              function (data) {
                  deferred.resolve();
                  console.log('statistics.getBlocks ~>', String(data.volume.blocks), 'blocks retrieved in', String(deferred.elapsed), 'seconds');
              }
        );
    };

    this.getLastBlock = function (deferred) {
        statistics.getLastBlock(
              function (data) {
                  deferred.resolve();
                  console.log('statistics.getLastBlock ~>', 'Error retrieving block:', data.error);
              },
              function (data) {
                  deferred.resolve();
                  console.log('statistics.getLastBlock ~>', 'block retrieved in', String(deferred.elapsed), 'seconds');
              }
        );
    };

    this.getPeers = function (deferred) {
        statistics.locator.disabled = true;
        statistics.getPeers(
              function (data) {
                  deferred.resolve();
                  console.log('statistics.getPeers ~>', 'Error retrieving peers:', data.error);
              },
              function (data) {
                  deferred.resolve();
                  console.log('statistics.getPeers ~>', (data.list.connected.length + data.list.disconnected.length), 'peers retrieved in', String(deferred.elapsed), 'seconds');
              }
        );
    };
};

