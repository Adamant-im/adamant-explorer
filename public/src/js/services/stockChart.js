'use strict';

var StockChart = function ($http, $scope) {
    var self = this;

    this.config = {
        type: 'stock',
        theme: 'light',
        pathToImages: '/img/amcharts/',
        dataSets: [{
            fieldMappings: [{
                fromField: 'date',
                toField: 'date'
            }, {
                fromField: 'open',
                toField: 'open'
            }, {
                fromField: 'close',
                toField: 'close'
            }, {
                fromField: 'high',
                toField: 'high'
            }, {
                fromField: 'low',
                toField: 'low'
            }, {
                fromField: 'btcVolume',
                toField: 'btcVolume'
            }, {
                fromField: 'xcrVolume',
                toField: 'xcrVolume'
            }, {
                fromField: 'numTrades',
                toField: 'numTrades'
            }],
            color: '#888888',
            dataProvider: [],
            categoryField: 'date'
        }],
        panels: [{
            title: 'Price',
            showCategoryAxis: false,
            percentHeight: 70,
            valueAxes: [{
                id: 'v1',
                dashLength: 5,
                precision: 8
            }],
            categoryAxis: {
                dashLength: 5,
                parseDates: true
            },
            stockGraphs: [{
                type: 'candlestick',
                id: 'g1',
                openField: 'open',
                closeField: 'close',
                highField: 'high',
                lowField: 'low',
                valueField: 'close',
                lineColor: '#288234',
                fillColors: '#38B449',
                negativeLineColor: '#990000',
                negativeFillColors: '#CC0000',
                fillAlphas: 1,
                useDataSetColors: false,
                comparable: false,
                showBalloon: true,
                balloonText: 'Open:<b>[[open]]</b><br>Close:<b>[[close]]</b><br>Low:<b>[[low]]</b><br>High:<b>[[high]]</b>',
                balloonColor: '#888888',
                proCandlesticks: true
            }]
          },
          {
              title: 'Volume',
              percentHeight: 30,
              marginTop: 1,
              showCategoryAxis: true,
              valueAxes: [ {
                  dashLength: 5,
                  precision: 8
              } ],
              categoryAxis: {
                  dashLength: 5,
                  parseDates: true
              },
              stockGraphs: [{
                  valueField: 'btcVolume',
                  type: 'column',
                  showBalloon: true,
                  balloonText: 'Volume:<b>[[value]]</b>',
                  balloonColor: '#888888',
                  fillAlphas: 1,
                  colors: 'black',
                  backgroundColors: 'black',
                  fillColors: 'black'
              }]
            }
        ],
        chartCursorSettings: {
            fullWidth: true,
            cursorAlpha: 0.1,
            valueBalloonsEnabled: true,
            valueLineBalloonEnabled: true,
            valueLineEnabled: true,
            valueLineAlpha: 0.5,
            cursorColor: '#1E9ADD'
        },
        chartScrollbarSettings: {
            graph: 'g1',
            graphType: 'smoothedLine'
        },
        periodSelector: {
            position: 'bottom',
            periods: []
        }
    };

    this.dataSets = {
        minute: {
            minPeriod: 'mm',
            periods: [{
                period: 'MAX',
                label: 'MAX',
                selected: true
            }, {
                period: 'hh',
                count: 12,
                label: '12 Hours'
            }, {
                period: 'hh',
                count: 6,
                label: '6 Hours'
            }, {
                period: 'hh',
                count: 3,
                label: '3 Hours'
            }]
        },
        hour: {
            minPeriod: 'hh',
            periods: [{
                period: 'MAX',
                label: 'MAX',
                selected: true
            }, {
                period: 'MM',
                count: 1,
                label: '1 Month'
            }, {
                period: 'WW',
                count: 1,
                label: '1 Week'
            }, {
                period: 'DD',
                count: 1,
                label: '1 Day'
            }]
        },
        day: {
            minPeriod: 'DD',
            periods: [{
                period: 'MAX',
                label: 'MAX',
                selected: true
            }, {
                period: 'MM',
                count: 6,
                label: '6 Months'
            }, {
                period: 'MM',
                count: 3,
                label: '3 Months'
            }, {
                period: 'MM',
                count: 1,
                label: '1 Month'
            }]
        }
    };

    $scope.setExchange = function (exchange, duration) {
        $scope.oldExchange = $scope.exchange;
        $scope.exchange = (exchange || $scope.exchange || 'Bter');
        if ($scope.newExchange = ($scope.exchange !== $scope.oldExchange)) {
            console.log('Changed exchange from:', $scope.oldExchange, 'to:', $scope.exchange);
        }
        return $scope.setDuration(duration);
    }

    $scope.setDuration = function (duration) {
        $scope.oldDuration = $scope.duration;
        $scope.duration = (duration || $scope.duration || 'hour');
        if ($scope.newDuration = ($scope.duration !== $scope.oldDuration)) {
            console.log('Changed duration from:', $scope.oldDuration, 'to:', $scope.duration);
        }
        return getCandles();
    }

    var getCandles = function () {
        console.log('Retrieving candles...');
        $http.get(['/api/candles/getCandles',
                   '?e=', angular.lowercase($scope.exchange),
                   '&d=', $scope.duration].join('')).then(updateChart);
    }

    var updateChart = function (resp) {
        if (!self.chart) {
            self.chart = AmCharts.makeChart('stockChart', self.config);
            self.chart.categoryAxesSettings = new AmCharts.CategoryAxesSettings();
        }

        var updatePeriod = ($scope.newExchange || $scope.newDuration);

        if (updatePeriod) {
            console.log('Updating period selector...');
            self.chart.categoryAxesSettings.minPeriod = self.dataSets[$scope.duration].minPeriod;
            self.chart.periodSelector.periods = self.dataSets[$scope.duration].periods;
            self.chart.validateNow();
        }

        if (_.size(resp.data.candles) > 0) {
            console.log('Chart data updated');
            self.chart.dataSets[0].dataProvider = resp.data.candles;
            self.chart.validateData();
        } else {
            console.log('Chart data is empty');
            self.chart.dataSets[0].dataProvider = [];
            self.chart.validateNow();
        }

        if (updatePeriod) {
            console.log('Default period set');
            self.chart.periodSelector.setDefaultPeriod();
        }

        $scope.newExchange = $scope.newDuration = false;
        return getStatistics();
    }

    var getStatistics = function () {
        console.log('Retrieving statistics...');
        $http.get(['/api/candles/getStatistics',
                   '?e=', angular.lowercase($scope.exchange)].join('')).then(updateStatistics);
    }

    var updateStatistics = function (resp) {
        if (resp.data.success) {
            $scope.statistics = resp.data.statistics;
        }
    }

    $scope.setExchange();

    var interval = setInterval(getCandles, 30000);

    $scope.$on('$locationChangeStart', function (event, next, current) {
        clearInterval(interval);
    });
}

angular.module('cryptichain.tools').factory('stockChart',
  function ($http) {
      return function ($scope) {
          return new StockChart($http, $scope);
      }
  });
