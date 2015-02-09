var request = require('request'),
	async = require('async');

module.exports = function (app) {
	app.get('/api/statistics/getActiveNode', function (req, res) {
		// return active nodes where is shareport = 1;
	});

	app.get('/api/statistics/getBestBlock', function (req, res) {
		// return best block for last 24 hours (with more amount and fee)
	});

	app.get('/api/statistics/getLastBlockTime', function (req, res) {
		// return last block time
	});

	app.get('/api/statistics/getCountOfTransactions', function (req, res) {
		// return count of transactions
	});

	app.get('/api/statistics/getPeers', function (req, res) {
		// return peers by page
	});
}