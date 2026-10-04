import type { IReincarnationOrb, IPlayer, IAttrs } from './gameStore';
import { DIVINE_TRIALS } from '@/data/divineTrials';
export interface PublicProfile {
  publicId: string;
  updatedAt: number;
  current: IReincarnationOrb;
  history: IReincarnationOrb[];
}
export interface RankEntry { publicId: string; rank: number; name: string; level: number; power: number; }
export interface LeaderboardAPI {
  list(): Promise<{ entries: RankEntry[]; self: RankEntry | null; updatedAt: number }>;
  profile(publicId: string): Promise<PublicProfile>;
  publish?(profile: PublicProfile, consent: boolean): Promise<unknown>;
}
export const combatPower = (a: Partial<IAttrs>) => Math.round((
  (a.attack || 0) + (a.defense || 0) + (a.speed || 0) + (a.spirit || 0) +
  (a.hp || 0) + (a.critRate || 0) * 100 + (a.critDmg || 0) * 50 + (a.maxSoulPower || 0)
) * .5);
export const powerText = (n: number) => n >= 1e8 ? (n / 1e8).toFixed(2) + '亿' : n >= 1e4 ? (n / 1e4).toFixed(2) + '万' : n.toLocaleString();
// Only display fields; never send the full player/save code, account info or auth session.
const pick = (value: any, keys: string[]) => Object.fromEntries(keys.filter(k => value?.[k] !== undefined).map(k => [k, value[k]]));
function soul(s: any) { return s ? pick(s, ['id','name','quality','type','direction','element','extremeAttribute','image','imageId','description']) : null; }
function item(x: any) { return pick(x, ['id','name','type','quality','quantity','description','image','imageId','year','years','element','beastAttribute','slot','attackBonus','defenseBonus','speedBonus','spiritBonus','hpBonus','critRateBonus','critDmgBonus','soulPowerBonus','skillDamage','skillName','skillDescription']); }
export function displaySnapshot(orb: IReincarnationOrb): IReincarnationOrb {
  const out = pick(orb, ['index','timestamp','name','level','realm','direction','isTwinSoul','soulCoins','inventoryCount','recruitedCount','teamCount','domainName','divineTrialName']);
  return { ...out, martialSoul: soul(orb.martialSoul), secondSoul: soul(orb.secondSoul),
    attributes: pick(orb.attributes, ['attack','defense','speed','spirit','hp','critRate','critDmg','maxSoulPower']),
    soulRings: (orb.soulRings || []).map(item), secondSoulRings: (orb.secondSoulRings || []).map(item),
    soulBones: Object.fromEntries(Object.entries(orb.soulBones || {}).map(([k,v]) => [k,v ? item(v) : null])),
    equipment: Object.fromEntries(Object.entries(orb.equipment || {}).map(([k,v]) => [k,v ? item(v) : null])),
    inventory: (orb.inventory || []).map(item), soulSpirits: (orb.soulSpirits || []).map(x => pick(x,['id','name','quality','level','years','year']))
  } as IReincarnationOrb;
}
export function ownProfile(p: IPlayer, attributes: IAttrs, history: IReincarnationOrb[], realm: string): PublicProfile {
  const current = displaySnapshot({
    index: (p.reincarnation?.count || 0) + 1, timestamp: Date.now(), name: p.name, level: p.level, realm,
    direction: p.direction, martialSoul: p.martialSoul, secondSoul: p.secondSoul, isTwinSoul: p.isTwinSoul,
    soulRings: p.soulRings, secondSoulRings: p.secondSoulRings || [], soulBones: p.soulBones,
    equipment: p.equipment, soulSpirits: p.soulSpirits || [], soulCoins: p.soulCoins,
    inventory: p.inventory || [], inventoryCount: p.inventory?.length || 0, attributes,
    recruitedCount: (p.recruited || []).length, teamCount: (p.team || []).length + 1, domainName: p.domain?.name || '',
    divineTrialName: DIVINE_TRIALS.find(t => t.id === p.divineTrial?.chosenTrialId)?.name || ''
  } as IReincarnationOrb);
  return { publicId: 'local-self', updatedAt: Date.now(), current, history: history.map(displaySnapshot) };
}
export function publicLeaderboardAPI(): LeaderboardAPI | null {
  return (window as any).__RPG_LEADERBOARD_API__ || null;
}

// The login integration supplies an authenticated SDK function caller. No secret keys here.
export function cloudbaseLeaderboardAPI(call: (data: unknown) => Promise<any>): LeaderboardAPI {
  async function invoke(data: unknown) {
    const response = await call(data);
    const result = response.result ?? response;
    if (!result.ok) throw new Error(result.message || '排行榜服务暂不可用');
    return result.data;
  }
  return {
    list: () => invoke({action:'list'}),
    publish: (profile, consent) => invoke({action:'publish', consent, profile:{current:displaySnapshot(profile.current),history:profile.history.map(displaySnapshot)}}),
    profile: async publicId => {
      const p = await invoke({action:'profile',publicId});
      if (!p?.current?.martialSoul || !Array.isArray(p.history)) throw new Error('人物档案不完整');
      return {...p, current:displaySnapshot(p.current), history:p.history.map(displaySnapshot)};
    },
  };
}
