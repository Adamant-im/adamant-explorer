const { TRANSACTION_TYPES } = require('../../../transactionTypes.mjs');

/**
 * Select transaction ids by a boolean semantic flag from the shared
 * protocol registry.
 * @param {'publicOperation'|'transfer'|'service'} flag Registry flag
 * @returns {Array<number>} Numeric transaction type ids
 */
function typesWith(flag) {
  return TRANSACTION_TYPES.filter((definition) => definition[flag]).map(
    (definition) => definition.type,
  );
}

const PUBLIC_OPERATION_TYPES = Object.freeze(typesWith('publicOperation'));
const TRANSFER_TYPES = Object.freeze(typesWith('transfer'));
const SERVICE_TYPES = Object.freeze(typesWith('service'));
const PUBLIC_OPERATION_TYPE_SET = new Set(PUBLIC_OPERATION_TYPES);

/**
 * Whether a transaction type is visible in the latest public operations.
 * @param {number|string} type Transaction type id
 * @returns {boolean} True for public operation types
 */
function isPublicOperationType(type) {
  return PUBLIC_OPERATION_TYPE_SET.has(Number(type));
}

module.exports = {
  TRANSACTION_TYPES,
  PUBLIC_OPERATION_TYPES,
  TRANSFER_TYPES,
  SERVICE_TYPES,
  isPublicOperationType,
};
