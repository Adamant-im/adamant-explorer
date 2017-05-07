import AppServices from './services.module';

const OrderBy = function (predicate) {
    this.reverse   = false;
    this.predicate = predicate;

    this.order = function (predicate) {
        this.reverse = (this.predicate === predicate) ? !this.reverse : false;
        this.predicate = predicate;
    };
};

AppServices.factory('orderBy',
  () => predicate => new OrderBy(predicate));
