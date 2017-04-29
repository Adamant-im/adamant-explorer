import 'angular';
import AppTopAccounts from './index';

const TopAccountsCtrlConstructor = function (lessMore) {
    this.topAccounts = lessMore({
        url : '/api/getTopAccounts',
        key : 'accounts'
    });
};

AppTopAccounts.controller('TopAccountsCtrl', TopAccountsCtrlConstructor);
