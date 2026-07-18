/**
 * Protocol and UX transaction semantics used by operation lists.
 *
 * The protocol exposes numeric types, while the explorer additionally
 * derives deposit, withdrawal and unvote labels from transaction context.
 * This module is framework-free so Node unit tests can cover the mapping.
 */

/** Every transaction type currently defined by adamant-api. */
export const TRANSACTION_TYPES = Object.freeze([
  { type: 0, id: 'transfer', label: 'Transfer' },
  { type: 1, id: 'second-signature', label: 'Second signature' },
  { type: 2, id: 'create-delegate', label: 'Create delegate' },
  { type: 3, id: 'vote', label: 'Vote / Unvote' },
  { type: 4, id: 'multisignature', label: 'Multisignature' },
  { type: 5, id: 'dapp-registration', label: 'DApp registration' },
  { type: 6, id: 'dapp-deposit', label: 'DApp deposit' },
  { type: 7, id: 'dapp-withdrawal', label: 'DApp withdrawal' },
  { type: 8, id: 'message', label: 'Message' },
  { type: 9, id: 'state', label: 'State' },
]);

/**
 * Complete user-facing operation filter list, including labels derived
 * from transfer and vote direction.
 */
export const OPERATION_TYPE_OPTIONS = Object.freeze([
  { id: 'transfer', label: 'Transfer' },
  { id: 'deposit', label: 'Deposit' },
  { id: 'withdraw', label: 'Withdraw' },
  { id: 'second-signature', label: 'Second signature' },
  { id: 'create-delegate', label: 'Create delegate' },
  { id: 'vote', label: 'Vote' },
  { id: 'unvote', label: 'Unvote' },
  { id: 'multisignature', label: 'Multisignature' },
  { id: 'dapp-registration', label: 'DApp registration' },
  { id: 'dapp-deposit', label: 'DApp deposit' },
  { id: 'dapp-withdrawal', label: 'DApp withdrawal' },
  { id: 'message', label: 'Message' },
  { id: 'state', label: 'State' },
]);

const TYPE_META = {
  transfer: { label: 'Transfer', tone: 'green', icon: 'transfer' },
  deposit: { label: 'Deposit', tone: 'green', icon: 'deposit' },
  withdraw: { label: 'Withdraw', tone: 'red', icon: 'withdraw' },
  'second-signature': { label: 'Second signature', tone: 'blue', icon: 'signature' },
  'create-delegate': { label: 'Create delegate', tone: 'blue', icon: 'delegate' },
  vote: { label: 'Vote', tone: 'violet', icon: 'vote' },
  unvote: { label: 'Unvote', tone: 'orange', icon: 'vote' },
  multisignature: { label: 'Multisignature', tone: 'blue', icon: 'multisignature' },
  'dapp-registration': { label: 'DApp registration', tone: 'blue', icon: 'dapp' },
  'dapp-deposit': { label: 'DApp deposit', tone: 'green', icon: 'deposit' },
  'dapp-withdrawal': { label: 'DApp withdrawal', tone: 'red', icon: 'withdraw' },
  message: { label: 'Message', tone: 'neutral', icon: 'message' },
  state: { label: 'State', tone: 'neutral', icon: 'state' },
  unknown: { label: 'Unknown', tone: 'neutral', icon: 'state' },
};

/** Returns whether a vote transaction removes at least one vote. */
function isUnvote(tx) {
  if (tx.votes?.deleted?.length) {
    return true;
  }

  const votes = tx.asset?.votes;
  return Array.isArray(votes) && votes.some((vote) => String(vote).startsWith('-'));
}

/**
 * Resolves the UX operation id for a transaction.
 *
 * For regular transfers, a known exchange recipient means Deposit and a
 * known exchange sender means Withdraw. Recipient takes precedence for
 * exchange-to-exchange transfers because funds arrive at that wallet.
 *
 * @param {Object} tx Enriched transaction
 * @returns {string} Stable operation id
 */
export function operationTypeId(tx) {
  switch (Number(tx?.type)) {
    case 0:
      if (tx.knownRecipient?.kind === 'exchange') return 'deposit';
      if (tx.knownSender?.kind === 'exchange') return 'withdraw';
      return 'transfer';
    case 1:
      return 'second-signature';
    case 2:
      return 'create-delegate';
    case 3:
      return isUnvote(tx) ? 'unvote' : 'vote';
    case 4:
      return 'multisignature';
    case 5:
      return 'dapp-registration';
    case 6:
      return 'dapp-deposit';
    case 7:
      return 'dapp-withdrawal';
    case 8:
      return 'message';
    case 9:
      return 'state';
    default:
      return 'unknown';
  }
}

/**
 * Returns label, tone and icon metadata for a transaction.
 *
 * @param {Object} tx Enriched transaction
 * @returns {{id: string, label: string, tone: string, icon: string}} Operation metadata
 */
export function operationMeta(tx) {
  const id = operationTypeId(tx);
  return { id, ...TYPE_META[id] };
}

/**
 * Resolves a meaningful recipient for operation-list presentation.
 *
 * Delegate registrations point back to their creator, while votes point
 * to the first affected delegate. Other service operations have no
 * account recipient and return `null`.
 *
 * @param {Object} tx Enriched transaction
 * @returns {{address: string, label: string, isDelegate: boolean}|null} Recipient identity
 */
export function operationRecipient(tx) {
  const type = Number(tx?.type);

  if (type === 0 || type === 8) {
    return tx.recipientId
      ? {
          address: tx.recipientId,
          label:
            tx.recipientDelegate?.username ||
            tx.recipientUsername ||
            tx.knownRecipient?.owner ||
            tx.recipientId,
          isDelegate: Boolean(tx.recipientDelegate?.username || tx.recipientUsername),
        }
      : null;
  }

  if (type === 2) {
    return tx.senderId
      ? {
          address: tx.senderId,
          label:
            tx.asset?.delegate?.username ||
            tx.senderDelegate?.username ||
            tx.senderUsername ||
            tx.knownSender?.owner ||
            tx.senderId,
          isDelegate: true,
        }
      : null;
  }

  if (type === 3) {
    const vote = tx.votes?.deleted?.[0] || tx.votes?.added?.[0];
    const delegate = vote?.delegate;

    return delegate?.address
      ? {
          address: delegate.address,
          label: delegate.username || delegate.address,
          isDelegate: true,
        }
      : null;
  }

  return null;
}
