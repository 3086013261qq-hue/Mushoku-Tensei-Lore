"""Build a standalone MVU module, never read or emit a character card."""
from pathlib import Path
import json,re,hashlib,shutil

ROOT=Path(__file__).resolve().parents[1]
REPO=ROOT.parents[1]
SRC=ROOT/'src'
DIST=ROOT/'dist'
DATA=ROOT/'data'

def write(path,text):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(text,encoding='utf-8')

def build():
    DATA.mkdir(exist_ok=True)
    sources={
        'death-catalog.v0.1.json':REPO/'mvu/death-catalog.v0.1.json',
        'death-catalog.metadata.v0.2.json':REPO/'mvu/death-catalog.v0.2.json',
        'captions.v0.2.json':REPO/'mvu/008_帝皇娘因果宣言_锁屏字幕时间轴_v0.2.json',
        'opening-media-manifest.v0.1.json':REPO/'media/opening/opening-media-manifest.v0.1.json',
        'empress-assets-manifest.v1.json':REPO/'media/empress/empress-assets-manifest.v1.json'
    }
    for name,path in list(sources.items()):
        # The downloadable module is independently rebuildable from its own
        # exact frozen copies; it does not need the parent repository.
        if not path.is_file():
            path=DATA/name
            sources[name]=path
        if not path.is_file():raise FileNotFoundError('Missing frozen module asset: '+name)
        if path.resolve()!=(DATA/name).resolve():shutil.copyfile(path,DATA/name)
    read=lambda name:json.loads((DATA/name).read_text())
    manifest=read('opening-media-manifest.v0.1.json')
    config={
        'moduleVersion':'1.0.0',
        'seenKey':'mushoku_causal_codex_opening_seen_v1',
        'audioUrl':manifest['runtime_asset']['cdn_url'],
        'images':{asset['file']:'https://cdn.jsdelivr.net/gh/3086013261qq-hue/Mushoku-Tensei-Lore@main/media/empress/'+asset['file']
                  for asset in read('empress-assets-manifest.v1.json')['assets']}
    }
    css=(SRC/'panel.css').read_text()+'\n'+(SRC/'mobile.css').read_text()
    assets={'config':config,'css':css,'baseCatalog':read('death-catalog.v0.1.json'),
            'catalogMetadata':read('death-catalog.metadata.v0.2.json'),'captions':read('captions.v0.2.json')}
    write(DATA/'cdn-config.json',json.dumps(config,ensure_ascii=False,indent=2)+'\n')
    write(SRC/'assets.js','// Generated from frozen design/media assets. No worldbook data.\nexport const ASSETS = '+json.dumps(assets,ensure_ascii=False,separators=(',',':'))+';\n')
    code=[]
    for name in ['assets.js','core.js','catalog.js','view.js','runtime.js']:
        text=(SRC/name).read_text()
        text=re.sub(r'^import .+;\n','',text,flags=re.M)
        text=re.sub(r'^export ','',text,flags=re.M)
        code.append('// '+name+'\n'+text)
    entry="""
$(async () => {
  try {
    await waitGlobalInitialized('Mvu');
    const plugin=await startTavern({Mvu,getChatMessages,getLastMessageId,eventOn,tavern_events,
      eventRemoveListener:typeof eventRemoveListener==='function'?eventRemoveListener:null});
    window.addEventListener('pagehide',()=>plugin.dispose(),{once:true});
  } catch(error) {console.error('[CausalCodex] initialization failed',error);}
});
"""
    bundle='// Independent Causal Codex MVU module 1.0.0\n(()=>{\n'+ '\n'.join(code)+entry+'\n})();\n'
    assert '</script' not in bundle.lower(), 'Embedded script closing tag would break Tavern Helper'
    write(DIST/'causal-codex.js',bundle)
    scripts=[]
    for ident,name,content in [
        ('causal-codex-mvu-core','MVU',(SRC/'MVU.js').read_text()),
        ('causal-codex-zod','MVU ZOD · 因果法典',(SRC/'schema.js').read_text()),
        ('causal-codex-runtime','因果法典 · 独立MVU',bundle)
    ]:
        scripts.append({'type':'script','enabled':True,'name':name,'id':ident,'content':content,
                        'info':'独立模块；不包含角色卡或世界书业务正文。',
                        'button':{'enabled':False,'buttons':[]},'data':{},'export_with':{'data':True,'button':False}})
    write(DIST/'tavern-helper-scripts.json',json.dumps(scripts,ensure_ascii=False,indent=2)+'\n')
    write(DIST/'panel.html','<!-- Runtime mount shell; createView fills its Shadow DOM. -->\n<div class="causal-codex-host"></div>\n')
    write(DIST/'panel.css',css)
    schema_extension=re.sub(r'^import .+;\n','',(SRC/'schema.js').read_text(),flags=re.M)
    schema_extension=re.sub(r'^export const Schema=.*\n','',schema_extension,flags=re.M)
    schema_extension=re.sub(r'^\$\(\(\)=>\{registerMvuSchema\(Schema\);\}\);\n','',schema_extension,flags=re.M)
    write(DIST/'schema-extension.js',schema_extension)
    regex=[{'id':'causal-codex-hide-update','scriptName':'[MVU]去除变量更新显示',
            'findRegex':r'/<UpdateVariable>\s*[\s\S]*?<\/UpdateVariable>\s*/gi','replaceString':'',
            'trimStrings':[],'placement':[2],'disabled':False,'markdownOnly':True,'promptOnly':False,
            'runOnEdit':True,'substituteRegex':0,'minDepth':None,'maxDepth':None},
           {'id':'causal-codex-hide-placeholder','scriptName':'[MVU]去除正文底部占位符',
            'findRegex':r'/<StatusPlaceHolderImpl\s*\/?>/gi','replaceString':'',
            'trimStrings':[],'placement':[1,2],'disabled':False,'markdownOnly':True,'promptOnly':True,
            'runOnEdit':True,'substituteRegex':0,'minDepth':None,'maxDepth':None}]
    write(DIST/'regex.json',json.dumps(regex,ensure_ascii=False,indent=2)+'\n')
    source_hashes={name:hashlib.sha256(path.read_bytes()).hexdigest() for name,path in sources.items()}
    write(DATA/'source-hashes.json',json.dumps(source_hashes,indent=2)+'\n')
    print('Built standalone MVU scripts; no card JSON/PNG read or generated.')

if __name__=='__main__':build()
