import AppTools from '../app/app-tools.module.js';
import QrCodeWithLogo from 'qr-code-with-logo'

AppTools.directive('qrcode', () => {
    const QrcodeLinK = ($scope, $element, $attrs) => {
        const myCanvas = document.createElement('canvas')
        window.el = $element;
        $element[0].append(myCanvas);
        window.can = myCanvas;
        QrCodeWithLogo.toCanvas({
            canvas: myCanvas,
            content: $attrs.data,
            width: 220,
            logo: {
                logoSize: 0.25,
                borderSize:0.02,
                src: $attrs.img_logo || 'https://newexplorer.adamant.im/9633cf0868a9a6e61fba65bc3d43aa8c.png',
                radius: 50
            }
        })

    }
    return {
        link: QrcodeLinK
    }
});