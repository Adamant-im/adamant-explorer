'use strict';

var DelegateMonitor = function ($scope) {
    this.$scope = $scope;

    this.updateActive = function (active) {
        this.$scope.activeDelegates = active.delegates;
    }

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
    }

    this.updateLastBlock = function (lastBlock) {
        this.$scope.lastBlock = lastBlock.block;
    }

    this.updateRegistrations = function (registrations) {
        this.$scope.registrations = registrations.transactions;
    }

    this.updateVotes = function (votes) {
        this.$scope.votes = votes.transactions;
    }

    // Private

    var bestForger = function (delegates) {
        if (_.size(delegates) > 0) {
            return _.max(delegates, function (d) { return d.fees; });
        }
    }

    var totalForged = function (delegates) {
        return _.chain(delegates)
                .map(function (d) { return d.fees; })
                .reduce(function (memo, num) { return memo + num; }, 0)
                .value();
    }

    var bestUptime = function (delegates) {
        if (_.size(delegates) > 0) {
            return _.max(delegates, function (d) { return parseFloat(d.productivity); });
        }
    }

    var worstUptime = function (delegates) {
        if (_.size(delegates) > 0) {
            return _.min(delegates, function (d) { return parseFloat(d.productivity); });
        }
    }
}

angular.module('cryptichain.tools').factory('delegateMonitor',
  function ($socket) {
      return function ($scope) {
          var delegateMonitor = new DelegateMonitor($scope),
              ns = $socket('/delegateMonitor');

          ns.on('data', function (res) {
              delegateMonitor.updateActive(res.active);
              delegateMonitor.updateTotals(res.active);
              delegateMonitor.updateLastBlock(res.lastBlock);
              delegateMonitor.updateRegistrations(res.registrations);
              delegateMonitor.updateVotes(res.votes);
          });

          $scope.$on('$destroy', function (event) {
              ns.removeAllListeners();
          });

          $scope.$on('$locationChangeStart', function (event, next, current) {
              ns.emit('forceDisconnect');
          });

          return delegateMonitor;
      }
  });
