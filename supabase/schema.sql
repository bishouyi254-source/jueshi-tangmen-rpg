-- Review before deploying. All private save data is accessible only through authenticated RPCs.
create schema if not exists rpg_private;
revoke all on schema rpg_private from public, anon, authenticated;
create table rpg_private.saves (
 user_id uuid not null references auth.users(id) on delete cascade,
 slot integer not null check(slot between 1 and 3), revision bigint not null default 0,
 payload jsonb, history jsonb not null default '[]', receipts jsonb not null default '[]',
 updated_at timestamptz not null default now(), primary key(user_id,slot)
);
create table rpg_private.profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 public_id uuid not null unique default gen_random_uuid(), profile jsonb not null,
 name text not null check(length(name) between 1 and 40), level integer not null check(level between 1 and 999),
 power numeric not null check(power between 0 and 1e16), updated_at timestamptz not null default now()
);
create index rpg_profiles_power_idx on rpg_private.profiles(power desc,public_id);
alter table rpg_private.saves enable row level security;
alter table rpg_private.profiles enable row level security;
revoke all on all tables in schema rpg_private from public,anon,authenticated;

-- Definer RPCs enforce ownership and atomic revisions because clients cannot write the tables.
-- All objects are fully qualified, search_path is empty, and anon/PUBLIC execution is revoked.
create function public.rpg_list_saves() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'login_required'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('slot',slot,'revision',revision,'payload',payload,'history',history,'updated_at',updated_at) order by slot) from rpg_private.saves where user_id=auth.uid() and revision>0),'[]');
end $$;
create function public.rpg_write_save(p_slot integer,p_revision bigint,p_operation uuid,p_payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare s rpg_private.saves; h jsonb; receipt jsonb; result jsonb;
begin
 if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'login_required'; end if;
 if p_slot is null or p_slot not between 1 and 3 or p_revision is null or p_revision<0 or p_operation is null then raise exception 'invalid_slot'; end if;
 if p_payload is null or jsonb_typeof(p_payload)<>'object' or (p_payload->>'format') is distinct from '1' or coalesce(length(p_payload->>'saveCode'),0)=0 or coalesce(length(p_payload#>>'{summary,name}'),0)=0 or jsonb_typeof(p_payload#>'{summary,level}') is distinct from 'number' or octet_length(p_payload::text)>262144 then raise exception 'invalid_payload'; end if;
 insert into rpg_private.saves(user_id,slot) values(auth.uid(),p_slot) on conflict do nothing;
 select * into s from rpg_private.saves where user_id=auth.uid() and slot=p_slot for update;
 select x into receipt from jsonb_array_elements(s.receipts) x where x->>'id'=p_operation::text;
 if receipt is not null then
   if receipt->>'hash'<>md5(p_payload::text) then raise exception 'operation_reused'; end if;
   return jsonb_build_object('slot',s.slot,'revision',s.revision,'updated_at',s.updated_at,'payload',s.payload,'history',s.history,'ackRevision',(receipt->>'revision')::bigint);
 end if;
 if s.revision<>p_revision then raise exception 'revision_conflict'; end if;
 h=s.history;
 if s.revision>0 then h=jsonb_build_array(jsonb_build_object('revision',s.revision,'payload',s.payload,'updated_at',s.updated_at))||h; end if;
 h=coalesce((select jsonb_agg(value order by ordinality) from jsonb_array_elements(h) with ordinality where ordinality<=10),'[]');
 -- Bound stored history to 800KB while retaining the most recent snapshots.
 while octet_length(h::text)>819200 loop h=h-(jsonb_array_length(h)-1); end loop;
 update rpg_private.saves set revision=s.revision+1,payload=p_payload,history=h,updated_at=now(),
 receipts=jsonb_build_array(jsonb_build_object('id',p_operation,'hash',md5(p_payload::text),'revision',s.revision+1))||coalesce((select jsonb_agg(value order by ordinality) from jsonb_array_elements(s.receipts) with ordinality where ordinality<32),'[]')
 where user_id=auth.uid() and slot=p_slot returning jsonb_build_object('slot',slot,'revision',revision,'payload',payload,'history',history,'updated_at',updated_at,'ackRevision',revision) into result;
 return result;
end $$;

create function rpg_private.pick(v jsonb,keys text[]) returns jsonb language sql immutable set search_path='' as $$
 select coalesce(jsonb_object_agg(key,value),'{}') from jsonb_each(case when jsonb_typeof(v)='object' then v else '{}' end) where key=any(keys);
$$;
create function rpg_private.snapshot(v jsonb) returns jsonb language plpgsql immutable set search_path='' as $$
declare o jsonb; k text; itemkeys text[]:=array['id','name','type','quality','quantity','description','image','imageId','year','years','element','beastAttribute','slot','attackBonus','defenseBonus','speedBonus','spiritBonus','hpBonus','critRateBonus','critDmgBonus','soulPowerBonus','skillDamage','skillName','skillDescription'];
begin
 if jsonb_typeof(v) is distinct from 'object' then raise exception 'invalid_profile'; end if;
 o=rpg_private.pick(v,array['index','timestamp','name','level','realm','direction','isTwinSoul','soulCoins','inventoryCount','recruitedCount','teamCount','domainName','divineTrialName']);
 foreach k in array array['martialSoul','secondSoul'] loop
   o=o||jsonb_build_object(k,case when v->k is null or v->k='null'::jsonb then 'null'::jsonb else rpg_private.pick(v->k,array['id','name','quality','type','direction','element','extremeAttribute','image','imageId','description']) end);
 end loop;
 o=o||jsonb_build_object('attributes',rpg_private.pick(v->'attributes',array['attack','defense','speed','spirit','hp','critRate','critDmg','maxSoulPower']));
 foreach k in array array['soulRings','secondSoulRings','inventory','soulSpirits'] loop
  o=o||jsonb_build_object(k,coalesce((select jsonb_agg(rpg_private.pick(x,itemkeys)) from jsonb_array_elements(coalesce(v->k,'[]')) x),'[]'));
 end loop;
 foreach k in array array['soulBones','equipment'] loop
  o=o||jsonb_build_object(k,coalesce((select jsonb_object_agg(key,case when value='null'::jsonb then value else rpg_private.pick(value,itemkeys) end) from jsonb_each(coalesce(v->k,'{}'))),'{}'));
 end loop;
 return o;
end $$;
create function public.rpg_publish_profile(p_profile jsonb,p_consent boolean) returns jsonb language plpgsql security definer set search_path='' as $$
declare c jsonb; h jsonb; a jsonb; k text; n numeric; power numeric:=0; pid uuid;
begin
 if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'login_required'; end if;
 if p_consent is distinct from true then raise exception 'consent_required'; end if;
 if p_profile is null or octet_length(p_profile::text)>819200 or jsonb_typeof(p_profile->'history') is distinct from 'array' or jsonb_array_length(p_profile->'history')>99 then raise exception 'invalid_profile'; end if;
 c=rpg_private.snapshot(p_profile->'current');
 if coalesce(length(c->>'name'),0) not between 1 and 40 or jsonb_typeof(c->'level') is distinct from 'number' or (c->>'level')::numeric not between 1 and 999 or jsonb_typeof(c->'martialSoul') is distinct from 'object' then raise exception 'invalid_profile'; end if;
 h=coalesce((select jsonb_agg(rpg_private.snapshot(x)) from jsonb_array_elements(p_profile->'history') x),'[]');
 a=c->'attributes';
 foreach k in array array['attack','defense','speed','spirit','hp','critRate','critDmg','maxSoulPower'] loop
  if jsonb_typeof(a->k) is distinct from 'number' then raise exception 'invalid_attributes'; end if;
  n=(a->>k)::numeric;
  if n<0 or n>1e15 then raise exception 'invalid_attributes'; end if;
  power=power+n*case k when 'critRate' then 100 when 'critDmg' then 50 else 1 end;
 end loop;
 insert into rpg_private.profiles(user_id,profile,name,level,power) values(auth.uid(),jsonb_build_object('current',c,'history',h),c->>'name',(c->>'level')::integer,round(power/2))
 on conflict(user_id) do update set profile=excluded.profile,name=excluded.name,level=excluded.level,power=excluded.power,updated_at=now() returning public_id into pid;
 return jsonb_build_object('publicId',pid);
end $$;
create function public.rpg_leaderboard() returns jsonb language plpgsql security definer set search_path='' as $$
declare rows jsonb; own jsonb;
begin
 if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'login_required'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('publicId',public_id,'rank',rank,'name',name,'level',level,'power',power) order by rank),'[]') into rows from (select *,row_number() over(order by power desc,public_id) rank from rpg_private.profiles order by power desc,public_id limit 100) p;
 select jsonb_build_object('publicId',p.public_id,'name',p.name,'level',p.level,'power',p.power,'rank',1+(select count(*) from rpg_private.profiles x where x.power>p.power or (x.power=p.power and x.public_id<p.public_id))) into own from rpg_private.profiles p where user_id=auth.uid();
 return jsonb_build_object('entries',rows,'self',own,'updatedAt',extract(epoch from now())*1000);
end $$;
create function public.rpg_public_profile(p_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'login_required'; end if;
 select profile||jsonb_build_object('publicId',public_id,'updatedAt',extract(epoch from updated_at)*1000) into result from rpg_private.profiles where public_id=p_id;
 if result is null then raise exception 'profile_not_found'; end if;
 return result;
end $$;
revoke all on all functions in schema rpg_private from public,anon,authenticated;
revoke all on function public.rpg_list_saves(),public.rpg_write_save(integer,bigint,uuid,jsonb),public.rpg_publish_profile(jsonb,boolean),public.rpg_leaderboard(),public.rpg_public_profile(uuid) from public,anon;
grant execute on function public.rpg_list_saves(),public.rpg_write_save(integer,bigint,uuid,jsonb),public.rpg_publish_profile(jsonb,boolean),public.rpg_leaderboard(),public.rpg_public_profile(uuid) to authenticated;
