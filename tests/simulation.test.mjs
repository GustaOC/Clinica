import assert from 'node:assert/strict';
import { test } from 'node:test';
import { editWithOpenAI } from '../lib/simulation/openai.ts';
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
  region_options: {
    'Região A': { intensidade_visual: 'Discreta' },
  },
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
  assert.match(prompt, /preserv.*identidade/i);
  assert.match(prompt, /regioes_selecionadas/);
  assert.match(prompt, /intensidade_visual|Intensidade visual/);
  assert.match(prompt, /não converta quantidade diretamente/i);
  assert.match(prompt, /não constituem diagnóstico, prescrição ou promessa/i);
  assert.match(prompt, /ajustes estruturados.*autoridade principal/i);
  assert.match(prompt, /Procedimento de teste/);
  assert.match(prompt, /Produto de teste/);
  assert.match(prompt, /Região A/);
  assert.match(prompt, /Escolha técnica/);
  assert.match(prompt, /Preservar características não selecionadas/);
  assert.match(prompt, /<planejamento_do_sistema>/);
});

test('every selected region requires all of its structured parameters', () => {
  const lipsProcedure = {
    ...procedure,
    regions: ['Lábios'],
    questions: [],
  };
  const lipsProduct = { ...product, procedure_id: lipsProcedure.id };
  assert.throws(
    () =>
      buildPlan(
        {
          ...input,
          regions: ['Lábios'],
          region_options: { Lábios: { volume: 'Discreto' } },
          answers: {},
        },
        lipsProcedure,
        lipsProduct,
      ),
    /projeção para Lábios/i,
  );
  const plan = buildPlan(
    {
      ...input,
      regions: ['Lábios'],
      region_options: {
        Lábios: { volume: 'Moderado', projecao: 'Discreta' },
      },
      answers: {},
    },
    lipsProcedure,
    lipsProduct,
  );
  assert.deepEqual(plan.region_options.Lábios, {
    volume: 'Moderado',
    projecao: 'Discreta',
  });
});

test('OpenAI request sends one photo server-side and returns its image', async () => {
  let calls = 0;
  const output = Buffer.from('generated-image');
  const result = await editWithOpenAI(
    Buffer.from('original-image'),
    buildPlan(input, procedure, product),
    'test-key',
    'test-image-model',
    async (url, options) => {
      calls += 1;
      assert.equal(url, 'https://api.openai.com/v1/images/edits');
      assert.equal(options.headers.Authorization, 'Bearer test-key');
      assert.ok(options.body instanceof FormData);
      assert.equal(options.body.get('model'), 'test-image-model');
      assert.equal(options.body.get('quality'), 'high');
      assert.match(options.body.get('prompt'), /Procedimento de teste/);
      const sentImage = options.body.get('image[]');
      assert.ok(sentImage instanceof Blob);
      assert.deepEqual(
        Buffer.from(await sentImage.arrayBuffer()),
        Buffer.from('original-image'),
      );
      return Response.json({
        data: [{ b64_json: output.toString('base64') }],
      });
    },
  );
  assert.equal(calls, 1);
  assert.deepEqual(result.image, output);
  assert.equal(result.mime, 'image/png');
});

test('OpenAI usage limit is not retried automatically', async () => {
  let calls = 0;
  await assert.rejects(
    editWithOpenAI(
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

test('OpenAI response without an image fails closed', async () => {
  await assert.rejects(
    editWithOpenAI(
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
