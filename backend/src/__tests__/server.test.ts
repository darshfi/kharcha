import test from 'node:test';
import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import { parseUPISMS } from '../lib/parseUPISMS';

// These tests never connect to the real database.
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
const app = require('../server').default;
const { supabase } = require('../services/supabase');

test('HTTP health and authenticated SMS parsing', async (t) => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  t.after(() => new Promise<void>(resolve => server.close(() => resolve())));
  t.mock.method(supabase.auth, 'getUser', async (token: string) => token === 'valid-token'
    ? { data: { user: { id: 'test-user' } }, error: null }
    : { data: { user: null }, error: new Error('Invalid token') });
  const post = (body: unknown, authorization?: string) => fetch(`${base}/api/expenses/sms-parse`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(authorization ? { Authorization: authorization } : {}) },
    body: JSON.stringify(body),
  });

  await t.test('health responds at the implemented path', async () => {
    const response = await fetch(`${base}/health`);
    assert.equal(response.status, 200);
    assert.equal((await response.json() as any).status, 'OK');
  });
  await t.test('missing, malformed and invalid tokens are rejected', async () => {
    for (const header of [undefined, 'valid-token', 'Basic valid-token', 'Bearer invalid']) {
      const response = await post({ sms_text: 'Rs.250 debited', user_id: 'test-user' }, header);
      assert.equal(response.status, 401);
    }
  });
  await t.test('another user cannot submit a parsing request', async () => {
    assert.equal((await post({ sms_text: 'Rs.250 debited', user_id: 'another-user' }, 'Bearer valid-token')).status, 403);
  });
  await t.test('non-string text is a client error', async () => {
    assert.equal((await post({ sms_text: { text: 'Rs.250' }, user_id: 'test-user' }, 'Bearer valid-token')).status, 400);
  });
  await t.test('bank SMS example retains date, merchant and reference', async () => {
    const response = await post({
      sms_text: 'Rs.250.00 debited on 24-09-26 to VPA swiggy@icici (UPI Ref No 426812345678)', user_id: 'test-user',
    }, 'bearer valid-token');
    assert.equal(response.status, 200);
    const result = await response.json() as any;
    assert.equal(result.amount, 250);
    assert.equal(result.date, '2026-09-24');
    assert.equal(result.merchant, 'swiggy');
    assert.equal(result.referenceNumber, '426812345678');
  });
});

test('textual bank dates and credit detection', () => {
  const result = parseUPISMS('INR 1,500.50 received on 2-Oct-2026. UTR 123456789012');
  assert.equal(result.amount, 1500.5);
  assert.equal(result.date, '2026-10-02');
  assert.equal(result.isCredit, true);
});
