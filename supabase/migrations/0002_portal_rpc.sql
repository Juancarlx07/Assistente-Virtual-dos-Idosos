-- Funções do portal self-service da pessoa querida.
--
-- SECURITY DEFINER: rodam como dono (contornam o RLS), mas cada uma resolve o
-- token para uma pessoa e só age sobre os dados DELA. O token é o segredo de
-- acesso. São chamáveis com a anon key, então o app não embarca service role.

create or replace function public.portal_obter(p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_pessoa_id uuid;
  v_result jsonb;
begin
  select pessoa_id into v_pessoa_id from consentimento where token_portal = p_token;
  if v_pessoa_id is null then return null; end if;

  select jsonb_build_object(
    'pessoa', (select to_jsonb(p) from pessoa_querida p where p.id = v_pessoa_id),
    'consentimento', (select to_jsonb(c) from consentimento c where c.token_portal = p_token),
    'preferencias', coalesce((select jsonb_agg(to_jsonb(pr)) from preferencia pr where pr.pessoa_id = v_pessoa_id), '[]'::jsonb),
    'datas', coalesce((select jsonb_agg(to_jsonb(d) order by d.data) from data_importante d where d.pessoa_id = v_pessoa_id), '[]'::jsonb),
    'ciclos', coalesce((select jsonb_agg(to_jsonb(ci)) from ciclo_consumo ci where ci.pessoa_id = v_pessoa_id), '[]'::jsonb)
  ) into v_result;
  return v_result;
end; $$;

create or replace function public.portal_definir_consentimento(p_token text, p_status text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_pessoa_id uuid;
begin
  if p_status not in ('concedido', 'revogado') then return false; end if;
  select pessoa_id into v_pessoa_id from consentimento where token_portal = p_token;
  if v_pessoa_id is null then return false; end if;
  update consentimento set
    status = p_status::status_consentimento,
    data_concessao = case when p_status = 'concedido' then now() else data_concessao end,
    data_revogacao = case when p_status = 'revogado' then now() else null end
  where token_portal = p_token;
  update pessoa_querida set status_consentimento = p_status::status_consentimento
  where id = v_pessoa_id;
  return true;
end; $$;

create or replace function public.portal_adicionar_preferencia(
  p_token text, p_categoria text, p_valor text, p_tipo text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_pessoa_id uuid;
begin
  select pessoa_id into v_pessoa_id from consentimento where token_portal = p_token;
  if v_pessoa_id is null then return false; end if;
  insert into preferencia (pessoa_id, categoria, valor, tipo)
  values (v_pessoa_id, p_categoria, p_valor, p_tipo::tipo_preferencia);
  return true;
end; $$;

create or replace function public.portal_remover_preferencia(p_token text, p_pref_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_pessoa_id uuid;
begin
  select pessoa_id into v_pessoa_id from consentimento where token_portal = p_token;
  if v_pessoa_id is null then return false; end if;
  delete from preferencia where id = p_pref_id and pessoa_id = v_pessoa_id;
  return true;
end; $$;

create or replace function public.portal_apagar_tudo(p_token text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_pessoa_id uuid;
begin
  select pessoa_id into v_pessoa_id from consentimento where token_portal = p_token;
  if v_pessoa_id is null then return false; end if;
  delete from preferencia where pessoa_id = v_pessoa_id;
  delete from data_importante where pessoa_id = v_pessoa_id;
  delete from ciclo_consumo where pessoa_id = v_pessoa_id;
  update consentimento set status = 'revogado', data_revogacao = now() where pessoa_id = v_pessoa_id;
  update pessoa_querida set status_consentimento = 'revogado' where id = v_pessoa_id;
  return true;
end; $$;

-- Expõe apenas estas funções ao cliente anônimo/autenticado.
revoke all on function public.portal_obter(text) from public;
revoke all on function public.portal_definir_consentimento(text, text) from public;
revoke all on function public.portal_adicionar_preferencia(text, text, text, text) from public;
revoke all on function public.portal_remover_preferencia(text, uuid) from public;
revoke all on function public.portal_apagar_tudo(text) from public;
grant execute on function public.portal_obter(text) to anon, authenticated;
grant execute on function public.portal_definir_consentimento(text, text) to anon, authenticated;
grant execute on function public.portal_adicionar_preferencia(text, text, text, text) to anon, authenticated;
grant execute on function public.portal_remover_preferencia(text, uuid) to anon, authenticated;
grant execute on function public.portal_apagar_tudo(text) to anon, authenticated;
