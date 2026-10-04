import type { SupabaseClient } from '@supabase/supabase-js';
import { displaySnapshot, type LeaderboardAPI } from './leaderboard';

export interface CloudPayload { format: 1; saveCode: string; exploration: unknown; summary: { name: string; level: number }; }
export interface CloudSlot { slot: number; revision: number; updated_at: string; payload: CloudPayload; history: { revision: number; updated_at: string; payload: CloudPayload }[]; }
export function validatePayload(p: CloudPayload) {
  if(p.format!==1 || !p.saveCode || !p.summary?.name || !Number.isFinite(p.summary.level)) throw new Error('没有可上传的角色存档');
  if(new TextEncoder().encode(JSON.stringify(p)).length>262144) throw new Error('存档超过256KB，请先导出本地备份');
}
export function cloudService(client: SupabaseClient) {
  async function call(name: string, args?: any) {
    const {data,error}=await client.rpc(name,args);
    if(error) throw new Error(error.message==='revision_conflict'?'云端已有更新，请重新读取后选择存档（未覆盖云端）':error.message);
    return data;
  }
  return {
    list: ():Promise<CloudSlot[]>=>call('rpg_list_saves'),
    write: async(slot:number,revision:number,operationId:string,payload:CloudPayload):Promise<CloudSlot>=>{
      validatePayload(payload);
      return call('rpg_write_save',{p_slot:slot,p_revision:revision,p_operation:operationId,p_payload:payload});
    },
    leaderboard: {
      list: ()=>call('rpg_leaderboard'),
      profile: async publicId=>{
        const p=await call('rpg_public_profile',{p_id:publicId});
        return {...p,current:displaySnapshot(p.current),history:p.history.map(displaySnapshot)};
      },
      publish: async(profile,consent)=>{
        if(!consent)throw new Error('需要同意公开人物档案');
        return call('rpg_publish_profile',{p_profile:{current:displaySnapshot(profile.current),history:profile.history.map(displaySnapshot)},p_consent:true});
      }
    } satisfies LeaderboardAPI
  };
}
