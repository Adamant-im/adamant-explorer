angular.module('lisk_explorer')
.filter('currency', (numberFilter, liskFilter) => (amount, currency, decimal_places) => {
    const lisk = liskFilter (amount);
    let factor = 1;

    if (currency.tickers && currency.tickers.LSK && currency.tickers.LSK[currency.symbol]) {
      factor = currency.tickers.LSK[currency.symbol];
    } else if (currency.symbol !== 'LSK') {
      // Exchange rate not available for current symbol
      return 'N/A';
    }

    if (decimal_places === undefined) {
      switch (currency.symbol) {
        case 'LSK':
        case 'BTC':
          return numberFilter ((lisk * factor), 8).replace (/\.?0+$/, '');
        default:
          return numberFilter ((lisk * factor), 2).replace (/\.?0+$/, '');
      }
    } else {
      return numberFilter ((lisk * factor), decimal_places);
    }
});