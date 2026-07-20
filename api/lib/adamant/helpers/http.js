'use strict';

const { SUPPORTED_API_PATHS } = require('../constants.mjs');
const supportedApiPathSet = new Set(SUPPORTED_API_PATHS);

/**
 * Check whether a URL pathname is the API root or belongs below it.
 *
 * Prefix lookalikes such as `/apiary` are deliberately excluded.
 * @param {*} path URL pathname without a query string
 * @returns {boolean} Whether API middleware should apply
 */
function isApiPath(path) {
  return typeof path === 'string' && /^\/api(?:\/|$)/i.test(path);
}

/**
 * Check whether a pathname is one of Explorer's supported exact endpoints.
 * @param {*} path URL pathname without a query string
 * @returns {boolean} Whether the path has a registered Explorer handler
 */
function isSupportedApiPath(path) {
  return typeof path === 'string' && supportedApiPathSet.has(path);
}

module.exports = {
  isApiPath,
  isSupportedApiPath,
};
