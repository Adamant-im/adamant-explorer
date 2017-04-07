'use strict';

const OrderBy = function (predicate) {
    this.reverse   = false;
    this.predicate = predicate;

    this.order = function (predicate) {
        this.reverse = (this.predicate === predicate) ? !this.reverse : false;
        this.predicate = predicate;
    };
};

angular.module('lisk_explorer.system').factory('orderBy',
  () => predicate => new OrderBy(predicate));
