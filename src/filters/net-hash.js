/**
 * @todo check the possibility of removing hard coded hashes
 */
angular.module('lisk_explorer')
.filter('nethash', () => nethash => {
    if (nethash === 'da3ed6a45429278bac2666961289ca17ad86595d33b31037615d4b8e8f158bba') {
        return 'Testnet';
    } else if (nethash === 'ed14889723f24ecc54871d058d98ce91ff2f973192075c0155ba2b7b70ad2511')  {
        return 'Mainnet';
    } else {
        return 'Local';
    }
});