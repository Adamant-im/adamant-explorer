'use strict';

const ForgingMonitor = function (forgingStatus) {
    this.getStatus = delegate => forgingStatus(delegate);

    this.getforgingTotals = delegates => {
        const cnt1 = _.countBy(delegates, d => {
            switch (d.forgingStatus.code) {
                case 0:
                case 3:
                    return 'forging';
                case 1:
                case 4:
                    return 'missedBlock';
                case 2:
                    return 'notForging';
                case 3:
                case 4:
                    return 'awaitingSlot';
                default:
                    return 'unprocessed';
            }
        });
        const cnt2 = _.countBy(delegates, d => {
            switch (d.forgingStatus.code) {
                case 3:
                case 4:
                    return 'awaitingSlot';
                default:
                    return 'unprocessed';
            }
        });

        cnt1.awaitingSlot = cnt2.awaitingSlot;
        return cnt1;
    };

    this.getForgingProgress = totals => {
        let unprocessed  = totals.unprocessed || 0;
            unprocessed += totals.staleStatus || 0;

        if (unprocessed > 0) {
            return (101 - unprocessed);
        } else {
            return 101;
        }
    };
};

angular.module('lisk_explorer.tools').service('forgingMonitor',
  forgingStatus => new ForgingMonitor(forgingStatus));
