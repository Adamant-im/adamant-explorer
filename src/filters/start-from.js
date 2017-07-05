import AppFilters from './filters.module';

AppFilters.filter('startFrom', () => (input, start) => {
    start = +start;
    return input.slice(start);
})