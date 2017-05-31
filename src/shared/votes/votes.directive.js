import AppTools from '../../app/app-tools.module';
import template from './votes.html';

const votes = AppTools.directive('votes', () => ({
    restrict: 'E',
    scope: { votes: '=' },
    template,
    replace: true
}));

export default votes;
