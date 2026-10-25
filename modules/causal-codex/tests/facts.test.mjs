import test from 'node:test';
import assert from 'node:assert/strict';
import {readLatestCausality} from '../src/facts.js';

const raw=(k=0,c=0)=>`<causality>\n⚖️鲁迪因果: ${k}/100｜阶段: 潜伏\n🌍世界纠正: ${c}/100｜阶段: 萌芽\n💀鲁迪生死: 存活｜死法: 无\n<!--RT:OPEN=MOCK;BASE=0;KSET=;CSET=;OLD01=0;CORR_ACTIVE=0-->\n</causality>`;
function read(messages){return readLatestCausality(id=>messages[id]?[messages[id]]:[],messages.length-1);}
test('zero is a valid public score, including the opening message',()=>{
  const result=read([{role:'assistant',message:raw()}]);assert.equal(result.fact.karma,0);assert.equal(result.fact.correction,0);assert.equal(result.sourceId,0);
});
test('missing/incomplete/invalid latest blocks fall back to the latest valid assistant',()=>{
  const messages=[{role:'assistant',message:raw(5,19)},{role:'assistant',message:'ordinary prose'},{role:'assistant',message:'<causality>streaming'}];
  assert.equal(read(messages).fact.correction,19);
  messages.push({role:'assistant',message:raw().replace('0/100','101/100')});assert.equal(read(messages).sourceId,0);
  messages.push({role:'user',message:raw(18,18)});assert.equal(read(messages).sourceId,0);
});
test('multiple blocks select the last complete valid block without changing protocol',()=>{
  assert.equal(read([{role:'assistant',message:raw(5,5)+raw(19,19)+'<causality>partial'}]).fact.karma,19);
  assert.equal(read([{role:'assistant',message:raw(5,5)+raw().replace('萌芽','invalid')}]).fact.karma,5);
});
test('no valid block returns a waiting state, not invented values',()=>{
  assert.equal(read([{role:'assistant',message:'no settlement'}]),null);
  assert.equal(read([]),null);
});
