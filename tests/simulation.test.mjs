import assert from 'node:assert/strict';
import { test } from 'node:test';
import { editWithGemini } from '../lib/simulation/gemini.ts';
import {
  buildPlan,
  simulationPrompt,
  SimulationError,
} from '../lib/simulation/types.ts';

const procedure = {
  id: '10000000-0000-4000-8000-000000000001',
  name: 'Procedimento de teste',
  description: '',
  regions: ['Região A', 'Região B'],
  questions: [
    { id: 'question-1', label: 'Escolha técnica?', options: ['A', 'B'] },
  ],
  requires_product: true,
  active: true,
};
const product = {
  id: '20000000-0000-4000-8000-000000000001',
  procedure_id: procedure.id,
  name: 'Produto de teste',
  brand: '',
  unit: '',
  active: true,
};
const input = {
  regions: ['Região A'],
  intensity: 'Discreta',
  answers: { 'question-1': 'A' },
  quantity: '',
  notes: 'Preservar características não selecionadas.',
};

test('planning accepts only catalog-compatible choices', () => {
  const plan = buildPlan(input, procedure, product);
  assert.equal(plan.product?.id, product.id);
  assert.deepEqual(plan.regions, ['Região A']);
  assert.throws(
    () =>
      buildPlan(
        { ...input, regions: ['Fora do catálogo'] },
        procedure,
        product,
      ),
    SimulationError,
  );
  assert.throws(
    () =>
      buildPlan(input, procedure, {
        ...product,
        procedure_id: '30000000-0000-4000-8000-000000000001',
      }),
    /não pertence/,
  );
  assert.throws(
    () => buildPlan({ ...input, answers: {} }, procedure, product),
    /Responda/,
  );
});

test('prompt limits the edit and does not treat quantity as predicted effect', () => {
  const prompt = simulationPrompt(buildPlan(input, procedure, product));
  assert.match(prompt, /Preserve identidade/);
  assert.match(prompt, /não infira correspondência entre dose e aparência/i);
  assert.match(prompt, /não representa promessa de resultado/i);
});

test('Gemini request sends one photo server-side and returns its image', async () => {
  let calls = 0;
  const output = Buffer.from('generated-image');
  const result = await editWithGemini(
    Buffer.from('original-image'),
    buildPlan(input, procedure, product),
    'test-key',
    'test-image-model',
    async (url, options) => {
      calls += 1;
      assert.equal(
        url,
        'https://generativelanguage.googleapis.com/v1beta/models/test-image-model:generateContent',
      );
      assert.equal(options.headers['x-goog-api-key'], 'test-key');
      const body = JSON.parse(options.body);
      assert.equal(body.contents[0].parts.length, 2);
      assert.equal(
        body.contents[0].parts[1].inlineData.data,
        Buffer.from('original-image').toString('base64'),
      );
      return Response.json({
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    mimeType: 'image/png',
                    data: output.toString('base64'),
                  },
                },
              ],
            },
          },
        ],
      });
    },
  );
  assert.equal(calls, 1);
  assert.deepEqual(result.image, output);
  assert.equal(result.mime, 'image/png');
});

test('Gemini usage limit is not retried automatically', async () => {
  let calls = 0;
  await assert.rejects(
    editWithGemini(
      Buffer.from('original'),
      buildPlan(input, procedure, product),
      'test-key',
      'test-image-model',
      async () => {
        calls += 1;
        return new Response('{}', { status: 429 });
      },
    ),
    (error) => error instanceof SimulationError && error.status === 429,
  );
  assert.equal(calls, 1);
});

test('Gemini response without an image fails closed', async () => {
  await assert.rejects(
    editWithGemini(
      Buffer.from('original'),
      buildPlan(input, procedure, product),
      'test-key',
      'test-image-model',
      async () =>
        Response.json({
          candidates: [{ content: { parts: [{ text: 'no image' }] } }],
        }),
    ),
    (error) => error instanceof SimulationError && error.status === 422,
  );
});
