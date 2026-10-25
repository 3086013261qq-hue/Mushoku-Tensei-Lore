// Run with PLAYWRIGHT_MODULE pointing to an installed Playwright package if needed.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const output=path.join(__dirname,'browser-results.json');
let server;
(async()=>{
  server=require('node:http').createServer((req,res)=>{
    const target=path.resolve(__dirname,'..','.'+decodeURIComponent(req.url.split('?')[0]));
    const file=fs.existsSync(target) && fs.statSync(target).isDirectory()?path.join(target,'index.html'):target;
    if(!file.startsWith(path.resolve(__dirname,'..')+path.sep) || !fs.existsSync(file)){res.writeHead(404);res.end();return;}
    res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve=>server.listen(8765,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const checks=[],errors=[];
  const context=await browser.newContext({viewport:{width:390,height:844}});
  // Deterministic media adapter: initial autoplay rejection, real click retry succeeds.
  await context.addInitScript(()=>{
    class MockAudio extends EventTarget{
      constructor(src){super();this.src=src;this.currentTime=0;this.paused=true;this.calls=0;window.__testAudio=this;}
      async play(){this.calls++;if(this.calls===1)throw new DOMException('mock autoplay denied','NotAllowedError');this.paused=false;this.dispatchEvent(new Event('playing'));}
      pause(){this.paused=true;}load(){}removeAttribute(){}
    }
    window.Audio=MockAudio;
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  // Use local copies of the exact frozen WebPs for deterministic layout checks.
  await page.route('https://cdn.jsdelivr.net/gh/**/media/empress/*.webp',route=>{
    const filename=new URL(route.request().url()).pathname.split('/').at(-1);
    return route.fulfill({path:path.resolve(__dirname,'../../../media/empress',filename),contentType:'image/webp'});
  });
  await page.goto('http://127.0.0.1:8765/demo/');await page.waitForFunction(()=>Boolean(window.demo));
  assert.equal(await page.locator('.causal-codex-host').count(),1);
  await page.getByRole('button',{name:'播放宣言',exact:true}).waitFor({state:'visible'});
  checks.push('autoplay rejection exposes gesture button');
  await page.getByRole('button',{name:'播放宣言',exact:true}).click();
  await page.evaluate(()=>{window.__testAudio.currentTime=87;window.__testAudio.dispatchEvent(new Event('timeupdate'));});
  assert.equal(await page.locator('.current-cue').textContent(),'因果。');
  await page.evaluate(()=>{window.__testAudio.currentTime=145;window.__testAudio.dispatchEvent(new Event('timeupdate'));});
  assert.equal(await page.locator('.current-cue').textContent(),'THE CAUSAL CODEX IS OPEN');
  await page.evaluate(()=>{window.__testAudio.currentTime=158;window.__testAudio.dispatchEvent(new Event('timeupdate'));});
  assert.equal(await page.evaluate(()=>localStorage.getItem('mushoku_causal_codex_opening_seen_v1')),'true');
  checks.push('subtitle cue 21, postlude, 158s closing and persistent seen');
  assert.equal(await page.locator('.cells .cell').count(),40);
  for(const width of [320,360,390,440]){
    await page.setViewportSize({width,height:844});
    const dimensions=await page.locator('.surface').evaluate(el=>({scroll:el.scrollWidth,width:el.clientWidth}));
    assert.ok(dimensions.scroll<=dimensions.width+1,JSON.stringify({width,dimensions}));
    const clipped=await page.locator('.causal-codex-host').evaluate(host=>[...host.shadowRoot.querySelectorAll('.bar h3,.legend,.qtext,.feedback')].filter(el=>el.scrollWidth>el.clientWidth+1).map(el=>[el.className,el.scrollWidth,el.clientWidth]));
    assert.deepEqual(clipped,[],JSON.stringify({width,clipped}));
    const small=await page.locator('.causal-codex-host button:visible').evaluateAll(els=>els.filter(el=>el.getBoundingClientRect().height<44).length);
    assert.equal(small,0);checks.push(`width ${width}: no overflow; visible touch targets >=44px`);
  }
  await page.getByRole('button',{name:'下一回合 · 跨多阈值'}).click();
  await page.waitForFunction(()=>Object.keys(window.demo.read().chat.stat_data.$causal_codex.seen).length===1);
  const first=await page.evaluate(()=>demo.read().chat.stat_data.$causal_codex.pending.id);
  await page.getByRole('button',{name:'将锁定死法提示填入输入框'}).click();
  assert.match(await page.locator('#send_textarea').inputValue(),/死亡签机械提示/);
  checks.push('threshold draw and real input event bridge');
  await page.evaluate(()=>demo.plugin.refresh());
  assert.equal(await page.evaluate(()=>demo.read().chat.stat_data.$causal_codex.pending.id),first);
  await page.reload();await page.waitForFunction(()=>Boolean(window.demo));
  assert.equal(await page.locator('.opening').isVisible(),false);
  assert.equal(await page.evaluate(()=>demo.read().chat.stat_data.$causal_codex.pending.id),first);
  checks.push('refresh retains selected death and does not replay first declaration');
  await page.getByRole('button',{name:/百死图鉴/}).click();
  assert.ok(await page.locator('.entry.unknown b').evaluateAll(es=>es.every(e=>e.textContent==='未记录')));
  await page.getByRole('button',{name:'帝皇',exact:false}).all();
  checks.push('codex undiscovered cells do not reveal names');
  await page.getByRole('button',{name:'正文确认死亡'}).click();
  await page.getByRole('button',{name:'♻ 起来，账还没清。',exact:true}).waitFor({state:'visible'});
  assert.equal(await page.getByRole('button',{name:'♻ 起来，账还没清。',exact:true}).isEnabled(),true);
  const before=await page.evaluate(()=>demo.read().chat.stat_data.$causal_codex);
  await page.getByRole('button',{name:'♻ 起来，账还没清。',exact:true}).click();
  await page.waitForFunction(()=>demo.read().chat.stat_data.$causal_codex.reviveCount===1);
  const after=await page.evaluate(()=>demo.read().chat.stat_data.$causal_codex);
  assert.deepEqual(after.seen,before.seen);assert.deepEqual(after.marks,before.marks);assert.deepEqual(after.cursor,before.cursor);
  assert.match(await page.locator('.legend').first().textContent(),/已复活/);
  await page.evaluate(()=>demo.tamper());
  assert.equal(await page.evaluate(()=>demo.read()['m'+demo.read().chat.stat_data.$causal_codex.revivePending.turn]?.stat_data._causal_codex._revive_count),1);
  checks.push('settlement, revive preservation, model mechanical-write guard');
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.locator('.seal').evaluate(el=>getComputedStyle(el).animationName),'none');
  checks.push('reduced-motion disables animations');
  await page.setViewportSize({width:390,height:844});
  await page.locator('.causal-codex-host').screenshot({path:path.join(__dirname,'preview-390.png')});
  assert.deepEqual(errors,[]);
  // A second, clean device: media error must leave the codex operational.
  const failContext=await browser.newContext({viewport:{width:320,height:800}});
  await failContext.addInitScript(()=>{
    class FailedAudio extends EventTarget{constructor(){super();this.paused=true;setTimeout(()=>this.dispatchEvent(new Event('error')),20);}play(){return new Promise(()=>{});}pause(){}load(){}removeAttribute(){}}
    window.Audio=FailedAudio;
  });
  const failure=await failContext.newPage();await failure.route('https://cdn.jsdelivr.net/**',route=>route.abort());
  await failure.goto('http://127.0.0.1:8765/demo/');await failure.waitForFunction(()=>Boolean(window.demo));
  await failure.getByRole('button',{name:'进入法典',exact:true}).waitFor({state:'visible'});
  assert.equal(await failure.locator('.body').isVisible(),true);
  assert.equal(await failure.evaluate(()=>localStorage.getItem('mushoku_causal_codex_opening_seen_v1')),null);
  await failure.getByRole('button',{name:'进入法典',exact:true}).click();
  checks.push('CDN/audio failure leaves codex accessible and does not mark seen');
  const bundlePage=await context.newPage();bundlePage.on('pageerror',e=>errors.push(e.message));
  await bundlePage.goto('http://127.0.0.1:8765/demo/?bundle=1');
  await bundlePage.waitForFunction(()=>Boolean(window.demo));
  assert.equal(await bundlePage.locator('.causal-codex-host').count(),1);
  assert.equal(await bundlePage.locator('.cell').count(),40);
  assert.deepEqual(errors,[]);
  checks.push('distributed standalone bundle initializes against mocked Tavern Helper APIs');
  fs.writeFileSync(output,JSON.stringify({passed:checks.length,checks,errors},null,2)+'\n');
  console.log(JSON.stringify({passed:checks.length,checks},null,2));await browser.close();server.close();
})().catch(error=>{console.error(error);server?.close();process.exit(1);});
