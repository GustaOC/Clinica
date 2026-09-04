import {
  authenticated,
  failure,
  jsonBody,
  response,
  sameOrigin,
} from '@/lib/simulation/server';
import {
  buildPlan,
  record,
  SimulationError,
  textField,
  uuid,
  type Procedure,
  type Product,
} from '@/lib/simulation/types';

export async function GET() {
  try {
    const { db, user } = await authenticated();
    const { data, error } = await db
      .from('aesthetic_sessions')
      .select(
        'id,title,plan,created_at,aesthetic_photos(id,session_id,label,status,original_path,generated_path,error,created_at)',
      )
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error)
      throw new SimulationError('Não foi possível carregar o histórico.', 503);
    return response({ sessions: data });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { db, user } = await authenticated(),
      body = record(await jsonBody(request));
    if (body.consent !== true)
      throw new SimulationError(
        'Confirme a autorização para uso das imagens na simulação.',
      );
    const { data: procedure } = await db
      .from('aesthetic_procedures')
      .select('*')
      .eq('id', uuid(body.procedure_id))
      .eq('active', true)
      .maybeSingle();
    if (!procedure) throw new SimulationError('Procedimento não encontrado.');
    let product: Product | null = null;
    if (body.product_id) {
      const { data } = await db
        .from('aesthetic_products')
        .select('*')
        .eq('id', uuid(body.product_id))
        .maybeSingle();
      if (!data) throw new SimulationError('Produto não encontrado.');
      product = data as Product;
    }
    const plan = buildPlan(body, procedure as Procedure, product);
    const { data, error } = await db
      .from('aesthetic_sessions')
      .insert({
        owner_id: user.id,
        title: textField(body.title || 'Nova simulação', 'Identificação', 100),
        plan,
        consent: true,
        consent_at: new Date().toISOString(),
      })
      .select('id,title,plan,created_at')
      .single();
    if (error)
      throw new SimulationError('Não foi possível salvar o planejamento.', 503);
    return response({ session: data }, 201);
  } catch (error) {
    return failure(error);
  }
}
