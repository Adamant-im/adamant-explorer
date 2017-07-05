import AppBreadCrumb from './bread-crumb.module';
import template from './bread-crumb.html';

AppBreadCrumb.directive('breadCrumb',  ($state, $transitions) => {
    const BreadCrumbCtrl = function () {

        /**
         * Initiates the hierarchy array of sections
         */
        this.setSections = (next, states, breadCrumbValues) => {
            let sections = [];
            let section = next;

            while (section.parentDir !== section.name) {
                for (let item of states) {
                    if (item.name === section.parentDir) {
                        sections.unshift({
                            name: item.name,
                            url: this.setPathParams(item.url, breadCrumbValues)
                        });
                        section = item;
                        break;
                    }
                }
            }
            sections.push({
                name: next.name,
                url: '#'
            });

            return sections;
        }

        /**
         * Replaces any :param in path string with their corresponding values from given set of breadCrumb values.
         * Use this method to set values either when initiating the component/controller of the state
         * or inside any sync function's callback.
         */
        this.setPathParams = (path, breadCrumbValues) => {
            const paramsReg = /(?:\/\:([^\/]+)?)/g;
            const params = path.match(paramsReg);
            let paramName = '';
            let paramValue = '';

            if (params) {
                for (let item of params) {
                    paramName = item.replace(/(^\/\:)|(\?)/g, '');
                    paramValue = paramName && breadCrumbValues && breadCrumbValues[paramName] ? breadCrumbValues[paramName]: '';
                    path = path.replace(item, `/${paramValue}`)
                }
            }

            return path;
        }
    }

    const BreadCrumbLink = (scope, element, attrs, ctrl) => {
        let init = (values) => {
            const states = $state.get();
            if (!scope.breadCrumb) {
                scope.breadCrumb = {};
            }
            if (values.constructor.name != "Transition") {
                angular.merge(scope.breadCrumb, values);
            }
            scope.breadCrumb.set = init;

            scope.sections = ctrl.setSections($state.current, states, scope.breadCrumb);
        }

        $transitions.onSuccess({ to: '*' }, init);
    }

    return {
        restrict: 'E',
        template,
        controller: BreadCrumbCtrl,
        link: BreadCrumbLink,
    }
});
