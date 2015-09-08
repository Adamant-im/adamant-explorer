'use strict';

angular.module('cryptichain.tools')
  .directive('forgingStatus', function () {
      return {
          restrict: 'A',
          scope: {
              forgingStatus: '=forgingStatus'
          },
          template: '<i class="forging-status fa"></i>',
          replace: true,
          link: function (scope, element, attr) {
              var el = element[0];

              var updateStatus = function () {
                  element.removeClass('fa-circle-o').addClass('fa-circle');

                  switch (scope.forgingStatus) {
                      case 3: // Stale Status
                          element.removeClass('red orange green');
                          element.attr('title', 'Stale Status');
                          break;
                      case 0: // Forging
                          element.removeClass('red orange').addClass('green');
                          element.attr('title', 'Forging');
                          break;
                      case 1: // Missed Cycles
                          element.removeClass('red green').addClass('orange');
                          element.attr('title', 'Missed Cycles');
                          break;
                      case 2: // Not Forging
                          element.removeClass('orange green').addClass('red');
                          element.attr('title', 'Not Forging');
                          break;
                      default: // No Status
                          element.removeClass('fa-circle red orange green').addClass('fa-circle-o');
                          element.attr('title', '');
                  }
              };

              scope.$watch('forgingStatus', updateStatus, true);
          }
      };
  });
