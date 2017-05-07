import FooterApp from './footer.module';
import template from './footer.html';

const FooterLink = () => {};

FooterApp.directive('mainFooter', () => {
    return {
        restrict: 'E',
        link: FooterLink,
        template,
    }
});
