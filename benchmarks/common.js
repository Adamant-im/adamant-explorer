'use strict';

module.exports = function (app, api) {
    var common = new api.common(app, api);

    this.getFee = function (deferred) {
        common.getFee(
            function (data) {
                deferred.resolve();
                console.log('common.getFee ~>', 'Error retrieving fee:', data.error);
            },
            function (data) {
                deferred.resolve();
                console.log('common.getFee ~>', 'fee retrieved in', String(deferred.elapsed), 'seconds');
            }
        );
    };

    this.getXCRCourse = function (deferred) {
        common.getXCRCourse(
            function (data) {
                deferred.resolve();
                console.log('common.getXCRCourse ~>', 'Error retrieving rates:', data.error);
            },
            function (data) {
                deferred.resolve();
                console.log('common.getXCRCourse ~>', 'rates retrieved in', String(deferred.elapsed), 'seconds');
            }
        );
    };

    this.search = function (deferred) {
        common.search(
            '12907382053545086321C',
            function (data) {
                deferred.resolve();
                console.log('common.search ~>', 'Error retrieving search result:', data.error);
            },
            function (data) {
                deferred.resolve();
                console.log('common.search ~>', 'search result retrieved in', String(deferred.elapsed), 'seconds');
            }
        );
    };
};

