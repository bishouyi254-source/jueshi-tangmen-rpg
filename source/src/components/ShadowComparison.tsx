import React from 'react';
function __localShadowComparisonRows(previous,current){
 return [['attack','攻击'],['defense','防御'],['hp','气血'],['speed','速度'],['spirit','精神']].map(([key,label])=>{
  const read=value=>Number.isFinite(value)&&value>=0?value:null;
  const before=read(previous?.[key]),now=read(current?.[key]);
  const max=Math.max(before??0,now??0,1);
  return {key,label,before,now,beforeWidth:before===null?0:before/max*100,nowWidth:now===null?0:now/max*100,change:before===null||now===null?null:before===0?(now===0?0:null):(now-before)/before*100};
 });
}
function __localShadowComparison({orb,current}){
 const el=(tag,props,...children)=>React.createElement(tag,props,...children);
 const format=value=>value===null?'未记录':Math.round(value).toLocaleString('zh-CN');
 return el('section',{'aria-label':'轮回之影实力对比',style:{border:'1px solid rgba(167,139,250,.25)',borderRadius:12,padding:16,marginBottom:12,background:'rgba(0,0,0,.25)'}},
  el('h3',{style:{fontSize:14,fontWeight:700,marginBottom:14}},'⚔ 实力对比'),
  ...__localShadowComparisonRows(orb?.attributes,current).map(row=>{
   const up=row.now!==null&&row.before!==null&&row.now>row.before,down=row.now!==null&&row.before!==null&&row.now<row.before;
   const text=row.before===null||row.now===null?'无法比较':row.before===0&&row.now>0?'↑ 新增':`${up?'↑ ':down?'↓ ':'持平 '}${Math.abs(row.change??0).toFixed(1).replace(/\.0$/,'')}%`;
   const bar=(width,color,label)=>el('div',{role:'img','aria-label':label,style:{height:5,borderRadius:4,background:'rgba(255,255,255,.06)',overflow:'hidden',marginTop:3}},el('div',{style:{height:'100%',width:`${width}%`,background:color,borderRadius:4}}));
   return el('div',{key:row.key,style:{marginBottom:14}},
    el('div',{style:{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:5}},el('span',null,row.label),el('span',{style:{color:up?'#4ade80':down?'#f87171':'#94a3b8'}},text)),
    bar(row.beforeWidth,'#a78bfa',`${row.label}前世 ${format(row.before)}`),bar(row.nowWidth,'#22d3ee',`${row.label}今生 ${format(row.now)}`),
    el('div',{style:{display:'flex',justifyContent:'space-between',gap:12,fontSize:10,color:'#94a3b8',marginTop:5}},el('span',null,`前世 ${format(row.before)}`),el('span',null,`今生 ${format(row.now)}`)));
  }),
  el('p',{style:{fontSize:11,color:'#94a3b8',lineHeight:1.6}},`紫色：第${orb.index}世存档 · 青色：今生实时属性。进入战斗后，影子轮回领域另加 ${orb.index*10}% 全属性、${orb.index}% 魂技伤害。`));
}

export default __localShadowComparison;