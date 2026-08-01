import { createRequire } from 'node:module';
import { expect } from 'chai';

const require = createRequire(import.meta.url);
const cache = require('../../cache.js');

describe('API cache policy', function () {
  it('uses the same cache path for GET and Express-compatible HEAD requests', function () {
    expect(cache.isApiCacheMethod('GET')).to.equal(true);
    expect(cache.isApiCacheMethod('HEAD')).to.equal(true);
    expect(cache.isApiCacheMethod('POST')).to.equal(false);
  });

  it('versions latest blocks and transfers by the trusted block identity', function () {
    const latestBlock = { id: 'block-101', height: 101 };

    expect(
      cache.getCacheKey('/api/getLastBlocks?n=20', '/api/getLastBlocks', latestBlock),
    ).to.equal('block:101:block-101:/api/getLastBlocks?n=20');
    expect(
      cache.getCacheKey('/api/getLastTransfers', '/api/getLastTransfers', latestBlock),
    ).to.equal('block:101:block-101:/api/getLastTransfers');
  });

  it('bypasses volatile and request-time health endpoints when no usable key exists', function () {
    expect(cache.getCacheKey('/api/getLastBlocks?n=0', '/api/getLastBlocks')).to.equal(null);
    expect(
      cache.getCacheKey('/api/networkHealth', '/api/networkHealth', {
        id: 'block-101',
        height: 101,
      }),
    ).to.equal(null);
  });

  it('keeps stable endpoint keys unchanged', function () {
    expect(
      cache.getCacheKey('/api/getBlock?blockId=123', '/api/getBlock', {
        id: 'block-101',
        height: 101,
      }),
    ).to.equal('/api/getBlock?blockId=123');
  });
});
