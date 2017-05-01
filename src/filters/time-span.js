import AppFilters from './filters.module';

AppFilters.filter('timeSpan', epochStampFilter => (a, b) => moment.duration(epochStampFilter(a) - epochStampFilter(b)).humanize());