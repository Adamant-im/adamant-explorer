import AppServices from './services.module';

AppServices.value('txTypes', {
    0 : 'Normal transaction',
    1 : 'Second signature creation',
    2 : 'Delegate registration',
    3 : 'Delegate vote',
    4 : 'Multi-signature creation',
    5 : 'Dapp registration',
    6 : 'Dapp deposit',
    7 : 'Dapp withdrawal',
    8 : 'Chat message'
});
