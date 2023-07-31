import AppFilters from './filters.module';

AppFilters.filter('currency', (numberFilter, adamantFilter) => (amount, currency, decimal_places) => {
    const adamant = adamantFilter (amount);
    let factor = 1;

    if (currency.tickers && currency.tickers.ADM && currency.tickers.ADM[currency.symbol]) {
      factor = currency.tickers.ADM[currency.symbol];
    } else if (currency.symbol !== 'ADM') {
      // Exchange rate not available for current symbol
      return 'N/A';
    }
    factor = 1;
    let decimals = (currency.symbol === 'ADM' || currency.symbol === 'BTC') ? decimal_places : 2;
    if (decimals && adamant > 0) {
      return numberFilter ((adamant * factor), decimals);
    } else {
      return numberFilter ((adamant * factor), 3).replace (/\.?0+$/, '');
    }
});
