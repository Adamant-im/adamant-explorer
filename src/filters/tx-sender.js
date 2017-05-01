import AppFilters from './filters.module';

AppFilters.filter('txSender', () => tx => (tx.senderDelegate && tx.senderDelegate.username) || tx.senderUsername || (tx.knownSender && tx.knownSender.owner) || tx.senderId);