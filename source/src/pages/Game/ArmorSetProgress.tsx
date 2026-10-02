import {ARMOR_PARTS,dragonProgress,armorTier,armorBonusBreakdown} from '@/lib/dragonLegend';
export default function ArmorSetProgress({player}:{player:any}){
 const d=dragonProgress(player),tier=armorTier(player),count=d.parts.filter(x=>x>0).length,two=d.parts.filter(x=>x===2).length,target=tier===0?1:2;
 const missing=ARMOR_PARTS.filter((_,i)=>d.parts[i]<target),b=armorBonusBreakdown(player);
 const labels={attack:'攻击',defense:'防御',speed:'速度',spirit:'精神',hp:'气血'};
 return <div className="dragon-card" data-armor-progress>
 <div className="dragon-section-title"><span>套装进度</span><span className="dragon-badge">{tier===2?'二字成套':tier===1?'一字成套':'尚未成套'}</span></div>
 <div className="dragon-row"><span>一字部件</span><b>{count}/11</b></div><div className="dragon-progress"><span style={{width:count/11*100+'%'}}/></div>
 <div className="dragon-row" style={{marginTop:12}}><span>二字部件</span><b>{two}/11</b></div><div className="dragon-progress"><span style={{width:two/11*100+'%'}}/></div>
 <p className="dragon-hint">{missing.length?'距离'+(target===1?'一字':'二字')+'成套还缺：'+missing.join('、'):'二字套装已完成，斗铠振奋已解锁。'}</p>
 <p className="dragon-hint">部件五维 +{(b.parts*100).toFixed(1)}% · 套装方向{labels[b.directionKey]} +{(b.direction*100).toFixed(1)}%{b.resonance?' · 属性契合'+labels[b.resonanceKey]+' +3.0%':''}。{d.equipped?'已装备，当前生效。':'未装备，装备后生效。'}</p>
 </div>;
}
