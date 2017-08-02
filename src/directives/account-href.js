import AppTools from '../app/app-tools.module.js';

const accountHref = AppTools.directive('accountHref', () => {
    /**
     * Joins all of the inputs and returns the resulting string in camelCase.
     * @param {string} first - This word will join the rest in lower-case
     * @param {...string} rest - Each one will be joined in capitalized format.
     *
     * @return {string}
     */
    const joinCameCased = (first, ...rest) => {
        rest = rest.map(word => word.toLowerCase().replace(/\b\w/g, l => l.toUpperCase()));
        return first.toLowerCase() + rest.join('');
    }

    const getUserName = (scope, attrs) => {
        if (attrs.type === 'delegate') {
            return scope.accountHref[joinCameCased(attrs.type, 'delegate')] &&
                scope.accountHref[joinCameCased(attrs.type, 'delegate')].username;
        } else {
            return scope.accountHref[joinCameCased(attrs.type, 'username')];
        }
    }

    return {
        scope: {
            accountHref: '=',
            id: '='
        },
        link: ($scope, $element, $attrs) => {
            let username = null;
            let id = null;

            if ($attrs.type === 'sender' || $attrs.type === 'recipient') {
                username = getUserName($scope, $attrs);
                id = $scope.accountHref[joinCameCased($attrs.type, 'id')];
            } else {
                username = $attrs.type === 'delegate' && $scope.accountHref.username;
                id = $scope.id ? $scope.id : $scope.accountHref.address;
            }

            $attrs.$set('href', username ? `/delegate/${id}` : `/address/${id}`);
        }
    }
});

export default accountHref;
