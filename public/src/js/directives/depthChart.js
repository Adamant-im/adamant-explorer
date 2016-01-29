'use strict';

angular.module('lisk_explorer.tools')
  .directive('depthChart', function ($timeout) {
      function DepthChart (scope, elm, attr) {
          var self = this;

          this.style = {
              width: '100%',
              height: '500px'
          };

          this.config = {
              type: 'serial',
              theme: 'light',
              pathToImages: '/img/amcharts/',
              precision: 8,
              colors: ['#38B449', '#d32f2f'],
              dataProvider: [{}],
              valueAxes: [{
                  stackType: 'regular',
                  position: 'left',
                  dashLength: 5,
              }],
              graphs: [{
                  fillAlphas: 0.7,
                  lineAlpha: 0.5,
                  title: 'Bids',
                  valueField: 'bid'
              }, {
                  fillAlphas: 0.7,
                  lineAlpha: 0.5,
                  title: 'Asks',
                  valueField: 'ask'
              }],
              marginTop: 15,
              chartCursor: {
                  fullWidth: true,
                  cursorAlpha: 0.1,
                  valueBalloonsEnabled: true,
                  valueLineBalloonEnabled: true,
                  valueLineEnabled: true,
                  valueLineAlpha: 0.5,
                  cursorColor: '#0299eb'
              },
              categoryField: 'price',
              categoryAxis: {
                  startOnAxis: !0,
                  dashLength: 5,
                  labelRotation: 30,
                  labelFunction: function (n, t) {
                      return Number(t.category).toFixed(8);
                  }
              }
          };

          this.updateDepth = function () {
              var delay = 0;

              if (!scope.depthChart) {
                  delay = 500;
                  console.log('Initializing depth chart...');
                  scope.depthChart = AmCharts.makeChart('depthChart', self.config);
                  scope.depthChart.categoryAxesSettings = new AmCharts.CategoryAxesSettings();
              }

              $timeout(function () {
                  if (scope.tab !== 'depthChart') {
                      return;
                  }

                  if (_.size(scope.orders.depth) > 0) {
                      scope.depthChart.dataProvider = scope.orders.depth;
                      scope.depthChart.validateData();
                      console.log('Depth chart data updated');
                      elm.contents().css('display', 'block');
                  } else {
                      console.log('Depth chart data is empty');
                      scope.depthChart.dataProvider = [];
                      scope.depthChart.validateData();
                      elm.contents().css('display', 'none');
                      elm.prepend('<p class="amChartsEmpty"><i class="fa fa-exclamation-circle"></i> No Data</p>');
                  }

                  scope.$emit('$depthChartUpdated');
              }, delay);
          };

          elm.css('width', self.style.width);
          elm.css('height', self.style.height);
      }

      return {
          restric: 'E',
          replace: true,
          template: '<div id="depthChart"></div>',
          link: function (scope, elm, attr) {
              var depthChart = new DepthChart(scope, elm, attr);
              scope.$on('$ordersUpdated', depthChart.updateDepth);
          }
      };
  });
