import test from 'node:test';
import assert from 'node:assert/strict';
import {ASSETS} from '../src/assets.js';
import {parseCausality,initialMechanics,advanceMechanics,reviveMechanics,readonlyProjection,eligibleItems,visibleEntries} from '../src/core.js';
import {readDeathCatalog} from '../src/catalog.js';
import {createMvuStore,fillInput} from '../src/runtime.js';

const catalog=readDeathCatalog(ASSETS.baseCatalog,ASSETS.catalogMetadata);
const fact=(k=45,c=20,active=true,life='存活',death='无')=>({karma:k,correction:c,active,life,death,karmaPhase:'渗出',correctionPhase:'局部纠偏',rt:{}});
const scene={tags:['日常','饮食'],rudyPresent:true};
const step=(state,f,t,s=scene)=>advanceMechanics(state,f,t,catalog,s,()=>0);
function initialized(){return step(initialMechanics(),fact(43,8),'1').state;}
function draw(){return step(initialized(),fact(51,11),'2');}
const raw=`<causality>\n【本回合变动】\n因果: +0｜来源: mock\n纠正: +0｜来源: mock\n***\n⚖️鲁迪因果: 45/100｜阶段: 渗出\n🌍世界纠正: 20/100｜阶段: 局部纠偏\n💀鲁迪生死: 存活｜死法: 无\n<!--RT:OPEN=mock;BASE=45;KSET=T1;CSET=;OLD01=0;CORR_ACTIVE=1-->\n</causality>`;

test('public causality parsed without ethical scoring or RT mutation',()=>{
  const parsed=parseCausality(raw);assert.equal(parsed.karma,45);assert.equal(parsed.correction,20);assert.equal(parsed.rt.KSET,'T1');
  assert.throws(()=>parseCausality(raw+raw));assert.throws(()=>parseCausality(raw.replace('</causality>','')));
  assert.throws(()=>parseCausality(raw.replace('45/100','101/100')));
  assert.throws(()=>parseCausality(raw.replace('渗出','自造阶段')));
  assert.throws(()=>parseCausality(raw.replace('CORR_ACTIVE=1','CORR_ACTIVE=2')));
  assert.throws(()=>parseCausality(raw.replace('💀鲁迪生死: 存活｜死法: 无','')));
});
test('catalog v0.1 IDs and names preserved; frozen category counts',()=>{
  assert.equal(catalog.items.length,100);
  assert.deepEqual(catalog.items.map(i=>[Number(i.id),i.name]),ASSETS.baseCatalog.items.map(i=>[i.id,i.name]));
  assert.deepEqual(Object.fromEntries(Object.keys(catalog.categories).map(k=>[k,catalog.items.filter(i=>i.category===k).length])),
    {'魔法':17,'战斗':20,'旅行':20,'日常':8,'权谋':11,'帝皇':9,'因果':6,'荒诞':9});
});
test('no historical draw on first attachment mid-chat',()=>{
  const result=step(initialMechanics(),fact(80,60),'1');assert.equal(result.drawn,null);
  assert.equal(Object.keys(result.state.historical.karma).length,16);assert.equal(result.state.pending,null);
});
test('T+3 baseline karma does not draw; correction starts at zero',()=>{
  let state=step(initialMechanics(),fact(40,0,false),'1').state;
  state=step(state,fact(60,0,false),'2').state;
  let result=step(state,fact(70,0,true),'3');assert.equal(result.drawn,null);assert.equal(result.state.historical.karma['70'],true);
  result=step(result.state,fact(70,5,true),'4');assert.ok(result.drawn);assert.deepEqual(result.newMarks.correction,['5']);
});
test('multiple fresh thresholds across both bars draw exactly one',()=>{
  const result=draw();assert.ok(result.drawn);assert.equal(Object.keys(result.state.seen).length,1);
  assert.deepEqual(result.newMarks,{karma:['45','50'],correction:['10']});assert.equal(result.state.lastDrawTurn,'2');
});
test('refresh/edit/swipe stable on the same turn; no extra roll',()=>{
  const first=draw();let called=0;
  const repeat=advanceMechanics(first.state,fact(80,80),'2',catalog,scene,()=>{called++;return .99;});
  assert.equal(called,0);assert.deepEqual(repeat.state.pending,first.state.pending);assert.equal(repeat.drawn,null);
});
test('single pending consumes future thresholds, does not accumulate tickets',()=>{
  const first=draw();const next=step(first.state,fact(80,50),'3');
  assert.equal(next.state.pending.id,first.state.pending.id);assert.equal(Object.keys(next.state.seen).length,1);
  assert.equal(next.state.marks.karma['80'],true);assert.equal(next.state.marks.correction['50'],true);
  assert.ok(!JSON.stringify(next.state).includes('death_queue'));
});
test('no scene/rudy absent creates one deferred trigger, then locks a matched item',()=>{
  let result=step(initialized(),fact(51,11),'2',{});assert.equal(result.state.pending.id,null);assert.equal(result.drawn,null);
  result=step(result.state,fact(51,11),'2',scene);assert.ok(result.drawn);
  assert.ok(catalog.items.find(i=>i.id===result.drawn).scene_tags.some(t=>scene.tags.includes(t)));
  assert.equal(eligibleItems(catalog,initialMechanics(),{tags:['日常'],rudyPresent:false}).length,0);
});
test('declining and reascending the same threshold never draws again',()=>{
  let state=draw().state;const id=state.pending.id,name=catalog.items.find(i=>i.id===id).name;
  state=step(state,fact(51,11,true,'死亡',name),'3').state;
  state=reviveMechanics(state,fact(51,11,true,'死亡',name),'3').state;
  state=step(state,fact(30,5),'4').state;
  const result=step(state,fact(51,11),'5');assert.equal(result.drawn,null);assert.equal(result.state.pending,null);
});
test('pending counts as discovery, settlement does not count twice',()=>{
  let result=draw();const id=result.state.pending.id,item=catalog.items.find(i=>i.id===id);
  assert.equal(result.state.seen[id].status,'pending');
  result=step(result.state,fact(51,11,true,'死亡',item.name),'3');
  assert.equal(result.state.last.status,'settled');assert.equal(result.state.pending,null);assert.equal(Object.keys(result.state.seen).length,1);
});
test('mismatching narrative death never changes the locked ticket',()=>{
  const first=draw(),result=step(first.state,fact(51,11,true,'死亡','其他'),'3');
  assert.equal(result.state.pending.id,first.state.pending.id);assert.match(result.notice,/不同/);
});
test('revive changes only lifecycle flags; repeated clicks are idempotent',()=>{
  const first=draw();const f=fact(51,11,true,'死亡',catalog.items.find(i=>i.id===first.drawn).name);
  const settled=step(first.state,f,'3').state;
  const before=structuredClone(settled),result=reviveMechanics(settled,f,'3');
  assert.equal(result.changed,true);assert.equal(result.state.reviveCount,1);
  assert.deepEqual(result.state.seen,before.seen);assert.deepEqual(result.state.marks,before.marks);assert.deepEqual(result.state.cursor,before.cursor);
  assert.equal(reviveMechanics(result.state,f,'3').changed,false);
  assert.equal(step(result.state,f,'3').drawn,null);
  assert.equal(readonlyProjection(result.state)._revive_pending.count,1);
  assert.match(readonlyProjection(result.state)._mechanical_notice,/存活/);
});
test('unseen excluded until all 100 found, no count inflation after completion',()=>{
  const state=initialMechanics();for(const item of catalog.items)state.seen[item.id]={turn:'x',status:'settled'};
  assert.ok(eligibleItems(catalog,state,scene).length>0);
  delete state.seen['1'];assert.equal(eligibleItems(catalog,state,scene).length,0);
});
test('undiscovered names absent from visible models and search',()=>{
  const state=initialMechanics();const items=visibleEntries(catalog,state,'魔法');
  assert.ok(items.every(i=>i.name==='未记录'));assert.equal(visibleEntries(catalog,state,'魔法','魔力反噬').length,0);
});
test('MVU store preserves unrelated host fields and skips identical projection writes',async()=>{
  const variables={chat:{stat_data:{host:{value:7}}},message:{stat_data:{inventory:{coin:9}}}};let writes=0;
  const api={getMvuData:opts=>structuredClone(variables[opts.type]),replaceMvuData:(value,opts)=>{variables[opts.type]=structuredClone(value);writes++;}};
  const store=createMvuStore(api),state=draw().state;
  await store.write(state);await store.project(3,state);const n=writes;await store.project(3,state);
  assert.equal(writes,n);assert.equal(variables.chat.stat_data.host.value,7);assert.equal(variables.message.stat_data.inventory.coin,9);
  assert.deepEqual(await store.read(),state);
});
test('input bridge requires a real textarea, does not call send',()=>{
  assert.throws(()=>fillInput({querySelector:()=>null},'x'),/#send_textarea/);
});
