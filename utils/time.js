var moment = require('moment');

module.exports = {
    getTime : function (timestamp) {
        var d = new Date(Date.UTC(2014, 4, 2, 0, 0, 0, 0));
        var t = d.getTime();
        return parseInt((timestamp - t) / 1000);
    }
}
