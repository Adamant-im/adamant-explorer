angular.module('lisk_explorer.search').directive('search', ($stateParams, $location, $timeout, Global, $http) => {
    const SearchCtrl = function () {
        const sch = this;
        this.loading = false;
        this.badQuery = false;

        const _badQuery = () => {
            this.badQuery = true;

            $timeout(() => {
                this.badQuery = false;
            }, 2000);
        };

        const _resetSearch = () => {
            this.q = '';
            this.loading = false;
        };

        this.search = () => {
            this.badQuery = false;
            this.loading = true;

            $http.get('/api/search', {
                params : {
                    id : this.q
                }
            }).then(resp => {
                if (resp.data.success === false) {
                    sch.loading = false;
                    _badQuery();
                } else if (resp.data.id) {
                    this.loading = false;
                    _resetSearch();

                    $location.path(`/${resp.data.type}/${resp.data.id}`);
                }
            });
        };
    };

    const SearchLink = function () {}

    return {
        restrict: 'E',
        link: SearchLink,
        controller: SearchCtrl,
        controllerAs: 'sch',
        templateUrl : '/shared/search/search.html'
    }
});
