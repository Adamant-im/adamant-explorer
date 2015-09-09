'use strict';

var DelegateMonitor = function ($scope, epochStampFilter) {
    this.$scope = $scope;

    this.updateActive = function (active) {
        _.each(active.delegates, function (d) {
            d.forgingStatus = forgingStatus(d);
        });
        this.$scope.activeDelegates = active.delegates;
    };

    this.updateTotals = function (active) {
        this.$scope.totalDelegates = active.totalCount || 0;
        this.$scope.totalActive    = 101;

        if (this.$scope.totalDelegates > this.$scope.totalActive) {
            this.$scope.totalStandby = (this.$scope.totalDelegates - this.$scope.totalActive);
        } else {
            this.$scope.totalStandby = 0;
        }

        this.$scope.bestForger  = bestForger(active.delegates);
        this.$scope.totalForged = totalForged(active.delegates);
        this.$scope.bestUptime  = bestUptime(active.delegates);
        this.$scope.worstUptime = worstUptime(active.delegates);
    };

    this.updateLastBlock = function (lastBlock) {
        this.$scope.lastBlock = lastBlock.block;
    };

    this.updateRegistrations = function (registrations) {
        this.$scope.registrations = registrations.transactions;
    };

    this.updateVotes = function (votes) {
        this.$scope.votes = votes.transactions;
    };

    this.updateLastBlocks = function (delegate) {
        var existing = _.find(this.$scope.activeDelegates, function (d) {
            return d.publicKey === delegate.publicKey;
        });
        if (existing) {
            existing.blocksAt = delegate.blocksAt
            existing.blocks = delegate.blocks
            existing.forgingStatus = forgingStatus(delegate);
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
        var status = {};

        if (delegate.blocksAt && _.size(delegate.blocks) > 0) {
            status.blocksAt  = delegate.blocksAt;
            status.timestamp = _.first(delegate.blocks).timestamp;
            status.statusAge = moment().diff(delegate.blocksAt, 'minutes');
            status.blockAge  = moment().diff(epochStampFilter(status.timestamp), 'minutes');
        }

        if (!status.blocksAt) {
            // No Status
            status.code = 4;
        } else if (status.statusAge > 10) {
            // Stale Status
            status.code = 3;
        } else if (status.blockAge <= 30) {
            // Forging
            status.code = 0;
        } else if (status.blockAge <= 60) {
            // Missed Cycles
            status.code = 1;
        } else {
            // Not Forging
            status.code = 2;
        }

        status.rating = status.code + (Math.pow(10, 3) + ~~delegate.rate).toString().substring(1);
        return status;
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
