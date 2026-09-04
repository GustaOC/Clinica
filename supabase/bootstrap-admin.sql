-- Execute depois de criar admin@clinica.com.br em Authentication > Users.
-- A senha é definida somente no painel do Supabase e nunca deve entrar neste arquivo.

do $$
declare
  admin_user_id uuid;
begin
  select id
    into admin_user_id
    from auth.users
   where lower(email) = lower('admin@clinica.com.br')
   limit 1;

  if admin_user_id is null then
    raise exception 'Crie admin@clinica.com.br em Authentication > Users antes de executar este arquivo.';
  end if;

  insert into public.aesthetic_members (user_id, role, active)
  values (admin_user_id, 'admin', true)
  on conflict (user_id) do update
    set role = 'admin', active = true;
end $$;
