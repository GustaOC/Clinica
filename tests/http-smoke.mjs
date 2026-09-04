import assert from 'node:assert/strict';

// Non-browser diagnostic. Start the production server before running this script.
const origin = process.env.SMOKE_ORIGIN || 'http://localhost:3000';
assert.ok(
  ['localhost', '127.0.0.1'].includes(new URL(origin).hostname),
  'Use only a local test server',
);

for (const path of ['/', '/privacidade', '/termos']) {
  const response = await fetch(`${origin}${path}`, { redirect: 'manual' });
  assert.equal(response.status, 200, `${path} should render`);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  const html = await response.text();
  assert.match(html, /lang="pt-BR"/);
  assert.doesNotMatch(
    html,
    /signin-with-chatgpt|oai-authenticated-user|Mariana Lopes|Dra\. Valentina/,
  );
  if (path === '/') {
    for (const expected of [
      'Simulação de procedimentos',
      'Fotografias da sessão',
      'Planejamento',
      'CLINICAL WORKSPACE',
    ])
      assert.ok(html.includes(expected), `missing system content: ${expected}`);
    assert.ok(html.includes('noindex'));
    assert.doesNotMatch(html, /Agendar Consulta|Corpo Clínico/);
  }
  console.log(`OK ${path} (${Buffer.byteLength(html)} bytes HTML)`);
}

const portal = await fetch(`${origin}/portal`, { redirect: 'manual' });
assert.equal(portal.status, 307);
assert.equal(portal.headers.get('location'), '/');
console.log('OK /portal redirects to the system');

const workspace = await fetch(`${origin}/api/workspace/session`);
assert.equal(workspace.status, 200);
assert.deepEqual(await workspace.json(), {
  configured: false,
  gemini: false,
  member: null,
});
assert.equal(workspace.headers.get('cache-control'), 'no-store');
console.log('OK workspace reports integrations as unconfigured');

const crossOrigin = await fetch(`${origin}/api/workspace/session`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', origin: 'https://evil.test' },
  body: JSON.stringify({ email: 'fixture@example.test', password: 'fixture' }),
});
assert.equal(crossOrigin.status, 403);
console.log('OK cross-origin login is rejected');

for (const path of ['/api/workspace/catalog', '/api/simulations']) {
  const unavailable = await fetch(`${origin}${path}`);
  assert.equal(unavailable.status, 503);
  assert.equal(unavailable.headers.get('cache-control'), 'no-store');
  console.log(`OK ${path} fails closed without Supabase`);
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
