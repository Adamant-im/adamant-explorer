import AppFilters from './filters.module';
import moment from 'moment';

AppFilters.filter('timeAgo', epochStampFilter => timestamp => moment(epochStampFilter(timestamp)).fromNow());