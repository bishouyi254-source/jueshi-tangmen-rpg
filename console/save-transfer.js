/* Copies game saves through the game's own export/import functions. No network requests. */
(() => {
  'use strict';
  const original = location.hostname === '4kxu2wt6ct8mb.aiforce.cloud' && /^\/app\/app_17dnukzxw22(?:\/|$)/.test(location.pathname);
  const clone = location.hostname === 'bishouyi254-source.github.io' && /^\/jueshi-tangmen-rpg(?:\/|$)/.test(location.pathname) || ['localhost','127.0.0.1'].includes(location.hostname) && location.port === '4173';
  if (!original && !clone || document.getElementById('douluo-save-copy') || document.getElementById('douluo-control-panel')?.shadowRoot?.getElementById('douluo-save-copy')) return;
  function game() {
    const root = document.getElementById('root');
    if (!root) throw Error('游戏尚未加载，请稍后再试');
    const key = Object.keys(root).find(k => k.startsWith('__reactContainer'));
    const fiber = root[key];
    const queue = [fiber?.stateNode?.current || fiber?.current || fiber], seen = new Set();
    for (let i = 0; i < queue.length && i < 10000; i++) {
      const node = queue[i];
      if (!node || seen.has(node)) continue;
      seen.add(node);
      const value = node.memoizedProps?.value;
      if (typeof value?.exportSave === 'function' && typeof value?.importSave === 'function') return value;
      queue.push(node.child,node.sibling);
    }
    throw Error('没有找到游戏存档接口，请先进入游戏后重试');
  }
  function safeGame() {
    const value = game();
    if (value.inBattle || window.DouluoBot?.status?.().running) throw Error('请先结束战斗并关闭自动任务');
    return value;
  }
  function pack(value,allowEmpty=false) {
    // A loaded character can exist even when the original storage adapter
    // returns no saved record. Raw player JSON is supported by importSave.
    let saveCode=value.exportSave();
    if (!saveCode && typeof value.player?.name === 'string' &&
        Number.isFinite(value.player.level) && value.player.martialSoul) {
      saveCode=JSON.stringify(value.player);
    }
    if (!saveCode && !allowEmpty) throw Error('当前没有可导出的角色存档');
    return {format:'douluo-save-copy',version:1,exportedAt:new Date().toISOString(),source:original?'original':'clone',saveCode,
      summary:value.player?{name:value.player.name,level:value.player.level}:null,
      exploration:value.exploration || null};
  }
  function download(data,name) {
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
  }
  function stamp(){return new Date().toISOString().replace(/[:.]/g,'-');}
  const host=document.createElement('div');host.id='douluo-save-copy';
  Object.assign(host.style,{position:'fixed',bottom:'12px',left:'12px',zIndex:'2147483647'});
  const shadow=host.attachShadow({mode:'open'});
  shadow.innerHTML=`<style>:host{font:14px system-ui;color:#fff}details{width:min(320px,calc(100vw - 24px));background:#18152a;border:1px solid #9572cf;border-radius:12px;padding:12px}summary{cursor:pointer;font-weight:bold}button{margin:10px 6px 0 0;padding:8px;background:#7250b4;color:white;border:0;border-radius:7px;cursor:pointer}button:disabled{opacity:.5;cursor:wait}p{font-size:12px;white-space:pre-wrap;overflow-wrap:anywhere;margin-bottom:0}</style><details><summary>存档复制工具</summary><button id="export">导出存档副本</button><button id="import" ${original?'hidden':''}>导入存档副本</button><input id="file" type="file" accept=".json,.txt" hidden><p>${original?'原版仅提供导出，不修改原版存档。':'导入前会保留并下载复刻版原存档备份。'}</p><p id="status" role="status"></p></details>`;
  if (original) {
    document.body.append(host);
  } else {
    // The clone uses one draggable/collapsible panel for tasks and save copies.
    Object.assign(host.style,{position:'static',bottom:'auto',left:'auto',zIndex:'auto',marginTop:'14px'});
    function mountInConsole() {
      const body=document.getElementById('douluo-control-panel')?.shadowRoot?.querySelector('.body');
      if (!body) return false;
      body.append(host);
      const style=document.createElement('style');
      style.textContent='details{width:auto;border-radius:8px;padding:10px;box-sizing:border-box}';
      shadow.append(style);
      return true;
    }
    if (!mountInConsole()) {
      const observer=new MutationObserver(()=>{if(mountInConsole())observer.disconnect();});
      observer.observe(document.body,{childList:true,subtree:true});
    }
  }
  const status=shadow.getElementById('status'),input=shadow.getElementById('file');
  const exports=shadow.getElementById('export'),imports=shadow.getElementById('import');
  const message=text=>{status.textContent=text;};
  exports.addEventListener('click',()=>{
    try{const data=pack(safeGame());download(data,`斗罗-${original?'原版':'复刻版'}-存档副本-${stamp()}.json`);message('已发起下载，请查看 Chrome 下载列表。原存档保留不动。');}catch(error){message(error.message);}
  });
  imports.addEventListener('click',()=>{if(!clone)return;try{safeGame();input.value='';input.click();}catch(error){message(error.message);}});
  input.addEventListener('change',async()=>{
    if(!clone||!input.files?.length)return;
    exports.disabled=imports.disabled=true;
    try{
      const file=input.files[0];if(file.size>8*1024*1024)throw Error('文件过大，请选择游戏导出的存档文件');
      const text=(await file.text()).trim();let code=text,exploration=null;
      if(text.startsWith('{')){
        const data=JSON.parse(text);
        if(data.format==='douluo-save-copy'){
          if(data.version!==1||typeof data.saveCode!=='string'||!data.saveCode)throw Error('存档文件版本或内容无效');
          code=data.saveCode;exploration=data.exploration||null;
        }else if(typeof data.name!=='string'||typeof data.level!=='number')throw Error('不是有效的游戏存档');
      }else if(!text.startsWith('DL2_'))throw Error('不是有效的游戏存档码');
      const value=safeGame();
      if(!confirm('将复制这个文件到复刻版。复刻版现有存档会先备份，再被导入副本替换；原版存档不变。继续吗？')){message('已取消，没有修改存档。');return;}
      const backup=pack(value,true),key=`douluo-copy-backup-${Date.now()}`;
      const backupText=JSON.stringify(backup);localStorage.setItem(key,backupText);
      if(localStorage.getItem(key)!==backupText)throw Error('旧存档备份失败，导入已停止');
      download(backup,`斗罗-复刻版-导入前备份-${stamp()}.json`);
      const result=value.importSave(code);
      if(!result?.success)throw Error(result?.reason||'导入失败，旧存档备份已保留');
      if(typeof value.setExploration==='function')value.setExploration(exploration);
      message('导入成功。请核对角色名字、等级、武魂与装备，再刷新确认。备份文件已发起下载，并保留在本页面本地存储。');
    }catch(error){message(error.message);}finally{exports.disabled=imports.disabled=false;input.value='';}
  });
})();
