/**
 * Pure formatting utilities shared across the frontend.
 *
 * These replace the AngularJS filters of the previous explorer version
 * (`currency`, `timestamp`, `timeAgo`, `txType`, and friends). They are
 * framework-free on purpose: unit tests import them directly in Node.
 */

/** Number of sats in one ADM token. */
export const SAT = 1e8;

/**
 * ADAMANT epoch: blockchain timestamps count seconds from this moment
 * (2017-09-02 17:00:00 UTC).
 */
export const EPOCH_MS = Date.UTC(2017, 8, 2, 17, 0, 0, 0);

/**
 * Transaction type names by numeric type id, as defined by the ADAMANT
 * protocol (inherited from Lisk types 0-7, type 8 is the ADAMANT chat
 * message transaction).
 */
export const TX_TYPES = {
  0: 'Normal transaction',
  1: 'Second signature creation',
  2: 'Delegate registration',
  3: 'Delegate vote',
  4: 'Multi-signature creation',
  5: 'Dapp registration',
  6: 'Dapp deposit',
  7: 'Dapp withdrawal',
  8: 'Chat message',
};

/**
 * Converts a blockchain timestamp into a JavaScript Date.
 *
 * @param {number} timestamp Seconds since the ADAMANT epoch
 * @returns {Date} Corresponding date in local time
 */
export function epochToDate(timestamp) {
  return new Date(EPOCH_MS + timestamp * 1000);
}

/**
 * Converts an amount in sats to a decimal ADM string with trailing
 * zeros trimmed, e.g. `150000000` becomes `'1.5'`.
 *
 * @param {number|string} amount Amount in sats
 * @returns {string} Decimal ADM amount without trailing zeros
 */
export function toAdm(amount) {
  if (isNaN(amount)) {
    return (0).toFixed(8);
  }

  return (parseInt(amount) / SAT).toFixed(8).replace(/\.?0+$/, '');
}

/**
 * Formats a sats amount for display in the selected currency.
 *
 * Behavior matches the legacy `currency` filter: amounts are converted
 * with the known ticker when the selected symbol is not ADM, grouped with
 * thousands separators, and either fixed to `decimals` places or trimmed
 * of trailing zeros when no explicit precision is requested.
 *
 * @param {number|string} amount Amount in sats
 * @param {{symbol: string, tickers?: Object}} currency Selected currency and known rates
 * @param {number} [decimals] Fixed number of decimal places; `undefined` trims trailing zeros
 * @returns {string} Formatted amount, or `'N/A'` when no rate is known for the symbol
 */
export function formatCurrency(amount, currency, decimals) {
  const adm = Number(toAdm(amount));
  let factor = 1;

  if (currency.tickers?.ADM?.[currency.symbol]) {
    factor = currency.tickers.ADM[currency.symbol];
  } else if (currency.symbol !== 'ADM') {
    // Exchange rate not available for the selected symbol
    return 'N/A';
  }

  const fixed = currency.symbol === 'ADM' || currency.symbol === 'BTC' ? decimals : 2;

  if (fixed && adm > 0) {
    return groupNumber(adm * factor, fixed);
  }

  return groupNumber(adm * factor, 3).replace(/\.?0+$/, '');
}

/**
 * Formats a number with `en-US` thousands grouping and a fixed number of
 * fraction digits.
 *
 * @param {number} value Value to format
 * @param {number} decimals Exact number of fraction digits
 * @returns {string} Grouped decimal string
 */
export function groupNumber(value, decimals) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formats a blockchain timestamp as `YYYY/MM/DD HH:mm:ss` in local time.
 *
 * @param {number} timestamp Seconds since the ADAMANT epoch
 * @returns {string} Formatted date-time string
 */
export function formatTimestamp(timestamp) {
  const date = epochToDate(timestamp);
  const pad = (n) => String(n).padStart(2, '0');

  return (
    `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

/**
 * Humanizes a duration the way moment.js does: "a few seconds",
 * "a minute", "25 minutes", "an hour", "3 days", and so on.
 *
 * @param {number} ms Duration in milliseconds (sign is ignored)
 * @returns {string} Human-readable approximate duration
 */
export function humanizeDuration(ms) {
  const seconds = Math.abs(ms) / 1000;
  const minutes = seconds / 60;
  const hours = minutes / 60;
  const days = hours / 24;
  const months = days / 30.4;
  const years = days / 365;

  if (seconds < 45) return 'a few seconds';
  if (minutes < 1.5) return 'a minute';
  if (minutes < 45) return `${Math.round(minutes)} minutes`;
  if (hours < 1.5) return 'an hour';
  if (hours < 22) return `${Math.round(hours)} hours`;
  if (days < 1.5) return 'a day';
  if (days < 26) return `${Math.round(days)} days`;
  if (months < 1.5) return 'a month';
  if (months < 11) return `${Math.round(months)} months`;
  if (years < 1.5) return 'a year';
  return `${Math.round(years)} years`;
}

/**
 * Formats a blockchain timestamp as a relative "time ago" phrase.
 *
 * @param {number} timestamp Seconds since the ADAMANT epoch
 * @returns {string} Phrase like `'5 minutes ago'` (or `'in 5 minutes'` for future stamps)
 */
export function timeAgo(timestamp) {
  const diff = Date.now() - epochToDate(timestamp).getTime();
  const phrase = humanizeDuration(diff);

  return diff >= 0 ? `${phrase} ago` : `in ${phrase}`;
}

/**
 * Humanizes the span between two blockchain timestamps.
 *
 * @param {number} a First timestamp, seconds since the ADAMANT epoch
 * @param {number} [b] Second timestamp; defaults to the current moment
 * @returns {string} Human-readable span, e.g. `'2 minutes'`
 */
export function timeSpan(a, b) {
  const end = b !== undefined ? epochToDate(b).getTime() : Date.now();

  return humanizeDuration(epochToDate(a).getTime() - end);
}

/**
 * Formats a forging wait time in seconds as `'N min M sec'`, with
 * `'Now!'` for zero.
 *
 * @param {number} seconds Seconds until the delegate's forging slot
 * @returns {string} Human-readable wait time
 */
export function forgingTime(seconds) {
  if (seconds === 0) {
    return 'Now!';
  }

  const minutes = Math.floor(seconds / 60);
  const rest = seconds - minutes * 60;

  if (minutes && rest) {
    return `${minutes} min ${rest} sec`;
  }

  if (minutes) {
    return `${minutes} min`;
  }

  return `${rest} sec`;
}

/**
 * Returns the round number a block height belongs to. A round in the
 * ADAMANT DPoS consensus spans 101 blocks (one per active delegate).
 *
 * @param {number} height Block height
 * @returns {number} 1-based round number, `0` for non-numeric input
 */
export function round(height) {
  if (isNaN(height)) {
    return 0;
  }

  return Math.floor(height / 101) + (height % 101 > 0 ? 1 : 0);
}

/**
 * Calculates which share of the total supply an amount represents.
 *
 * @param {number} amount Amount in sats
 * @param {number} supply Total supply in sats
 * @returns {string} Percentage with two decimals, `'0.00'` when the supply is unknown
 */
export function supplyPercent(amount, supply) {
  if (isNaN(amount) || !(supply > 0)) {
    return (0).toFixed(2);
  }

  return ((amount / supply) * 100).toFixed(2);
}

/** Well-known network identifiers by nethash. */
const KNOWN_NETHASHES = {
  '38f153a81332dea86751451fd992df26a9249f0834f72f58f84ac31cceb70f43': 'Testnet',
  '77265cf40a806763bc1e3ff0d899a1c0582b46e84ce8808b445dd9b95aa86da5': 'Mainnet',
};

/**
 * Maps a nethash to a display name of the network.
 *
 * @param {string} nethash Network hash reported by the node
 * @returns {string} `'Mainnet'`, `'Testnet'`, or `'Local'` for unknown hashes
 */
export function nethashLabel(nethash) {
  return KNOWN_NETHASHES[nethash] ?? 'Local';
}

/**
 * Returns the human-readable name of a transaction's type.
 *
 * @param {{type: number}} tx Transaction
 * @returns {string} Type name, e.g. `'Delegate vote'`
 */
export function txTypeLabel(tx) {
  return TX_TYPES[parseInt(tx.type)];
}

/**
 * Best display label for a transaction sender: delegate username, known
 * wallet owner, or the raw address.
 *
 * @param {Object} tx Transaction with optional `senderDelegate`, `senderUsername`, `knownSender`
 * @returns {string} Sender label
 */
export function txSenderLabel(tx) {
  return tx.senderDelegate?.username || tx.senderUsername || tx.knownSender?.owner || tx.senderId;
}

/**
 * Best display label for a transaction recipient. Transfer types (0 and 8)
 * resolve to a delegate username, known wallet owner, or address; other
 * types have no recipient and resolve to the type name.
 *
 * @param {Object} tx Transaction with optional recipient metadata
 * @returns {string} Recipient label or transaction type name
 */
export function txRecipientLabel(tx) {
  if (tx.type === 0 || tx.type === 8) {
    return (
      tx.recipientDelegate?.username ||
      tx.recipientUsername ||
      tx.knownRecipient?.owner ||
      tx.recipientId
    );
  }

  return txTypeLabel(tx);
}

/**
 * Display label for an account reference in vote and voter lists.
 *
 * @param {Object} account Account with optional `username` and `knowledge`
 * @returns {string} Username, known owner, or address
 */
export function accountLabel(account) {
  return account.username || account.knowledge?.owner || account.address;
}
