import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import config from '../config.js';
import { toShopDate } from './time.js';

describe('toShopDate', () => {
  test('uses the shop time zone, not the time zone of the machine', () => {
    // 03:30 UTC is 23:30 of the 25th in Caracas (UTC-4)...
    const instant = new Date('2026-11-26T03:30:00Z');

    assert.equal(toShopDate(instant, 'America/Caracas'), '2026-11-25');
    // ...and already 00:30 of the 26th in Buenos Aires (UTC-3)
    assert.equal(toShopDate(instant, 'America/Argentina/Buenos_Aires'), '2026-11-26');
    assert.equal(toShopDate(instant, 'UTC'), '2026-11-26');
  });

  test('formats as YYYY-MM-DD with leading zeros', () => {
    assert.equal(toShopDate(new Date('2026-01-05T15:00:00Z'), 'UTC'), '2026-01-05');
  });

  test('defaults to the zone configured for the shop', () => {
    const instant = new Date('2026-11-26T03:30:00Z');

    assert.equal(toShopDate(instant), toShopDate(instant, config.SHOP_TIMEZONE));
  });
});
