import {clone,parseCausality,initialMechanics,advanceMechanics,reviveMechanics,readonlyProjection} from './core.js';
import {readDeathCatalog} from './catalog.js';
import {createView} from './view.js';
import {ASSETS} from './assets.js';

// Only the MVU store is used for mechanics. No narrative scores in localStorage.
export function createMvuStore(Mvu) {
  return {
    async read() {
      const envelope=await Mvu.getMvuData({type:'chat'});
      return clone(envelope?.stat_data?.$causal_codex || initialMechanics());
    },
    async write(state,isCurrent=()=>true) {
      const envelope=clone(await Mvu.getMvuData({type:'chat'}) || {});
      if(!isCurrent())return;
      envelope.stat_data ??= {};envelope.stat_data.$causal_codex=clone(state);
      await Mvu.replaceMvuData(envelope,{type:'chat'});
    },
    async project(id,state,isCurrent=()=>true) {
      const envelope=clone(await Mvu.getMvuData({type:'message',message_id:id}) || {});
      if(!isCurrent())return;
      envelope.stat_data ??= {};
      const projection=readonlyProjection(state);
      if(JSON.stringify(envelope.stat_data._causal_codex)===JSON.stringify(projection))return;
      envelope.stat_data._causal_codex=projection;
      await Mvu.replaceMvuData(envelope,{type:'message',message_id:id});
    }
  };
}

export function fillInput(document,text) {
  const textarea=document.querySelector('#send_textarea');
  if(!textarea)throw new Error('未找到酒馆输入框 #send_textarea');
  const win=document.defaultView;
  const setter=Object.getOwnPropertyDescriptor(win.HTMLTextAreaElement.prototype,'value')?.set;
  if(setter)setter.call(textarea,String(text));else textarea.value=String(text);
  textarea.dispatchEvent(new win.Event('input',{bubbles:true}));textarea.focus();
}

export async function startTavern(api) {
  const {Mvu,getChatMessages,getLastMessageId,eventOn,tavern_events}=api;
  const parent=api.parent || window.parent,document=parent.document;
  parent.CausalCodex?.dispose?.();
  const catalog=readDeathCatalog(ASSETS.baseCatalog,ASSETS.catalogMetadata);
  const store=createMvuStore(Mvu);let view=null,host=null,epoch=0,disposed=false,tail=Promise.resolve();
  let lastFact=null,lastTurn=null,sceneProvider=null;const scenes=new Map(),listeners=[];
  const enqueue=task=>{const expected=epoch;tail=tail.catch(()=>{}).then(async()=>{
    if(disposed || expected!==epoch)return;
    try{await task(expected);}catch(error){view?.feedback(error.message);console.error('[CausalCodex]',error);}
  });return tail;};
  function subscribe(event,callback) {
    if(!event)return;
    const listener=eventOn(event,callback);listeners.push({event,callback,listener});
  }
  function latestAssistant() {
    for(let id=getLastMessageId();id>=0;id--){
      const message=getChatMessages(id)?.[0];
      if(message?.role==='assistant')return {id,message};
    }
    return null;
  }
  function ensureHost(id) {
    const box=document.querySelector(`#chat > .mes[mesid="${Number(id)}"] .mes_text`);
    if(!box)return false;
    if(host && host.parentElement!==box)box.appendChild(host);
    if(!host){
      document.querySelectorAll('.causal-codex-host').forEach(node=>node.remove());
      host=document.createElement('div');host.className='causal-codex-host';box.appendChild(host);
      view=createView(host,{css:ASSETS.css,config:ASSETS.config,catalog,captions:ASSETS.captions,
        storage:parent.localStorage,onRevive:revive,onFill:text=>{
          try{fillInput(document,text);view.feedback('提示已填入输入框，由你决定是否发送。');}
          catch(error){view.feedback(error.message);}
        }});
    }
    host.dataset.messageId=String(id);return true;
  }
  async function sceneFor(turn,fact) {
    if(scenes.has(String(turn)))return scenes.get(String(turn));
    if(sceneProvider)return await sceneProvider({messageId:turn,causality:clone(fact)}) || {};
    // Optional machine context if the host already supplies it. No prose inference.
    return {tags:(fact.rt.SCENE_TAGS||'').split(',').filter(Boolean),
      rudyPresent:fact.rt.RUDY_PRESENT==='1',emperorPresent:fact.rt.EMPEROR_PRESENT==='1'};
  }
  async function refreshTask(expected) {
    const target=latestAssistant();if(!target || !ensureHost(target.id))return;
    const state=await store.read();if(expected!==epoch)return;
    let fact;
    try{fact=parseCausality(target.message.message);}catch(error){
      lastFact=null;lastTurn=null;
      view.render({fact:null,state,turn:target.id,notice:error.message});return;
    }
    const scene=await sceneFor(target.id,fact);if(expected!==epoch)return;
    const outcome=advanceMechanics(state,fact,target.id,catalog,scene);
    if(JSON.stringify(outcome.state)!==JSON.stringify(state))await store.write(outcome.state,()=>expected===epoch && !disposed);
    if(expected!==epoch)return;
    await store.project(target.id,outcome.state,()=>expected===epoch && !disposed);if(expected!==epoch)return;
    lastFact=fact;lastTurn=target.id;view.render({...outcome,fact,turn:target.id});
  }
  const refresh=()=>enqueue(refreshTask);
  const revive=()=>enqueue(async expected=>{
    if(!lastFact || lastTurn===null)return;
    const target=latestAssistant();if(!target || target.id!==lastTurn)return;
    // Re-read the public fact to avoid a stale enabled button.
    const fact=parseCausality(target.message.message),state=await store.read();
    if(expected!==epoch)return;
    const result=reviveMechanics(state,fact,lastTurn);if(!result.changed)return;
    await store.write(result.state,()=>expected===epoch && !disposed);if(expected!==epoch)return;
    await store.project(lastTurn,result.state,()=>expected===epoch && !disposed);if(expected!==epoch)return;
    view.render({fact,state:result.state,turn:lastTurn});view.mode('INTERVENE',450);
    view.feedback('复活已生效；因果、纠正、账目与历史保持不变。下轮读取机械只读提示继承生存状态。');
  });
  function guardMechanicalProjection(next,old) {
    if(!next?.stat_data)return;
    // Called before MVU commits parsed patches; model cannot manufacture mechanics.
    if(old?.stat_data?._causal_codex!==undefined)next.stat_data._causal_codex=clone(old.stat_data._causal_codex);
    else delete next.stat_data._causal_codex;
    if(old?.stat_data?.$causal_codex!==undefined)next.stat_data.$causal_codex=clone(old.stat_data.$causal_codex);
    else delete next.stat_data.$causal_codex;
  }
  subscribe(Mvu.events?.VARIABLE_UPDATE_ENDED || 'mag_variable_update_ended',guardMechanicalProjection);
  const schedule=()=>{setTimeout(refresh,0);};
  for(const key of ['CHARACTER_MESSAGE_RENDERED','MESSAGE_UPDATED','MESSAGE_SWIPED','MESSAGE_DELETED'])subscribe(tavern_events[key],schedule);
  subscribe(Mvu.events?.VARIABLE_INITIALIZED || 'mag_variable_initialized',schedule);
  subscribe(Mvu.events?.BEFORE_MESSAGE_UPDATE || 'mag_before_message_update',schedule);
  // VARIABLE_UPDATE_ENDED precedes storage commit; refresh on the next task.
  subscribe(Mvu.events?.VARIABLE_UPDATE_ENDED || 'mag_variable_update_ended',schedule);
  subscribe(tavern_events.CHAT_CHANGED,()=>{
    epoch++;scenes.clear();lastFact=null;lastTurn=null;view?.destroy();view=null;host=null;
    setTimeout(refresh,0);
  });
  const publicApi={
    refresh,
    setSceneContext(messageId,scene){scenes.set(String(messageId),clone(scene));return refresh();},
    setSceneProvider(provider){if(typeof provider!=='function')throw new Error('scene provider must be a function');sceneProvider=provider;return refresh();},
    dispose(){disposed=true;epoch++;view?.destroy();for(const {event,callback,listener} of listeners){
      if(listener?.stop)listener.stop();else if(api.eventRemoveListener)api.eventRemoveListener(event,callback);
    }parent.removeEventListener('pagehide',publicApi.dispose);if(parent.CausalCodex===publicApi)delete parent.CausalCodex;}
  };
  parent.CausalCodex=publicApi;parent.addEventListener('pagehide',publicApi.dispose,{once:true});
  await refresh();return publicApi;
}
