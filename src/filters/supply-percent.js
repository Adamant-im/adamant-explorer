angular.module('lisk_explorer')
.filter('supplyPercent', () => (amount, supply) => {
  const supply_check = (supply > 0);
    if (isNaN(amount) || !supply_check) {
      return (0).toFixed(2);
    }
    return (amount / supply * 100).toFixed(2);
});