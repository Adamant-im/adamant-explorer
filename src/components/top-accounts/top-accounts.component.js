import 'angular';
import AppTopAccounts from './top-accounts.module';
import template from './top-accounts.html';

const TopAccountsConstructor = function (lessMore) {
    this.topAccounts = lessMore({
        url : '/api/getTopAccounts',
        key : 'accounts'
    });
};

AppTopAccounts.component('topAccounts', {
    template: template,
    controller: TopAccountsConstructor,
    controllerAs: 'vm'
});
