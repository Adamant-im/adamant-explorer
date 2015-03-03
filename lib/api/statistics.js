var request = require('request'),
    async = require('async');

module.exports = function (app) {
    function Blocks () {
        this.maxOffset = 200; // 300 (5 Hours)

        this.url = function (offset, limit) {
            return url("/api/blocks?&orderBy=height:desc", offset, limit);
        },

        this.best = function (blocks, bestBlock, cb) {
            if (any(blocks)) {
                for (var i = 0; i < blocks.length; i++) {
                    var newBlock = blocks[i];

                    if (bestBlock) {
                        var bestAmount = bestBlock.totalAmount + bestBlock.totalFee,
                            newAmount = newBlock.totalAmount + newBlock.totalFee;

                        if (bestAmount < newAmount) {
                            bestBlock = newBlock;
                        }
                    } else {
                        bestBlock = newBlock;
                    }
                }
                return cb({ found: false, bestBlock: bestBlock });
            } else {
                return cb({ found: true });
            }
        }
    }

    this.getBestBlock = function (error, success) {
        var offset    = 0,
            bestBlock = null,
            blocks    = new Blocks(),
            found     = false;

        async.doUntil(
            function (next) {
                request.get({
                    url: app.get("crypti address") + blocks.url(offset, 100),
                    json : true
                }, function (err, resp, body) {
                    if (err || resp.statusCode != 200) {
                        return next(err || "Status code is not equal 200");
                    } else {
                        blocks.best(body.blocks, bestBlock, function (res) {
                            bestBlock = res.bestBlock;
                            found     = res.found;
                        });
                    }

                    return next();
                });
            },
            function () {
                offset += 100;
                found   = (offset > blocks.maxOffset);

                return found;
            },
            function (err) {
                if (err) {
                    console.log("Error retrieving best block: " + err);
                    return error({ success: false });
                } else {
                    return success({ success: true, block: bestBlock });
                }
            }
        )
    }

    this.getLastBlock = function (error, success) {
        var blocks = new Blocks();

        request.get({
            url: app.get("crypti address") + blocks.url(null, 1),
            json : true
        }, function (err, resp, body) {
            if (err || resp.statusCode != 200) {
                return next(err || "Status code is not equal 200");
            } else if (any(body.blocks)) {
                return success({ success: true, block: body.blocks[0] });
            } else {
                return error({ success: false });
            }
        });
    }

    function Transactions () {
        this.maxOffset = 200; // 300
        this.list      = []

        this.url = function (offset, limit) {
            return url("/api/transactions?orderBy=timestamp:desc", offset, limit);
        }

        this.collect = function (transactions) {
            this.list = this.list.concat(transactions);
        }

        this.volume = function () {
            var amount = 0;

            if (any(this.list)) {
                for (var i = 0; i < this.list.length; i++) {
                    var transaction = this.list[i];

                    amount += transaction.amount + transaction.fee;
                }
            }

            return amount;
        }

        this.beginning = function () {
            if (any(this.list)) {
                return this.list[this.list.length - 1].timestamp;
            }
        }

        this.end = function (transactions) {
            if (any(this.list)) {
                return this.list[0].timestamp;
            }
        }
    }

    this.getVolume = function (error, success) {
        var offset       = 0,
            transactions = new Transactions(),
            found        = false;

        async.doUntil(
            function (next) {
                request.get({
                    url: app.get("crypti address") + transactions.url(offset, 100),
                    json : true
                }, function (err, resp, body) {
                    if (err || resp.statusCode != 200) {
                        return next(err || "Status code is not equal 200");
                    } else if (any(body.transactions)) {
                        transactions.collect(body.transactions);
                        found = false;
                    } else {
                        found = true;
                    }

                    return next();
                });
            },
            function () {
                offset += 100;
                found   = (offset > transactions.maxOffset);

                return found;
            },
            function (err) {
                if (err) {
                    console.log("Error retrieving transaction volume: " + err);
                    return error({ success: false });
                } else {
                    return success({
                        success: true,
                        amount: transactions.volume(),
                        beginning: transactions.beginning(),
                        end: transactions.end()
                    });
                }
            }
        )
    }

    function Peers () {
        this.maxOffset = 900; // 1000

        this.list = {
            connected:    [], // 1
            disconnected: []  // 2
        }

        this.url = function (offset, limit) {
            return url("/api/peers?orderBy=ip:asc", offset, limit);
        },

        this.collect = function (peers) {
            var i = 0, self = this;

            async.doUntil(
                function (next) {
                    self.process(peers[i], next);
                },
                function () {
                    i += 1;

                    return (i + 1) > peers.length;
                },
                function (err) {
                    if (err) {
                        console.log("Error collecting peers: " + err);
                        return [];
                    } else {
                        return peers;
                    }
                }
            );
        }

        this.process = function (p, next) {
            p.dottedQuad = num2ip(p.ip);
            p.osBrand    = osBrand(p.os);

            switch(parseInt(p.state)) {
                case 1:
                    p.humanState = 'Disconnected';
                    this.list.disconnected.push(p);
                    return next();
                case 2:
                    p.humanState = 'Connected';
                    this.list.connected.push(p);
                    geoLocate(p.dottedQuad, function(res) {
                        p.location = res;
                        return next();
                    });
                default:
                    return next();
            }
        }

        // Private

        var num2ip = function (num) {
            if (isNaN(num)) {
                return '0.0.0.0';
            } else {
                var ip = num % 256;

                for (var i = 3; i > 0; i--) {
                    num = Math.floor(num / 256);
                    ip  = num % 256 + '.' + ip;
                }

                return ip;
            }
        }

        var osBrand = function (os) {
          if (os.match(/darwin[0-9]+/i)) {
              return 0; // OS-X
          } else if (os.match(/linux[0-9]+/i)) {
              return 1; // Linux
          } else if (os.match(/win[0-9]+/i)) {
              return 2; // Windows
          } else {
              return 3; // Unknown
          }
        }

        var geoLocate = function(ip, cb) {
            request.get({
                url: app.get("freegeoip address") + '/json/' + ip,
                json : true
            }, function (err, resp, body) {
                if (err || resp.statusCode != 200) {
                    return cb(null);
                } else {
                    return cb(body);
                }
            });
        }
    }

    this.getPeers = function (error, success) {
        var offset = 0,
            peers  = new Peers(),
            found  = false;

        async.doUntil(
            function (next) {
                request.get({
                    url: app.get("crypti address") + peers.url(offset, 100),
                    json : true
                }, function (err, resp, body) {
                    if (err || resp.statusCode != 200) {
                        return next(err || "Status code is not equal 200");
                    } else if (any(body.peers)) {
                        found = false;
                        peers.collect(body.peers);
                    } else {
                        found = true;
                    }
                    return next();
                });
            },
            function () {
                offset += 100;
                found   = (offset > peers.maxOffset);

                return found;
            },
            function (err) {
                if (err) {
                    console.log("Error retrieving peers: " + err);
                    return error({ success: false });
                } else {
                    return success({ success: true, list: peers.list });
                }
            }
        )
    }

    // Private

    var any = function (array) {
        return (Array.isArray(array) && array.length > 0);
    }

    var url = function (url, offset, limit) {
        if (!isNaN(offset)) {
            url += "&offset=" + offset;
        }
        if (!isNaN(limit)) {
            url += "&limit=" + limit;
        }

        return url;
    }
}
