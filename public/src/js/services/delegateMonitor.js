'use strict';

var DelegateMonitor = function ($scope, epochStampFilter) {
    this.updateActive = function (active) {
        _.each(active.delegates, function (d) {
            d.forgingStatus = forgingStatus(d);
        });
        $scope.activeDelegates = active.delegates;
        updateForgingTotals(active.delegates);
        updateForgingProgress($scope.forgingTotals);
    };

    this.updateTotals = function (active) {
        $scope.totalDelegates = active.totalCount || 0;
        $scope.totalActive    = 101;

        if ($scope.totalDelegates > $scope.totalActive) {
            $scope.totalStandby = ($scope.totalDelegates - $scope.totalActive);
        } else {
            $scope.totalStandby = 0;
        }

        $scope.bestForger  = bestForger(active.delegates);
        $scope.totalForged = totalForged(active.delegates);
        $scope.bestUptime  = bestUptime(active.delegates);
        $scope.worstUptime = worstUptime(active.delegates);
    };

    this.updateLastBlock = function (lastBlock) {
        $scope.lastBlock = lastBlock.block;
    };

    this.updateRegistrations = function (registrations) {
        $scope.registrations = registrations.transactions;
    };

    this.updateVotes = function (votes) {
        $scope.votes = votes.transactions;
    };

    this.updateLastBlocks = function (delegate) {
        var existing = _.find($scope.activeDelegates, function (d) {
            return d.publicKey === delegate.publicKey;
        });
        if (existing) {
            existing.blocksAt = delegate.blocksAt
            existing.blocks = delegate.blocks
            existing.forgingStatus = forgingStatus(delegate);
            updateForgingTotals($scope.activeDelegates);
            updateForgingProgress($scope.forgingTotals);
        }
    };

    // Private

    var bestForger = function (delegates) {
        if (_.size(delegates) > 0) {
            return _.max(delegates, function (d) { return d.fees; });
        }
    };

    var totalForged = function (delegates) {
        return _.chain(delegates)
                .map(function (d) { return d.fees; })
                .reduce(function (memo, num) { return memo + num; }, 0)
                .value();
    };

    var bestUptime = function (delegates) {
        if (_.size(delegates) > 0) {
            return _.max(delegates, function (d) { return parseFloat(d.productivity); });
        }
    };

    var worstUptime = function (delegates) {
        if (_.size(delegates) > 0) {
            return _.min(delegates, function (d) { return parseFloat(d.productivity); });
        }
    };

    var forgingStatus = function (delegate) {
        var status = { updatedAt: delegate.blocksAt };

        if (delegate.blocksAt && _.size(delegate.blocks) > 0) {
            status.lastBlock = _.first(delegate.blocks),
            status.blockAt   = epochStampFilter(status.lastBlock.timestamp);

            var statusAge = moment().diff(delegate.blocksAt, 'minutes'),
                blockAge  = moment().diff(status.blockAt, 'minutes');
        } else {
            status.lastBlock = null;
        }

        if (!status.updatedAt) {
            // Unprocessed
            status.code = 5;
        } else if (!status.blockAt) {
            // Awaiting Status
            status.code = 4;
        } else if (statusAge > 9) {
            // Stale Status
            status.code = 3;
        } else if (blockAge <= 34) {
            // Forging
            status.code = 0;
        } else if (blockAge <= 68) {
            // Missed Cycles
            status.code = 1;
        } else {
            // Not Forging
            status.code = 2;
        }

        status.rating = status.code + (Math.pow(10, 3) + ~~delegate.rate).toString().substring(1);
        return status;
    };

    var updateForgingTotals = function (delegates) {
        $scope.forgingTotals = _.countBy(delegates, function (d) {
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

    var updateForgingProgress = function (totals) {
        var unprocessed  = totals.unprocessed || 0;
            unprocessed += totals.staleStatus || 0;

        if (unprocessed > 0) {
            $scope.forgingTotals.processed = (101 - unprocessed);
        } else {
            $scope.forgingTotals.processed = 101;
        }

        if ($scope.forgingTotals.processed > 0) {
            $scope.forgingProgress = true;
        }
    };
};

angular.module('cryptichain.tools').factory('delegateMonitor',
  function ($socket, epochStampFilter) {
      return function ($scope) {
          var delegateMonitor = new DelegateMonitor($scope, epochStampFilter),
              ns = $socket('/delegateMonitor');

          ns.on('data', function (res) {
              if (res.active) {
                  delegateMonitor.updateActive(res.active);
                  delegateMonitor.updateTotals(res.active);
              }
              if (res.lastBlock) { delegateMonitor.updateLastBlock(res.lastBlock); }
              if (res.registrations) { delegateMonitor.updateRegistrations(res.registrations); }
              if (res.votes) { delegateMonitor.updateVotes(res.votes); }
          });

          ns.on('delegate', function (res) {
              if (res.publicKey) {
                  delegateMonitor.updateLastBlocks(res);
              }
          });

          $scope.$on('$destroy', function (event) {
              ns.removeAllListeners();
          });

          $scope.$on('$locationChangeStart', function (event, next, current) {
              ns.emit('forceDisconnect');
          });

          return delegateMonitor;
      };
  });
