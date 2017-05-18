import AppTools from '../../app/app-tools.module';
import template from './peers.html';

const peers = AppTools.directive('peers', orderBy => ({
    restrict: 'E',
    scope: { peers: '=' },
    template,
    replace: true,

    link: function (scope, element, attr) {
        scope.table = orderBy('ip');
    }
}));

export default peers;
