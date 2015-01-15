// Source: public/src/js/app.js
angular.module('insight',[
  'ngAnimate',
  'ngResource',
  'ngRoute',
  'ngProgress',
  'ui.bootstrap',
  'ui.route',
  'monospaced.qrcode',
  'gettext',
  'insight.system',
  'insight.socket',
  'insight.blocks',
  'insight.transactions',
  'insight.address',
  'insight.search',
  'insight.status',
  'insight.connection',
  'insight.currency'
]);

angular.module('insight.system', []);
angular.module('insight.socket', []);
angular.module('insight.blocks', []);
angular.module('insight.transactions', []);
angular.module('insight.address', []);
angular.module('insight.search', []);
angular.module('insight.status', []);
angular.module('insight.connection', []);
angular.module('insight.currency', []);

// Source: public/src/js/controllers/address.js
angular.module('insight.address').controller('AddressController',
  function($scope, $rootScope, $routeParams, $location, $http) {
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

      $scope.loadTrs = function () {
          $http.get("/api/getTransactionsByAddress", {
              params : {
                  address : $routeParams.address
              }
          }).then(function (resp) {
              if (resp.data.success) {
                  $scope.txs = resp.data.transactions;
              }
          });
      }

      $scope.loadMore = function () {

      }

      $scope.address = {
          address : $routeParams.address
      };

      $scope.getAddress();
  });

// Source: public/src/js/controllers/blocks.js
angular.module('insight.blocks').controller('BlocksController',
  function($scope, $rootScope, $routeParams, $location, $http, $interval) {
      $scope.getLastBlocks = function (n) {
          var offset = 0;
          if (n) {
              offset = (n - 1) * 20;
          }

          $http.get("/api/lastBlocks?n=" + offset).then(function (resp) {
              if (resp.data.success) {
                  $scope.blocks = resp.data.blocks;

                  if (resp.data.pagination) {
                      $scope.pagination = resp.data.pagination;
                  }
              } else {
                  $scope.blocks = [];
              }
          });
      }

      $scope.getBlock = function (blockId) {
          $http.get("/api/getBlock", {
              params : {
                  blockId : blockId
              }
          }).then(function (resp) {
              if (resp.data.success) {
                  $scope.block = resp.data.block;
                  return $http.get("/api/getTransactionsByBlock", {
                      params : {
                          blockId : blockId
                      }
                  });
              } else {
                  throw 'Block was not found!'
              }
          }).then(function (resp) {
              if (resp.data.success) {
                  $scope.block.transactions = resp.data.transactions;
              } else {
                  throw 'Block transactions were not found!'
              }
              $scope.txs = $scope.block.transactions;
          }).catch(function (error) {
              console.log(error);
              $location.path("/");
          });
      }

      if ($routeParams.blockId) {
          $scope.block = {
              id : $routeParams.blockId
          };

          $scope.getBlock($routeParams.blockId);
      } else {
          if ($routeParams.blockDate) {
              $scope.getLastBlocks($routeParams.blockDate);
          } else {
              $scope.getLastBlocks();
          }
      }
});

// Source: public/src/js/controllers/connection.js
angular.module('insight.connection').controller('ConnectionController',
  function($scope, $window, Status, getSocket, PeerSync) {


  });

// Source: public/src/js/controllers/currency.js
angular.module('insight.currency').controller('CurrencyController',
  function($scope, $rootScope, Currency) {



  });

// Source: public/src/js/controllers/footer.js
angular.module('insight.system').controller('FooterController',
  function($scope, Version) {

    var _getVersion = function() {
      Version.get({},
      function(res) {
        $scope.version = res.version;
      });
    };

    $scope.version = _getVersion();

});

// Source: public/src/js/controllers/header.js
angular.module('insight.system').controller('HeaderController',
  function($scope, $rootScope, $modal, $http, $interval) {
      $scope.getHeight = function () {
          $http.get("/api/getBlocksCount").then(function (resp) {
              if (resp.data.success) {
                  $scope.totalBlocks = resp.data.count;
              } else {
                  if (!$scope.totalBlocks) {
                      $scope.totalBlocks = 0;
                  }
              }
          });
      }

      $scope.getFee = function () {
          $http.get("/api/getFee").then(function (resp) {
              if (resp.data.success) {
                  $scope.fee = resp.data.feePercent;
              } else {
                  $scope.fee = "Error";
              }
          });
      }

      $scope.getXCR = function () {
          $http.get("/api/getXCRCourse").then(function (resp) {
             if (resp.data.success) {
                 $scope.xcr = resp.data.xcr;
                 $scope.usd = resp.data.usd;
             } else {
                 $scope.course = "Error";
             }
          });
      }

      $scope.heightInterval = $interval(function () {
          $scope.getHeight();
      }, 30000);

      $scope.feeInterval = $interval(function () {
          $scope.getFee();
      }, 30000);

      $scope.xcrInterval = $interval(function () {
          $scope.getXCR();
      }, 30000);

      $scope.getHeight();
      $scope.getFee();
      $scope.getXCR();
  });

// Source: public/src/js/controllers/index.js
var TRANSACTION_DISPLAYED = 20;
var BLOCKS_DISPLAYED = 20;

angular.module('insight.system').controller('IndexController',
  function($scope, $http, $interval) {
      $scope.getLastBlocks = function () {
          $http.get("/api/lastBlocks").then(function (resp) {
              if (resp.data.success) {
                  if ($scope.blocks && $scope.blocks.length > 0) {
                      if ($scope.blocks[0].id != resp.data.blocks[0].id) {
                          $scope.blocks = resp.data.blocks;
                      }
                  } else {
                      $scope.blocks = resp.data.blocks;
                  }
              }
          });
      }

      $scope.blocksInterval = $interval(function () {
          $scope.getLastBlocks();
      }, 30000);

      $scope.getLastBlocks();

      $scope.getLastTransactions = function () {
          $http.get("/api/getLastTransactions").then(function (resp) {
              if (resp.data.success) {
                  if ($scope.txs && $scope.txs.length > 0) {
                      if ($scope.txs[0] != resp.data.txs[0]) {
                          $scope.txs = resp.data.txs;
                      }
                  } else {
                      $scope.txs = resp.data.transactions;
                  }
              }
          });
      }

      $scope.transactionsInterval = $interval(function () {
          $scope.getLastTransactions();
      }, 30000);

      $scope.getLastTransactions();
  });

// Source: public/src/js/controllers/scanner.js
angular.module('insight.system').controller('ScannerController',
  function($scope, $rootScope, $modalInstance, Global) {

});

// Source: public/src/js/controllers/search.js
angular.module('insight.search').controller('SearchController',
  function($scope, $routeParams, $location, $timeout, Global, $http) {
      $scope.loading = false;
      $scope.badQuery = false;

      var _badQuery = function() {
          $scope.badQuery = true;

          $timeout(function() {
              $scope.badQuery = false;
          }, 2000);
      };

      var _resetSearch = function() {
          $scope.q = '';
          $scope.loading = false;
      };

      $scope.search = function () {
          $scope.badQuery = false;
          $scope.loading = true;

          $http.get("/api/search", {
              params : {
                  id : $scope.q
              }
          }).then(function (resp) {
              if (resp.data.success == false || resp.data.found == false) {
                  $scope.loading = false;
                  _badQuery();
              } else if (resp.data.id) {
                  $scope.loading = false;
                  _resetSearch();

                  $location.path("/" + resp.data.type + "/" + resp.data.id);
              }
          });
      }
});

// Source: public/src/js/controllers/status.js
angular.module('insight.status').controller('StatusController',
  function($scope, $routeParams, $location, Global, Status, Sync, getSocket) {

  });

// Source: public/src/js/controllers/topAccounts.js
angular.module('insight.address').controller('TopAccounts',
    function($scope, $rootScope, $routeParams, $location, $http) {
        $scope.getTopAccounts = function () {
            $http.get("/api/getTopAccounts").then(function (resp) {
                if (resp.data.success) {
                    $scope.topAccounts = resp.data.accounts;
                }
            });
        }

        $scope.getTopAccounts();
    });
// Source: public/src/js/controllers/transactions.js
angular.module('insight.transactions').controller('transactionsController',
function($scope, $rootScope, $routeParams, $location, $http) {
    $scope.getTransaction = function () {
        $http.get("/api/getTransaction", {
            params : {
                transactionId : $routeParams.txId
            }
        }).then(function (resp) {
            if (resp.data.success) {
                $scope.tx = resp.data.transaction;
            }
        });
    }

    $scope.getTransaction();
});

// Source: public/src/js/services/address.js
angular.module('insight.address').factory('Address',
  function($resource) {
  return $resource('/api/addr/:addrStr/?noTxList=1', {
    addrStr: '@addStr'
  }, {
    get: {
      method: 'GET',
      interceptor: {
        response: function (res) {
          return res.data;
        },
        responseError: function (res) {
          if (res.status === 404) {
            return res;
          }
        }
      }
    }
  });
});


// Source: public/src/js/services/blocks.js
angular.module('insight.blocks')
  .factory('Block',
    function($resource) {
    return $resource('/api/block/:blockHash', {
      blockHash: '@blockHash'
    }, {
      get: {
        method: 'GET',
        interceptor: {
          response: function (res) {
            return res.data;
          },
          responseError: function (res) {
            if (res.status === 404) {
              return res;
            }
          }
        }
      }
    });
  })
  .factory('Blocks',
    function($resource) {
      return $resource('/api/blocks');
  })
  .factory('BlockByHeight',
    function($resource) {
      return $resource('/api/block-index/:blockHeight');
  });

// Source: public/src/js/services/currency.js
angular.module('insight.currency').factory('Currency',
  function($resource) {
    return $resource('/api/currency');
});

// Source: public/src/js/services/global.js
//Global service for global variables
angular.module('insight.system')
  .factory('Global',[
    function() {
    }
  ])
  .factory('Version',
    function($resource) {
      return $resource('/api/version');
  });

// Source: public/src/js/services/socket.js
var ScopedSocket = function(socket, $rootScope) {
  this.socket = socket;
  this.$rootScope = $rootScope;
  this.listeners = [];
};

ScopedSocket.prototype.removeAllListeners = function(opts) {
  if (!opts) opts = {};
  for (var i = 0; i < this.listeners.length; i++) {
    var details = this.listeners[i];
    if (opts.skipConnect && details.event === 'connect') {
      continue;
    }
    this.socket.removeListener(details.event, details.fn);
  }
  this.listeners = [];
};

ScopedSocket.prototype.on = function(event, callback) {
  var socket = this.socket;
  var $rootScope = this.$rootScope;

  var wrapped_callback = function() {
    var args = arguments;
    $rootScope.$apply(function() {
      callback.apply(socket, args);
    });
  };
  socket.on(event, wrapped_callback);

  this.listeners.push({
    event: event,
    fn: wrapped_callback
  });
};

ScopedSocket.prototype.emit = function(event, data, callback) {
  var socket = this.socket;
  var $rootScope = this.$rootScope;

  socket.emit(event, data, function() {
    var args = arguments;
    $rootScope.$apply(function() {
      if (callback) {
        callback.apply(socket, args);
      }
    });
  });
};

angular.module('insight.socket').factory('getSocket',
  function($rootScope) {
    var socket = io.connect(null, {
      'reconnect': true,
      'reconnection delay': 500,
    });
    return function(scope) {
      var scopedSocket = new ScopedSocket(socket, $rootScope);
      scope.$on('$destroy', function() {
        scopedSocket.removeAllListeners();
      });
      socket.on('connect', function() {
        scopedSocket.removeAllListeners({
          skipConnect: true
        });
      });
      return scopedSocket;
    };
  });

// Source: public/src/js/services/status.js
angular.module('insight.status')
  .factory('Status',
    function($resource) {
      return $resource('/api/status', {
        q: '@q'
      });
    })
  .factory('Sync',
    function($resource) {
      return $resource('/api/sync');
    })
  .factory('PeerSync',
    function($resource) {
      return $resource('/api/peer');
    });

// Source: public/src/js/services/transactions.js
angular.module('insight.transactions')
  .factory('Transaction',
    function($resource) {
    return $resource('/api/tx/:txId', {
      txId: '@txId'
    }, {
      get: {
        method: 'GET',
        interceptor: {
          response: function (res) {
            return res.data;
          },
          responseError: function (res) {
            if (res.status === 404) {
              return res;
            }
          }
        }
      }
    });
  })
  .factory('TransactionsByBlock',
    function($resource) {
    return $resource('/api/txs', {
      block: '@block'
    });
  })
  .factory('TransactionsByAddress',
    function($resource) {
    return $resource('/api/txs', {
      address: '@address'
    });
  })
  .factory('Transactions',
    function($resource) {
      return $resource('/api/txs');
  });

// Source: public/src/js/directives.js
var ZeroClipboard = window.ZeroClipboard;

angular.module('insight')
  .directive('scroll', function ($window) {
    return function(scope, element, attrs) {
      angular.element($window).bind('scroll', function() {
        if (this.pageYOffset >= 200) {
          scope.secondaryNavbar = true;
        } else {
          scope.secondaryNavbar = false;
        }
        scope.$apply();
      });
    };
  })
  .directive('whenScrolled', function($window) {
    return {
      restric: 'A',
      link: function(scope, elm, attr) {
        var pageHeight, clientHeight, scrollPos;
        $window = angular.element($window);

        var handler = function() {
          pageHeight = window.document.documentElement.scrollHeight;
          clientHeight = window.document.documentElement.clientHeight;
          scrollPos = window.pageYOffset;

          if (pageHeight - (scrollPos + clientHeight) === 0) {
            scope.$apply(attr.whenScrolled);
          }
        };

        $window.on('scroll', handler);

        scope.$on('$destroy', function() {
          return $window.off('scroll', handler);
        });
      }
    };
  })
  .directive('clipCopy', function() {
    ZeroClipboard.config({
      moviePath: '/lib/zeroclipboard/ZeroClipboard.swf',
      trustedDomains: ['*'],
      allowScriptAccess: 'always',
      forceHandCursor: true
    });

    return {
      restric: 'A',
      scope: { clipCopy: '=clipCopy' },
      template: '<div class="tooltip fade right in"><div class="tooltip-arrow"></div><div class="tooltip-inner">Copied!</div></div>',
      link: function(scope, elm) {
        var clip = new ZeroClipboard(elm);

        clip.on('load', function(client) {
          var onMousedown = function(client) {
            client.setText(scope.clipCopy);
          };

          client.on('mousedown', onMousedown);

          scope.$on('$destroy', function() {
            client.off('mousedown', onMousedown);
          });
        });

        clip.on('noFlash wrongflash', function() {
          return elm.remove();
        });
      }
    };
  });

// Source: public/src/js/filters.js
angular.module('insight')
  .filter('startFrom', function() {
    return function(input, start) {
      start = +start; //parse to int
      return input.slice(start);
    }
  })
  .filter('split', function() {
    return function(input, delimiter) {
      var delimiter = delimiter || ',';
      return input.split(delimiter);
    }
  }).filter('timestamp', function () {
        return function (timestamp) {
            var epochDate = new Date(Date.UTC(2014, 4, 2, 0, 0, 0, 0));
            var epochTime = parseInt(epochDate.getTime() / 1000);

            timestamp = epochTime + timestamp;

            var d = new Date(timestamp * 1000);
            var month = d.getMonth() + 1;

            if (month < 10) {
                month = "0" + month;
            }

            var day = d.getDate();

            if (day < 10) {
                day = "0" + day;
            }

            var h = d.getHours();
            var m = d.getMinutes();
            var s = d.getSeconds();

            if (h < 10) {
                h = "0" + h;
            }

            if (m < 10) {
                m = "0" + m;
            }

            if (s < 10) {
                s = "0" + s;
            }

            return d.getFullYear() + "/" + month + "/" + day + " " + h + ":" + m + ":" + s;
        }
    });

// Source: public/src/js/config.js
//Setting up route
angular.module('insight').config(function($routeProvider) {
  $routeProvider.
    when('/block/:blockId', {
      templateUrl: '/views/block.html',
      title: 'Block '
    }).
    when('/block-index/:blockHeight', {
      controller: 'BlocksController',
      templateUrl: '/views/redirect.html'
    }).
    when('/tx/:txId/:v_type?/:v_index?', {
      templateUrl: '/views/transaction.html',
      title: 'Transaction '
    }).
    when('/', {
      templateUrl: '/views/index.html',
      title: 'Home'
    }).
    when('/blocks', {
      templateUrl: '/views/block_list.html',
      title: 'Blocks List'
    }).
    when('/blocks-date/:blockDate?', {
      templateUrl: '/views/block_list.html',
      title: 'Blocks List'
    }).
    when('/address/:address', {
      templateUrl: '/views/address.html',
      title: 'Address'
    })
      .when("/topAccounts", {
          templateUrl : "/views/topAccounts.html",
          title: "Top Accounts"
      })
    .otherwise({
      templateUrl: '/views/404.html',
      title: 'Error'
    });
});

//Setting HTML5 Location Mode
angular.module('insight')
  .config(function($locationProvider) {
    $locationProvider.html5Mode(true);
    $locationProvider.hashPrefix('!');
  })
  .run(function($rootScope, $route, $location, $routeParams, $anchorScroll, ngProgress, gettextCatalog) {
    gettextCatalog.currentLanguage = 'en';
    $rootScope.$on('$routeChangeStart', function() {
      ngProgress.start();
    });

    $rootScope.$on('$routeChangeSuccess', function() {
      ngProgress.complete();

      //Change page title, based on Route information
      $rootScope.titleDetail = '';
      $rootScope.title = $route.current.title;
      $rootScope.isCollapsed = true;
      $rootScope.currentAddr = null;

      $location.hash($routeParams.scrollTo);
      $anchorScroll();
    });
  });

// Source: public/src/js/init.js
angular.element(document).ready(function() {
  // Init the app
  // angular.bootstrap(document, ['insight']);
});

// Source: public/src/js/translations.js
angular.module('insight').run(['gettextCatalog', function (gettextCatalog) {
/* jshint -W100 */
/* jshint +W100 */
}]);