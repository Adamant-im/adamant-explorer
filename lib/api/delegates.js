var request = require('request');

module.exports = function (app) {
    this.getDelegate = function (publicKey, error, success) {
        if (!publicKey) {
            return error({ success : false });
        }
        request.get({
            url : app.get("crypti address")
                + "/api/delegates/get?publicKey=" + publicKey,
            json : true
        }, function (err, response, body) {
            if (err || response.statusCode != 200) {
                return error({ success : false });
            } else if (body.success == true) {
                return success({ success : true, delegate : body.delegate });
            } else {
                return error({ success : false });
            }
        });
    }

    this.getForgedByAccount = function (publicKey, error, success) {
        if (!publicKey) {
            return error({ success : false });
        }
        request.get({
            url : app.get("crypti address")
                + "/api/delegates/forging/getForgedByAccount?generatorPublicKey=" + publicKey,
            json : true
        }, function (err, response, body) {
            if (err || response.statusCode != 200) {
                return error({ success : false });
            } else if (body.success == true) {
                return success({ success : true, fees : body.fees });
            } else {
                return error({ success : false });
            }
        });
    }
}
