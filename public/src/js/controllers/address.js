'use strict';

angular.module('cryptichain.address').controller('AddressController',
  function ($scope, $rootScope, $routeParams, $location, $http) {
      $scope.getAddress = function () {
          $http.get("/api/getAccount", {
              params : {
                  address : $routeParams.address
              }
          }).then(function (resp) {
              if (resp.data.success) {
                  $scope.address = resp.data;
              }
          });
      }

      $scope.loadTxs = function () {
          Pager.disable();
          $scope.loading = true;
          Pager.getTxs(0, (Pager.limit + 1),
              function (resp) { Pager.loadTxs(resp) });
      }

      $scope.loadMore = function () {
          Pager.disable();
          $scope.loading = true;
          Pager.getTxs(0, 1, function (resp) {
              var changed = false;

              if ($scope.txs[0] && resp.data.transactions[0]) {
                  changed = ($scope.txs[0].id != resp.data.transactions[0].id);
              }

              Pager.nextOffset();

              if (changed) {
                  Pager.getTxs(0, (Pager.offset + Pager.limit + 1),
                      function (resp) { Pager.loadTxs(resp) });
              } else {
                  Pager.getTxs(Pager.offset, (Pager.limit + 1),
                      function (resp) { Pager.loadMore(resp) });
              }
          });
      }

      $scope.loadLess = function () { Pager.loadLess(); }

      $scope.address = {
          address : $routeParams.address
      };

      $scope.getAddress();

      $scope.allVotes = (10000000000000000);

      $scope.getApproval = function (vote) {
          return (vote / $scope.allVotes ) * 100;
      }

      // Private

      var Pager = {
          offset : 0, limit : 20, splice : 0,

          disable : function () {
              $scope.moreTxs = $scope.lessTxs = false;
          },

          getTxs : function (offset, limit, cb) {
              $http.get("/api/getTransactionsByAddress", {
                  params : {
                      address : $routeParams.address,
                      offset  : offset,
                      limit   : limit
                  }
              }).then(function (resp) {
                  if (resp.data.success && angular.isArray(resp.data.transactions)) {
                      cb(resp);
                  } else {
                      throw 'Failed to get transaction(s) for: ' + $routeParams.address;
                  }
              });
          },

          spliceTxs : function (resp) {
              var length = resp.data.transactions.length;

              if (length > 1 && length % this.limit == 1) {
                  $scope.moreTxs = this.moreTxs(length);
                  resp.data.transactions.splice(-1, 1);
              } else {
                  $scope.moreTxs = false;
              }
          },

          loadTxs : function (resp) {
              this.spliceTxs(resp);
              $scope.txs = resp.data.transactions;
              $scope.lessTxs = this.lessTxs($scope.txs.length);
              $scope.loading = false;
          },

          moreTxs : function (length) {
              return (length % this.limit) == 1;
          },

          loadMore : function (resp) {
              this.spliceTxs(resp);
              $scope.txs = $scope.txs.concat(resp.data.transactions);
              if ($scope.txs.length + this.limit > 1000) {
                  $scope.moreTxs = false;
              }
              $scope.lessTxs = this.lessTxs($scope.txs.length);
              $scope.loading = false;
          },

          nextOffset : function () {
              return this.offset += this.limit;
          },

          prevOffset : function () {
              return this.offset -= this.limit;
          },

          lessTxs : function (length) {
              if (length > this.limit) {
                  var mod = length % this.limit;
                  this.splice = (mod == 0) ? this.limit : mod;
                  return true;
              } else {
                  this.splice = 0;
                  return false;
              }
          },

          loadLess : function () {
              $scope.lessTxs = false;
              $scope.txs.splice(-this.splice, this.splice);
              $scope.lessTxs = this.lessTxs($scope.txs.length);
              $scope.moreTxs = true;
              this.prevOffset();
          }
      }
  });
