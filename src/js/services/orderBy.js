'use strict';

var OrderBy = function (predicate) {
    this.reverse   = false;
    this.predicate = predicate;

    this.order = function (predicate) {
        this.reverse = (this.predicate === predicate) ? !this.reverse : false;
        this.predicate = predicate;
    };
};

angular.module('lisk_explorer.system').factory('orderBy',
  function () {
      return function (predicate) {
          return new OrderBy(predicate);
      };
  });
