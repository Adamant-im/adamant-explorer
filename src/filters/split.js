import AppFilters from './filters.module';

AppFilters.filter('split', () => (input, delimiter) => {
    delimiter = delimiter || ',';
    return input.split(delimiter);
});