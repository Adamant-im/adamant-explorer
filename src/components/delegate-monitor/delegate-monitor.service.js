import AppDelegateMonitor from './delegate-monitor.module';

const DelegateMonitor = function ($scope, $rootScope, forgingMonitor) {
    this.updateActive = active => {
        active.delegates.forEach(d => {
            d.forgingStatus = forgingMonitor.getStatus(d);
            d.proposal = $rootScope.delegateProposals[d.username.toLowerCase()];
        });
        $scope.activeDelegates = active.delegates;

        updateForgingTotals(active.delegates);
        updateForgingProgress($scope.forgingTotals);
    };

    this.updateTotals = active => {
        $scope.totalDelegates = active.totalCount || 0;
        $scope.totalActive    = 101;

        if ($scope.totalDelegates > $scope.totalActive) {
            $scope.totalStandby = ($scope.totalDelegates - $scope.totalActive);
        } else {
            $scope.totalStandby = 0;
        }

        $scope.bestForger  = bestForger(active.delegates);
        $scope.totalForged = totalForged(active.delegates);
        $scope.bestProductivity  = bestProductivity(active.delegates);
        $scope.worstProductivity = worstProductivity(active.delegates);
    };

    this.updateLastBlock = lastBlock => {
        $scope.lastBlock = lastBlock.block;
    };

    this.updateRegistrations = registrations => {
        $scope.registrations = registrations.transactions;
    };

    this.updateNextForgers = nextForgers => {
        $scope.nextForgers = nextForgers;
    };

    this.updateVotes = votes => {
        $scope.votes = votes.transactions;
    };

    this.updateApproval = approval => {
        $scope.approval = approval;
    };

    this.updateLastBlocks = delegate => {
        $scope.activeDelegates.forEach(d => {
            d.forgingStatus = forgingMonitor.getStatus(d);
        });

        // const existing = _.find($scope.activeDelegates, d => d.publicKey === delegate.publicKey);
        let found = false;
        const existing = $scope.activeDelegates.filter((d) => {
            if (!found && (d.publicKey === delegate.publicKey)) {
                found = true;
                return true;
            }
            return false
        })[0];
        if (existing) {
            existing.blocksAt = delegate.blocksAt;
            existing.blocks = delegate.blocks;
            existing.forgingStatus = forgingMonitor.getStatus(delegate);
        }
        updateForgingTotals($scope.activeDelegates);
        updateForgingProgress($scope.forgingTotals);
    };

    // Private

    var bestForger = delegates => {
        // if (_.size(delegates) > 0) {
        if (delegates.length > 0) {
            // return _.max(delegates, d => parseInt(d.forged));
            return Math.max(...delegates.map(delegate => delegate.forged));
        }
    };

    // var totalForged = delegates => _.chain(delegates)
    var totalForged = delegates => delegates
            .map(d => parseInt(d.forged))
            .reduce((memo, num) => parseInt(memo) + parseInt(num), 0);
            // .value();

    var bestProductivity = delegates => {
        // if (_.size(delegates) > 0) {
        if (delegates.length > 0) {
            // return _.max(delegates, d => parseFloat(d.productivity));
            return Math.max(...delegates.map(delegate => delegate.productivity));
        }
    };

    var worstProductivity = delegates => {
        if (delegates.length > 0) {
            // return _.min(delegates, d => parseFloat(d.productivity));
            return Math.min(...delegates.map(delegate => delegate.productivity));
        }
    };

    var updateForgingTotals = delegates => {
        $scope.forgingTotals = forgingMonitor.getforgingTotals(delegates);
    };

    var updateForgingProgress = totals => {
        totals.processed = forgingMonitor.getForgingProgress(totals);

        if (totals.processed > 0) {
            $scope.forgingProgress = true;
        }
    };
};

AppDelegateMonitor.factory('delegateMonitor',
  ($socket, $rootScope, forgingMonitor) => vm => {
      const delegateMonitor = new DelegateMonitor(vm, $rootScope, forgingMonitor), ns = $socket('/delegateMonitor');

      ns.on('data', res => {
          if (res.active) {
              delegateMonitor.updateActive(res.active);
              delegateMonitor.updateTotals(res.active);
          }
          if (res.lastBlock) { delegateMonitor.updateLastBlock(res.lastBlock); }
          if (res.registrations) { delegateMonitor.updateRegistrations(res.registrations); }
          if (res.nextForgers) { delegateMonitor.updateNextForgers(res.nextForgers); }
          if (res.votes) { delegateMonitor.updateVotes(res.votes); }
          if (res.approval) { delegateMonitor.updateApproval(res.approval); }
      });

      ns.on('delegate', res => {
          if (res.publicKey) {
              delegateMonitor.updateLastBlocks(res);
          }
      });

      $rootScope.$on('$destroy', event => {
          ns.removeAllListeners();
      });

      $rootScope.$on('$stateChangeStart', (event, next, current) => {
          ns.emit('forceDisconnect');
      });

      return delegateMonitor;
  }
);
