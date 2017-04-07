'use strict';

const SearchLink = function ($stateParams, $location, $timeout, Global, $http) {
    const sch = this;
    sch.loading = false;
    sch.badQuery = false;

    const _badQuery = () => {
        sch.badQuery = true;

        $timeout(() => {
            sch.badQuery = false;
        }, 2000);
    };

    const _resetSearch = () => {
        sch.q = '';
        sch.loading = false;
    };

    sch.search = () => {
        sch.badQuery = false;
        sch.loading = true;

        $http.get('/api/search', {
            params : {
                id : sch.q
            }
        }).then(resp => {
            if (resp.data.success === false) {
                sch.loading = false;
                _badQuery();
            } else if (resp.data.id) {
                sch.loading = false;
                _resetSearch();

                $location.path(`/${resp.data.type}/${resp.data.id}`);
            }
        });
    };
};

angular.module('lisk_explorer.search').directive('Search', () => {
    return {
        restrict: 'E',
        link: SearchLink,
        templateUrl : '/shared/search/search.html'
    }
});
