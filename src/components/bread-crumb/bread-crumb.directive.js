import AppBreadCrumb from './bread-crumb.module';
import template from './bread-crumb.html';

AppBreadCrumb.directive('breadCrumb',  ($state, $transitions) => {
    const BreadCrumpLink = (scope, element, attrs) => {
        const states = $state.get();

        scope.init = () => {
            scope.sections = [];

            let section = $state.current;
            while (section.parentDir !== section.name) {
                for (let item of states) {
                    if (item.name === section.parentDir) {
                        scope.sections.unshift({
                            name: item.name,
                            url: scope.setPathParams(item.url, scope.breadCrumb)
                        });
                        section = item;
                        break;
                    }
                }
            }
            scope.sections.push({
                name: $state.current.name,
                url: '#'
            });
        }

        /**
         * Replaces any :param in path string with their corresponding values from given set of breadCrumb values.
         */
        scope.setPathParams = (path, breadCrumbValues) => {
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

        $transitions.onSuccess({ to: '*' }, scope.init);
    }

    return {
        restric: 'E',
        template,
        link: BreadCrumpLink,
    }
});
