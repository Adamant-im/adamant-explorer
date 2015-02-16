'use strict';

angular.module('insight.socket').factory('$socket',
  function ($location, $rootScope) {
    return function(namespace) {
          var socket = io($location.host() + ':' + $location.port() + namespace);

          return {
              on: function (eventName, callback) {
                  socket.on(eventName, function () {
                      var args = arguments;

                      $rootScope.$apply(function () {
                          callback.apply(socket, args);
                      });
                  });
              },

              emit: function (eventName, data, callback) {
                  socket.emit(eventName, data, function () {
                      var args = arguments;

                      $rootScope.$apply(function () {
                          if (callback) {
                              callback.apply(socket, args);
                          }
                      });
                  });
              },

              removeAllListeners: function (eventName, callback) {
                  socket.removeAllListeners(eventName, function () {
                      var args = arguments;

                      $rootScope.$apply(function () {
                          callback.apply(socket, args);
                      });
                  });
              }
          }
      }
  });
