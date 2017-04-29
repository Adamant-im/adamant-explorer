import 'angular';
import AppActivityGraph from './index';

const ActivityGraphCtrlConstructor = function (activityGraph) {
    activityGraph(this);
};

AppActivityGraph.controller('ActivityGraphCtrl', ActivityGraphCtrlConstructor);
