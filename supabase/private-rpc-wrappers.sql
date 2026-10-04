-- Keep elevated implementation outside the exposed API schema.
alter function public.rpg_list_saves() set schema rpg_private;
alter function public.rpg_write_save(integer,bigint,uuid,jsonb) set schema rpg_private;
alter function public.rpg_publish_profile(jsonb,boolean) set schema rpg_private;
alter function public.rpg_leaderboard() set schema rpg_private;
alter function public.rpg_public_profile(uuid) set schema rpg_private;
grant usage on schema rpg_private to authenticated;
create function public.rpg_list_saves() returns jsonb language sql security invoker set search_path='' as $$select rpg_private.rpg_list_saves()$$;
create function public.rpg_write_save(p_slot integer,p_revision bigint,p_operation uuid,p_payload jsonb) returns jsonb language sql security invoker set search_path='' as $$select rpg_private.rpg_write_save(p_slot,p_revision,p_operation,p_payload)$$;
create function public.rpg_publish_profile(p_profile jsonb,p_consent boolean) returns jsonb language sql security invoker set search_path='' as $$select rpg_private.rpg_publish_profile(p_profile,p_consent)$$;
create function public.rpg_leaderboard() returns jsonb language sql security invoker set search_path='' as $$select rpg_private.rpg_leaderboard()$$;
create function public.rpg_public_profile(p_id uuid) returns jsonb language sql security invoker set search_path='' as $$select rpg_private.rpg_public_profile(p_id)$$;
revoke all on function public.rpg_list_saves(),public.rpg_write_save(integer,bigint,uuid,jsonb),public.rpg_publish_profile(jsonb,boolean),public.rpg_leaderboard(),public.rpg_public_profile(uuid) from public,anon;
grant execute on function public.rpg_list_saves(),public.rpg_write_save(integer,bigint,uuid,jsonb),public.rpg_publish_profile(jsonb,boolean),public.rpg_leaderboard(),public.rpg_public_profile(uuid) to authenticated;
