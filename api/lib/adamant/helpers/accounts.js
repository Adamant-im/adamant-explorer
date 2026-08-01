const { isAdamantAddress, isPublicKey, parseIntegerParameter } = require('./validation');

/**
 * Validate account address
 * @param {*} address Candidate address
 * @returns {boolean} Whether the address is valid
 */
function validateAddress(address) {
  return isAdamantAddress(address);
}

/**
 * Validate account public key
 * @param {*} publicKey Candidate public key
 * @returns {boolean} Whether the public key is valid
 */
function validatePublicKey(publicKey) {
  return isPublicKey(publicKey);
}

/**
 * Parse a non-negative integer or return a default value.
 *
 * Retained for internal compatibility. Public handlers use explicit bounds.
 * @param {*} value Candidate integer
 * @param {number} defaultValue Value returned for invalid input
 * @returns {number} Parsed integer or the default
 */
function param(value, defaultValue) {
  try {
    return parseIntegerParameter(value, {
      name: 'integer',
      defaultValue,
    });
  } catch {
    return defaultValue;
  }
}

module.exports = {
  validateAddress,
  validatePublicKey,
  param,
};
