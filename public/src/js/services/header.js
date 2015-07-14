'use strict';

var Header = function ($scope) {
    this.$scope = $scope;

    this.updateBlocksCount = function (res) {
        if (res.success) {
            this.$scope.totalBlocks = res.count;
        } else {
            this.$scope.totalBlocks = 0;
        }
    }

    this.updateFee = function (res) {
        if (res.success) {
            this.$scope.fee = res.feePercent;
        } else {
            this.$scope.fee = 0.0;
        }
    }

    this.updateXCRCourse = function (res) {
        if (res.success) {
            this.$scope.xcrBtc = res.xcr;
            this.$scope.xcrUsd = res.usd;
        } else {
            this.$scope.xcrBtc = this.$scope.xcrUsd = 0.0;
        }
    }
}

angular.module('cryptichain.system').factory('header',
  function ($socket) {
      return function ($scope) {
          var header = new Header($scope),
              ns = $socket('/header');

          ns.on('data', function (res) {
              if (res.blocks) { header.updateBlocksCount(res.blocks); }
              if (res.fee)    { header.updateFee(res.fee); }
              if (res.course) { header.updateXCRCourse(res.course); }
          });

          $scope.$on('$destroy', function (event) {
              ns.removeAllListeners();
          });

          $scope.$on('$locationChangeStart', function (event, next, current) {
              ns.emit('forceDisconnect');
          });

          return header;
      }
  });
