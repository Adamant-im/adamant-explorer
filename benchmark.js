'use strict';

var Benchmark = require('benchmark'),
    suite = new Benchmark.Suite('api');

var express = require('express'),
    config = require('./config');
    config.enableExchange = false;

var api = require('./lib/api'),
    benchmarks = require('./benchmarks'),
    utils = require('./utils');

var app = express();
app.exchange = new utils.exchange(config);
app.knownAddresses = new utils.knownAddresses();
app.knownAddresses.load();

app.set('lisk address', 'http://' + config.lisk.host + ':' + config.lisk.port);
app.set('freegeoip address', 'http://' + config.freegeoip.host + ':' + config.freegeoip.port);

////////////////////////////////////////////////////////////////////////////////

var tests = new benchmarks(app, api);

suite.add('accounts.getAccount', tests.accounts.getAccount, { defer : true })
     .add('accounts.getTopAccounts', tests.accounts.getTopAccounts, { defer : true });

suite.add('blocks.getLastBlocks', tests.blocks.getLastBlocks, { defer : true })
     .add('blocks.getBlock', tests.blocks.getBlock, { defer : true })
     .add('blocks.getBlockStatus', tests.blocks.getBlockStatus, { defer : true });

suite.add('common.getTicker', tests.common.getTicker, { defer : true })
     .add('common.search', tests.common.search, { defer : true });

suite.add('delegates.getActive', tests.delegates.getActive, { defer : true })
     .add('delegates.getStandby', tests.delegates.getStandby, { defer : true })
     .add('delegates.getLatestRegistrations', tests.delegates.getLatestRegistrations, { defer : true })
     .add('delegates.getLatestVotes', tests.delegates.getLatestVotes, { defer : true })
     .add('delegates.getLastBlock', tests.delegates.getLastBlock, { defer : true });

suite.add('statistics.getBlocks', tests.statistics.getBlocks, { defer : true, minSamples : 3 })
     .add('statistics.getLastBlock', tests.statistics.getLastBlock, { defer : true })
     .add('statistics.getPeers', tests.statistics.getPeers, { defer : true, minSamples : 3 });

suite.add('transactions.getTransaction', tests.transactions.getTransaction, { defer : true })
     .add('transactions.getUnconfirmedTransactions', tests.transactions.getUnconfirmedTransactions, { defer : true })
     .add('transactions.getLastTransactions', tests.transactions.getLastTransactions, { defer : true })
     .add('transactions.getTransactionsByAddress', tests.transactions.getTransactionsByAddress, { defer : true })
     .add('transactions.getTransactionsByBlock', tests.transactions.getTransactionsByBlock, { defer : true });

suite.on('cycle', function (event) {
   console.log(String(event.target));
})
.on('complete', function () {
   console.log('Slowest is ' + this.filter('slowest').pluck('name'));
   console.log('Fastest is ' + this.filter('fastest').pluck('name'));
   console.log('Done :)');
});

console.log('Running benchmarks...');
suite.run({ 'async': false });
