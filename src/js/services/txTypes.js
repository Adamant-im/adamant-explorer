'use strict';

angular.module('lisk_explorer.system').value('txTypes', {
    0 : 'Normal transaction',
    1 : 'Second signature creation',
    2 : 'Delegate registration',
    3 : 'Delegate vote',
    4 : 'Multi-signature creation',
    5 : 'Dapp registration',
    7 : 'Dapp deposit',
    8 : 'Dapp withdrawal'
});
