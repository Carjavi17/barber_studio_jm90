import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { requireRole } from './roles.js';

// A minimal stand-in for Express' response object
function fakeRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

// Runs the middleware and reports what happened
function run(middleware, user) {
  const res = fakeRes();
  let nextCalled = false;
  middleware({ user }, res, () => { nextCalled = true; });
  return { res, nextCalled };
}

describe('requireRole', () => {
  test('lets a user with the allowed role continue', () => {
    const { res, nextCalled } = run(requireRole('admin'), { role: 'admin' });

    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, 200);
  });

  test('blocks other roles with 403 and a message in Spanish', () => {
    const { res, nextCalled } = run(requireRole('admin'), { role: 'client' });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.error, 'No tienes permiso para hacer esto');
  });

  test('accepts any of several roles', () => {
    const middleware = requireRole('barber', 'admin');

    assert.equal(run(middleware, { role: 'barber' }).nextCalled, true);
    assert.equal(run(middleware, { role: 'admin' }).nextCalled, true);
    assert.equal(run(middleware, { role: 'client' }).nextCalled, false);
  });

  test('a client can never act as a barber or admin', () => {
    for (const allowed of ['barber', 'admin']) {
      assert.equal(run(requireRole(allowed), { role: 'client' }).res.statusCode, 403);
    }
  });
});
