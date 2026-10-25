import {normalizeCatalog} from './core.js';
// The baseline v0.1 IDs/names are authoritative; v0.2 supplies frozen metadata only.
export function readDeathCatalog(base,metadata) {return normalizeCatalog(base,metadata);}
export async function loadDeathCatalog(baseUrl,metadataUrl,fetcher=fetch) {
  const responses=await Promise.all([fetcher(baseUrl),fetcher(metadataUrl)]);
  if(responses.some(response=>!response.ok))throw new Error('死亡词表不可读取；不抽取，不丢失pending');
  const [base,metadata]=await Promise.all(responses.map(response=>response.json()));
  return readDeathCatalog(base,metadata);
}
