const ActivityGraphCtrlConstructor = function (activityGraph) {
    activityGraph(this);
};

angular.module('lisk_explorer.tools').controller('ActivityGraphCtrl', ActivityGraphCtrlConstructor);
