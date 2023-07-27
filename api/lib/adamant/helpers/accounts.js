/**
 * Validate account address
 * @param {String} address
 * @returns {Boolean}
 */
function validateAddress(address) {
  return (
    typeof address === 'string' && address.match(/^[U|u][0-9]{1,21}$/g)
  );
}

/**
 * Validate account public key
 * @param {String} publicKey
 * @returns {Boolean}
 */
function validatePublicKey(publicKey) {
  return (
    typeof publicKey === 'string' &&
    publicKey.match(/^([A-Fa-f0-9]{2}){32}$/g)
  );
}

/**
 * Parse integer or return default value
 * @param {*} p parameter
 * @param {Number} d default value
 * @returns {Number}
 */
function param(p, d) {
  p = parseInt(p);

  if (isNaN(p) || p < 0) {
    return d;
  } else {
    return p;
  }
}

module.exports = {
  validateAddress,
  validatePublicKey,
  param,
};
