import AppTools from '../app/app-tools.module.js';
import qrcode from 'qrcode-generator';

AppTools.directive('qrcode', () => {
    const QrcodeLinK = ($scope, $element, $attrs) => {
        var typeNumber = 4;
        var errorCorrectionLevel = 'L';
        var qr = qrcode(typeNumber, errorCorrectionLevel);
        qr.addData($attrs.data);
        qr.make();
        $element.html(qr.createSvgTag());
        $element.find('svg').attr({
            viewBox:"8 7 66 69",
            width:"164",
            height:"164",
        });
    }
    return {
        link: QrcodeLinK
    }
});
