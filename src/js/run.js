
angular.module('lisk_explorer')
.run((
    $rootScope,
    $state,
    $location,
    $stateParams,
    $anchorScroll,
    $http,
    ngProgress,
    gettextCatalog
) => {
      gettextCatalog.currentLanguage = 'en';
      $rootScope.$on('$stateChangeStart', () => {
          ngProgress.start();
      });

      $rootScope.$on('$stateChangeSuccess', () => {
          ngProgress.complete();

          // Change page title, based on route information
          $rootScope.titleDetail = '';
          $rootScope.title = $state.current.title;
          $rootScope.isCollapsed = true;

          // Market Watcher
          $http.get('/api/exchanges').then (result => {
              if (result.data.success && result.data.enabled) {
                $rootScope.marketWatcher = true;
              }
          });

          $location.hash($stateParams.scrollTo);
          $anchorScroll();
      });
  });
