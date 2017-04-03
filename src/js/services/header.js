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

    // @todo shouldn't this be in run inetad of header?
    this.updateDelegateProposals = res => {
        $rootScope.delegateProposals = {};
        if (res.success) {
            
            for (let proposal of res.proposals) {
                $rootScope.delegateProposals[proposal.name.toLowerCase()] = proposal;
            }
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
