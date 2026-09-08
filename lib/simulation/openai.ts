import { SimulationError, simulationPrompt, type Plan } from './types.ts';

type OpenAIImageResponse = {
  data?: Array<{ b64_json?: string }>;
  error?: { code?: string; message?: string; type?: string };
};

// A single-image edit uses the Image API recommended for one prompt and one output.
// The provider URL and model are never accepted from the browser.
export async function editWithOpenAI(
  image: Buffer,
  plan: Plan,
  apiKey: string,
  model: string,
  fetcher: typeof fetch = fetch,
): Promise<{ image: Buffer; mime: string }> {
  if (!/^[a-z0-9.-]+$/.test(model))
    throw new SimulationError(
      'Modelo de imagem não configurado corretamente.',
      503,
    );

  const form = new FormData();
  form.set('model', model);
  form.set('prompt', simulationPrompt(plan));
  form.set('quality', 'high');
  form.append(
    'image[]',
    new Blob([new Uint8Array(image)], { type: 'image/jpeg' }),
    'photo.jpg',
  );

  let result: Response;
  try {
    result = await fetcher('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: AbortSignal.timeout(240_000),
    });
  } catch {
    throw new SimulationError(
      'A geração demorou além do limite. Confira o histórico antes de tentar novamente.',
      504,
    );
  }

  let body: OpenAIImageResponse;
  try {
    body = (await result.json()) as OpenAIImageResponse;
  } catch {
    throw new SimulationError(
      'O serviço de imagens da OpenAI retornou uma resposta inválida.',
      502,
    );
  }

  if (result.status === 429)
    throw new SimulationError(
      'Limite ou saldo da OpenAI atingido. Confira o faturamento antes de tentar novamente.',
      429,
    );
  if (result.status === 401 || result.status === 403)
    throw new SimulationError(
      'A OpenAI não autorizou a geração. Confira a chave, o faturamento e o acesso ao modelo de imagem.',
      503,
    );
  if (result.status === 400 || result.status === 404)
    throw new SimulationError(
      body.error?.code === 'moderation_blocked'
        ? 'A OpenAI não gerou a imagem devido aos filtros de segurança.'
        : 'O modelo de imagem da OpenAI não está disponível para esta conta ou configuração.',
      422,
    );
  if (!result.ok)
    throw new SimulationError(
      'O serviço de imagens da OpenAI está temporariamente indisponível. Tente novamente mais tarde.',
      502,
    );

  const encoded = body.data?.[0]?.b64_json;
  if (!encoded)
    throw new SimulationError(
      'A OpenAI não retornou uma imagem para esta foto. Revise o planejamento.',
      422,
    );
  if (encoded.length > 20_000_000)
    throw new SimulationError(
      'A imagem gerada excedeu o tamanho permitido.',
      502,
    );
  return { image: Buffer.from(encoded, 'base64'), mime: 'image/png' };
}
