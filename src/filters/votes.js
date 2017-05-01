import AppFilters from './filters.module';

AppFilters.filter('votes', () => a => a.username || (a.knowledge && a.knowledge.owner) || a.address)