-- Review and confirm deployment first. No private saves or account permissions are changed.
alter table rpg_private.profiles add column if not exists direction text not null default '';
alter table rpg_private.profiles add column if not exists current_index integer not null default 1;
alter table rpg_private.profiles add column if not exists history_power numeric not null default 0;
alter table rpg_private.profiles add column if not exists history_index integer not null default 1;

create or replace function rpg_private.display_n(v jsonb,cap numeric) returns integer
language sql immutable set search_path='' as $$
 select case when jsonb_typeof(v)='number' then least(cap,greatest(0,floor(v::text::numeric)))::integer else 0 end;
$$;
create or replace function rpg_private.display_ranks(v jsonb,keys text[]) returns jsonb
language sql immutable set search_path='' as $$
 select jsonb_object_agg(k,rpg_private.display_n(v->k,4)) from unnest(keys) k;
$$;
create or replace function rpg_private.growth_snapshot(v jsonb) returns jsonb
language plpgsql immutable set search_path='' as $$
declare parts jsonb; tier integer;
begin
 if v->'version' is distinct from '1'::jsonb then return null; end if;
 select jsonb_agg(n order by i),min(n) into parts,tier from (select i,rpg_private.display_n(v#>array['armor','parts',i::text],4) n from generate_series(0,10) i) p;
 return jsonb_build_object('version',1,
 'armor',jsonb_build_object('parts',parts,'tier',tier,'equipped',coalesce(v#>'{armor,equipped}'='true'::jsonb,false),'name',left(coalesce(v#>>'{armor,name}',''),4),'style',case when v#>>'{armor,style}' in ('attack','defense','control','support') then v#>>'{armor,style}' else 'attack' end),
 'gold',jsonb_build_object('unlocked',coalesce(v#>'{gold,unlocked}'='true'::jsonb,false),'seals',rpg_private.display_n(v#>'{gold,seals}',18),'points',rpg_private.display_n(v#>'{gold,points}',2000),'evolutions',rpg_private.display_ranks(v#>'{gold,evolutions}',array['claw','body','core','state'])),
 'silver',jsonb_build_object('unlocked',coalesce(v#>'{silver,unlocked}'='true'::jsonb,false),'points',rpg_private.display_n(v#>'{silver,points}',2000),'elements',rpg_private.display_ranks(v#>'{silver,elements}',array['火','水','土','风','光','暗','空间']),'body',rpg_private.display_ranks(v#>'{silver,body}',array['body','spirit','heart','space'])),
 'twin',jsonb_build_object('unlocked',coalesce(v#>'{twin,unlocked}'='true'::jsonb,false),'stage',rpg_private.display_n(v#>'{twin,stage}',5),'activeStage',least(rpg_private.display_n(v#>'{twin,stage}',5),rpg_private.display_n(v#>'{twin,activeStage}',5)),'points',rpg_private.display_n(v#>'{twin,points}',2000)));
end $$;

create or replace function rpg_private.profile_power(v jsonb) returns numeric
language plpgsql immutable set search_path='' as $$
declare k text;n numeric;total numeric:=0;
begin
 foreach k in array array['attack','defense','speed','spirit','hp','critRate','critDmg','maxSoulPower'] loop
  if jsonb_typeof(v->k) is distinct from 'number' then return null; end if;
  n=(v->>k)::numeric;if n<0 or n>1e15 then return null;end if;
  total=total+n*case k when 'critRate' then 100 when 'critDmg' then 50 else 1 end;
 end loop;
 return round(total/2);
end $$;

-- Populate metadata for existing public snapshots only, never infer missing growth from today's state.
update rpg_private.profiles p set
 direction=case when p.profile#>>'{current,direction}' in ('强攻系','敏攻系','控制系','辅助系','防御系') then p.profile#>>'{current,direction}' else '' end,
 current_index=greatest(1,rpg_private.display_n(p.profile#>'{current,index}',100)),
 history_power=coalesce((select rpg_private.profile_power(o->'attributes') from jsonb_array_elements(jsonb_build_array(p.profile->'current')||coalesce(p.profile->'history','[]')) o where rpg_private.profile_power(o->'attributes') is not null order by rpg_private.profile_power(o->'attributes') desc,rpg_private.display_n(o->'index',100) desc limit 1),p.power),
 history_index=coalesce((select greatest(1,rpg_private.display_n(o->'index',100)) from jsonb_array_elements(jsonb_build_array(p.profile->'current')||coalesce(p.profile->'history','[]')) o where rpg_private.profile_power(o->'attributes') is not null order by rpg_private.profile_power(o->'attributes') desc,rpg_private.display_n(o->'index',100) desc limit 1),1);
create index if not exists rpg_profiles_history_idx on rpg_private.profiles(history_power desc,public_id);
create index if not exists rpg_profiles_direction_power_idx on rpg_private.profiles(direction,power desc,public_id);
create index if not exists rpg_profiles_direction_history_idx on rpg_private.profiles(direction,history_power desc,public_id);

create or replace function rpg_private.rpg_publish_profile(p_profile jsonb,p_consent boolean) returns jsonb
language plpgsql security definer set search_path='' as $$
declare c jsonb;h jsonb;o jsonb;n numeric;cp numeric;hp numeric;hi integer;ci integer;idx integer;seen integer[]:=array[]::integer[];pid uuid;dir text;
begin
 if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'login_required';end if;
 if p_consent is distinct from true then raise exception 'consent_required';end if;
 if p_profile is null or octet_length(p_profile::text)>819200 or jsonb_typeof(p_profile->'history') is distinct from 'array' or jsonb_array_length(p_profile->'history')>99 then raise exception 'invalid_profile';end if;
 c=rpg_private.snapshot(p_profile->'current');
 if coalesce(length(c->>'name'),0) not between 1 and 40 or jsonb_typeof(c->'level') is distinct from 'number' or (c->>'level')::numeric not between 1 and 999 or (c->>'level')::numeric<>floor((c->>'level')::numeric) or jsonb_typeof(c->'martialSoul') is distinct from 'object' then raise exception 'invalid_profile';end if;
 if jsonb_typeof(c->'index') is distinct from 'number' or (c->>'index')::numeric not between 1 and 100 or (c->>'index')::numeric<>floor((c->>'index')::numeric) then raise exception 'invalid_life';end if;
 ci=(c->>'index')::integer;cp=rpg_private.profile_power(c->'attributes');if cp is null then raise exception 'invalid_attributes';end if;
 dir=c->>'direction';if dir not in ('强攻系','敏攻系','控制系','辅助系','防御系') or dir is null then raise exception 'invalid_direction';end if;
 h=coalesce((select jsonb_agg(rpg_private.snapshot(x)) from jsonb_array_elements(p_profile->'history') x),'[]');hp=cp;hi=ci;
 for o in select value from jsonb_array_elements(h) loop
  if jsonb_typeof(o->'index') is distinct from 'number' or (o->>'index')::numeric not between 1 and ci-1 or (o->>'index')::numeric<>floor((o->>'index')::numeric) then raise exception 'invalid_life';end if;
  idx=(o->>'index')::integer;if idx=any(seen) then raise exception 'duplicate_life';end if;seen=array_append(seen,idx);
  if coalesce(length(o->>'name'),0) not between 1 and 40 or jsonb_typeof(o->'level') is distinct from 'number' or (o->>'level')::numeric not between 1 and 999 or (o->>'level')::numeric<>floor((o->>'level')::numeric) or jsonb_typeof(o->'martialSoul') is distinct from 'object' then raise exception 'invalid_profile';end if;
  n=rpg_private.profile_power(o->'attributes');if n is null then raise exception 'invalid_attributes';end if;
  if n>hp or (n=hp and idx>hi) then hp=n;hi=idx;end if;
 end loop;
 insert into rpg_private.profiles(user_id,profile,name,level,power,direction,current_index,history_power,history_index)
 values(auth.uid(),jsonb_build_object('current',c,'history',h),c->>'name',(c->>'level')::integer,cp,dir,ci,hp,hi)
 on conflict(user_id) do update set profile=excluded.profile,name=excluded.name,level=excluded.level,power=excluded.power,direction=excluded.direction,current_index=excluded.current_index,history_power=excluded.history_power,history_index=excluded.history_index,updated_at=now() returning public_id into pid;
 return jsonb_build_object('publicId',pid);
end $$;

create or replace function rpg_private.rpg_leaderboard_v2(p_direction text default '',p_metric text default 'current') returns jsonb
language plpgsql security definer set search_path='' as $$
declare rows jsonb;own jsonb;
begin
 if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'login_required';end if;
 if p_direction is null or p_metric is null or p_direction not in ('','强攻系','敏攻系','控制系','辅助系','防御系') or p_metric not in ('current','history') then raise exception 'invalid_filter';end if;
 with ranked as (select public_id,name,level,power,current_index,direction,history_power,history_index,updated_at,row_number() over(order by case when p_metric='history' then history_power else power end desc,public_id) rank from rpg_private.profiles where p_direction='' or direction=p_direction)
 select coalesce(jsonb_agg(jsonb_build_object('publicId',public_id,'rank',rank,'name',name,'level',level,'power',power,'index',current_index,'direction',direction,'historyPower',history_power,'historyIndex',history_index,'updatedAt',extract(epoch from updated_at)*1000) order by rank),'[]') into rows from (select * from ranked order by rank limit 100) r;
 select jsonb_build_object('publicId',p.public_id,'name',p.name,'level',p.level,'power',p.power,'index',p.current_index,'direction',p.direction,'historyPower',p.history_power,'historyIndex',p.history_index,'updatedAt',extract(epoch from p.updated_at)*1000,'rank',1+(select count(*) from rpg_private.profiles x where (p_direction='' or x.direction=p_direction) and ((case when p_metric='history' then x.history_power else x.power end)>(case when p_metric='history' then p.history_power else p.power end) or ((case when p_metric='history' then x.history_power else x.power end)=(case when p_metric='history' then p.history_power else p.power end) and x.public_id<p.public_id)))) into own
 from rpg_private.profiles p where user_id=auth.uid() and (p_direction='' or p.direction=p_direction);
 return jsonb_build_object('entries',rows,'self',own,'updatedAt',extract(epoch from now())*1000);
end $$;
create or replace function public.rpg_leaderboard_v2(p_direction text default '',p_metric text default 'current') returns jsonb
language sql security invoker set search_path='' as $$select rpg_private.rpg_leaderboard_v2(p_direction,p_metric)$$;
revoke all on function rpg_private.display_n(jsonb,numeric),rpg_private.display_ranks(jsonb,text[]),rpg_private.growth_snapshot(jsonb),rpg_private.profile_power(jsonb),rpg_private.rpg_leaderboard_v2(text,text),public.rpg_leaderboard_v2(text,text) from public,anon,authenticated;
grant execute on function rpg_private.rpg_leaderboard_v2(text,text),public.rpg_leaderboard_v2(text,text) to authenticated;

-- Updated snapshot whitelist
create or replace function rpg_private.item_snapshot(v jsonb) returns jsonb language sql immutable set search_path='' as $$
 select rpg_private.pick(v,array['id','name','type','quality','quantity','description','image','imageId','year','years','level','element','beastAttribute','slot','attackBonus','defenseBonus','speedBonus','spiritBonus','hpBonus','critRateBonus','critDmgBonus','soulPowerBonus','skillDamage','skillDamagePct','skillName','skillDescription','skillDesc','skillType'])||case when jsonb_typeof(v->'attributes')='object' then jsonb_build_object('attributes',rpg_private.pick(v->'attributes',array['attack','defense','speed','spirit','hp','critRate','critDmg','soulPower','allAttr'])) else '{}'::jsonb end;
$$;
revoke all on function rpg_private.item_snapshot(jsonb) from public,anon,authenticated;
create or replace function rpg_private.snapshot(v jsonb) returns jsonb language plpgsql immutable set search_path='' as $$
declare o jsonb; k text; itemkeys text[]:=array['id','name','type','quality','quantity','description','image','imageId','year','years','element','beastAttribute','slot','attackBonus','defenseBonus','speedBonus','spiritBonus','hpBonus','critRateBonus','critDmgBonus','soulPowerBonus','skillDamage','skillName','skillDescription'];
begin
 if jsonb_typeof(v) is distinct from 'object' then raise exception 'invalid_profile'; end if;
 o=rpg_private.pick(v,array['index','timestamp','name','level','realm','direction','isTwinSoul','soulCoins','inventoryCount','recruitedCount','teamCount','domainName','divineTrialName']);
 foreach k in array array['martialSoul','secondSoul'] loop
   o=o||jsonb_build_object(k,case when v->k is null or v->k='null'::jsonb then 'null'::jsonb else rpg_private.pick(v->k,array['id','name','quality','type','direction','element','extremeAttribute','image','imageId','description']) end);
 end loop;
 o=o||jsonb_build_object('attributes',rpg_private.pick(v->'attributes',array['attack','defense','speed','spirit','hp','critRate','critDmg','maxSoulPower']));
 foreach k in array array['soulRings','secondSoulRings','inventory','soulSpirits'] loop
  o=o||jsonb_build_object(k,coalesce((select jsonb_agg(rpg_private.item_snapshot(x)) from jsonb_array_elements(coalesce(v->k,'[]')) x),'[]'));
 end loop;
 foreach k in array array['soulBones','equipment'] loop
  o=o||jsonb_build_object(k,coalesce((select jsonb_object_agg(key,case when value='null'::jsonb then value else rpg_private.item_snapshot(value) end) from jsonb_each(coalesce(v->k,'{}'))),'{}'));
 end loop;
 if rpg_private.growth_snapshot(v->'publicGrowth') is not null then o=o||jsonb_build_object('publicGrowth',rpg_private.growth_snapshot(v->'publicGrowth'));end if;
 return o;
end $$;
