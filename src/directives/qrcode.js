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
            content: $attrs.data.toUpperCase(),
            width: 220,
            logo: {
                src: $attrs.imd_src || 'https://newexplorer.adamant.im/9633cf0868a9a6e61fba65bc3d43aa8c.png',
                borderSize: 0,
                borderRadius: 50,
                logoSize: 0.25
            }
        })
        window.qr = (opt) => {
            opt.src = 'https://newexplorer.adamant.im/9633cf0868a9a6e61fba65bc3d43aa8c.png';
            QrCodeWithLogo.toCanvas({
                canvas: myCanvas,
                content: $attrs.data.toUpperCase(),
                width: 220,
                logo: opt
            })
            console.log('Ok')
        }

    }
    return {
        link: QrcodeLinK
    }
});