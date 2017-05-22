import AppServices from './services.module';


/**
 * @todo isolate socket.io
 * @todo why sicket is not mounted in bundle?
 */
AppServices.factory('$socket',
  ($location, $rootScope) => namespace => {
        const socket = io(`${$location.host()}:${$location.port()}${namespace}`, { 'forceNew': true });

        return {
            on: function (eventName, callback) {
                socket.on(eventName, function () {
                    const args = arguments;

                    $rootScope.$apply(() => {
                        callback.apply(socket, args);
                    });
                });
            },

            emit: function (eventName, data, callback) {
                socket.emit(eventName, data, function () {
                    const args = arguments;

                    $rootScope.$apply(() => {
                        if (callback) {
                            callback.apply(socket, args);
                        }
                    });
                });
            },

            removeAllListeners: function (eventName, callback) {
                socket.removeAllListeners(eventName, function () {
                    const args = arguments;

                    $rootScope.$apply(() => {
                        callback.apply(socket, args);
                    });
                });
            }
        };
    });
