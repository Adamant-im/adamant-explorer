/**
 * Helpers for linking account-like entities (senders, recipients,
 * delegates, voters) to the right explorer page. They replace the legacy
 * `account-href` directive: delegates link to `/delegate/:address`,
 * plain accounts to `/address/:address`.
 */

/**
 * Router path for a transaction sender.
 *
 * @param {Object} tx Transaction with `senderId` and optional `senderDelegate`/`senderUsername`
 * @returns {string} `/delegate/...` when the sender is a delegate, `/address/...` otherwise
 */
export function txSenderPath(tx) {
  const isDelegate = Boolean(tx.senderDelegate?.username || tx.senderUsername);

  return isDelegate ? `/delegate/${tx.senderId}` : `/address/${tx.senderId}`;
}

/**
 * Router path for a transaction recipient.
 *
 * @param {Object} tx Transaction with `recipientId` and optional recipient metadata
 * @returns {string} `/delegate/...` when the recipient is a delegate, `/address/...` otherwise
 */
export function txRecipientPath(tx) {
  const isDelegate = Boolean(tx.recipientDelegate?.username || tx.recipientUsername);

  return isDelegate ? `/delegate/${tx.recipientId}` : `/address/${tx.recipientId}`;
}

/**
 * Router path for an account-like object from vote and voter lists.
 *
 * @param {Object} account Account with `address` and optional delegate metadata
 * @returns {string} `/delegate/...` when a username is known, `/address/...` otherwise
 */
export function accountPath(account) {
  const isDelegate = Boolean(
    account.username || account.isDelegate || account.knowledge?.kind === 'delegate',
  );

  return `${isDelegate ? '/delegate' : '/address'}/${account.address}`;
}
