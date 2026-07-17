'use strict';

/**
 * Validate the peer geo-location configuration.
 * @param {Object} value Candidate `geoLocation` config section
 * @returns {string|null} Validation error, or `null` when the section is valid
 */
function validateGeoLocationConfig(value) {
  if (typeof value.enabled !== 'boolean') {
    return 'Field "geoLocation.enabled" must be Boolean';
  }

  if (value.provider !== 'geojs') {
    return 'Field "geoLocation.provider" must be "geojs"';
  }

  if (!Number.isInteger(value.timeout) || value.timeout <= 0) {
    return 'Field "geoLocation.timeout" must be a positive integer';
  }

  return null;
}

module.exports = {
  validateGeoLocationConfig,
};
