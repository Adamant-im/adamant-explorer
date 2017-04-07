'use strict';

const ZeroClipboard = window.ZeroClipboard;

angular.module('lisk_explorer')
  .directive('clipCopy', () => {
      ZeroClipboard.config({
          moviePath: '/swf/ZeroClipboard.swf',
          trustedDomains: ['*'],
          allowScriptAccess: 'always',
          forceHandCursor: true
      });

      return {
          restric: 'A',
          scope: { clipCopy: '=clipCopy' },
          template: '<div class="tooltip fade right in"><div class="tooltip-arrow"></div><div class="tooltip-inner">Copied!</div></div>',
          link: function (scope, elm) {
              const clip = new ZeroClipboard(elm);

              clip.on('load', client => {
                  const onMousedown = client => {
                      client.setText(scope.clipCopy);
                  };

                  client.on('mousedown', onMousedown);

                  scope.$on('$destroy', () => {
                      client.off('mousedown', onMousedown);
                  });
              });

              clip.on('noFlash wrongflash', () => elm.remove());
          }
      };
  });
