import {
  authenticated,
  configuration,
  database,
  failure,
  jsonBody,
  response,
  sameOrigin,
  saveSession,
} from '@/lib/simulation/server';
import { record, SimulationError, textField } from '@/lib/simulation/types';

export async function GET() {
  const config = configuration();
  if (!config.url || !config.key)
    return response({ configured: false, gemini: config.gemini, member: null });
  try {
    const { user, member } = await authenticated();
    return response({
      configured: true,
      gemini: config.gemini,
      member: { id: user.id, email: user.email, role: member.role },
    });
  } catch (error) {
    return response({
      configured: true,
      gemini: config.gemini,
      member: null,
      message:
        error instanceof SimulationError && error.status !== 401
          ? error.message
          : undefined,
    });
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const body = record(await jsonBody(request)),
      db = database();
    const email = textField(body.email, 'E-mail', 254);
    if (
      typeof body.password !== 'string' ||
      !body.password.length ||
      body.password.length > 256
    )
      throw new SimulationError('Senha inválida.');
    const password = body.password;
    const { data, error } = await db.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.session)
      throw new SimulationError('E-mail ou senha inválidos.', 401);
    const { data: member, error: memberError } = await db
      .from('aesthetic_members')
      .select('role')
      .eq('user_id', data.user.id)
      .eq('active', true)
      .maybeSingle();
    if (memberError || !member)
      throw new SimulationError(
        'A conta não está habilitada para acessar o sistema clínico.',
        403,
      );
    await saveSession(data.session);
    return response({
      configured: true,
      gemini: configuration().gemini,
      member: { id: data.user.id, email: data.user.email, role: member.role },
    });
  } catch (error) {
    return failure(error);
  }
}
export async function DELETE(request: Request) {
  try {
    sameOrigin(request);
    try {
      const { db } = await authenticated();
      await db.auth.signOut({ scope: 'local' });
    } catch {
      /* Expired sessions can still be cleared. */
    }
    await saveSession(null);
    return response({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
