'use strict';

var ZeroClipboard = window.ZeroClipboard;

angular.module('lisk_explorer')
  .directive('clipCopy', function () {
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
              var clip = new ZeroClipboard(elm);

              clip.on('load', function (client) {
                  var onMousedown = function (client) {
                      client.setText(scope.clipCopy);
                  };

                  client.on('mousedown', onMousedown);

                  scope.$on('$destroy', function () {
                      client.off('mousedown', onMousedown);
                  });
              });

              clip.on('noFlash wrongflash', function () {
                  return elm.remove();
              });
          }
      };
  });
