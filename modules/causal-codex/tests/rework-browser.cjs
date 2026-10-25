const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
let server,browser;
(async()=>{
  const moduleRoot=path.resolve(__dirname,'..');
  server=require('node:http').createServer((req,res)=>{
    const target=path.resolve(moduleRoot,'.'+decodeURIComponent(req.url.split('?')[0]));
    const file=fs.existsSync(target)&&fs.statSync(target).isDirectory()?path.join(target,'index.html'):target;
    if(!file.startsWith(moduleRoot+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}
    res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve=>server.listen(8765,'127.0.0.1',resolve));
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:390,height:844}}),errors=[],checks=[];
  await context.addInitScript(()=>{
    class MockAudio extends EventTarget{
      constructor(src){super();this.src=src;this.currentTime=0;this.paused=true;this.calls=0;window.__testAudio=this;}
      async play(){this.calls++;if(this.calls===1)throw new DOMException('mock autoplay denied','NotAllowedError');this.paused=false;this.dispatchEvent(new Event('playing'));}
      pause(){this.paused=true;}load(){}removeAttribute(){}
    }window.Audio=MockAudio;
  });
  await context.route('https://cdn.jsdelivr.net/gh/**/media/empress/*.webp',route=>route.fulfill({path:path.resolve(__dirname,'../../../media/empress',new URL(route.request().url()).pathname.split('/').at(-1)),contentType:'image/webp'}));
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:8765/demo/?empty=1');await page.waitForFunction(()=>Boolean(window.demo));
  await page.getByRole('button',{name:'播放宣言',exact:true}).click();
  const media=await page.evaluate(()=>({src:__testAudio.src,volume:__testAudio.volume}));
  assert.match(media.src,/imperial-causality-declaration-v2\.mp3$/);assert.equal(media.volume,.8);
  await page.evaluate(()=>{for(const time of [0,32.6,34.5]){__testAudio.currentTime=time;__testAudio.dispatchEvent(new Event('timeupdate'));}});
  assert.equal(await page.locator('.current-cue').textContent(),'从这一刻开始，每一个选择，都必须拥有它的代价。');
  const shots=path.join(__dirname,'rework-static');fs.mkdirSync(shots,{recursive:true});
  async function layout(width){
    await page.setViewportSize({width,height:844});
    const overflow=await page.locator('.causal-codex-host').evaluate(host=>{
      const root=host.shadowRoot;
      return [...root.querySelectorAll('.surface,.opening,.captions,.current-cue,.previous-cue,.bar h3,.meter-reading,.legend')]
        .filter(el=>el.getBoundingClientRect().width>0&&el.scrollWidth>el.clientWidth+1).map(el=>[el.className,el.scrollWidth,el.clientWidth]);
    });assert.deepEqual(overflow,[],JSON.stringify({width,overflow}));
    assert.equal(await page.locator('.causal-codex-host button:visible').evaluateAll(els=>els.filter(el=>el.getBoundingClientRect().height<44).length),0);
  }
  for(const width of [320,360,390,440]){
    await layout(width);
    await page.getByRole('button',{name:'暂停 / 继续',exact:true}).click();assert.equal(await page.evaluate(()=>__testAudio.paused),true);
    await page.getByRole('button',{name:'暂停 / 继续',exact:true}).click();assert.equal(await page.evaluate(()=>__testAudio.paused),false);
    await page.locator('.opening').screenshot({path:path.join(shots,`opening-${width}.png`)});
    checks.push(`opening ${width}px: layered background; unobscured 44px controls; no text overflow; pause/resume`);
  }
  await page.evaluate(()=>{__testAudio.currentTime=87;__testAudio.dispatchEvent(new Event('timeupdate'));});
  assert.equal(await page.locator('.current-cue').textContent(),'因果。');
  await page.evaluate(()=>{__testAudio.currentTime=145;__testAudio.dispatchEvent(new Event('timeupdate'));});
  assert.equal(await page.locator('.current-cue').textContent(),'THE CAUSAL CODEX IS OPEN');
  await page.evaluate(()=>{__testAudio.currentTime=158;__testAudio.dispatchEvent(new Event('timeupdate'));});
  assert.equal(await page.locator('.opening').isVisible(),false);assert.equal(await page.locator('.quote').isVisible(),true);
  checks.push('original cue 11/21, postlude, 158s close, source MP3, volume and quote lock preserved');
  async function readings(){return page.locator('.bar').evaluateAll(bars=>bars.map(bar=>({number:bar.querySelector('.meter-number').textContent.replace(/\s+/g,' ').trim(),phase:bar.querySelector('.meter-phase').textContent,current:bar.querySelectorAll('.cell.current').length,cells:bar.querySelectorAll('.cell').length})));}
  assert.deepEqual(await readings(),[{number:'-- / 100',phase:'待结算',current:0,cells:20},{number:'-- / 100',phase:'待结算',current:0,cells:20}]);
  assert.ok((await page.locator('.body').textContent()).includes('等待首次因果结算'));checks.push('no valid causality: two permanent --/100 readouts and 40 cells');
  const scores=[0,5,19,20,40,60,80,100],kp=['潜伏','潜伏','潜伏','裂纹','渗出','偏移','清算','极限'],cp=['萌芽','萌芽','萌芽','局部纠偏','结构松动','秩序重构','深层校正','高位稳态'];
  for(let i=0;i<scores.length;i++){
    const n=scores[i];await page.evaluate(n=>demo.advance(n,n),n);
    assert.deepEqual(await readings(),[{number:`${n} / 100`,phase:kp[i],current:Math.floor(n/5),cells:20},{number:`${n} / 100`,phase:cp[i],current:Math.floor(n/5),cells:20}]);
    checks.push(`karma/correction ${n}: exact supplied phase and ${Math.floor(n/5)}/20 current cells`);
  }
  await page.evaluate(()=>demo.advance(0,5));
  assert.deepEqual((await readings()).map(r=>r.current),[0,1]);checks.push('decreasing scores update current fill while threshold history remains recorded');
  await page.evaluate(()=>demo.advance(40,60));
  const before=await page.evaluate(()=>JSON.stringify(demo.read().chat.stat_data.$causal_codex));
  const expected=await readings();
  await page.evaluate(()=>demo.blank());assert.deepEqual(await readings(),expected);
  assert.equal(await page.evaluate(()=>JSON.stringify(demo.read().chat.stat_data.$causal_codex)),before);
  await page.evaluate(()=>demo.incomplete());assert.deepEqual(await readings(),expected);
  await page.reload();await page.waitForFunction(()=>Boolean(window.demo));assert.deepEqual(await readings(),expected);
  checks.push('missing/incomplete latest output and reload retain latest valid numbers without mechanical writes');
  await page.evaluate(()=>demo.advance(80,100));const edited=await readings();
  await page.evaluate(()=>demo.editIncomplete());assert.deepEqual(await readings(),edited);
  checks.push('incomplete streaming edit retains the last successful display in this chat');
  for(const width of [320,360,390,440]){await layout(width);await page.locator('.causal-codex-host').screenshot({path:path.join(shots,`values-${width}.png`)});checks.push(`numeric panel ${width}px: 40 cells, readable numbers/phases, no overflow`);}
  await page.evaluate(()=>demo.changeChat());assert.deepEqual((await readings()).map(r=>r.number),['-- / 100','-- / 100']);checks.push('chat switch clears the display fallback and does not leak prior values');
  await page.getByRole('button',{name:'◉ 回听宣言',exact:true}).click();await page.getByRole('button',{name:'播放宣言',exact:true}).click();
  assert.equal(await page.evaluate(()=>__testAudio.paused),false);await page.getByRole('button',{name:'跳过',exact:true}).click();
  await page.locator('.settings summary').click();await page.evaluate(()=>localStorage.removeItem('mushoku_causal_codex_opening_seen_v1'));
  await page.getByRole('button',{name:'以后只显示箴言',exact:true}).click();
  assert.equal(await page.evaluate(()=>localStorage.getItem('mushoku_causal_codex_opening_seen_v1')),'true');
  checks.push('manual replay, skip and disabling automatic opening remain functional');
  const bundle=await context.newPage();bundle.on('pageerror',error=>errors.push(error.message));await bundle.goto('http://127.0.0.1:8765/demo/?bundle=1&empty=1');await bundle.waitForFunction(()=>Boolean(window.demo));
  assert.equal(await bundle.locator('.meter-number').count(),2);assert.equal(await bundle.locator('.cell').count(),40);checks.push('rebuilt standalone dist includes the permanent readouts');
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(__dirname,'rework-results.json'),JSON.stringify({passed:checks.length,checks,errors},null,2)+'\n');
  console.log(JSON.stringify({passed:checks.length,checks},null,2));await browser.close();server.close();
})().catch(error=>{console.error(error);server?.close();process.exit(1);});
