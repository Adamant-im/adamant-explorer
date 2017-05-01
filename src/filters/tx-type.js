import AppFilters from './filters.module';

AppFilters.filter('txType', txTypes => tx => txTypes[parseInt(tx.type)]);