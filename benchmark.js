const Benchmark = require('benchmark');
const suite = new Benchmark.Suite('api');

const express = require('express');
const _ = require('lodash');
const logger = require('./utils/log');
const config = require('./modules/configReader');
config.enableExchange = false;

const benchmarks = require('./benchmarks');
const utils = require('./utils');

const app = express();
app.exchange = new utils.exchange(config);
app.knownAddresses = utils.knownAddresses;

app.set('freegeoip address', 'http://' + config.freegeoip.host + ':' + config.freegeoip.port);

const tests = new benchmarks(app);

suite
  .add('accounts.getAccount', tests.accounts.getAccount, {defer: true})
  .add('accounts.getTopAccounts', tests.accounts.getTopAccounts, {defer: true});

suite
  .add('blocks.getLastBlocks', tests.blocks.getLastBlocks, {defer: true})
  .add('blocks.getBlock', tests.blocks.getBlock, {defer: true})
  .add('blocks.getBlockStatus', tests.blocks.getBlockStatus, {defer: true});


//  common.getTicker is disabled as all exchange functions are disabled
suite
  // .add('common.getTicker', tests.common.getTicker, {defer: true})
  .add('common.search', tests.common.search, {defer: true});

suite
  .add('delegates.getActive', tests.delegates.getActive, {defer: true})
  .add('delegates.getStandby', tests.delegates.getStandby, {defer: true})
  .add('delegates.getLatestRegistrations', tests.delegates.getLatestRegistrations, {defer: true})
  .add('delegates.getLatestVotes', tests.delegates.getLatestVotes, {defer: true})
  .add('delegates.getLastBlock', tests.delegates.getLastBlock, {defer: true});

suite
  .add('statistics.getBlocks', tests.statistics.getBlocks, {defer: true, minSamples: 3})
  .add('statistics.getLastBlock', tests.statistics.getLastBlock, {defer: true})
  .add('statistics.getPeers', tests.statistics.getPeers, {defer: true, minSamples: 3});

suite
  .add('transactions.getTransaction', tests.transactions.getTransaction, {defer: true})
  .add('transactions.getUnconfirmedTransactions', tests.transactions.getUnconfirmedTransactions, {defer: true})
  .add('transactions.getLastTransactions', tests.transactions.getLastTransactions, {defer: true})
  .add('transactions.getTransactionsByAddress', tests.transactions.getTransactionsByAddress, {defer: true})
  .add('transactions.getTransactionsByBlock', tests.transactions.getTransactionsByBlock, {defer: true});

suite
  .on('cycle', (event) => {
    logger.log(String(event.target));
  })
  .on('complete', function () {
    logger.log('Slowest is ' + _.map(this.filter('slowest'), 'name'));
    logger.log('Fastest is ' + _.map(this.filter('fastest'), 'name'));
    logger.log('Done :)');
  });

logger.log('Running benchmarks...');
suite.run({'async': false});
