import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { GET, POST } from '../app/api/patients/route.ts';

test('patient API remains closed after removing previous authentication', async () => {
  for (const handler of [GET, POST]) {
    const response = handler(
      new Request('https://example.test/api/patients', {
        headers: {
          'oai-authenticated-user-id': 'spoofed',
          'oai-authenticated-user-email': 'test@example.test',
        },
      }),
    );
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const data = await response.json();
    assert.equal(data.error, 'PATIENT_PORTAL_UNAVAILABLE');
    assert.equal(data.patients, undefined);
  }
});
test('deployment scripts and dependencies no longer require hosted Sites runtime', async () => {
  const packageJson = JSON.parse(
    await readFile(new URL('../package.json', import.meta.url), 'utf8'),
  );
  assert.equal(packageJson.scripts.build, 'next build');
  assert.equal(packageJson.scripts.start, 'next start');
  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };
  for (const forbidden of [
    'vinext',
    'wrangler',
    '@openai/sites-vite-plugin',
    '@cloudflare/vite-plugin',
  ])
    assert.equal(dependencies[forbidden], undefined);
});
test('public route does not load the legacy dashboard or previous identity provider', async () => {
  const page = await readFile(
    new URL('../app/page.tsx', import.meta.url),
    'utf8',
  );
  assert.doesNotMatch(page, /requireChatGPTUser|clinic-app|oai-authenticated/);
});
test('published interface has no provisional brand or brand artwork', async () => {
  const visibleSources = await Promise.all(
    ['../app/layout.tsx', '../components/simulation/workspace.tsx'].map(
      (path) => readFile(new URL(path, import.meta.url), 'utf8'),
    ),
  );
  assert.doesNotMatch(visibleSources.join('\n'), /\bLumina\b/i);
  for (const path of ['../public/favicon.svg', '../public/og.png'])
    await assert.rejects(
      readFile(new URL(path, import.meta.url)),
      (error) => error?.code === 'ENOENT',
    );
});
