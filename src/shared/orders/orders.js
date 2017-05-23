import AppTools from '../../app/app-tools.module';
import template from './orders.html';

const orders = AppTools.directive('orders', () => ({
    restrict: 'E',
    scope: {
        orders: '=orders',
        heading: '@heading',
        name: '@name'
    },
    template,
    replace: true
}));

export default orders;
