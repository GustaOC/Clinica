import { authenticated, BUCKET, failure } from '@/lib/simulation/server';
import { SimulationError, uuid } from '@/lib/simulation/types';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { db, user } = await authenticated(),
      id = uuid((await context.params).id);
    const { data: photo } = await db
      .from('aesthetic_photos')
      .select('original_path,generated_path')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single();
    const generated =
      new URL(request.url).searchParams.get('kind') === 'generated';
    const path = generated ? photo?.generated_path : photo?.original_path;
    if (!path) throw new SimulationError('Imagem não encontrada.', 404);
    const { data, error } = await db.storage.from(BUCKET).download(path);
    if (error || !data) throw new SimulationError('Imagem indisponível.', 404);
    return new Response(data, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'private, no-store',
        'Content-Disposition': `${new URL(request.url).searchParams.has('download') ? 'attachment' : 'inline'}; filename="${generated ? 'simulacao-ia' : 'original'}-${id}.jpg"`,
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return failure(error);
  }
}
