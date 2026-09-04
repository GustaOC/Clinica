import sharp from 'sharp';
import {
  authenticated,
  BUCKET,
  configuration,
  failure,
  response,
  sameOrigin,
} from '@/lib/simulation/server';
import { editWithGemini } from '@/lib/simulation/gemini';
import { SimulationError, uuid, type Plan } from '@/lib/simulation/types';

export const runtime = 'nodejs';
export const maxDuration = 300;
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    sameOrigin(request);
    const { db, user } = await authenticated(),
      id = uuid((await context.params).id);
    const key = process.env.GEMINI_API_KEY;
    if (!key)
      throw new SimulationError(
        'A geração de imagens ainda não foi conectada.',
        503,
      );
    const { data: claim, error: claimError } = await db.rpc(
      'claim_aesthetic_photo',
      { photo_id: id },
    );
    if (claimError)
      throw new SimulationError(
        'Esta foto já está em processamento ou há outra geração em andamento. Atualize o histórico antes de tentar novamente.',
        409,
      );
    if (!claim)
      throw new SimulationError('Foto não disponível para geração.', 404);
    try {
      const { data: session } = await db
        .from('aesthetic_sessions')
        .select('plan')
        .eq('id', claim.session_id)
        .eq('owner_id', user.id)
        .single();
      if (!session)
        throw new SimulationError('Planejamento não encontrado.', 404);
      const { data: original, error: downloadError } = await db.storage
        .from(BUCKET)
        .download(claim.original_path);
      if (downloadError || !original)
        throw new SimulationError('Não foi possível ler a foto original.', 503);
      const { image } = await editWithGemini(
        Buffer.from(await original.arrayBuffer()),
        session.plan as Plan,
        key,
        configuration().model,
      );
      const resized = await sharp(image, { limitInputPixels: 32_000_000 })
        .rotate()
        .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 90 })
        .toBuffer({ resolveWithObject: true });
      const width = resized.info.width,
        height = Math.max(26, Math.round(width * 0.032));
      const label = Buffer.from(
        `<svg width="${width}" height="${height}"><rect width="100%" height="100%" fill="#152c46" fill-opacity=".85"/><text x="50%" y="67%" text-anchor="middle" font-family="sans-serif" font-size="${Math.round(height * 0.46)}" fill="white">SIMULAÇÃO IA · RESULTADO ILUSTRATIVO</text></svg>`,
      );
      const marked = await sharp(resized.data)
        .composite([{ input: label, gravity: 'south' }])
        .jpeg({ quality: 90 })
        .toBuffer();
      const path = `${user.id}/${claim.session_id}/${id}-generated-${claim.claim_token}.jpg`;
      const { error: uploadError } = await db.storage
        .from(BUCKET)
        .upload(path, marked, { contentType: 'image/jpeg' });
      if (uploadError)
        throw new SimulationError(
          'A imagem foi gerada, mas não foi possível salvar o resultado. Uma nova tentativa poderá gerar nova cobrança.',
          503,
        );
      const { data: photo, error: finishError } = await db.rpc(
        'finish_aesthetic_photo',
        {
          photo_id: id,
          token: claim.claim_token,
          result_path: path,
          failure_message: null,
          used_model: configuration().model,
        },
      );
      if (finishError) {
        await db.storage.from(BUCKET).remove([path]);
        throw new SimulationError(
          'Não foi possível registrar o resultado. Confira o histórico.',
          503,
        );
      }
      return response({ photo });
    } catch (error) {
      await db.rpc('finish_aesthetic_photo', {
        photo_id: id,
        token: claim.claim_token,
        result_path: null,
        failure_message:
          error instanceof SimulationError
            ? error.message
            : 'Falha ao processar a imagem. Revise a foto e tente novamente.',
        used_model: configuration().model,
      });
      throw error;
    }
  } catch (error) {
    return failure(error);
  }
}
