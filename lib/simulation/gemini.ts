import { SimulationError, simulationPrompt, type Plan } from './types.ts';

// Supported REST generateContent endpoint. Never receives a provider URL from the browser.
export async function editWithGemini(
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
  let result: Response;
  try {
    result = await fetcher(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        signal: AbortSignal.timeout(240_000),
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: simulationPrompt(plan) },
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: image.toString('base64'),
                  },
                },
              ],
            },
          ],
          generationConfig: {
            candidateCount: 1,
            responseModalities: ['IMAGE'],
            thinkingConfig: { thinkingLevel: 'HIGH' },
            imageConfig: { imageSize: '2K' },
          },
        }),
      },
    );
  } catch {
    throw new SimulationError(
      'A geração demorou além do limite. Confira o histórico antes de tentar novamente.',
      504,
    );
  }
  if (result.status === 429)
    throw new SimulationError(
      'Limite de uso do Gemini atingido. Aguarde antes de tentar novamente.',
      429,
    );
  if (result.status === 401 || result.status === 403)
    throw new SimulationError(
      'A conta Gemini não autorizou a geração. Confira a chave, o faturamento e o acesso ao modelo Pro Image.',
      503,
    );
  if (result.status === 400 || result.status === 404)
    throw new SimulationError(
      'O modelo Gemini Pro Image não está disponível para esta conta ou configuração.',
      503,
    );
  if (!result.ok)
    throw new SimulationError(
      'O serviço de imagem do Gemini está temporariamente indisponível. Tente novamente mais tarde.',
      502,
    );
  const body = await result.json();
  const parts = body.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts))
    throw new SimulationError(
      body.candidates?.[0]?.finishReason === 'SAFETY'
        ? 'O Gemini não gerou a imagem devido aos filtros de segurança.'
        : 'O Gemini não retornou uma imagem para esta foto.',
      422,
    );
  const output = parts.find(
    (part: { inlineData?: { mimeType?: string; data?: string } }) =>
      part.inlineData?.mimeType?.startsWith('image/') && part.inlineData?.data,
  );
  if (!output)
    throw new SimulationError(
      'Não foi possível simular esta foto. Revise o planejamento e a imagem.',
      422,
    );
  const data = output.inlineData.data as string;
  if (data.length > 20_000_000)
    throw new SimulationError(
      'A imagem gerada excedeu o tamanho permitido.',
      502,
    );
  return {
    image: Buffer.from(data, 'base64'),
    mime: output.inlineData.mimeType as string,
  };
}
