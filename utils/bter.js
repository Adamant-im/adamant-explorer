var bter = require('./bter-api');


module.exports = {
    getBTCUSD : function (cb) {
        bter.getTicker({ CURR_A: 'btc', CURR_B: 'usd' }, function(err, result) {
            cb(err, result.avg);
        });
    },

    getXCRBTC : function (cb) {
        bter.getTicker({CURR_A: 'xcr', CURR_B: 'btc'}, function (err, result) {
            cb(err, result.avg);
        });
    },

    convertXCRTOUSD : function (xcr, btc, usd) {
        return (xcr * btc * usd);
    }
}