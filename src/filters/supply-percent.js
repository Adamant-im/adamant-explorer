import AppFilters from './filters.module';

AppFilters.filter('supplyPercent', () => (amount, supply) => {
  const supply_check = (supply > 0);
    if (isNaN(amount) || !supply_check) {
      return (0).toFixed(2);
    }
    return (amount / supply * 100).toFixed(2);
});