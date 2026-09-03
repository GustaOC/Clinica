import assert from 'node:assert/strict';

// Non-browser diagnostic. Start the production server before running this script.
const origin = process.env.SMOKE_ORIGIN || 'http://localhost:3000';
assert.ok(
  ['localhost', '127.0.0.1'].includes(new URL(origin).hostname),
  'Use only a local test server',
);
for (const path of ['/', '/privacidade', '/termos', '/portal']) {
  const response = await fetch(`${origin}${path}`, { redirect: 'manual' });
  assert.equal(
    response.status,
    200,
    `${path} should render without authentication redirect`,
  );
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  const html = await response.text();
  assert.match(html, /lang="pt-BR"/);
  assert.doesNotMatch(
    html,
    /signin-with-chatgpt|oai-authenticated-user|Mariana Lopes|Dra\. Valentina/,
  );
  if (path === '/') {
    for (const id of [
      'especialidades',
      'corpo-clinico',
      'estrutura',
      'convenios',
      'contato',
    ])
      assert.ok(html.includes(`id="${id}"`), `missing section ${id}`);
    assert.ok(html.includes('noindex'));
    assert.ok(html.includes('Endereço a informar'));
  }
  console.log(`OK ${path} (${Buffer.byteLength(html)} bytes HTML)`);
}
for (const method of ['GET', 'POST']) {
  const response = await fetch(`${origin}/api/patients`, {
    method,
    headers: {
      'oai-authenticated-user-id': 'spoofed',
      'oai-authenticated-user-email': 'spoofed@example.test',
    },
  });
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal((await response.json()).error, 'PATIENT_PORTAL_UNAVAILABLE');
  console.log(`OK ${method} /api/patients stays closed`);
}
