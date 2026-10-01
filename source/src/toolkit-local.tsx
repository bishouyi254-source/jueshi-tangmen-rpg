import React from 'react';
export const logger=console;
export const scopedStorage={getItem:(key:string)=>localStorage.getItem(key),setItem:(key:string,value:string)=>localStorage.setItem(key,value),removeItem:(key:string)=>localStorage.removeItem(key)};
export const AppContainer=({children}:any)=><>{children}</>;
export const ErrorRender=({error,resetErrorBoundary}:any)=><div role="alert">游戏发生错误：{String(error?.message||error)}<button onClick={resetErrorBoundary}>重新加载界面</button></div>;
export const unusedAvatarImages=['https://api.dicebear.com/9.x/adventurer/svg?seed=Douluo'];

export const getAppId=()=>window.appId; export const avatarImages={avatarImg3:'https://api.dicebear.com/9.x/adventurer/svg?seed=Douluo'};
