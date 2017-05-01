import AppFilters from './filters.module';

AppFilters.filter('txRecipient', txTypes => tx => {
    if (tx.type === 0) {
        return ((tx.recipientDelegate && tx.recipientDelegate.username) || tx.recipientUsername || (tx.knownRecipient && tx.knownRecipient.owner) || tx.recipientId);
    } else {
        return (txTypes[parseInt(tx.type)]);
    }
})