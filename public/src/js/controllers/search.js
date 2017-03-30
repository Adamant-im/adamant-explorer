'use strict';

var SearchCtrlConstructor = function ($stateParams, $location, $timeout, Global, $http) {
    var sch = this;

    sch.loading = false;
    sch.badQuery = false;

    var _badQuery = function () {
        sch.badQuery = true;

        $timeout(function () {
            sch.badQuery = false;
        }, 2000);
    };

    var _resetSearch = function () {
        sch.q = '';
        sch.loading = false;
    };

    sch.search = function () {
        sch.badQuery = false;
        sch.loading = true;

        $http.get('/api/search', {
            params : {
                id : sch.q
            }
        }).then(function (resp) {
            if (resp.data.success === false) {
                sch.loading = false;
                _badQuery();
            } else if (resp.data.id) {
                sch.loading = false;
                _resetSearch();

                $location.path('/' + resp.data.type + '/' + resp.data.id);
            }
        });
    };
}

angular.module('lisk_explorer.search').controller('SearchCtrl', SearchCtrlConstructor);
