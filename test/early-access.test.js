import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/early-access.js';

// In-memory stand-in for D1: a UNIQUE email column.
function fakeDb() {
  const rows = new Set();
  return {
    rows,
    prepare: () => ({
      bind: (email) => ({
        run: async () => {
          if (rows.has(email)) return { meta: { changes: 0 } };
          rows.add(email);
          return { meta: { changes: 1 } };
        },
      }),
    }),
  };
}

let env, sent, resendOk;
beforeEach(() => {
  env = { DB: fakeDb(), RESEND_API_KEY: 're_test', FROM_EMAIL: 'Aloud <onboarding@resend.dev>' };
  sent = [];
  resendOk = true;
  globalThis.fetch = async (url, init) => {
    sent.push({ url, body: JSON.parse(init.body) });
    return new Response(resendOk ? '{"id":"x"}' : '{"message":"nope"}', { status: resendOk ? 200 : 500 });
  };
});

const post = (body) =>
  onRequestPost({
    request: new Request('http://x/api/early-access', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) }),
    env,
  });

test('stores a new email (normalised) and sends one thank-you mail', async () => {
  const res = await post({ email: '  Prof@Uni.EDU ' });
  assert.equal(res.status, 200);
  assert.deepEqual([...env.DB.rows], ['prof@uni.edu']);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].url, 'https://api.resend.com/emails');
  assert.deepEqual(sent[0].body.to, ['prof@uni.edu']);
});

test('a repeat signup succeeds but does not mail again', async () => {
  await post({ email: 'a@b.co' });
  const res = await post({ email: 'A@b.co' });
  assert.equal(res.status, 200);
  assert.equal(env.DB.rows.size, 1);
  assert.equal(sent.length, 1);
});

test('rejects invalid emails and bad JSON', async () => {
  for (const email of ['', 'nope', 'a@b', 'a b@c.d', `${'x'.repeat(250)}@b.co`, 42]) {
    assert.equal((await post({ email })).status, 400, String(email));
  }
  assert.equal((await post('not json')).status, 400);
  assert.equal(env.DB.rows.size, 0);
});

test('honeypot: bot submissions look successful but store nothing', async () => {
  const res = await post({ email: 'bot@spam.co', website: 'http://spam' });
  assert.equal(res.status, 200);
  assert.equal(env.DB.rows.size, 0);
  assert.equal(sent.length, 0);
});

test('email provider failure still keeps the signup', async () => {
  resendOk = false;
  const res = await post({ email: 'keep@me.co' });
  assert.equal(res.status, 200);
  assert.ok(env.DB.rows.has('keep@me.co'));
});

test('database failure returns 500 so the visitor can retry', async () => {
  env.DB.prepare = () => { throw new Error('db down'); };
  assert.equal((await post({ email: 'x@y.co' })).status, 500);
});
