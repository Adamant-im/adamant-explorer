'use strict';

const TopAccountsCtrlConstructor = function (lessMore) {
    this.topAccounts = lessMore({
        url : '/api/getTopAccounts',
        key : 'accounts'
    });
};

angular.module('lisk_explorer.address').controller('TopAccountsCtrl', TopAccountsCtrlConstructor);
