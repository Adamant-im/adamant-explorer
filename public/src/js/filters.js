'use strict';

angular.module('cryptichain')
  .filter('startFrom', function () {
      return function (input, start) {
          start = +start;
          return input.slice(start);
      }
  })
  .filter('split', function () {
      return function (input, delimiter) {
          var delimiter = delimiter || ',';
          return input.split(delimiter);
      }
  })
  .filter('epochStamp', function () {
      return function (d) {
          return new Date(
              (((Date.UTC(2015, 3, 9, 0, 0, 0, 0) / 1000) + d) * 1000)
          );
      }
  })
  .filter('timeAgo', function (epochStampFilter) {
      return function (timestamp) {
          return moment(epochStampFilter(timestamp)).fromNow();
      }
  })
  .filter('timeSpan', function (epochStampFilter) {
      return function (a, b) {
          return moment.duration(
              epochStampFilter(a) - epochStampFilter(b)
          ).humanize();
      }
  })
  .filter('timestamp', function (epochStampFilter) {
      return function (timestamp) {
          var d     = epochStampFilter(timestamp);
          var month = d.getMonth() + 1;

          if (month < 10) {
              month = "0" + month;
          }

          var day = d.getDate();

          if (day < 10) {
              day = "0" + day;
          }

          var h = d.getHours();
          var m = d.getMinutes();
          var s = d.getSeconds();

          if (h < 10) {
              h = "0" + h;
          }

          if (m < 10) {
              m = "0" + m;
          }

          if (s < 10) {
              s = "0" + s;
          }

          return d.getFullYear() + "/" + month + "/" + day + " " + h + ":" + m + ":" + s;
      }
  })
  .filter('fiat', function () {
      return function (amount) {
          return (parseInt(amount) / 100000000).toFixed(2);
      }
  })
  .filter('xcr', function () {
      return function (amount) {
          if (isNaN(amount)) {
              return amount;
          } else {
              return (parseInt(amount) / 100000000);
          }
      }
  })
  .filter('approval', function () {
      return function (votes) {
          if (isNaN(votes)) {
              return 0;
          } else {
              return ((parseInt(votes) / 10000000000000000) * 100).toFixed(2);
          }
      }
  })
  .filter('supply', function (xcrFilter) {
      return function (amount) {
          return ((xcrFilter(amount) / 100000000) * 100).toFixed(2);
      }
  });
