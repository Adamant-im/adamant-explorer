'use strict';

const Header = function ($rootScope) {
    $rootScope.currency = {
      symbol: 'LSK'
    };

    this.updateBlockStatus = res => {
        if (res.success) {
            $rootScope.blockStatus = {
                height:    res.height,
                fee:       res.fee,
                milestone: res.milestone,
                reward:    res.reward,
                supply:    res.supply,
                nethash:   res.nethash
            };
        }
    };

    this.updatePriceTicker = res => {
        if (res.success) {
            $rootScope.currency.tickers = res.tickers;
        }

        // When ticker for user-stored currency is not available - switch to LSK temporarly
        if ($rootScope.currency.symbol !== 'LSK' && (!$rootScope.currency.tickers || !$rootScope.currency.tickers.LSK || !$rootScope.currency.tickers.LSK[$rootScope.currency.symbol])) {
            console.log (`Currency ${$rootScope.currency.symbol} not available, fallback to LSK`);
            $rootScope.currency.symbol = 'LSK';
        }
    };

    this.updateDelegateProposals = res => {
        if (res.success) {
            $rootScope.delegateProposals = res.proposals;
        } else {
            $rootScope.delegateProposals = [];
        }
    };
};

angular.module('lisk_explorer.system').factory('header',
  ($rootScope, $socket) => () => {
      const header = new Header($rootScope), ns = $socket('/header');

      ns.on('data', res => {
          if (res.status) { header.updateBlockStatus(res.status); }
          if (res.ticker) { header.updatePriceTicker(res.ticker); }
      });

      ns.on('delegateProposals', res => {
          if (res) { header.updateDelegateProposals(res); }
      });


      $rootScope.$on('$destroy', event => {
          ns.removeAllListeners();
      });

      return header;
  });
