'use strict';

var Header = function ($scope) {
    this.updateBlocksCount = function (res) {
        if (res.success) {
            $scope.totalBlocks = res.count;
        } else {
            $scope.totalBlocks = 0;
        }
    };

    this.updateFee = function (res) {
        if (res.success) {
            $scope.fee = res.feePercent;
        } else {
            $scope.fee = 0.0;
        }
    };

    this.updateLISKCourse = function (res) {
        if (res.success) {
            $scope.liskBtc = res.lisk;
            $scope.liskUsd = res.usd;
        } else {
            $scope.liskBtc = $scope.liskUsd = 0.0;
        }
    };
};

angular.module('lisk_explorer.system').factory('header',
  function ($socket) {
      return function ($scope) {
          var header = new Header($scope),
              ns = $socket('/header');

          ns.on('data', function (res) {
              if (res.blocks) { header.updateBlocksCount(res.blocks); }
              if (res.fee)    { header.updateFee(res.fee); }
              if (res.course) { header.updateLISKCourse(res.course); }
          });

          $scope.$on('$destroy', function (event) {
              ns.removeAllListeners();
          });

          return header;
      };
  });
