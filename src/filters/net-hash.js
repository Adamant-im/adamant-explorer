import AppFilters from './filters.module';

/**
 * @todo check the possibility of removing hard coded hashes
 */
AppFilters.filter('nethash', () => nethash => {
    if (nethash === '38f153a81332dea86751451fd992df26a9249f0834f72f58f84ac31cceb70f43') {
        return 'Testnet';
    } else if (nethash === '77265cf40a806763bc1e3ff0d899a1c0582b46e84ce8808b445dd9b95aa86da5')  {
        return 'Mainnet';
    } else {
        return 'Local';
    }
});