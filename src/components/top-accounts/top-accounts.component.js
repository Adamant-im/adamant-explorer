import 'angular';
import AppTopAccounts from './top-accounts.module';
import template from './top-accounts.html';

const TopAccountsConstructor = function (lessMore) {
    const vm = this;
    const SAT = 100000000;
    this.topAccounts = lessMore({
        url: '/api/getTopAccounts',
        key: 'accounts'
    });

    this.topAccounts.$http.get('api/totalSupply').then(resp => {
        if (resp.status == 200) vm.totalSupply = resp.data * SAT;
    })

};

AppTopAccounts.component('topAccounts', {
    template: template,
    controller: TopAccountsConstructor,
    controllerAs: 'vm'
});