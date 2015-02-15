var request = require('request'),
	async = require('async');

module.exports = function (app) {
	app.get('/api/statistics/getActiveNodes', function (req, res) {
		var offset = 0,
			peers = [],
			found = false;

		async.doUntil(
			function (next) {
				request.get(req.crypti + "/api/peers?state=2&orderBy=ip:asc&limit=100&offset=" + offset, function (err, resp, body) {
					if (err || resp.statusCode != 200) {
						return next(err || "Status code is not equal 200");
					}

					if (body.peers.length != 0) {
						peers = peers.concat(body.peers);
						found = true;
					} else {
						found = false;
					}

					return next();
				});
			},
			function () {
				offset += 100;
				return found;
			},
			function (err) {
				if (err) {
					console.log("Error in active peers: " + err);
					return res.json({success: false});
				}

				return res.json({success: true, count: peers.length});
			}
		)
	});

	app.get('/api/statistics/getBestBlock', function (req, res) {
		var offset = 0,
			bestBlock = null,
			found = false;

		async.doUntil(
			function (next) {
				request.get(req.crypti + "/api/blocks?&orderBy=height:desc&limit=100&offset=" + offset, function (err, resp, body) {
					if (err || resp.statusCode != 200) {
						return next(err || "Status code is not equal 200");
					}

					if (body.blocks.length != 0) {
						for (var i = 0; i < body.blocks.length; i++) {
							var block = body.blocks[i];


							if (bestBlock) {
								var bestAmount = bestAmount.totalAmount + bestBlock.totalFee,
									newAmount = block.totalAmount + block.totalFee;

								if (bestAmount < newAmount) {
									bestBlock = block;
								}
							} else {
								bestBlock = block;
							}
						}
						found = true;
					} else {
						found = false;
					}

					return next();
				});
			},
			function () {
				offset += 100;

				if (offset > 924) {
					return false;
				}

				return found;
			},
			function (err) {
				if (err) {
					console.log("Error in best block: " + err);
					return res.json({success: false});
				}

				return res.json({success: true, id: bestBlock.id});
			}
		)
	});

	app.get('/api/statistics/getLastBlockTime', function (req, res) {
		request.get(req.crypti + "/api/blocks?&orderBy=height:desc&limit=1", function (err, resp, body) {
			if (err || resp.statusCode != 200) {
				return next(err || "Status code is not equal 200");
			}

			if (body.blocks.length != 0) {
				return res.json({success: true, timestamp: body.blocks[0].timestamp});
			} else {
				return res.json({success: false});
			}
		});
	});

	app.get('/api/statistics/getCountOfTransactions', function (req, res) {
		// count of transaction for last 24 hours
	});

	app.get('/api/statistics/getPeers', function (req, res) {
		var offset = 0,
			peers = [],
			found = false;

		async.doUntil(
			function (next) {
				request.get(req.crypti + "/api/peers?orderBy=ip:asc&limit=100&offset=" + offset, function (err, resp, body) {
					if (err || resp.statusCode != 200) {
						return next(err || "Status code is not equal 200");
					}

					if (body.peers.length != 0) {
						peers = peers.concat(body.peers);
						found = true;
					} else {
						found = false;
					}

					return next();
				});
			},
			function () {
				offset += 100;
				return found;
			},
			function (err) {
				if (err) {
					console.log("Error in active peers: " + err);
					return res.json({success: false});
				}

				return res.json({success: true, peers: peers});
			}
		)
	});
}