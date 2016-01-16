'use strict';

var ForgingMonitor = function (forgingStatus) {
    this.getStatus = function (delegate) {
        return forgingStatus(delegate);
    };

    this.getforgingTotals = function (delegates) {
        return _.countBy(delegates, function (d) {
            switch (d.forgingStatus.code) {
                case 0:
                    return 'forging';
                case 1:
                    return 'missedCycles';
                case 2:
                    return 'notForging';
                case 3:
                    return 'staleStatus';
                case 4:
                    return 'awaitingStatus';
                default:
                    return 'unprocessed';
            }
        });
    };

    this.getForgingProgress = function (totals) {
        var unprocessed  = totals.unprocessed || 0;
            unprocessed += totals.staleStatus || 0;

        if (unprocessed > 0) {
            return (101 - unprocessed);
        } else {
            return 101;
        }
    };
};

angular.module('lisk_explorer.tools').service('forgingMonitor',
  function (forgingStatus) {
      return new ForgingMonitor(forgingStatus);
  });
