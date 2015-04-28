'use strict';

angular.module('cryptichain.address').controller('TopAccounts',
  function ($scope, lessMore) {
      $scope.topAccounts = lessMore({
          url : "/api/getTopAccounts",
          key : "accounts"
      });
  });
