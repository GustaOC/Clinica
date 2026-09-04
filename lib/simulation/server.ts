import { createClient, type Session } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { SimulationError } from './types';

export const BUCKET = 'aesthetic-photos';
export function configuration() {
  return {
    url: process.env.SUPABASE_URL || '',
    key:
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      '',
    gemini: Boolean(process.env.GEMINI_API_KEY),
    model: process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image',
  };
}
export function database() {
  const { url, key } = configuration();
  if (!url || !key)
    throw new SimulationError(
      'O acesso ao sistema ainda não foi configurado.',
      503,
    );
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
export async function saveSession(session: Session | null) {
  const jar = await cookies();
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
  };
  jar.set('lumina-access', session?.access_token || '', {
    ...options,
    maxAge: session ? session.expires_in : 0,
  });
  jar.set('lumina-refresh', session?.refresh_token || '', {
    ...options,
    maxAge: session ? 86400 : 0,
  });
}
export async function authenticated() {
  const db = database(),
    jar = await cookies();
  const access_token = jar.get('lumina-access')?.value,
    refresh_token = jar.get('lumina-refresh')?.value;
  if (!refresh_token)
    throw new SimulationError('Entre com sua conta para continuar.', 401);
  const { data: auth, error } = access_token
    ? await db.auth.setSession({ access_token, refresh_token })
    : await db.auth.refreshSession({ refresh_token });
  if (error || !auth.session)
    throw new SimulationError('Sua sessão expirou. Entre novamente.', 401);
  if (auth.session.access_token !== access_token)
    await saveSession(auth.session);
  const {
    data: { user },
    error: userError,
  } = await db.auth.getUser();
  if (userError || !user)
    throw new SimulationError('Não foi possível validar a sessão.', 401);
  const { data: member, error: memberError } = await db
    .from('aesthetic_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('active', true)
    .maybeSingle();
  if (memberError)
    throw new SimulationError(
      'O módulo de simulações ainda não está disponível no banco.',
      503,
    );
  if (!member)
    throw new SimulationError(
      'Esta conta não tem acesso ao sistema clínico.',
      403,
    );
  return { db, user, member };
}
export function sameOrigin(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin)
    throw new SimulationError('Origem da solicitação inválida.', 403);
}
export async function limitedBody(
  request: Request,
  max = 24_000,
): Promise<Uint8Array> {
  if (Number(request.headers.get('content-length')) > max)
    throw new SimulationError('O arquivo excede o limite de envio.', 413);
  const reader = request.body?.getReader();
  if (!reader) throw new SimulationError('Solicitação vazia.');
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > max) {
      await reader.cancel();
      throw new SimulationError('O arquivo excede o limite de envio.', 413);
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}
export async function jsonBody(request: Request) {
  try {
    return JSON.parse(
      new TextDecoder().decode(await limitedBody(request)),
    ) as unknown;
  } catch (error) {
    if (error instanceof SimulationError) throw error;
    throw new SimulationError('Dados inválidos.');
  }
}
export function response(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}
export function failure(error: unknown) {
  return response(
    {
      error:
        error instanceof SimulationError
          ? error.message
          : 'Não foi possível concluir. Tente novamente.',
    },
    error instanceof SimulationError ? error.status : 500,
  );
}
