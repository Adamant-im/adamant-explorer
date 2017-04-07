'use strict';

angular.module('lisk_explorer')
  .filter('approval', () => votes => {
    if (isNaN(votes)) {
        return 0;
    } else {
        return ((parseInt(votes) / 10000000000000000) * 100).toFixed(2);
    }
})
  .filter('epochStamp', () => d => new Date(
    (((Date.UTC(2016, 4, 24, 17, 0, 0, 0) / 1000) + d) * 1000)
))
  .filter('forgingTime', () => seconds => {
  if (seconds === 0) {
    return 'Now!';
  }
  const minutes = Math.floor(seconds / 60);
  seconds = seconds - (minutes * 60);
  if (minutes && seconds) {
    return `${minutes} min ${seconds} sec`;
  } else if (minutes) {
    return `${minutes} min `;
  } else {
    return `${seconds} sec`;
  }
})
  .filter('fiat', () => amount => {
    if (isNaN(amount)) {
        return (0).toFixed(2);
    } else {
        return (parseInt(amount) / 100000000).toFixed(2);
    }
})
  .filter('lisk', () => amount => {
    if (isNaN(amount)) {
        return (0).toFixed(8);
    } else {
        return (parseInt(amount) / 100000000).toFixed (8).replace (/\.?0+$/, '');
    }
})
  .filter('currency', (numberFilter, liskFilter) => (amount, currency, decimal_places) => {
    const lisk = liskFilter (amount);
    let factor = 1;

    if (currency.tickers && currency.tickers.LSK && currency.tickers.LSK[currency.symbol]) {
      factor = currency.tickers.LSK[currency.symbol];
    } else if (currency.symbol !== 'LSK') {
      // Exchange rate not available for current symbol
      return 'N/A';
    }

    if (decimal_places === undefined) {
      switch (currency.symbol) {
        case 'LSK':
        case 'BTC':
          return numberFilter ((lisk * factor), 8).replace (/\.?0+$/, '');
        default:
          return numberFilter ((lisk * factor), 2).replace (/\.?0+$/, '');
      }
    } else {
      return numberFilter ((lisk * factor), decimal_places);
    }
})
  .filter('nethash', () => nethash => {
    if (nethash === 'da3ed6a45429278bac2666961289ca17ad86595d33b31037615d4b8e8f158bba') {
        return 'Testnet';
    } else if (nethash === 'ed14889723f24ecc54871d058d98ce91ff2f973192075c0155ba2b7b70ad2511')  {
        return 'Mainnet';
    } else {
        return 'Local';
    }
})
  .filter('round', () => height => {
    if (isNaN(height)) {
        return 0;
    } else {
        return Math.floor(height / 101) + (height % 101 > 0 ? 1 : 0);
    }
})
  .filter('split', () => (input, delimiter) => {
    delimiter = delimiter || ',';
    return input.split(delimiter);
})
  .filter('startFrom', () => (input, start) => {
    start = +start;
    return input.slice(start);
})
  .filter('supplyPercent', () => (amount, supply) => {
  const supply_check = (supply > 0);
    if (isNaN(amount) || !supply_check) {
      return (0).toFixed(2);
    }
    return (amount / supply * 100).toFixed(2);
})
  .filter('timeAgo', epochStampFilter => timestamp => moment(epochStampFilter(timestamp)).fromNow())
  .filter('timeSpan', epochStampFilter => (a, b) => moment.duration(
    epochStampFilter(a) - epochStampFilter(b)
).humanize())
  .filter('timestamp', epochStampFilter => timestamp => {
    const d     = epochStampFilter(timestamp);
    let month = d.getMonth() + 1;

    if (month < 10) {
        month = `0${month}`;
    }

    let day = d.getDate();

    if (day < 10) {
        day = `0${day}`;
    }

    let h = d.getHours();
    let m = d.getMinutes();
    let s = d.getSeconds();

    if (h < 10) {
        h = `0${h}`;
    }

    if (m < 10) {
        m = `0${m}`;
    }

    if (s < 10) {
        s = `0${s}`;
    }

    return `${d.getFullYear()}/${month}/${day} ${h}:${m}:${s}`;
})
  .filter('txSender', () => tx => (tx.senderDelegate && tx.senderDelegate.username) || tx.senderUsername || (tx.knownSender && tx.knownSender.owner) || tx.senderId)
  .filter('txRecipient', txTypes => tx => {
    if (tx.type === 0) {
        return ((tx.recipientDelegate && tx.recipientDelegate.username) || tx.recipientUsername || (tx.knownRecipient && tx.knownRecipient.owner) || tx.recipientId);
    } else {
        return (txTypes[parseInt(tx.type)]);
    }
})
  .filter('txType', txTypes => tx => txTypes[parseInt(tx.type)])
  .filter('alterWordSeparation', () => {
      // @todo Use polymer instead
      if (!String.prototype.trim) {
          String.prototype.trim = function () {
              return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
          };
      }
      const types = {
          dashSeparated: {
              reg: /\s/g,
              alternate: '-'
          },
          spaceSeparated: {
              reg: /\-/g,
              alternate: ' '
          }
      };
      return (phrase, type) => {
          if (type in types) {
              return phrase.trim().replace(types[type].reg, types[type].alternate);

          }
      };
  })
  .filter('votes', () => a => a.username || (a.knowledge && a.knowledge.owner) || a.address).filter('proposal', $sce => (name, proposals) => {
    const p = _.find (proposals, p => name && p.name === name.toLowerCase ());
    if (p) {
        return $sce.trustAsHtml(`<a class="glyphicon glyphicon-user" href="https://forum.lisk.io/viewtopic.php?f=48&t=${p.topic}" title="${_.escape (p.description)}" target="_blank"></a>`);
    } else {
        return null;
    }
});
