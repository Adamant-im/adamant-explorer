import AppTools from '../app/app-tools.module.js';
import Clipboard from 'clipboard';

AppTools.directive('clipCopy', () => {
    return {
        restric: 'A',
        scope: { clipCopy: '=clipCopy' },
        template: '<div class="tooltip fade right in"><div class="tooltip-arrow"></div><div class="tooltip-inner">{{tooltipText}}</div></div>',
        link: function (scope, elm) {
            scope.tooltipText = 'Copied!'
            const clip = new Clipboard(elm[0], {
                text: (target) => scope.clipCopy
            });
            clip.on('success', e => {
               elm.addClass('active');
            });
            elm.on('mouseleave', e => {
                elm.removeClass('active');
            })
            clip.on('error', function(e) {
               scope.tooltipText = 'Press Ctrl+C to copy!';
               scope.$apply();
               elm.addClass('active');
            });
            scope.$on('$destroy', () => clip.desctroy());
        }
    };
});
