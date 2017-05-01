import 'angular';
import AppActivityGraph from './activity-graph.module';
import template from './activity-graph.html';

const ActivityGraphConstructor = function (activityGraph) {
    activityGraph(this);
};

AppActivityGraph.component('activityGraph', {
    template: template,
    controller: ActivityGraphConstructor,
    controllerAs: 'vm'
});
