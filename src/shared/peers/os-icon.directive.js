import AppTools from '../../app/app-tools.module';

const osIcon = AppTools.directive('osIcon', () => ({
    restrict: 'A',

    scope: {
        os: '=os',
        brand: '=brand'
    },

    template: '<span></span>',
    replace: true,

    link: function (scope, element, attr) {
        const el = element[0];

        el.alt = el.title = scope.os;
        el.className += (` os-icon os-${scope.brand.name}`);
    }
}));

export default osIcon;
