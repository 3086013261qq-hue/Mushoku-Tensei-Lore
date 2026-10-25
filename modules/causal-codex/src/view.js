import {effectiveLife,visibleEntries} from './core.js';

const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const QUOTES = [
  '世界允许第二次选择，但不替任何人删除第一次。',
  '宽恕不是遗忘；它只意味着你仍有资格作出下一次选择。',
  '我不要求你从未犯错。我要求你看见错误之后，不再假装没有看见。',
  '爱不是免罪券，痛苦也不是偿债凭证。',
  '被偏爱不是罪；把偏爱当成理所当然，才会让秩序开始倾斜。',
  '若一个世界只能靠替你承担代价来维持你的幸福，那不是仁慈，是失衡。',
  '人可以软弱，可以后悔，也可以重新开始；唯独不能要求因果替自己失忆。',
  '真正的自由从来包含拒绝你的自由。',
  '你可以被爱，但没有任何人天生属于你。',
  '纠正不是让谁更痛苦，而是让每个人重新拥有自己的选择。',
  '我爱人类，所以我不会把人类当成永远无需负责的孩子。',
  '复活让你继续活，不让你的账自动归零。'
];

export function createView(host,{css,config,catalog,captions,onRevive,onFill,storage}) {
  const root=host.attachShadow({mode:'open'});
  root.innerHTML=`<style>${css}</style><div class="surface"><div class="card quiet">
    <div class="top"><div class="seal" aria-hidden="true">${Array.from({length:12},(_,i)=>`<i class="ray" style="transform:rotate(${i*30}deg) translateY(-15px)"></i>`).join('')}</div>
    <div class="title"><b>因果法典</b><small>CAUSAL CODEX · IMPERIAL OBSERVATION</small></div><div class="state">QUIET</div></div>
    <section class="opening" hidden aria-label="帝皇宣言锁屏"></section>
    <main class="body"></main><div class="feedback" role="status" aria-live="polite"></div>
    </div></div>`;
  const card=root.querySelector('.card'),body=root.querySelector('.body'),lock=root.querySelector('.opening');
  let current=null, expanded=false, category='魔法',page=0, identity=false, timer, destroyed=false;
  const animatedTurns=new Set();
  let audio=null,mediaTimer=null,firstAttempted=false,captionKey='',gesture=false,openingError=false;
  const getPref=key=>{try{return storage.getItem(key);}catch{return null;}};
  const setPref=(key,value)=>{try{storage.setItem(key,value);}catch{feedback('此环境无法保存开屏偏好；本次会话内仍只尝试一次。');}};
  function feedback(text) {root.querySelector('.feedback').textContent=text;}
  function mode(value,ms) {
    clearTimeout(timer);card.className='card '+value.toLowerCase();root.querySelector('.state').textContent=value;
    if(ms)timer=setTimeout(()=>mode('QUIET'),ms);
  }
  function image(file,cls,alt,eager=false) {
    return `<img class="${cls}" src="${escapeHTML(config.images[file])}" alt="${alt}" loading="${eager?'eager':'lazy'}">`;
  }
  function quote() {return QUOTES[Math.abs(Number(current?.turn)||0)%QUOTES.length];}
  function cells(field,fact,state,newMarks) {
    const cls=field==='karma'?'k':'c';
    return `<div class="cells" role="img" aria-label="${field==='karma'?'因果':'纠正'}阈值记录；当前${fact[field]}点">${Array.from({length:20},(_,i)=>{
      const key=String((i+1)*5),hit=state.marks[field][key],historical=state.historical[field][key];
      return `<i class="cell ${hit?cls:''} ${historical?'historical':''} ${newMarks[field]?.includes(key)?'fresh':''}" aria-hidden="true"></i>`;
    }).join('')}</div>`;
  }
  function render(data) {
    current=data;
    const {fact,state,turn,notice=''}=data;
    const fresh=!animatedTurns.has(String(turn));
    const newMarks=fresh?(data.newMarks||{karma:[],correction:[]}):{karma:[],correction:[]};
    const drawn=fresh?data.drawn:null;
    if(data.drawn || Object.values(data.newMarks||{}).some(marks=>marks.length))animatedTurns.add(String(turn));
    const pending=state.pending,record=pending?.id?pending:state.last;
    const item=record?.id?catalog.items.find(item=>item.id===record.id):null;
    const dead=fact && effectiveLife(fact,state)==='死亡';
    const total=Object.keys(state.seen).length;
    body.innerHTML=`<div class="quote">
      <div class="portrait">${image('EMP-QUOTE-01.webp','','帝皇娘箴言侧影')}</div>
      <div class="qtext"><div>${escapeHTML(quote())}</div><small>THE EMPRESS REMEMBERS</small></div>
      <button class="replay" data-action="replay">◉ 回听宣言</button></div>
      <div class="section"><div class="label">DUAL CAUSALITY</div>${fact?`<div class="bars">
      <div class="bar"><h3><span>⚖ 鲁迪因果</span><span>${fact.karma} / 100 · ${escapeHTML(fact.karmaPhase)}</span></h3>${cells('karma',fact,state,newMarks)}</div>
      <div class="bar"><h3><span>🌍 世界纠正</span><span>${fact.correction} / 100 · ${escapeHTML(fact.correctionPhase)}</span></h3>${cells('correction',fact,state,newMarks)}</div>
      <p class="legend">低亮：历史基线 · 常亮：监察后已跨阈值 · 每格5点<br>${fact.active?'帝皇监察已激活':'T+3监察尚未激活'} · 鲁迪${dead?'死亡':'存活'}${state.revivePending?' · 已复活，等待下轮正文继承':''}</p></div>`:'<p class="empty">等待一个完整有效的 &lt;causality&gt; 状态块。</p>'}
      ${item?`<div class="ticket ${drawn===item.id?'new-ticket':''}">${image('EMP-CODEX-01.webp','ticketart','死亡法典暗纹')}
      <div class="ticketcontent"><div class="cat">${escapeHTML(catalog.categories[item.category].icon+' '+item.category)} · DEATH DRAW</div>
      <strong>${escapeHTML(item.name)}</strong><small>${record.status==='settled'?'已结算 · SETTLED':'已锁定 · 等待正文在合理场景确认死亡'}</small>
      <small>阈值共鸣 ×${Object.values(record.crossed||{}).flat().length} · 抽取 ×1</small>
      ${pending?.id?'<button class="text-button" data-action="fill">将锁定死法提示填入输入框</button>':''}</div></div>`:pending?'<div class="ticket"><div class="ticketcontent"><strong>签发资格已保留</strong><small>等待明确场景标签；未抽签，不推定死亡。</small></div></div>':''}
      ${notice?`<p class="legend">${escapeHTML(notice)}</p>`:''}</div>
      <button class="codexrow" data-action="codex" aria-expanded="${expanded}"><span>💀 百死图鉴　${String(total).padStart(2,'0')} / 100</span><small>${expanded?'收起':'展开'}　›</small></button>
      <section class="codex" ${expanded?'':'hidden'} aria-label="百死图鉴">${codexHTML(state)}</section>
      <div class="revive"><div class="revivebox ${dead?'dead':''}"><div class="haloring"></div>${image('EMP-REVIVE-01.webp','reviveart','帝皇娘复活区半身')}
      <div class="revivetext"><h3>${dead?'起来，账还没清。':'鲁迪仍然活着'}</h3><p>复活让你继续活，不让你的账自动归零。</p></div>
      <button class="btn" data-action="revive" ${dead?'':'disabled'}>♻ 起来，账还没清。</button></div>
      <div class="watermark">IMPERIAL OBSERVATION · THE EMPRESS REMEMBERS</div></div>
      <details class="settings"><summary>开屏偏好与视觉锚点</summary><button class="text-button" data-action="quotes-only">以后只显示箴言</button>
      <button class="text-button" data-action="identity">${identity?'收起':'查看'}帝皇娘主立绘</button>
      ${identity?`<div class="identity open">${image('EMP-BASE-01.webp','','帝皇娘唯一正式主立绘')}<div><b>人类帝皇</b><p>因果法典 · 唯一正式视觉锚点</p></div></div>`:''}</details>`;
    wireImageFallback();
    if (lock.hidden && (drawn || Object.values(newMarks).some(marks=>marks.length))) mode('OBSERVE',350);
    if (!firstAttempted) {
      firstAttempted=true;
      if(getPref(config.seenKey)!=='true') openDeclaration(false);
    }
  }
  function codexHTML(state) {
    const list=visibleEntries(catalog,state,category);
    const pages=Math.max(1,Math.ceil(list.length/10));page=Math.min(page,pages-1);
    const count=list.filter(item=>item.status!=='undiscovered').length;
    return `<h3>THE HUNDRED DEATHS</h3><div class="bookmarks" role="group" aria-label="死亡类别">${Object.entries(catalog.categories).map(([name,cat])=>`<button data-category="${escapeHTML(name)}" aria-pressed="${name===category}">${cat.icon} ${escapeHTML(name)}</button>`).join('')}</div>
    <p class="legend">${escapeHTML(category)}　${count} / ${list.length} 已记录</p><div class="entries">${list.slice(page*10,page*10+10).map(entry=>`<div class="entry ${entry.status==='undiscovered'?'unknown':''}"><small>No. ${entry.id.padStart(3,'0')}</small><b>${escapeHTML(entry.name)}</b><small>${entry.status==='undiscovered'?'封存':entry.status.toUpperCase()}</small></div>`).join('')}</div>
    <div class="pagination"><button data-action="prev" ${page===0?'disabled':''}>上一页</button><span>${page+1} / ${pages}</span><button data-action="next" ${page+1>=pages?'disabled':''}>下一页</button></div>
    <div class="watermark">THE EMPRESS REMEMBERS</div>`;
  }
  function wireImageFallback() {
    root.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>{
      img.hidden=true;img.parentElement.classList.add('image-fallback');
    },{once:true}));
  }
  function stopAudio() {
    clearTimeout(mediaTimer);mediaTimer=null;
    if(audio){audio.pause();audio.removeAttribute('src');audio.load();audio=null;}
  }
  function closeDeclaration(markSeen) {
    if(markSeen)setPref(config.seenKey,'true');
    stopAudio();lock.hidden=true;body.hidden=false;mode('QUIET');
  }
  function captionAt(time) {
    if (time>=captions.mix_duration_seconds) return closeDeclaration(true);
    const cue=captions.cues.find(cue=>time>=cue.start && time<cue.end);
    const key=cue?.id || (time>=151.5?'quote':'postlude');
    if(key===captionKey)return;captionKey=key;
    const old=lock.querySelector('.current-cue'),prev=lock.querySelector('.previous-cue');
    prev.textContent=cue?.emphasis==='critical'?'':old.textContent;
    old.textContent=cue?.text || (time>=151.5?QUOTES[0]:'THE CAUSAL CODEX IS OPEN');
    old.className='current-cue '+(cue?.emphasis==='critical'?'critical':'');
    lock.classList.toggle('postlude',time>=captions.voice_duration_seconds);
  }
  function mediaFailure() {
    if(destroyed || lock.hidden)return;
    openingError=true;clearTimeout(mediaTimer);
    if(audio)audio.pause();
    const play=lock.querySelector('[data-action="play"]');
    play.hidden=true;
    lock.querySelector('.current-cue').textContent='宣言暂不可用';
    lock.querySelector('[data-action="skip"]').textContent='进入法典';
    // Never hide the way into the working UI, and do not mark a failed attempt as seen.
    body.hidden=false;feedback('宣言加载失败；法典仍可正常使用。');mode('QUIET');
  }
  async function play() {
    if(!audio)return;
    clearTimeout(mediaTimer);mediaTimer=setTimeout(mediaFailure,15000);
    try {
      await audio.play();
      if(destroyed || lock.hidden)return;
      gesture=false;lock.querySelector('[data-action="play"]').hidden=true;
      mediaTimer=setTimeout(mediaFailure,15000); // stalled network, not an autoplay failure
    } catch(error) {
      clearTimeout(mediaTimer);
      if(destroyed || lock.hidden)return;
      gesture=true;lock.querySelector('[data-action="play"]').hidden=false;
      lock.querySelector('.current-cue').textContent='进入因果法典 · 播放宣言';
    }
  }
  function openDeclaration(replay) {
    stopAudio();openingError=false;captionKey='';gesture=false;
    lock.hidden=false;body.hidden=true;mode('INTERVENE');
    lock.innerHTML=`<div class="opening-top"><small>CAUSAL CODEX · ${replay?'REPLAY':'FIRST BOOT'}</small><button data-action="skip">跳过</button></div>
      <div class="lock-portrait">${image('EMP-LOCK-01.webp','','帝皇宣言圆章',true)}</div>
      <div class="magic-ring" aria-hidden="true"></div><div class="captions"><div class="previous-cue"></div><div class="current-cue">因果法典</div></div>
      <div class="opening-controls"><button data-action="play" hidden>播放宣言</button><button data-action="pause">暂停 / 继续</button></div>`;
    wireImageFallback();
    audio=new host.ownerDocument.defaultView.Audio(config.audioUrl);audio.preload='metadata';audio.volume=.8;
    const playingAudio=audio;
    audio.addEventListener('timeupdate',()=>{if(audio!==playingAudio)return;clearTimeout(mediaTimer);captionAt(audio.currentTime);});
    audio.addEventListener('waiting',()=>{if(audio!==playingAudio)return;clearTimeout(mediaTimer);mediaTimer=setTimeout(mediaFailure,15000);});
    audio.addEventListener('playing',()=>{if(audio===playingAudio)clearTimeout(mediaTimer);});
    audio.addEventListener('error',()=>{if(audio===playingAudio)mediaFailure();});
    audio.addEventListener('ended',()=>{if(audio===playingAudio)closeDeclaration(true);});
    play();
  }
  function click(event) {
    const el=event.target.closest('button');if(!el || el.disabled)return;
    const action=el.dataset.action;
    if(el.dataset.category){category=el.dataset.category;page=0;render(current);return;}
    if(action==='replay')openDeclaration(true);
    if(action==='skip')closeDeclaration(!openingError);
    if(action==='play')play();
    if(action==='pause' && audio){if(audio.paused)play();else {audio.pause();clearTimeout(mediaTimer);}}
    if(action==='codex'){expanded=!expanded;render(current);}
    if(action==='prev'){page--;render(current);}
    if(action==='next'){page++;render(current);}
    if(action==='identity'){identity=!identity;render(current);root.querySelector('.settings').open=true;}
    if(action==='quotes-only'){setPref(config.seenKey,'true');closeDeclaration(false);feedback('已关闭自动开屏；仍可主动回听宣言。');}
    if(action==='fill' && current?.state.pending?.id){
      const item=catalog.items.find(item=>item.id===current.state.pending.id);
      onFill(`【死亡签机械提示】已锁定：${item.name}。仅在鲁迪在场且合理场景中由正文确认结算；尚未发生时保持 pending，不重新抽签。死亡本身因果+0、纠正+0。`);
    }
    if(action==='revive') {mode('INTERVENE',450);Promise.resolve(onRevive()).catch(error=>feedback(error.message));}
  }
  root.addEventListener('click',click);
  return {render,feedback,mode,root,captionAt,
    destroy(){destroyed=true;clearTimeout(timer);stopAudio();root.removeEventListener('click',click);host.remove();}};
}
