'use strict';

module.exports = function (app, api) {
    var blocks = new api.blocks(app);

    this.getBlocksCount = function (deferred) {
        blocks.getBlocksCount(
            function (data) {
                deferred.resolve();
                console.log('blocks.getBlocksCount ~>', 'Error retrieving count:', data.error);
            },
            function (data) {
                deferred.resolve();
                console.log('blocks.getBlocksCount ~>', 'count retrieved in', String(deferred.elapsed), 'seconds');
            }
        );
    };

    this.getLastBlocks = function (deferred) {
        blocks.getLastBlocks(
            1,
            function (data) {
                deferred.resolve();
                console.log('blocks.getLastBlocks ~>', 'Error retrieving blocks:', data.error);
            },
            function (data) {
                deferred.resolve();
                console.log('blocks.getLastBlocks ~>', data.blocks.length, 'blocks retrieved in', String(deferred.elapsed), 'seconds');
            }
        );
    };

    this.getBlock = function (deferred) {
        blocks.getBlock(
            '13592630651917052637',
            function (data) {
                deferred.resolve();
                console.log('blocks.getBlock ~>', 'Error retrieving block:', data.error);
            },
            function (data) {
                deferred.resolve();
                console.log('blocks.getBlock ~>', 'block retrieved in', String(deferred.elapsed), 'seconds');
            }
        );
    };
};

