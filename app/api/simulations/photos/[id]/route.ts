import { authenticated, failure, response } from '@/lib/simulation/server';
import { SimulationError, uuid } from '@/lib/simulation/types';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { db, user } = await authenticated();
    const id = uuid((await context.params).id);
    const { data: photo, error } = await db
      .from('aesthetic_photos')
      .select('*')
      .eq('id', id)
      .eq('owner_id', user.id)
      .maybeSingle();
    if (error || !photo)
      throw new SimulationError('Fotografia não encontrada.', 404);
    return response({ photo });
  } catch (error) {
    return failure(error);
  }
}
