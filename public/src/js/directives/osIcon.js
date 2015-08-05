'use strict';

angular.module('cryptichain')
  .directive('osIcon', function () {
      return {
          restric: 'A',
          replace: true,
          template: '<span class="os-icon os-"></span>',
          link: function (scope, elm, attr) {
              elm[0].alt = elm[0].title = attr.os;
              elm[0].className = elm[0].className + attr.brand;
          }
      };
  });
