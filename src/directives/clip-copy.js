import AppTools from '../app/app-tools.module.js';
import ZeroClipboard from 'zeroclipboard';
import ZeroClipboardSwf from '../assets/swf/ZeroClipboard.swf';


AppTools.directive('clipCopy', () => {
    return {
        restric: 'A',
        scope: { clipCopy: '=clipCopy' },
        template: '<div class="tooltip fade right in"><div class="tooltip-arrow"></div><div class="tooltip-inner">Copied!</div></div>',
        link: function (scope, elm) {
            const clip = new ZeroClipboard(elm);

            clip.on('ready', clp => {
                const onAfterCopy = client => {
                    clp.client.setText(scope.clipCopy);
                };

                clp.client.on('aftercopy', onAfterCopy);
                scope.$on('$destroy', () => {
                    clp.client.off('aftercopy', onAfterCopy);
                });
            });

            clip.on('noFlash wrongflash', () => elm.remove());
        }
    };
});
