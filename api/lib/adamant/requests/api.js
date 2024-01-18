const config = require('../../../../modules/configReader');
const logger = require('../../../../utils/log');

module.exports = require('adamant-api')({ node: config.nodes_adm, logLevel: config.log_level }, logger);
