'use strict';
import moment from 'moment';
import template from './forging-status.html';

angular.module('lisk_explorer.tools')
  .directive('forgingStatus', $sce => ({
    restrict: 'A',
    scope: {
        forgingStatus: '='
    },
    template,
    transclude: true,
    link: function (scope, element, attr) {
        const el = element[0];

        const updateStatus = () => {
            element.removeClass('fa-circle-o').addClass('fa-circle');
            scope.tooltip = {};

            switch (scope.forgingStatus.code) {
                case 3: // Awaiting slot, but forged in last round
                    element.removeClass('fa-circle red orange').addClass('fa-circle-o green');
                    scope.tooltip.html = '<span class="avaiting-slot">Awaiting slot</span>';
                    scope.tooltip.class = 'tooltip-grey';
                    break;
                case 4: // Awaiting slot, but missed block in last round
                    element.removeClass('fa-circle green red').addClass('fa-circle-o orange');
                    scope.tooltip.html = '<span class="avaiting-slot">Awaiting slot</span>';
                    scope.tooltip.class = 'tooltip-grey';
                    break;
                case 0: // Forged block in current round
                    element.removeClass('red orange').addClass('green');
                    scope.tooltip.html = '<span class="forging">Forging</span>';
                    scope.tooltip.class = 'tooltip-green';
                    break;
                case 1: // Missed block in current round
                    element.removeClass('red green').addClass('orange');
                    scope.tooltip.html = '<span class="missed-block">Missed block</span>';
                    scope.tooltip.class = 'tooltip-orange';
                    break;
                case 2: // Not Forging
                    element.removeClass('orange green').addClass('red');
                    scope.tooltip.html = '<span class="not-forging">Not forging</span>';
                    scope.tooltip.class = 'tooltip-red';
                    break;
                default: // Awaiting Status
                    element.removeClass('fa-circle red orange green').addClass('fa-circle-o');
                    scope.tooltip.html = '<span class="awaiting-status">Awaiting status</span>';
                    scope.tooltip.class = 'tooltip-grey';
            }

            if (scope.forgingStatus.code < 5) {
                if (scope.forgingStatus.blockAt) {
                  scope.tooltip.html += `<br> Last block forged @ ${scope.forgingStatus.lastBlock.height}<br>`;
                  scope.tooltip.html +=  moment(scope.forgingStatus.blockAt).fromNow();
                } else {
                  scope.tooltip.html += '<br> Not forged a block yet<br>';
                }
            }

            scope.tooltip.html = $sce.trustAsHtml(scope.tooltip.html);
        };

        scope.$watch('forgingStatus', updateStatus, true);
    }
}));
