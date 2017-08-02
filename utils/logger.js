'use strict';
var safeStringify = require('fast-safe-stringify');
var fs = require('fs');
var flatstr = require('flatstr');
var newConsole = require('console').Console;
var config = require('../config');
var output = fs.createWriteStream(config.log.file, { flags: 'a' });
var myConsole = new newConsole(output, output);

var levels = {
  'trace': 0,
  'debug': 1,
  'info': 2,
  'warn': 3,
  'error': 4,
};

var logger = {};

logger.doLog = function doLog(level, msg, extra) {

  if (config.log.enabled) {
    var timestamp = Date.now();

    var stringMsg = typeof msg === 'string' ? msg : JSON.stringify(msg);
    var parsedMsg = stringMsg.replace(/(\r\n|\n|\r)/gm, ' ');

    if (extra) {
      var stringExtra = typeof extra === 'string' ? extra : JSON.stringify(extra);
      var parsedExtra = stringExtra.replace(/(\r\n|\n|\r)/gm, ' ');
      myConsole.log(flatstr(safeStringify({ level: level, timestamp: timestamp, message: msg + ' ' + parsedExtra})));
    } else {
      myConsole.log(flatstr(safeStringify({ level: level, timestamp: timestamp, message: msg})));
    }
  }

};

logger.trace = function trace(msg, extra) {
  if (levels[config.log.level] <= 0) {
    logger.doLog('TRACE', msg, extra);
  }
};

logger.debug = function debug(msg, extra) {
  if (levels[config.log.level] <= 1) {
    logger.doLog('DEBUG', msg, extra);
  }
};

logger.info = function info(msg, extra) {
  if (levels[config.log.level] <= 2) {
    logger.doLog('INFO', msg, extra);
  }
};

logger.warn = function warn(msg, extra) {
  if (levels[config.log.level] <= 3) {
    logger.doLog('WARN', msg, extra);
  }
};

logger.error = function error(msg, extra) {
  if (levels[config.log.level] <= 4) {
    logger.doLog('ERROR', msg, extra);
  }
};

module.exports = logger;
