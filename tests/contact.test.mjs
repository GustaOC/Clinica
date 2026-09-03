import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  emailUrl,
  mapsUrl,
  phoneUrl,
  siteOrigin,
  whatsappUrl,
} from '../lib/contact.ts';

test('missing contacts do not create fake external links', () => {
  for (const makeUrl of [emailUrl, mapsUrl, phoneUrl, whatsappUrl])
    assert.equal(makeUrl(''), null);
});
test('WhatsApp requires country code and encodes only a generic inquiry', () => {
  assert.equal(whatsappUrl('9999'), null);
  assert.equal(whatsappUrl('javascript:5567999990000'), null);
  assert.equal(whatsappUrl('0000000000000'), null);
  assert.equal(whatsappUrl('67999990000'), null);
  // Test fixture only, never used in the page's contact configuration.
  const url = new URL(
    whatsappUrl('+55 (67) 99999-0000', 'avaliação & orientações'),
  );
  assert.equal(url.hostname, 'wa.me');
  assert.equal(url.pathname, '/5567999990000');
  assert.match(url.searchParams.get('text'), /avaliação & orientações/);
  assert.equal(url.searchParams.size, 1);
});
test('phone, email and map links handle configuration safely', () => {
  assert.equal(phoneUrl('+55 (67) 3333-0000'), 'tel:+556733330000');
  assert.equal(emailUrl('javascript:alert(1)'), null);
  assert.equal(emailUrl('test@example.test?subject=bad'), null);
  assert.equal(emailUrl('test%0d%0a@example.test'), null);
  assert.equal(emailUrl('test@example.test'), 'mailto:test@example.test');
  assert.equal(
    new URL(mapsUrl('A & B #2')).searchParams.get('query'),
    'A & B #2',
  );
});
test('metadata uses only explicitly configured trusted origins', () => {
  assert.equal(siteOrigin({}), undefined);
  assert.equal(siteOrigin({ SITE_URL: 'javascript:alert(1)' }), undefined);
  assert.equal(
    siteOrigin({ SITE_URL: 'https://user:password@example.test' }),
    undefined,
  );
  assert.equal(
    siteOrigin({ SITE_URL: 'https://clinic.example.test/a' }).href,
    'https://clinic.example.test/',
  );
  assert.equal(
    siteOrigin({ VERCEL_PROJECT_PRODUCTION_URL: 'clinic-example.vercel.app' })
      .origin,
    'https://clinic-example.vercel.app',
  );
});
