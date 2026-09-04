import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';

const admin = '10000000-0000-4000-8000-000000000001';
const doctor = '20000000-0000-4000-8000-000000000001';
const outsider = '30000000-0000-4000-8000-000000000001';
const session = '40000000-0000-4000-8000-000000000001';
const photo = '50000000-0000-4000-8000-000000000001';

async function asUser(db, userId, sql) {
  await db.exec(
    `set role authenticated; select set_config('request.jwt.claim.sub', '${userId}', false);`,
  );
  try {
    return await db.query(sql);
  } finally {
    await db.exec('reset role;');
  }
}

test('Supabase migration isolates photos and atomically claims generations', async () => {
  const db = new PGlite();
  await db.waitReady;
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    grant usage on schema auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    create schema storage;
    create table storage.buckets (
      id text primary key,
      name text not null,
      public boolean not null default false,
      file_size_limit bigint,
      allowed_mime_types text[]
    );
    create table storage.objects (
      id uuid primary key default gen_random_uuid(),
      bucket_id text not null,
      name text not null
    );
    alter table storage.objects enable row level security;
    create function storage.foldername(name text) returns text[] language sql immutable as $$
      select string_to_array(name, '/')
    $$;
    grant usage on schema storage to anon, authenticated;
    grant execute on function storage.foldername(text) to anon, authenticated;
    grant select, insert, delete on storage.objects to authenticated;
  `);
  const migration = await readFile(
    new URL(
      '../supabase/migrations/202609030001_aesthetic_simulations.sql',
      import.meta.url,
    ),
    'utf8',
  );
  await db.exec(migration);
  await db.exec(`
    insert into auth.users(id) values ('${admin}'), ('${doctor}'), ('${outsider}');
    insert into public.aesthetic_members(user_id, role) values ('${admin}', 'admin'), ('${doctor}', 'doctor');
  `);

  await assert.rejects(
    asUser(
      db,
      doctor,
      `insert into public.aesthetic_procedures(name, regions) values ('Denied', array['A'])`,
    ),
    /row-level security policy/,
  );
  const inserted = await asUser(
    db,
    admin,
    `insert into public.aesthetic_procedures(name, regions) values ('Fixture', array['A']) returning id`,
  );
  assert.equal(inserted.rows.length, 1);

  await asUser(
    db,
    doctor,
    `insert into public.aesthetic_sessions(id, owner_id, title, plan, consent, consent_at)
     values ('${session}', '${doctor}', 'Fixture', '{}', true, now())`,
  );
  const originalPath = `${doctor}/${session}/${photo}-original.jpg`;
  await asUser(
    db,
    doctor,
    `insert into public.aesthetic_photos(id, session_id, owner_id, label, original_path)
     values ('${photo}', '${session}', '${doctor}', 'Frontal', '${originalPath}')`,
  );
  const own = await asUser(
    db,
    doctor,
    `select id from public.aesthetic_photos where id = '${photo}'`,
  );
  assert.equal(own.rows.length, 1);
  const hidden = await asUser(
    db,
    admin,
    `select id from public.aesthetic_photos where id = '${photo}'`,
  );
  assert.equal(hidden.rows.length, 0);
  const blocked = await asUser(
    db,
    outsider,
    `select public.claim_aesthetic_photo('${photo}') claim`,
  ).catch((error) => error);
  assert.match(String(blocked), /Access denied/);

  const claimed = await asUser(
    db,
    doctor,
    `select public.claim_aesthetic_photo('${photo}') claim`,
  );
  const token = claimed.rows[0].claim.claim_token;
  await assert.rejects(
    asUser(db, doctor, `select public.claim_aesthetic_photo('${photo}')`),
    /Already processing/,
  );
  await assert.rejects(
    asUser(
      db,
      doctor,
      `select public.finish_aesthetic_photo('${photo}', '${token}', '${doctor}/wrong.jpg', null, 'test-model')`,
    ),
    /Invalid path/,
  );
  const generatedPath = `${doctor}/${session}/${photo}-generated-${token}.jpg`;
  const finished = await asUser(
    db,
    doctor,
    `select public.finish_aesthetic_photo('${photo}', '${token}', '${generatedPath}', null, 'test-model') result`,
  );
  assert.equal(finished.rows[0].result.status, 'completed');
  const bucket = await db.query(
    `select public, file_size_limit from storage.buckets where id = 'aesthetic-photos'`,
  );
  assert.deepEqual(bucket.rows[0], { public: false, file_size_limit: 5242880 });
  await db.close();
});
