import AppHeader from './header.module';

const HeaderConstructor = function ($rootScope) {
  this.updateBlockStatus = (res) => {
    if (res.success) {
      $rootScope.blockStatus = {
        height: res.height,
        fee: res.fee,
        milestone: res.milestone,
        reward: res.reward,
        supply: res.supply,
        nethash: res.nethash,
      };
    }
  };

  this.updatePriceTicker = (res) => {
    if (res.success) {
      $rootScope.currency.tickers = res.tickers;
    }

    // When no rate is known for the selected currency, fall back to ADM
    if (
      $rootScope.currency.symbol !== 'ADM' &&
      (!$rootScope.currency.tickers ||
        !$rootScope.currency.tickers.ADM ||
        !$rootScope.currency.tickers.ADM[$rootScope.currency.symbol])
    ) {
      $rootScope.currency.symbol = 'ADM';
    }
  };

  return this;
};

AppHeader.factory('Header', ($rootScope, $socket) => HeaderConstructor);
