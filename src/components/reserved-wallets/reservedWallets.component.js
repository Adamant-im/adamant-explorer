import 'angular'
import AppHome from './reservedWallets.module'
import template from './reservedWallets.html'

const reservedWalletsConstructor = function ($scope, $http, $interval) {
    "use strict";

    this.wallets = [{
            balance: 0,
            name: 'Development and Support',
            address: 'U2065436277795836384'
        },
        {
            balance: 0,
            name: 'Marketing',
            address: 'U8842529089226485961'
        },
        {
            balance: 0,
            name: 'Investors',
            address: 'U8842068055848619621'
        },
        {
            balance: 0,
            name: 'Adoption and Bounty ',
            address: 'U15423595369615486571'
        },
    ];

    this.wallets.forEach(w => {
        $http.get('/api/getAccount', {
            params: {
                address: w.address
            }
        }).then(resp => {
            if (resp.data.success) {
                w.balance = +resp.data.balance;
            }
        });
    });
};

AppHome.component('reservedWallets', {
    template: template,
    controller: reservedWalletsConstructor,
    controllerAs: 'vm'
})