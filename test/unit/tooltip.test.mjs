import { expect } from 'chai';
import { normalizeTooltip } from '../../src/directives/tooltip.js';

describe('tooltip directive', function () {
  it('normalizes plain text with safe visual defaults', function () {
    expect(normalizeTooltip('  Exact UTC time  ')).to.deep.equal({
      content: 'Exact UTC time',
      tone: 'default',
      placement: 'top',
    });
  });

  it('keeps supported semantic options and rejects unsupported ones', function () {
    expect(
      normalizeTooltip({
        content: 'Forging',
        tone: 'green',
        placement: 'left',
      }),
    ).to.deep.equal({
      content: 'Forging',
      tone: 'green',
      placement: 'left',
    });

    expect(
      normalizeTooltip({ content: 'Safe', tone: 'custom', placement: 'center' }),
    ).to.deep.equal({
      content: 'Safe',
      tone: 'default',
      placement: 'top',
    });
  });
});
