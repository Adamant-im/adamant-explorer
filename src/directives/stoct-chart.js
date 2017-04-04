'use strict';

angular.module('lisk_explorer.tools')
  .directive('stockChart', $timeout => {
      function StockChart (scope, elm, attr) {
          const self = this;

          this.style = {
              width: '100%',
              height: '500px'
          };

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
                      fromField: 'liskVolume',
                      toField: 'liskVolume'
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
                      negativeFillColors: '#d32f2f',
                      fillAlphas: 0.7,
                      useDataSetColors: false,
                      comparable: false,
                      showBalloon: true,
                      balloonText: 'Open: <b>[[open]]</b><br>Close: <b>[[close]]</b><br>Low: <b>[[low]]</b><br>High: <b>[[high]]</b>',
                      balloonColor: '#888888',
                      proCandlesticks: true
                  }]
                },
                {
                    title: 'Volume',
                    percentHeight: 30,
                    marginTop: 1,
                    showCategoryAxis: true,
                    valueAxes: [{
                        dashLength: 5,
                        precision: 8
                    }],
                    categoryAxis: {
                        dashLength: 5,
                        parseDates: true
                    },
                    stockGraphs: [{
                        valueField: 'btcVolume',
                        periodValue: 'Sum',
                        type: 'column',
                        showBalloon: true,
                        balloonText: 'Volume: <b>[[value]]</b>',
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
                  cursorColor: '#0299eb'
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
                  groupToPeriods: ['hh', 'DD', 'WW', 'MM', 'YYYY'],
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
                  groupToPeriods: ['DD', 'WW', 'MM', 'YYYY'],
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
                  groupToPeriods: ['WW', 'MM', 'YYYY'],
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

          this.updatePeriod = () => {
              const newPeriod = (scope.data.newExchange || scope.data.newDuration);

              if (newPeriod) {
                  console.log('Updating period selector...');
                  scope.data.stockChart.categoryAxesSettings.minPeriod = self.dataSets[scope.data.duration].minPeriod;
                  scope.data.stockChart.periodSelector.periods = self.dataSets[scope.data.duration].periods;
                  scope.data.stockChart.validateNow();
              }

              return newPeriod;
          };

          this.updateCandles = () => {
              let delay = 0;

              if (!scope.data.stockChart) {
                  delay = 500;
                  console.log('Initializing stock chart...');
                  scope.data.stockChart = AmCharts.makeChart('stockChart', self.config);
                  scope.data.stockChart.categoryAxesSettings = new AmCharts.CategoryAxesSettings();
              }

              $timeout(() => {
                  if (scope.data.tab !== 'stockChart') {
                      return;
                  }

                  const newPeriod = self.updatePeriod(scope);

                  if (_.size(scope.data.candles) > 0) {
                      console.log('Stock chart data updated');
                      scope.data.stockChart.dataSets[0].dataProvider = scope.data.candles;
                      scope.data.stockChart.validateData();
                      elm.contents().css('display', 'block');
                  } else {
                      console.log('Stock chart data is empty');
                      scope.data.stockChart.dataSets[0].dataProvider = [];
                      scope.data.stockChart.validateNow();
                      elm.contents().css('display', 'none');
                      elm.prepend('<p class="amChartsEmpty"><i class="fa fa-exclamation-circle"></i> No Data</p>');
                  }

                  if (newPeriod) {
                      scope.data.stockChart.periodSelector.setDefaultPeriod();
                      console.log('Default period set');
                  }

                  scope.$emit('$stockChartUpdated');
              }, delay);
          };

          elm.css('width', self.style.width);
          elm.css('height', self.style.height);
      }

      return {
          restric: 'E',
          replace: true,
          template: '<div id="stockChart"></div>',
          scope: {
              data: '='
          },
          link: function (scope, elm, attr) {
              const stockChart = new StockChart(scope, elm, attr);
              scope.$on('$candlesUpdated', stockChart.updateCandles);
          }
      };
  });
