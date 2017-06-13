import AppFilters from './filters.module';

AppFilters.filter('currency', (numberFilter, liskFilter) => (amount, currency, decimal_places) => {
    const lisk = liskFilter (amount);
    let factor = 1;

    if (currency.tickers && currency.tickers.LSK && currency.tickers.LSK[currency.symbol]) {
      factor = currency.tickers.LSK[currency.symbol];
    } else if (currency.symbol !== 'LSK') {
      // Exchange rate not available for current symbol
      return 'N/A';
    }

    let decimals = (currency.symbol === 'LSK' || currency.symbol === 'BTC') ? decimal_places : 2;
    if (decimals && lisk > 0) {
      return numberFilter ((lisk * factor), decimals);
    } else {
      return numberFilter ((lisk * factor), 8).replace (/\.?0+$/, '');
    }
});
