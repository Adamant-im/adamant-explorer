import { createRequire } from 'node:module';
import { expect } from 'chai';

const require = createRequire(import.meta.url);
const {
  buildContentSecurityPolicy,
  normalizeHostHeader,
} = require('../../modules/httpSecurity.js');

describe('HTTP security policy', function () {
  it('allows only same-host WebSocket connections for valid public hosts', function () {
    expect(buildContentSecurityPolicy('explorer.adamant.im')).to.include(
      "connect-src 'self' ws://explorer.adamant.im wss://explorer.adamant.im",
    );
    expect(buildContentSecurityPolicy('127.0.0.1:6040')).to.include(
      'ws://127.0.0.1:6040 wss://127.0.0.1:6040',
    );
    expect(buildContentSecurityPolicy('[::1]:6040')).to.include('ws://[::1]:6040 wss://[::1]:6040');
  });

  it('does not expand connect-src for malformed or directive-like hosts', function () {
    for (const host of [
      'example.com; script-src https://evil.example',
      'example.com/path',
      'user@example.com',
      'example.com:0',
      'example.com:70000',
      '[not-ipv6]',
      '',
    ]) {
      const policy = buildContentSecurityPolicy(host);

      expect(normalizeHostHeader(host)).to.equal(null);
      expect(policy).to.include("connect-src 'self';");
      expect(policy).not.to.include('evil.example');
    }
  });

  it('keeps the map and runtime-style allowances required by the current UI', function () {
    const policy = buildContentSecurityPolicy('explorer.adamant.im');

    expect(policy).to.include("img-src 'self' https://*.tile.openstreetmap.org data:");
    expect(policy).to.include("style-src 'self' 'unsafe-inline'");
    expect(policy).to.include("object-src 'none'");
    expect(policy).to.include("base-uri 'self'");
  });
});
