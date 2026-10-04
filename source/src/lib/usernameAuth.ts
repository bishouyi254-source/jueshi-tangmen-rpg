import type { SupabaseClient } from '@supabase/supabase-js';

// Fixed login names; editable display metadata never determines save ownership.
export function normalizeUsername(value: string) {
 const display = value.normalize('NFKC').trim();
 if (!/^[\p{Script=Han}A-Za-z0-9_-]{3,24}$/u.test(display))
  throw new Error('用户名需为3–24个汉字、字母、数字、下划线或短横线');
 return {display, canonical: display.toLowerCase()};
}
export async function usernameIdentity(value: string) {
 const name = normalizeUsername(value);
 const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('rpg-username-v1:'+name.canonical));
 const hex = Array.from(new Uint8Array(digest), b=>b.toString(16).padStart(2,'0')).join('');
 // Reserved, non-deliverable domain: never send mail to these internal identifiers.
 return {...name, email: hex+'@accounts.invalid'};
}
function authError(error: {code?: string;message: string}) {
 if(error.code==='user_already_exists') return new Error('用户名已被注册，请换一个用户名或登录');
 if(error.code==='invalid_credentials') return new Error('用户名或密码错误');
 if(error.code==='email_not_confirmed') return new Error('用户名注册尚未启用，请等待网站配置完成');
 if(error.code==='over_request_rate_limit'||error.code==='over_email_send_rate_limit') return new Error('操作过于频繁，请稍后重试');
 return new Error('账号操作失败，请稍后重试（'+(error.code||'network_error')+'）');
}
export async function loginUsername(client: SupabaseClient, username: string, password: string) {
 const {email} = await usernameIdentity(username);
 if(!password) throw new Error('请输入密码');
 const {data,error} = await client.auth.signInWithPassword({email,password});
 if(error) throw authError(error);
 return data;
}
export async function registerUsername(client: SupabaseClient, username: string, password: string) {
 const {email,display,canonical} = await usernameIdentity(username);
 if(password.length<8) throw new Error('密码至少8位');
 const {data,error} = await client.auth.signUp({email,password,options:{data:{display_name:display,login_name:canonical}}});
 if(error) throw authError(error);
 if(!data.session) throw new Error('用户名注册尚未启用，请等待网站配置完成');
 return data;
}
