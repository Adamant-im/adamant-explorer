import AppFilters from './filters.module';
import moment from 'moment';

AppFilters.filter('timeSpan', epochStampFilter => (a, b) => moment.duration(epochStampFilter(a) - epochStampFilter(b)).humanize());