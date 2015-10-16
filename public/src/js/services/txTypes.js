'use strict';

angular.module('cryptichain.system').value('txTypes', {
    0 : 'Normal transaction',
    1 : 'Second signature creation',
    2 : 'Delegate registration',
    3 : 'Delegate vote',
    4 : 'Username registration',
    5 : 'New contact'
});
