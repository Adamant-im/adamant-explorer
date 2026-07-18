import { defineStore } from 'pinia';
import { io } from 'socket.io-client';

/**
 * Application-wide network state fed by the `/header` socket namespace:
 * blockchain status (height, supply, nethash) and exchange rate tickers.
 *
 * The socket lives for the whole page lifetime because the header is
 * always visible, so no teardown is needed.
 */
export const useNetworkStore = defineStore('network', {
  state: () => ({
    /** Latest block status from the node, `null` until the first socket event */
    blockStatus: null,
    /** Block identity used by open pages to refresh after sockets or REST fallback */
    latestBlock: null,
    /** Browser timestamp of the latest live network update */
    lastUpdate: null,
    /** Display currency; the explorer currently shows amounts in ADM only */
    currency: {
      symbol: 'ADM',
      /** Exchange rate map keyed by base symbol, e.g. `tickers.ADM.USD` */
      tickers: {},
    },
    /**
     * Preferred number of decimal places for amounts, `undefined` means
     * "trim trailing zeros". Kept in state so a decimals selector can be
     * reintroduced without touching consumers.
     */
    decimalPlaces: undefined,
  }),

  actions: {
    /**
     * Opens the `/header` socket subscription. Safe to call once from the
     * root component; repeated calls are ignored.
     */
    init() {
      if (this._socket) {
        return;
      }

      this._socket = io('/header', { forceNew: true });

      this._socket.on('data', (res) => {
        if (res.status?.success) {
          this.lastUpdate = Date.now();
          const height = Number(res.status.height);

          if (Number.isSafeInteger(height) && height > 0 && height !== this.latestBlock?.height) {
            this.latestBlock = { height };
          }

          this.blockStatus = {
            height,
            fee: res.status.fee,
            milestone: res.status.milestone,
            reward: res.status.reward,
            supply: res.status.supply,
            nethash: res.status.nethash,
          };
        }

        if (res.ticker?.success) {
          this.currency.tickers = res.ticker.tickers ?? {};
        }

        // When no rate is known for the selected currency, fall back to ADM
        if (this.currency.symbol !== 'ADM' && !this.currency.tickers?.ADM?.[this.currency.symbol]) {
          this.currency.symbol = 'ADM';
        }
      });

      this._socket.on('block', (block) => {
        const height = Number(block?.height);

        if (!Number.isSafeInteger(height) || height < 1) {
          return;
        }

        this.latestBlock = {
          id: block.id,
          height,
          timestamp: block.timestamp,
        };
        this.lastUpdate = Date.now();

        if (this.blockStatus) {
          this.blockStatus = { ...this.blockStatus, height };
        }
      });
    },
  },
});
