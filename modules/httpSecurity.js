'use strict';

const { isIP } = require('node:net');

/**
 * Normalize an HTTP Host header for use in CSP host-source expressions.
 *
 * Browsers serialize domain names as ASCII in Host. Rejecting every other
 * character prevents a crafted header from injecting extra CSP directives.
 * @param {*} value Candidate Host header
 * @returns {string|null} Normalized host with optional port, or `null`
 */
function normalizeHostHeader(value) {
  if (typeof value !== 'string' || !value || value.length > 255) {
    return null;
  }

  let hostname = value;
  let port = '';

  if (value.startsWith('[')) {
    const closingBracket = value.indexOf(']');

    if (closingBracket < 0) {
      return null;
    }

    hostname = value.slice(1, closingBracket);
    const suffix = value.slice(closingBracket + 1);

    if (suffix) {
      if (!suffix.startsWith(':')) {
        return null;
      }

      port = suffix.slice(1);
    }

    if (isIP(hostname) !== 6) {
      return null;
    }
  } else {
    const colon = value.lastIndexOf(':');

    if (colon >= 0) {
      if (value.indexOf(':') !== colon) {
        return null;
      }

      hostname = value.slice(0, colon);
      port = value.slice(colon + 1);
    }

    const isHostname = hostname
      .split('.')
      .every(
        (label) =>
          label.length >= 1 &&
          label.length <= 63 &&
          /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label),
      );

    if (!isIP(hostname) && !isHostname) {
      return null;
    }
  }

  if (port) {
    const portNumber = Number(port);

    if (
      !/^[0-9]+$/.test(port) ||
      !Number.isInteger(portNumber) ||
      portNumber < 1 ||
      portNumber > 65_535
    ) {
      return null;
    }
  }

  const normalizedHostname = isIP(hostname) === 6 ? `[${hostname.toLowerCase()}]` : hostname;
  return port ? `${normalizedHostname}:${Number(port)}` : normalizedHostname;
}

/**
 * Build the Explorer's Content Security Policy.
 *
 * Explicit same-host WebSocket sources preserve Socket.IO compatibility in
 * browsers where `'self'` does not cover `ws:` and `wss:`.
 * @param {*} hostHeader Request Host header
 * @returns {string} CSP header value
 */
function buildContentSecurityPolicy(hostHeader) {
  const host = normalizeHostHeader(hostHeader);
  const websocketSources = host ? ` ws://${host} wss://${host}` : '';

  return (
    `frame-ancestors 'none'; default-src 'self'; connect-src 'self'${websocketSources}; ` +
    "img-src 'self' https://*.tile.openstreetmap.org data:; " +
    "style-src 'self' 'unsafe-inline'; font-src 'self'; object-src 'none'; base-uri 'self'"
  );
}

module.exports = {
  buildContentSecurityPolicy,
  normalizeHostHeader,
};
