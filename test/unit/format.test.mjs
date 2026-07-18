import { expect } from 'chai';
import {
  EPOCH_MS,
  epochToDate,
  toAdm,
  formatCurrency,
  formatExactCurrency,
  formatFullCurrency,
  formatInteger,
  compactAmountParts,
  formatHomeAmountParts,
  formatTimestamp,
  formatUtcTimestamp,
  timestampTitle,
  humanizeDuration,
  timeAgo,
  forgingTime,
  round,
  supplyPercent,
  nethashLabel,
  txTypeLabel,
  txSenderLabel,
  txRecipientLabel,
  accountLabel,
} from '../../src/lib/format.js';

// Unit tests for the pure frontend formatting helpers. They run in plain
// Node (no browser, no Vue) and need no live explorer, unlike the API
// suite in test/api/.

describe('format.js', function () {
  describe('epochToDate()', function () {
    it('maps timestamp 0 to the ADAMANT epoch', function () {
      expect(epochToDate(0).getTime()).to.equal(EPOCH_MS);
    });

    it('advances one second per unit', function () {
      expect(epochToDate(10).getTime()).to.equal(EPOCH_MS + 10000);
    });
  });

  describe('toAdm()', function () {
    it('converts sats to a trimmed decimal string', function () {
      expect(toAdm(150000000)).to.equal('1.5');
    });

    it('trims trailing zeros of integer amounts', function () {
      expect(toAdm(100000000)).to.equal('1');
    });

    it('returns a zero string for non-numeric input', function () {
      expect(toAdm('not a number')).to.equal('0.00000000');
    });
  });

  describe('formatCurrency()', function () {
    const adm = { symbol: 'ADM', tickers: {} };

    it('formats ADM with fixed decimals when requested', function () {
      expect(formatCurrency(150000000, adm, 2)).to.equal('1.50');
    });

    it('trims trailing zeros without explicit decimals', function () {
      expect(formatCurrency(150000000, adm)).to.equal('1.5');
    });

    it('groups thousands', function () {
      expect(formatCurrency(123456700000000, adm, 2)).to.equal('1,234,567.00');
    });

    it('returns N/A when no rate is known for a foreign symbol', function () {
      expect(formatCurrency(150000000, { symbol: 'USD', tickers: {} })).to.equal('N/A');
    });

    it('converts with the known ticker rate', function () {
      const usd = { symbol: 'USD', tickers: { ADM: { USD: 2 } } };
      expect(formatCurrency(150000000, usd)).to.equal('3.00');
    });

    it('preserves all eight ADAMANT decimal places for ledger values', function () {
      expect(formatFullCurrency(23, adm)).to.equal('0.00000023');
      expect(formatFullCurrency(100000000, adm)).to.equal('1.00000000');
    });

    it('keeps exact base units while trimming insignificant trailing zeros', function () {
      expect(formatExactCurrency(23, adm)).to.equal('0.00000023');
      expect(formatExactCurrency(50000000, adm)).to.equal('0.5');
      expect(formatExactCurrency(123450000, adm)).to.equal('1.2345');
    });
  });

  describe('formatInteger()', function () {
    it('groups heights and confirmations', function () {
      expect(formatInteger(53733279)).to.equal('53,733,279');
    });
  });

  describe('compactAmountParts()', function () {
    it('uses the requested four-digit home-page precision', function () {
      expect(compactAmountParts(1.2345).text).to.equal('1.234');
      expect(compactAmountParts(10.234).text).to.equal('10.23');
      expect(compactAmountParts(3456).text).to.equal('3,456');
      expect(compactAmountParts(12345.13123).text).to.equal('12,345');
      expect(compactAmountParts(0.0012345).text).to.equal('0.0012');
      expect(compactAmountParts(0.00001234).text).to.equal('0.00001234');
    });

    it('returns integer and fraction as separate display parts', function () {
      expect(compactAmountParts(1.2345)).to.deep.equal({
        integer: '1',
        fraction: '234',
        text: '1.234',
      });
    });

    it('converts sats before compacting a home-page amount', function () {
      expect(formatHomeAmountParts(123450000, { symbol: 'ADM', tickers: {} }).text).to.equal(
        '1.234',
      );
    });
  });

  describe('formatTimestamp()', function () {
    it('renders the YYYY-MM-DD HH:mm:ss shape', function () {
      expect(formatTimestamp(0)).to.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
      expect(formatUtcTimestamp(0)).to.equal('2017-09-02 17:00:00');
    });

    it('puts the relative age on a separate tooltip line', function () {
      expect(timestampTitle(0)).to.match(/^2017-09-02 17:00:00 UTC\+0\n.+ ago$/);
    });
  });

  describe('humanizeDuration()', function () {
    it('describes short spans as a few seconds', function () {
      expect(humanizeDuration(10 * 1000)).to.equal('a few seconds');
    });

    it('rounds to minutes', function () {
      expect(humanizeDuration(25 * 60 * 1000)).to.equal('25 minutes');
    });

    it('rounds to hours', function () {
      expect(humanizeDuration(3 * 60 * 60 * 1000)).to.equal('3 hours');
    });

    it('rounds to days', function () {
      expect(humanizeDuration(3 * 24 * 60 * 60 * 1000)).to.equal('3 days');
    });

    it('uses a single numeric unit for singular long spans', function () {
      expect(humanizeDuration(365 * 24 * 60 * 60 * 1000)).to.equal('1 year');
    });
  });

  describe('timeAgo()', function () {
    it('appends the ago suffix for past stamps', function () {
      const fiveMinutesAgo = (Date.now() - EPOCH_MS) / 1000 - 300;
      expect(timeAgo(fiveMinutesAgo)).to.equal('5 minutes ago');
    });
  });

  describe('forgingTime()', function () {
    it('reports an immediate slot', function () {
      expect(forgingTime(0)).to.equal('Now!');
    });

    it('reports minutes and seconds', function () {
      expect(forgingTime(90)).to.equal('1 min 30 sec');
    });

    it('reports bare seconds', function () {
      expect(forgingTime(42)).to.equal('42 sec');
    });

    it('reports whole minutes', function () {
      expect(forgingTime(120)).to.equal('2 min');
    });
  });

  describe('round()', function () {
    it('starts round 1 at height 1', function () {
      expect(round(1)).to.equal(1);
    });

    it('keeps height 101 in round 1', function () {
      expect(round(101)).to.equal(1);
    });

    it('starts round 2 at height 102', function () {
      expect(round(102)).to.equal(2);
    });

    it('returns 0 for non-numeric input', function () {
      expect(round('x')).to.equal(0);
    });
  });

  describe('supplyPercent()', function () {
    it('computes the share with two decimals', function () {
      expect(supplyPercent(25, 100)).to.equal('25.00');
    });

    it('returns 0.00 when the supply is unknown', function () {
      expect(supplyPercent(25, 0)).to.equal('0.00');
    });
  });

  describe('nethashLabel()', function () {
    it('recognizes the mainnet hash', function () {
      expect(
        nethashLabel('77265cf40a806763bc1e3ff0d899a1c0582b46e84ce8808b445dd9b95aa86da5'),
      ).to.equal('Mainnet');
      expect(
        nethashLabel('bd330166898377fb28743ceef5e43a5d9d0a3efd9b3451fb7bc53530bb0a6d64'),
      ).to.equal('Mainnet');
    });

    it('recognizes the testnet hash', function () {
      expect(
        nethashLabel('38f153a81332dea86751451fd992df26a9249f0834f72f58f84ac31cceb70f43'),
      ).to.equal('Testnet');
    });

    it('labels unknown hashes as Local', function () {
      expect(nethashLabel('deadbeef')).to.equal('Local');
    });
  });

  describe('transaction labels', function () {
    it('names transaction types', function () {
      expect(txTypeLabel({ type: 3 })).to.equal('Vote / Unvote');
      expect(txTypeLabel({ type: 8 })).to.equal('Message');
    });

    it('prefers the sender delegate username', function () {
      const tx = { senderId: 'U1', senderDelegate: { username: 'jury' } };
      expect(txSenderLabel(tx)).to.equal('jury');
    });

    it('falls back to the sender address', function () {
      expect(txSenderLabel({ senderId: 'U1' })).to.equal('U1');
    });

    it('shows the recipient for transfer types', function () {
      expect(txRecipientLabel({ type: 0, recipientId: 'U2' })).to.equal('U2');
    });

    it('shows the type name for non-transfer types', function () {
      expect(txRecipientLabel({ type: 2 })).to.equal('Create delegate');
    });
  });

  describe('accountLabel()', function () {
    it('prefers the username', function () {
      expect(accountLabel({ username: 'jury', address: 'U1' })).to.equal('jury');
    });

    it('falls back to the known owner and then the address', function () {
      expect(accountLabel({ knowledge: { owner: 'Exchange' }, address: 'U1' })).to.equal(
        'Exchange',
      );
      expect(accountLabel({ address: 'U1' })).to.equal('U1');
    });
  });
});
