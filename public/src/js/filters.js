'use strict';

angular.module('lisk_explorer')
  .filter('approval', function () {
      return function (votes) {
          if (isNaN(votes)) {
              return 0;
          } else {
              return ((parseInt(votes) / 10000000000000000) * 100).toFixed(2);
          }
      };
  })
  .filter('epochStamp', function () {
      return function (d) {
          return new Date(
              (((Date.UTC(2016, 4, 24, 17, 0, 0, 0) / 1000) + d) * 1000)
          );
      };
  })
  .filter('forgingTime', function () {
      return function (seconds) {
        if (seconds === 0) {
          return 'Now!';
        }
        var minutes = Math.floor(seconds / 60);
        var seconds = seconds - (minutes * 60);
        if (minutes && seconds) {
          return minutes + ' min ' + seconds + ' sec';
        } else if (minutes) {
          return minutes + ' min ';
        } else {
          return seconds + ' sec';
        }
      };
  })
  .filter('fiat', function () {
      return function (amount) {
          if (isNaN(amount)) {
              return (0).toFixed(2);
          } else {
              return (parseInt(amount) / 100000000).toFixed(2);
          }
      };
  })
  .filter('lisk', function () {
      return function (amount) {
          if (isNaN(amount)) {
              return (0).toFixed(8);
          } else {
              return (parseInt(amount) / 100000000);
          }
      };
  })
  .filter('nethash', function () {
      return function (nethash) {
          if (nethash == "da3ed6a45429278bac2666961289ca17ad86595d33b31037615d4b8e8f158bba") {
              return network='Testnet';
          } else if (nethash == "ed14889723f24ecc54871d058d98ce91ff2f973192075c0155ba2b7b70ad2511")  {
	      return network='Mainnet';
          } else {
	      return network='Local';
	  }
      };
  })
  .filter('round', function () {
      return function (height) {
          if (isNaN(height)) {
              return 0;
          } else {
              return Math.floor(height / 101) + (height % 101 > 0 ? 1 : 0);
          }
      };
  })
  .filter('split', function () {
      return function (input, delimiter) {
          delimiter = delimiter || ',';
          return input.split(delimiter);
      };
  })
  .filter('startFrom', function () {
      return function (input, start) {
          start = +start;
          return input.slice(start);
      };
  })
  .filter('supplyPercent', function () {
      return function (amount, supply) {
          if (isNaN(amount) || !(supply > 0)) {
            return (0).toFixed(2);
          }
          return (amount / supply * 100).toFixed(2);
      };
  })
  .filter('timeAgo', function (epochStampFilter) {
      return function (timestamp) {
          return moment(epochStampFilter(timestamp)).fromNow();
      };
  })
  .filter('timeSpan', function (epochStampFilter) {
      return function (a, b) {
          return moment.duration(
              epochStampFilter(a) - epochStampFilter(b)
          ).humanize();
      };
  })
  .filter('timestamp', function (epochStampFilter) {
      return function (timestamp) {
          var d     = epochStampFilter(timestamp);
          var month = d.getMonth() + 1;

          if (month < 10) {
              month = '0' + month;
          }

          var day = d.getDate();

          if (day < 10) {
              day = '0' + day;
          }

          var h = d.getHours();
          var m = d.getMinutes();
          var s = d.getSeconds();

          if (h < 10) {
              h = '0' + h;
          }

          if (m < 10) {
              m = '0' + m;
          }

          if (s < 10) {
              s = '0' + s;
          }

          return d.getFullYear() + '/' + month + '/' + day + ' ' + h + ':' + m + ':' + s;
      };
  })
  .filter('txSender', function () {
      return function (tx) {
          return ((tx.senderDelegate && tx.senderDelegate.username) || tx.senderUsername || (tx.knownSender && tx.knownSender.owner) || tx.senderId);
      };
  })
  .filter('txRecipient', function (txTypes) {
      return function (tx) {
          if (tx.type === 0) {
              return ((tx.recipientDelegate && tx.recipientDelegate.username) || tx.recipientUsername || (tx.knownRecipient && tx.knownRecipient.owner) || tx.recipientId);
          } else {
              return (txTypes[parseInt(tx.type)]);
          }
      };
  })
  .filter('txType', function (txTypes) {
      return function (tx) {
          return txTypes[parseInt(tx.type)];
      };
  })
  .filter('votes', function () {
      return function (a) {
          return (a.username || (a.knowledge && a.knowledge.owner) || a.address);
      };
  });
