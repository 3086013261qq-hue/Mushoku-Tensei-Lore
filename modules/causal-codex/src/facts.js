import {parseCausality} from './core.js';

// Read-only display lookup. Skip streaming/incomplete/invalid blocks and never
// derive scores, phases, dates or mechanical consequences from narrative text.
export const isAssistant=row=>Boolean(row && row.is_user !== true && (!row.role || row.role === 'assistant'));
export const messageText=row=>row.message ?? row.mes ?? '';

export async function readLatestCausality(getChatMessages,lastId) {
  for(let id=Number(lastId);id>=0;id--) {
    const message=(await Promise.resolve(getChatMessages(id)))?.[0];
    if(!isAssistant(message))continue;
    const blocks=[...String(messageText(message)).matchAll(/<causality>[\s\S]*?<\/causality>/g)];
    for(let index=blocks.length-1;index>=0;index--) {
      try{return {fact:parseCausality(blocks[index][0]),sourceId:id};}catch{}
    }
  }
  return null;
}
