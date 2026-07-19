import definitions from '../../transactionTypes.mjs';

/**
 * Protocol and UX transaction semantics used by operation lists.
 *
 * The protocol exposes numeric types, while the explorer additionally
 * derives deposit, withdrawal and unvote labels from transaction context.
 * This module is framework-free so Node unit tests can cover the mapping.
 */

/** Every transaction type currently defined by adamant-api. */
export const TRANSACTION_TYPES = Object.freeze(
  definitions.map((definition) => ({ ...definition })),
);
export const TX_TYPE_LABELS = Object.freeze(
  Object.fromEntries(TRANSACTION_TYPES.map(({ type, label }) => [type, label])),
);

/**
 * Complete user-facing operation filter list, including labels derived
 * from transfer and vote direction.
 */
export const OPERATION_TYPE_OPTIONS = Object.freeze([
  { id: 'transfer', label: 'Transfer' },
  { id: 'welcome-bonus', label: 'Welcome bonus' },
  { id: 'deposit', label: 'Deposit' },
  { id: 'withdraw', label: 'Withdraw' },
  { id: 'second-signature', label: 'Second signature' },
  { id: 'create-delegate', label: 'Create delegate' },
  { id: 'vote', label: 'Vote' },
  { id: 'unvote', label: 'Unvote' },
  { id: 'vote-unvote', label: 'Vote & Unvote' },
  { id: 'multisignature', label: 'Multisignature' },
  { id: 'dapp-registration', label: 'DApp registration' },
  { id: 'dapp-deposit', label: 'DApp deposit' },
  { id: 'dapp-withdrawal', label: 'DApp withdrawal' },
  { id: 'message', label: 'Message' },
  { id: 'state', label: 'State' },
]);

const TYPE_META = {
  transfer: { label: 'Transfer', tone: 'green', icon: 'transfer' },
  'welcome-bonus': { label: 'Welcome bonus', tone: 'violet', icon: 'gift' },
  deposit: { label: 'Deposit', tone: 'green', icon: 'deposit' },
  withdraw: { label: 'Withdraw', tone: 'red', icon: 'withdraw' },
  'second-signature': { label: 'Second signature', tone: 'blue', icon: 'signature' },
  'create-delegate': { label: 'Create delegate', tone: 'blue', icon: 'delegate' },
  vote: { label: 'Vote', tone: 'violet', icon: 'vote' },
  unvote: { label: 'Unvote', tone: 'orange', icon: 'vote' },
  'vote-unvote': { label: 'Vote & Unvote', tone: 'violet', icon: 'vote' },
  multisignature: { label: 'Multisignature', tone: 'blue', icon: 'multisignature' },
  'dapp-registration': { label: 'DApp registration', tone: 'blue', icon: 'dapp' },
  'dapp-deposit': { label: 'DApp deposit', tone: 'green', icon: 'dapp-deposit' },
  'dapp-withdrawal': { label: 'DApp withdrawal', tone: 'red', icon: 'dapp-withdrawal' },
  message: { label: 'Message', tone: 'neutral', icon: 'message' },
  state: { label: 'State', tone: 'neutral', icon: 'state' },
  unknown: { label: 'Unknown', tone: 'neutral', icon: 'state' },
};

const WELCOME_BONUS_SENDER = 'U15423595369615486571';
const WELCOME_BONUS_AMOUNT = 10_000_000;

/** Returns whether a transfer is the fixed 0.1 ADM onboarding reward. */
function isWelcomeBonus(tx) {
  return tx.senderId === WELCOME_BONUS_SENDER && Number(tx.amount) === WELCOME_BONUS_AMOUNT;
}

/**
 * Resolves added and removed vote directions from enriched or raw assets.
 * @param {Object} tx Vote transaction
 * @returns {'vote'|'unvote'|'vote-unvote'} Semantic vote operation id
 */
function voteOperationId(tx) {
  const votes = tx.asset?.votes;
  const hasAdded =
    Boolean(tx.votes?.added?.length) ||
    (Array.isArray(votes) && votes.some((vote) => String(vote).startsWith('+')));
  const hasDeleted =
    Boolean(tx.votes?.deleted?.length) ||
    (Array.isArray(votes) && votes.some((vote) => String(vote).startsWith('-')));

  if (hasAdded && hasDeleted) {
    return 'vote-unvote';
  }

  return hasDeleted ? 'unvote' : 'vote';
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
      if (isWelcomeBonus(tx)) return 'welcome-bonus';
      if (tx.knownRecipient?.kind === 'exchange') return 'deposit';
      if (tx.knownSender?.kind === 'exchange') return 'withdraw';
      return 'transfer';
    case 1:
      return 'second-signature';
    case 2:
      return 'create-delegate';
    case 3:
      return voteOperationId(tx);
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
 * Delegate registrations point back to their creator. Vote and other
 * service operations have no single account recipient and return `null`,
 * allowing tables to show the canonical protocol operation name.
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

  return null;
}
