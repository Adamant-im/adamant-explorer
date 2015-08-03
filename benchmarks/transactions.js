'use strict';

module.exports = function (app, api) {
    var transactions = new api.transactions(app);

    this.getTransaction = function (deferred) {
        transactions.getTransaction(
            '6538470051935780976',
            function (data) {
                deferred.resolve();
                console.log('transactions.getTransaction ~>', 'Error retrieving transaction:', data.error);
            },
            function (data) {
                deferred.resolve();
                console.log('transactions.getTransaction ~>', 'transaction retrieved in', String(deferred.elapsed), 'seconds');
            }
        );
    };

    this.getUnconfirmedTransactions = function (deferred) {
        transactions.getUnconfirmedTransactions(
            function (data) {
                deferred.resolve();
                console.log('transactions.getUnconfirmedTransactions ~>', 'Error retrieving transactions:', data.error);
            },
            function (data) {
                deferred.resolve();
                console.log('transactions.getUnconfirmedTransactions ~>', data.transactions.length, 'transactions retrieved in', String(deferred.elapsed), 'seconds');
            }
        );
    };

    this.getLastTransactions = function (deferred) {
        transactions.getLastTransactions(
            function (data) {
                deferred.resolve();
                console.log('transactions.getLastTransactions ~>', 'Error retrieving transactions:', data.error);
            },
            function (data) {
                deferred.resolve();
                console.log('transactions.getLastTransactions ~>', data.transactions.length, 'transactions retrieved in', String(deferred.elapsed), 'seconds');
            }
        );
    };

    this.getTransactionsByAddress = function (deferred) {
        transactions.getTransactionsByAddress(
            { address : '12907382053545086321C',
              offset  : 0,
              limit   : 100 },
            function (data) {
                deferred.resolve();
                console.log('transactions.getTransactionsByAddress ~>', 'Error retrieving transactions:', data.error);
            },
            function (data) {
                deferred.resolve();
                console.log('transactions.getTransactionsByAddress ~>', data.transactions.length, 'transactions retrieved in', String(deferred.elapsed), 'seconds');
            }
        );
    };

    this.getTransactionsByBlock = function (deferred) {
        transactions.getTransactionsByBlock(
            { blockId : '13592630651917052637',
              offset  : 0,
              limit   : 100 },
            function (data) {
                deferred.resolve();
                console.log('transactions.getTransactionsByBlock ~>', 'Error retrieving transactions:', data.error);
            },
            function (data) {
                deferred.resolve();
                console.log('transactions.getTransactionsByBlock ~>', data.transactions.length, 'transactions retrieved in', String(deferred.elapsed), 'seconds');
            }
        );
    };
};

