import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '@/db';
import { auditLogs, patients } from '@/db/schema';
import { getChatGPTUser } from '@/app/chatgpt-auth';

function clean(value: unknown, max = 240) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const rows = await getDb().select().from(patients).where(eq(patients.ownerId, user.userId)).orderBy(desc(patients.createdAt));
  return NextResponse.json({ patients: rows });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await request.json() as Record<string, unknown>;
  const name = clean(body.name, 120);
  const cpf = clean(body.cpf, 18);
  const phone = clean(body.phone, 24);
  const birthDate = clean(body.birth, 16);
  if (!name || !cpf || !phone || !birthDate) {
    return NextResponse.json({ error: 'Nome, CPF, nascimento e telefone são obrigatórios.' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const db = getDb();
  const inserted = await db.insert(patients).values({
    ownerId: user.userId,
    name,
    cpf,
    phone,
    birthDate,
    email: clean(body.email, 160) || null,
    address: clean(body.address, 300) || null,
    guardian: clean(body.guardian, 120) || null,
    responsibleProfessional: user.displayName,
    createdAt: now,
    updatedAt: now,
  }).returning({ id: patients.id });

  await db.insert(auditLogs).values({
    ownerId: user.userId,
    actorId: user.userId,
    action: 'patient.created',
    entityType: 'patient',
    entityId: String(inserted[0]?.id ?? ''),
    createdAt: now,
  });

  return NextResponse.json({ id: inserted[0]?.id, created: true }, { status: 201 });
}
