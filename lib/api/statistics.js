var request = require('request'),
    _ = require('underscore'),
    async = require('async'),
    dns = require('dns');

module.exports = function (app) {
    function Blocks () {
        this.maxOffset = 8600; // 8700
        this.maxCount  = 8640; // 24 hours

        this.best = {
            block  : null,
            amount : 0
        }

        this.volume = {
            amount    : 0,
            blocks    : 0,
            txs       : 0,
            withTxs   : 0,
            beginning : null,
            end       : null
        }

        this.url = function (offset, limit) {
            return url("/api/blocks?&orderBy=height:desc", offset, limit);
        },

        this.inspect = function (blocks, offset) {
            if (_.size(blocks) <= 0) { return; }

            for (var i = 0; i < blocks.length; i++) {
                if (this.volume.blocks >= this.maxCount) { break; }

                var newBlock = blocks[i],
                    newAmount = (newBlock.totalAmount + newBlock.totalFee);

                this.volume.blocks += 1;
                this.volume.txs    += newBlock.numberOfTransactions;
                this.volume.amount += newAmount;

                if (newAmount > 0) {
                    this.volume.withTxs += 1;

                    if (newAmount > this.best.amount) {
                        this.best.block  = newBlock;
                        this.best.amount = newAmount;
                    }
                }
            }

            if (offset == 0) {
                this.volume.beginning = blocks[blocks.length - 1].timestamp;
            } else if (offset == this.maxOffset) {
                this.volume.end = blocks[0].timestamp;
            }
        }
    }

    this.getBlocks = function (error, success) {
        var offset = 0,
            limit  = 100,
            blocks = new Blocks();

        async.doUntil(
            function (next) {
                request.get({
                    url: app.get("crypti address") + blocks.url(offset, limit),
                    json : true
                }, function (err, resp, body) {
                    if (err || resp.statusCode != 200) {
                        return next(err || "Response was unsuccessful");
                    }

                    blocks.inspect(body.blocks, offset);
                    return next();
                });
            },
            function () {
                offset += limit;

                return (offset > blocks.maxOffset);
            },
            function (err) {
                if (err) {
                    console.log("Error retrieving blocks: " + err);
                    return error({ success: false });
                } else {
                    return success({
                        success: true,
                        best: blocks.best.block,
                        volume : blocks.volume
                    });
                }
            }
        )
    }

    this.getLastBlock = function (error, success) {
        var blocks = new Blocks();

        request.get({
            url: app.get("crypti address") + blocks.url(0, 1),
            json : true
        }, function (err, resp, body) {
            if (err || resp.statusCode != 200) {
                return error({ success: false });
            }

            if (_.size(body.blocks) > 0) {
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

            if (_.size(this.list) > 0) {
                for (var i = 0; i < this.list.length; i++) {
                    var transaction = this.list[i];

                    amount += transaction.amount + transaction.fee;
                }
            }

            return amount;
        }

        this.beginning = function () {
            if (_.size(this.list) > 0) {
                return this.list[this.list.length - 1].timestamp;
            }
        }

        this.end = function (transactions) {
            if (_.size(this.list) > 0) {
                return this.list[0].timestamp;
            }
        }
    }

    function Locator () {
        this.locate = function (ip, cb) {
            var location = null;

            if (location = cache[ip]) {
                console.log('Locator:', 'Using cached location for:', ip);
                return cb(location);
            } else {
                console.log('Locator:', 'Requesting new location for:', ip);
                return getLocation(ip, cb);
            }
        }

        this.update = function (ips) {
            for (var ip in cache) {
                if (ips.indexOf(ip) == -1) {
                    console.log('Locator', 'Removing stale location:', ip);
                    delete cache[ip];
                }
            }
        }

        // Private

        var cache = {};

        var getLocation = function (ip, cb) {
            async.parallel([
                function (callback) { getFreegeoip(ip, callback); },
                function (callback) { getHostName(ip, callback); }
            ],
            function (err, res) {
                if (err) {
                    console.error('Error:', err);
                }

                var data          = res[0] || {};
                    data.hostname = res[1];

                cache[ip] = data;
                return cb(data);
            });
        }

        var getFreegeoip = function (ip, cb) {
            request.get({
                url: app.get("freegeoip address") + '/json/' + ip,
                json : true
            }, function (err, resp, body) {
                if (err || resp.statusCode != 200) {
                    console.error('Locator:', 'Failed to get new location for:', ip);
                    return cb(err);
                } else {
                    return cb(null, body);
                }
            });
        }

        var getHostName = function (ip, cb) {
            dns.reverse(ip, function (err, hostnames) {
                if (err) {
                    console.error('Locator:', 'Failed to get new hostname for:', ip);
                    var hostname = null;
                } else {
                    var hostname = hostnames[0];
                }
                return cb(err, hostname);
            });
        }
    }

    this.locator = new Locator();

    function Peers (locator) {
        this.maxOffset = 900; // 1000

        this.list = {
            connected:    [], // 1
            disconnected: []  // 2
        }

        this.ips       = [];
        this.locations = locator;

        this.url = function (offset, limit) {
            return url("/api/peers?orderBy=ip:asc", offset, limit);
        }

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
            p.osBrand = osBrand(p.os);
            this.ips.push(p.ip);

            switch (parseInt(p.state)) {
                case 1:
                    p.humanState = 'Disconnected';
                    this.list.disconnected.push(p);
                    return next();
                case 2:
                    p.humanState = 'Connected';
                    this.list.connected.push(p);
                    this.locations.locate(p.ip, function (res) {
                        p.location = res;
                        return next();
                    });
                default:
                    return next();
            }
        }

        // Private

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
    }

    this.getPeers = function (error, success) {
        var offset = 0,
            limit  = 100,
            peers  = new Peers(this.locator),
            found  = false;

        async.doUntil(
            function (next) {
                request.get({
                    url: app.get("crypti address") + peers.url(offset, limit),
                    json : true
                }, function (err, resp, body) {
                    if (err || resp.statusCode != 200) {
                        return next(err || "Response was unsuccessful");
                    }

                    if (_.size(body.peers) > 0) {
                        peers.collect(body.peers);
                    } else {
                        found = true;
                    }

                    return next();
                });
            },
            function () {
                offset += limit;

                return found || (offset > peers.maxOffset);
            },
            function (err) {
                peers.locations.update(peers.ips);

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
