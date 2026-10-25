// Pure mechanical functions. No worldbook access and no ethical scoring.
export const KARMA_PHASES = ['潜伏','裂纹','渗出','偏移','清算','极限'];
export const CORRECTION_PHASES = ['萌芽','局部纠偏','结构松动','秩序重构','深层校正','高位稳态'];
export const clone = value => JSON.parse(JSON.stringify(value));
export function parseCausality(text) {
  const blocks = [...String(text).matchAll(/<causality>([\s\S]*?)<\/causality>/g)];
  if (blocks.length !== 1) throw new Error('需要且只允许一个完整 causality 块');
  const block = blocks[0][1];
  const karma = block.match(/鲁迪因果\s*[:：]\s*(\d+(?:\.\d+)?)\s*\/\s*100\s*[｜|]\s*阶段\s*[:：]\s*([^\n\r]+)/);
  const correction = block.match(/世界纠正\s*[:：]\s*(\d+(?:\.\d+)?)\s*\/\s*100\s*[｜|]\s*阶段\s*[:：]\s*([^\n\r]+)/);
  const life = block.match(/鲁迪生死\s*[:：]\s*(存活|死亡)\s*[｜|]\s*死法\s*[:：]\s*([^\n\r<]+)/);
  const rt = block.match(/<!--\s*RT:([\s\S]*?)-->/);
  if (!karma || !correction || !life || !rt) throw new Error('causality 字段不完整；保留既有机械态');
  const tags = Object.fromEntries(rt[1].split(';').filter(Boolean).map(pair => {
    const index = pair.indexOf('=');
    return [pair.slice(0,index).trim(), pair.slice(index+1).trim()];
  }));
  if (!['0','1'].includes(tags.CORR_ACTIVE)) throw new Error('CORR_ACTIVE 必须为 0 或 1');
  for (const key of ['OPEN','BASE','KSET','CSET','OLD01']) {
    if (!(key in tags)) throw new Error('缺少 RT 字段 '+key);
  }
  const k = Number(karma[1]), c = Number(correction[1]);
  const kp = karma[2].trim(), cp = correction[2].trim();
  if (k > 100 || c > 100 || !KARMA_PHASES.includes(kp) || !CORRECTION_PHASES.includes(cp)) {
    throw new Error('数值或阶段名无效；界面不会自行重算');
  }
  return {karma:k, correction:c, karmaPhase:kp, correctionPhase:cp,
    life:life[1], death:life[2].trim(), active:tags.CORR_ACTIVE==='1', rt:tags};
}

export function normalizeCatalog(base, enriched) {
  if (base.items.length !== 100 || enriched.items.length !== 100) throw new Error('死亡词表必须为100条');
  const map = new Map(enriched.items.map(item => [String(item.id),item]));
  const items = base.items.map(item => {
    const extra = map.get(String(item.id));
    if (!extra || extra.name!==item.name || !extra.category || !extra.scene_tags?.length) {
      throw new Error('词表编号/名称/分类不一致: '+item.id);
    }
    return {...item, id:String(item.id), category:extra.category, scene_tags:[...extra.scene_tags]};
  });
  if (new Set(items.map(item=>item.id)).size !== 100) throw new Error('死亡词表ID重复');
  return {items, categories:enriched.categories};
}

export function initialMechanics() {
  return {version:1, initialized:false, activated:false, cursor:{karma:0,correction:0},
    historical:{karma:{},correction:{}}, marks:{karma:{},correction:{}}, seen:{},
    pending:null, last:null, turns:{}, reviveCount:0, revivePending:null, lastDrawTurn:''};
}

const thresholds = value => Array.from({length:Math.floor(value/5)},(_,i)=>String((i+1)*5));
function markAll(target, value) { for (const mark of thresholds(value)) target[mark]=true; }
export function eligibleItems(catalog, state, scene={}) {
  // Tags are an explicit host contract. We do not infer narrative facts from prose.
  if (scene.rudyPresent !== true || !Array.isArray(scene.tags) || !scene.tags.length) return [];
  const tags = new Set(scene.tags);
  const allDiscovered = catalog.items.every(item=>Boolean(state.seen[item.id]));
  return catalog.items.filter(item => (allDiscovered || !state.seen[item.id]) &&
    (item.id!=='9' || scene.emperorPresent===true) &&
    item.scene_tags.some(tag => tags.has(tag) && (tag!=='帝皇' || scene.emperorPresent===true)));
}

export function advanceMechanics(previous, fact, turn, catalog, scene={}, random=Math.random) {
  const state=clone(previous || initialMechanics());
  const key=String(turn);
  const result={state, drawn:null, newMarks:{karma:[],correction:[]}, notice:''};
  const drawWaiting=()=>{
    if(fact.life==='死亡' || state.revivePending)return;
    if(state.pending && !state.pending.id && state.lastDrawTurn!==key) {
      const pool=eligibleItems(catalog,state,scene);
      if(pool.length) {
        const roll=Number(random());
        const selected=pool[Math.min(pool.length-1,Math.max(0,Math.floor((Number.isFinite(roll)?roll:0)*pool.length)))];
        state.pending={...state.pending,id:selected.id,name:selected.name,category:selected.category,drawTurn:key,status:'pending'};
        state.last=clone(state.pending);state.lastDrawTurn=key;
        state.turns[key].selectedId=selected.id;
        if(!state.seen[selected.id])state.seen[selected.id]={turn:key,status:'pending'};
        result.drawn=selected.id;
      }
    }
  };
  const settle=()=>{
    if (fact.life==='死亡' && state.pending?.id) {
      const item=catalog.items.find(item=>item.id===state.pending.id);
      if (item && fact.death===item.name) {
        state.last={...state.pending, status:'settled', settledTurn:key};
        state.seen[item.id].status='settled';
        state.pending=null;
      } else result.notice='正文死法与锁定签不同；保留待结算记录，不自动改写正文。';
    }
  };
  // Same message ID = same turn, including edits, swipes and re-rendering.
  if (state.turns[key]) {
    // Edits may reveal more crossed thresholds. Consume them without creating
    // another eligibility, so the next real turn cannot accidentally backfill it.
    if(fact.active) {
      if(!state.activated) {
        state.activated=true;
        markAll(state.historical.karma,fact.karma);
        markAll(state.historical.correction,fact.correction);
      }
      markAll(state.marks.karma,fact.karma);markAll(state.marks.correction,fact.correction);
    }
    state.cursor={karma:fact.karma,correction:fact.correction};
    settle();drawWaiting();return result;
  }
  state.turns[key]={processed:true, selectedId:null};
  if (state.revivePending && key!==state.revivePending.turn && fact.life==='存活') state.revivePending=null;
  if (!state.initialized) {
    state.initialized=true;
    // Attaching mid-chat must not charge historical thresholds.
    state.activated=fact.active;
    markAll(state.marks.karma,fact.karma); markAll(state.historical.karma,fact.karma);
    markAll(state.marks.correction,fact.correction); markAll(state.historical.correction,fact.correction);
    state.cursor={karma:fact.karma,correction:fact.correction};
    result.notice='已建立当前阈值基线；历史阈值不追溯抽签。';
    return result;
  }
  if (!fact.active) {
    state.cursor={karma:fact.karma,correction:fact.correction};
    return result;
  }
  if (!state.activated) {
    state.activated=true;
    markAll(state.marks.karma,fact.karma); markAll(state.historical.karma,fact.karma);
    state.cursor.karma=fact.karma;
    state.cursor.correction=0;
  }
  for (const field of ['karma','correction']) {
    for (const mark of thresholds(fact[field])) {
      if (!state.marks[field][mark] && Number(mark)>state.cursor[field]) {
        state.marks[field][mark]=true;
        result.newMarks[field].push(mark);
      }
    }
    state.cursor[field]=fact[field];
  }
  const hadPending=Boolean(state.pending);
  settle();
  // Do not generate a second ticket in a settlement turn, dead turn or revive turn.
  if (fact.life==='死亡' || state.revivePending || (hadPending && !state.pending)) return result;
  const crossed=result.newMarks.karma.length+result.newMarks.correction.length;
  if (!state.pending && crossed) {
    state.pending={id:null,triggerTurn:key,drawTurn:'',status:'waiting_scene',
      crossed:clone(result.newMarks)};
  }
  drawWaiting();
  return result;
}

export function reviveMechanics(previous, fact, turn) {
  const state=clone(previous);
  if (fact.life!=='死亡' || state.revivePending) return {state,changed:false};
  state.reviveCount++;
  state.revivePending={turn:String(turn),count:state.reviveCount};
  state.turns[String(turn)] ??= {processed:true, selectedId:null};
  return {state,changed:true};
}

export function effectiveLife(fact,state) { return state.revivePending ? '存活' : fact.life; }
export function readonlyProjection(state) {
  return {_death_seen:clone(state.seen),_death_marks_karma:clone(state.marks.karma),
    _death_marks_correction:clone(state.marks.correction),_pending_death_trigger:clone(state.pending),
    _last_death:clone(state.last),_revive_count:state.reviveCount,
    _revive_pending:clone(state.revivePending),_last_death_draw_turn:state.lastDrawTurn,
    _mechanical_notice:state.revivePending?'复活已生效。下一次有效输出继承：💀鲁迪生死: 存活｜死法: 无。因果、纠正、账目、关系与历史不变。':''};
}

export function visibleEntries(catalog,state,category,query='') {
  return catalog.items.filter(item=>!category || item.category===category).map(item=>{
    const record=state.seen[item.id];
    return {id:item.id,name:record?item.name:'未记录',status:record?.status||'undiscovered',category:item.category};
  }).filter(item=>!query || item.id.includes(query) || (item.status!=='undiscovered' && item.name.includes(query)));
}
