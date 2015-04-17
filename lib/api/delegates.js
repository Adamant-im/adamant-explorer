var request = require('request');

module.exports = function (app) {
    function Active () {
        this.getActive = function (cb) {
            request.get({
                url : app.get("crypti address")
                    + "/api/delegates/?orderBy=rate:asc&limit=101",
                json : true
            }, function (err, response, body) {
                if (err || response.statusCode != 200) {
                    return cb(err || "Status code is not equal 200");
                } else if (body.success == true) {
                    return cb(null, body.delegates);
                } else {
                    return cb(body.error);
                }
            });
        }

        this.getForged = function (delegate, cb) {
            request.get({
                url : app.get("crypti address")
                    + "/api/delegates/forging/getForgedByAccount?generatorPublicKey=" + delegate.publicKey,
                json : true
            }, function (err, response, body) {
                if (err || response.statusCode != 200) {
                    return cb(err || "Status code is not equal 200");
                } else if (body.success == true) {
                    delegate.fees = body.fees;
                    return cb();
                } else {
                    return cb(body.error);
                }
            });
        }
    }

    this.getActive = function (error, success) {
        var delegates = new Active();

        async.waterfall([
            function (cb) {
                delegates.getActive(cb);
            },
            function (result, cb) {
                async.each(result, function (delegate, callback) {
                    delegates.getForged(delegate, callback);
                }, function (err) {
                    if (err) {
                        return cb(err);
                    } else {
                        return cb(null, result);
                    }
                });
            },
        ], function (err, result) {
            if (err) {
                return error({ success : false, error : err });
            } else {
                return success({ success : true, delegates : result });
            }
        });
    }

    function Standby (n) {
        this.limit        = 20;
        this.offset       = parseInt(n);
        this.actualOffset = (isNaN(this.offset)) ? 101 : this.offset + 101;

        this.pagination = function (totalCount) {
            var pagination = {};
            pagination.currentPage = parseInt(this.offset / this.limit) + 1;

            var totalPages = parseInt(totalCount / this.limit);
            if (totalPages < totalCount / this.limit) { totalPages++; }

            if (pagination.currentPage > 1) {
                pagination.before = true;
                pagination.previousPage = pagination.currentPage - 1;
            }

            if (pagination.currentPage < totalPages) {
                pagination.more = true;
                pagination.nextPage = pagination.currentPage + 1;
            }

            return pagination;
        }
    }

    this.getStandby = function (n, error, success) {
        var delegates = new Standby(n);

        request.get({
            url : app.get("crypti address")
                + "/api/delegates/?orderBy=rate:asc"
                + "&limit="  + delegates.limit
                + "&offset=" + delegates.actualOffset,
            json : true
        }, function (err, response, body) {
            if (err || response.statusCode != 200) {
                return error({ success : false });
            } else if (body.success == true) {
                body.totalCount = (body.totalCount - 101);
                body.pagination = delegates.pagination(body.totalCount);
                return success(body);
            } else {
                return error({ success : false });
            }
        });
    }
}
