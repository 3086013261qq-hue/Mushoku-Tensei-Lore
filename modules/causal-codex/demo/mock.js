import {startTavern} from '../src/runtime.js';

const storageKey='causal_codex_DEMO_ONLY_mock_v1';
let saved;
try{saved=JSON.parse(sessionStorage.getItem(storageKey)||'null');}catch{}
let id=saved?.id||1,values=saved?.values||{},k=45,c=20,life='存活',death='无';
const messages=saved?.messages||{};
// Boundary-value fixture labels only; production reads the supplied phase verbatim.
const mockKarmaPhases=['潜伏','裂纹','渗出','偏移','清算','极限'];
const mockCorrectionPhases=['萌芽','局部纠偏','结构松动','秩序重构','深层校正','高位稳态'];
function raw(){return `<causality>\n【本回合变动】\n因果: +0｜来源: mock\n纠正: +0｜来源: mock\n***\n⚖️鲁迪因果: ${k}/100｜阶段: ${mockKarmaPhases[Math.min(5,Math.floor(k/20))]}\n🌍世界纠正: ${c}/100｜阶段: ${mockCorrectionPhases[Math.min(5,Math.floor(c/20))]}\n💀鲁迪生死: ${life}｜死法: ${death}\n<!--RT:OPEN=MOCK;BASE=45;KSET=MOCK-K;CSET=MOCK-C;OLD01=0;CORR_ACTIVE=1-->\n</causality>`;}
messages[id] ??= {role:'assistant',message:new URLSearchParams(location.search).has('empty')?'普通mock正文，尚未结算。':raw()};
function save(){sessionStorage.setItem(storageKey,JSON.stringify({id,values,messages}));document.querySelector('#diagnostics').textContent=JSON.stringify(values.chat?.stat_data?.$causal_codex||{},null,2);}
const handlers=new Map();
const events={VARIABLE_UPDATE_ENDED:'update',VARIABLE_INITIALIZED:'init',BEFORE_MESSAGE_UPDATE:'before'};
const tavern_events={CHARACTER_MESSAGE_RENDERED:'render',MESSAGE_UPDATED:'changed',MESSAGE_SWIPED:'swiped',MESSAGE_DELETED:'deleted',CHAT_CHANGED:'chat'};
const api={
  Mvu:{events,getMvuData:opts=>structuredClone(values[opts.type==='chat'?'chat':'m'+opts.message_id]||{}),
    replaceMvuData:async(value,opts)=>{values[opts.type==='chat'?'chat':'m'+opts.message_id]=structuredClone(value);save();}},
  getChatMessages:n=>messages[n]?[messages[n]]:[],getLastMessageId:()=>id,
  eventOn:(name,cb)=>{if(!handlers.has(name))handlers.set(name,new Set());handlers.get(name).add(cb);return {stop(){handlers.get(name).delete(cb);}};},
  tavern_events,parent:window
};
let plugin;
if(new URLSearchParams(location.search).has('bundle')) {
  Object.assign(window,api,{$:callback=>callback(),waitGlobalInitialized:async()=>{}});
  await import('../dist/causal-codex.js');
  const deadline=Date.now()+5000;
  while(!window.CausalCodex && Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,10));
  if(!window.CausalCodex)throw new Error('Bundled script did not initialize');
  plugin=window.CausalCodex;
}else plugin=await startTavern(api);
await plugin.setSceneProvider(()=>({tags:['日常','饮食'],rudyPresent:true,emperorPresent:false}));
async function advance(karma,correction,status='存活',name='无'){
  k=karma;c=correction;life=status;death=name;id++;
  messages[id]={role:'assistant',message:raw()};
  const node=document.querySelector('.mes');node.setAttribute('mesid',String(id));
  save();await plugin.refresh();
}
window.demo={plugin,api,advance,read:()=>structuredClone(values),
  async blank(){id++;messages[id]={role:'assistant',message:'普通mock正文，本轮没有 causality。'};document.querySelector('.mes').setAttribute('mesid',String(id));save();await plugin.refresh();},
  async incomplete(){id++;messages[id]={role:'assistant',message:'<causality>尚未输出完整'};document.querySelector('.mes').setAttribute('mesid',String(id));save();await plugin.refresh();},
  async editIncomplete(){messages[id].message='<causality>正在更新';save();await plugin.refresh();},
  async changeChat(){values={};for(const key of Object.keys(messages))delete messages[key];id=1;messages[id]={role:'assistant',message:'新的mock聊天，尚未结算。'};document.querySelector('.mes').setAttribute('mesid','1');for(const cb of handlers.get('chat')||[])cb();save();await plugin.refresh();},
  async settle(){const s=values.chat?.stat_data?.$causal_codex;const name=s?.pending?.id?
    (await import('../src/assets.js')).ASSETS.baseCatalog.items.find(i=>String(i.id)===s.pending.id).name:null;
    if(name)await advance(s.cursor.karma,s.cursor.correction,'死亡',name);},
  async tamper(){
    const old=structuredClone(values['m'+id]),next=structuredClone(old);
    next.stat_data._causal_codex._revive_count=999;
    for(const cb of handlers.get('update')||[])await cb(next,old);
    values['m'+id]=next;save();await plugin.refresh();
  },
  reset(){sessionStorage.removeItem(storageKey);location.reload();}
};
document.querySelector('.test-controls').addEventListener('click',async event=>{
  const action=event.target.dataset.demo;
  if(action==='reset')return window.demo.reset();
  if(action==='baseline')await advance(45,20);
  if(action==='cross'){const s=values.chat?.stat_data?.$causal_codex;await advance(Math.min(100,s.cursor.karma+11),Math.min(100,s.cursor.correction+6));}
  if(action==='settle')await window.demo.settle();
  if(action==='repeat')await plugin.refresh();
  if(action==='blank')await window.demo.blank();
  if(action==='empty')await window.demo.changeChat();
});
document.querySelector('.mes').setAttribute('mesid',String(id));
save();await plugin.refresh();
