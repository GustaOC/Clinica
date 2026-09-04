import sharp from 'sharp';
import {
  authenticated,
  BUCKET,
  failure,
  limitedBody,
  response,
  sameOrigin,
} from '@/lib/simulation/server';
import { SimulationError, textField, uuid } from '@/lib/simulation/types';

export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { db, user } = await authenticated();
    const bytes = await limitedBody(request, 3 * 1024 * 1024);
    const form = await new Response(Buffer.from(bytes), {
      headers: { 'Content-Type': request.headers.get('content-type') || '' },
    }).formData();
    const sessionId = uuid(form.get('sessionId')),
      id = uuid(form.get('photoId')),
      file = form.get('file');
    if (
      !(file instanceof File) ||
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
    )
      throw new SimulationError('Envie uma imagem JPG, PNG ou WebP.');
    const { data: session } = await db
      .from('aesthetic_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('owner_id', user.id)
      .single();
    if (!session) throw new SimulationError('Simulação não encontrada.', 404);
    const { data: existing } = await db
      .from('aesthetic_photos')
      .select('*')
      .eq('id', id)
      .eq('owner_id', user.id)
      .eq('session_id', sessionId)
      .maybeSingle();
    if (existing) return response({ photo: existing });
    let image: Buffer;
    try {
      image = await sharp(Buffer.from(await file.arrayBuffer()), {
        limitInputPixels: 25_000_000,
      })
        .rotate()
        .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 90 })
        .toBuffer();
    } catch {
      throw new SimulationError(
        'Não foi possível ler a fotografia. Use JPG, PNG ou WebP válido.',
      );
    }
    const path = `${user.id}/${sessionId}/${id}-original.jpg`;
    const { error: uploadError } = await db.storage
      .from(BUCKET)
      .upload(path, image, { contentType: 'image/jpeg', upsert: false });
    if (uploadError)
      throw new SimulationError(
        'Não foi possível salvar a foto no armazenamento privado. Tente novamente.',
        503,
      );
    const { data, error } = await db
      .from('aesthetic_photos')
      .insert({
        id,
        session_id: sessionId,
        owner_id: user.id,
        label: textField(form.get('label') || 'Fotografia', 'Ângulo', 100),
        original_path: path,
      })
      .select('*')
      .single();
    if (error) {
      await db.storage.from(BUCKET).remove([path]);
      throw new SimulationError('Não foi possível registrar a foto.', 503);
    }
    return response({ photo: data }, 201);
  } catch (error) {
    return failure(error);
  }
}
