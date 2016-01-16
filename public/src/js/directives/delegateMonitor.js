'use strict';

angular.module('lisk_explorer.tools')
  .directive('forgingStatus', function ($sce) {
      return {
          restrict: 'A',
          scope: {
              forgingStatus: '=forgingStatus'
          },
          templateUrl: '/views/delegateMonitor/forgingStatus.html',
          replace: true,
          transclude: true,
          link: function (scope, element, attr) {
              var el = element[0];

              var updateStatus = function () {
                  element.removeClass('fa-circle-o').addClass('fa-circle');
                  scope.tooltip = {};

                  switch (scope.forgingStatus.code) {
                      case 3: // Stale Status
                          element.removeClass('red orange green');
                          scope.tooltip.html = '<span class="stale-status">Stale Status</span>';
                          scope.tooltip.class = 'tooltip-grey';
                          break;
                      case 0: // Forging
                          element.removeClass('red orange').addClass('green');
                          scope.tooltip.html = '<span class="forging">Forging</span>';
                          scope.tooltip.class = 'tooltip-green';
                          break;
                      case 1: // Missed Cycles
                          element.removeClass('red green').addClass('orange');
                          scope.tooltip.html = '<span class="missed-cycles">Missed Cycles</span>';
                          scope.tooltip.class = 'tooltip-orange';
                          break;
                      case 2: // Not Forging
                          element.removeClass('orange green').addClass('red');
                          scope.tooltip.html = '<span class="not-forging">Not Forging</span>';
                          scope.tooltip.class = 'tooltip-red';
                          break;
                      default: // Awaiting Status
                          element.removeClass('fa-circle red orange green').addClass('fa-circle-o');
                          scope.tooltip.html = '<span class="awaiting-status">Awaiting Status</span>';
                          scope.tooltip.class = 'tooltip-grey';
                  }

                  if (scope.forgingStatus.code < 3) {
                      scope.tooltip.html += '<br> Last block forged ' + '@ ' + scope.forgingStatus.lastBlock.height + '<br>';
                      scope.tooltip.html +=  moment(scope.forgingStatus.blockAt).fromNow();
                  }

                  scope.tooltip.html = $sce.trustAsHtml(scope.tooltip.html);
              };

              scope.$watch('forgingStatus', updateStatus, true);
          }
      };
  });
