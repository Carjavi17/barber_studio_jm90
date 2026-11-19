import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import config from '../config.js';
import { validateService, validateReview, MAX_DURATION, MAX_COMMENT } from './validation.js';

const SLOT = config.SLOT_MINUTES;

describe('validateService', () => {
  const valid = { name: '  Corte de Cabello ', durationMinutes: SLOT, price: 22000 };

  test('accepts a valid service and trims the name', () => {
    const result = validateService(valid, { requireAll: true });

    assert.equal(result.error, undefined);
    assert.deepEqual(result.data, { name: 'Corte de Cabello', durationMinutes: SLOT, price: 22000 });
  });

  test('requires name, duration and price when creating', () => {
    for (const missing of ['name', 'durationMinutes', 'price']) {
      const body = { ...valid };
      delete body[missing];

      const result = validateService(body, { requireAll: true });

      assert.ok(result.error, `should fail without ${missing}`);
      assert.equal(result.data, undefined);
    }
  });

  test('rejects an empty or blank name', () => {
    assert.ok(validateService({ ...valid, name: '' }, { requireAll: true }).error);
    assert.ok(validateService({ ...valid, name: '   ' }, { requireAll: true }).error);
  });

  test('rejects durations that do not fit the slot size', () => {
    assert.ok(validateService({ ...valid, durationMinutes: SLOT + 1 }, { requireAll: true }).error);
    assert.ok(validateService({ ...valid, durationMinutes: 0 }, { requireAll: true }).error);
    assert.ok(validateService({ ...valid, durationMinutes: -SLOT }, { requireAll: true }).error);
  });

  test('rejects durations above the maximum, accepts the maximum itself', () => {
    assert.ok(validateService({ ...valid, durationMinutes: MAX_DURATION + SLOT }, { requireAll: true }).error);
    assert.equal(validateService({ ...valid, durationMinutes: MAX_DURATION }, { requireAll: true }).error, undefined);
  });

  test('accepts a price of 0 but not negative or decimal prices', () => {
    assert.equal(validateService({ ...valid, price: 0 }, { requireAll: true }).error, undefined);
    assert.ok(validateService({ ...valid, price: -1 }, { requireAll: true }).error);
    assert.ok(validateService({ ...valid, price: 20.5 }, { requireAll: true }).error);
  });

  test('rejects values that are not real numbers (an empty price must not become 0)', () => {
    for (const bad of ['', null, true, [], 'abc', '22000']) {
      const result = validateService({ ...valid, price: bad }, { requireAll: true });
      assert.ok(result.error, `price ${JSON.stringify(bad)} should be rejected`);
    }
  });

  test('when editing, only validates what was sent', () => {
    assert.deepEqual(validateService({ price: 25000 }, { requireAll: false }).data, { price: 25000 });
    assert.deepEqual(validateService({}, { requireAll: false }).data, {});
  });

  test('isActive must be a boolean', () => {
    assert.deepEqual(validateService({ isActive: false }, { requireAll: false }).data, { isActive: false });
    assert.ok(validateService({ isActive: 'false' }, { requireAll: false }).error);
  });

  test('ignores unknown fields instead of passing them to the database', () => {
    const result = validateService({ ...valid, id: 99, role: 'admin' }, { requireAll: true });

    assert.deepEqual(Object.keys(result.data).sort(), ['durationMinutes', 'name', 'price']);
  });
});

describe('validateReview', () => {
  test('accepts ratings from 1 to 5', () => {
    for (const rating of [1, 2, 3, 4, 5]) {
      assert.equal(validateReview(rating, ''), null);
    }
  });

  test('rejects ratings outside 1-5, decimals and NaN', () => {
    for (const rating of [0, 6, -1, 3.5, NaN]) {
      assert.ok(validateReview(rating, ''), `rating ${rating} should be rejected`);
    }
  });

  test('accepts a comment of exactly the maximum length, rejects one more', () => {
    assert.equal(validateReview(5, 'a'.repeat(MAX_COMMENT)), null);
    assert.match(validateReview(5, 'a'.repeat(MAX_COMMENT + 1)), /500 caracteres/);
  });
});
