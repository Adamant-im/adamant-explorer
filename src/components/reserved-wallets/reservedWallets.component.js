import 'angular'
import AppHome from './reservedWallets.module'
import template from './reservedWallets.html'

const reservedWalletsConstructor = function ($scope, $http, $interval) {
    "use strict";

    this.wallets = [{
            balance: 0,
            name: 'Development and Support',
            address: 'U2065436277795836384',
            description: 'ADAMANT'
        },
        {
            balance: 0,
            name: 'Marketing',
            address: 'U8842529089226485961',
            description: 'ADAMANT'
        },
        {
            balance: 0,
            name: 'Investors',
            address: 'U8842068055848619621',
            description: 'ADAMANT'
        },
        {
            balance: 0,
            name: 'Adoption and Bounty',
            address: 'U15423595369615486571',
            description: 'ADAMANT'
        },
        {
            balance: 0,
            name: 'Donates',
            address: 'U1973842998847463129',
            description: 'ADAMANT'
        },
        {
            balance: 0,
            name: 'Adoption (Hot wallet)',
            address: 'U1835325601873095435',
            description: 'ADAMANT Foundation'
        },
        {
            balance: 0,
            name: 'Adoption',
            address: 'U5875207477212018391',
            description: 'ADAMANT Foundation'
        },
        {
            balance: 0,
            name: 'Marketing',
            address: 'U8181868247557556851',
            description: 'ADAMANT Foundation'
        },
        {
            balance: 0,
            name: 'Development',
            address: 'U9701591031505109687',
            description: 'ADAMANT Foundation'
        },
        {
            balance: 0,
            name: 'Donates',
            address: 'U380651761819723095',
            description: 'ADAMANT Foundation'
        }
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