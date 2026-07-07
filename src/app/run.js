import 'angular';
import App from './app';

App.run(
  ($rootScope, $state, $location, $stateParams, $anchorScroll, gettextCatalog, $transitions) => {
    gettextCatalog.currentLanguage = 'en';
    $transitions.onSuccess({ to: '*' }, () => {
      $rootScope.titleDetail = '';
      $rootScope.title = $state.current.title;
      $rootScope.isCollapsed = true;

      $location.hash($stateParams.scrollTo);
      $anchorScroll();
    });
  },
);
