import {parseCausality} from './core.js';

// Read-only display lookup. Skip streaming/incomplete/invalid blocks and never
// derive scores, phases, dates or mechanical consequences from narrative text.
export function readLatestCausality(getChatMessages,lastId) {
  for(let id=Number(lastId);id>=0;id--) {
    const message=getChatMessages(id)?.[0];
    if(message?.role!=='assistant')continue;
    const blocks=[...String(message.message||'').matchAll(/<causality>[\s\S]*?<\/causality>/g)];
    for(let index=blocks.length-1;index>=0;index--) {
      try{return {fact:parseCausality(blocks[index][0]),sourceId:id};}catch{}
    }
  }
  return null;
}
