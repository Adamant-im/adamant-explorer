'use strict';

module.exports = function (app, api) {
    var delegates = new api.delegates(app);

    this.getActive = function (deferred) {
        delegates.getActive(
            function (data) {
                deferred.resolve();
                console.log('delegates.getActive ~>', 'Error retrieving delegates:', data.error);
            },
            function (data) {
                deferred.resolve();
                console.log('delegates.getActive ~>', data.delegates.length, 'delegates retrieved in', String(deferred.elapsed), 'seconds');
            }
        );
    };

    this.getStandby = function (deferred) {
        delegates.getStandby(
            0,
            function (data) {
                deferred.resolve();
                console.log('delegates.getStandby ~>', 'Error retrieving delegates:', data.error);
            },
            function (data) {
                deferred.resolve();
                console.log('delegates.getStandby ~>', data.delegates.length, 'delegates retrieved in', String(deferred.elapsed), 'seconds');
            }
        );
    };

    this.getLatestRegistrations = function (deferred) {
        delegates.getLatestRegistrations(
            function (data) {
                deferred.resolve();
                console.log('delegates.getLatestRegistrations ~>', 'Error retrieving registrations:', data.error);
            },
            function (data) {
                deferred.resolve();
                console.log('delegates.getLatestRegistrations ~>', data.transactions.length, 'registrations retrieved in', String(deferred.elapsed), 'seconds');
            }
        );
    };

    this.getLatestVotes = function (deferred) {
        delegates.getLatestVotes(
            function (data) {
                deferred.resolve();
                console.log('delegates.getLatestVotes ~>', 'Error retrieving votes:', data.error);
            },
            function (data) {
                deferred.resolve();
                console.log('delegates.getLatestVotes ~>', data.transactions.length, 'votes retrieved in', String(deferred.elapsed), 'seconds');
            }
        );
    };

    this.getLastBlock = function (deferred) {
        delegates.getLastBlock(
            function (data) {
                deferred.resolve();
                console.log('delegates.getLastBlock ~>', 'Error retrieving block:', data.error);
            },
            function (data) {
                deferred.resolve();
                console.log('delegates.getLastBlock ~>', 'block retrieved in', String(deferred.elapsed), 'seconds');
            }
        );
    };
};

