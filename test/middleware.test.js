import { test } from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../functions/_middleware.js';

const run = (u) => onRequest({ request: new Request(u), next: async () => new Response('page') });

test('bare domain redirects to www, keeping path and query', async () => {
  const res = await run('https://aloudedu.com/privacy?x=1');
  assert.equal(res.status, 301);
  assert.equal(res.headers.get('location'), 'https://www.aloudedu.com/privacy?x=1');
});

test('www is served untouched and indexable', async () => {
  const res = await run('https://www.aloudedu.com/');
  assert.equal(await res.text(), 'page');
  assert.equal(res.headers.get('x-robots-tag'), null);
});

test('pages.dev copies (incl. previews) are noindex', async () => {
  for (const u of ['https://aloud-website-9e1.pages.dev/', 'https://cd3209c1.aloud-website-9e1.pages.dev/']) {
    const res = await run(u);
    assert.equal(res.headers.get('x-robots-tag'), 'noindex');
    assert.equal(await res.text(), 'page');
  }
});
