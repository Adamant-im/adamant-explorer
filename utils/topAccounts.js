var request = require('request');

module.exports = function (crypti, cb) {
    request.get({
        url : crypti + "/api/getTopAccounts",
        json: true
    }, function (err, response, body) {
        if (err || response.statusCode != 200) {
            return cb("Can't get top accounts, something invalid");
        } else {
            if (body.accounts) {
                return cb(null, body.accounts);
            } else {
                return cb("Can't get top accounts, it's empty");
            }
        }
    });
}