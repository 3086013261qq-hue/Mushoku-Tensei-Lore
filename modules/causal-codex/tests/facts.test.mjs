import test from 'node:test';
import assert from 'node:assert/strict';
import {readLatestCausality} from '../src/facts.js';

const raw=(k=0,c=0)=>`<causality>\n⚖️鲁迪因果: ${k}/100｜阶段: 潜伏\n🌍世界纠正: ${c}/100｜阶段: 萌芽\n💀鲁迪生死: 存活｜死法: 无\n<!--RT:OPEN=MOCK;BASE=0;KSET=;CSET=;OLD01=0;CORR_ACTIVE=0-->\n</causality>`;
function read(messages){return readLatestCausality(id=>messages[id]?[messages[id]]:[],messages.length-1);}
test('zero is a valid public score, including the opening message',async()=>{
  const result=await read([{role:'assistant',message:raw()}]);assert.equal(result.fact.karma,0);assert.equal(result.fact.correction,0);assert.equal(result.sourceId,0);
});
test('missing/incomplete/invalid latest blocks fall back to the latest valid assistant',async()=>{
  const messages=[{role:'assistant',message:raw(5,19)},{role:'assistant',message:'ordinary prose'},{role:'assistant',message:'<causality>streaming'}];
  assert.equal((await read(messages)).fact.correction,19);
  messages.push({role:'assistant',message:raw().replace('0/100','101/100')});assert.equal((await read(messages)).sourceId,0);
  messages.push({role:'user',message:raw(18,18)});assert.equal((await read(messages)).sourceId,0);
});
test('multiple blocks select the last complete valid block without changing protocol',async()=>{
  assert.equal((await read([{role:'assistant',message:raw(5,5)+raw(19,19)+'<causality>partial'}])).fact.karma,19);
  assert.equal((await read([{role:'assistant',message:raw(5,5)+raw().replace('萌芽','invalid')}])).fact.karma,5);
});
test('no valid block returns a waiting state, not invented values',async()=>{
  assert.equal((await read([{role:'assistant',message:'no settlement'}])),null);
  assert.equal(await read([]),null);
});

for(const asyncApi of [false,true])test(`compatible shapes and nullish field precedence (${asyncApi?'Promise':'sync'})`,async()=>{
  const rows=[{role:'assistant',message:raw(5)}, {is_user:false,mes:raw(10)}, {is_user:false,role:'assistant',mes:raw(15)}];
  const get=id=>asyncApi?Promise.resolve(rows[id]?[rows[id]]:[]):rows[id]?[rows[id]]:[];
  for(let id=0;id<rows.length;id++)assert.equal((await readLatestCausality(get,id)).fact.karma,(id+1)*5);
  rows.push({is_user:true,role:'assistant',mes:raw(80)},{role:'system',mes:raw(90)}, {is_user:false,message:'',mes:raw(100)});
  assert.equal((await readLatestCausality(get,rows.length-1)).fact.karma,15);
  rows.push({is_user:false,message:null,mes:raw(20)});
  assert.equal((await readLatestCausality(get,rows.length-1)).fact.karma,20);
});
