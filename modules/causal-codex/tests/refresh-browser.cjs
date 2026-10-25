const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
let browser,server;
(async()=>{
 const root=path.resolve(__dirname,'..'),checks=[],errors=[];
 server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+req.url.split('?')[0]);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':'text/html');fs.createReadStream(file).pipe(res);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const bundle of [false,true])for(const asyncApi of [false,true]){
  const context=await browser.newContext({viewport:{width:390,height:844}});
  await context.route('https://**/*',r=>r.abort());
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  async function wait(fn,arg){for(let i=0;i<200;i++){if(await page.evaluate(fn,arg))return;await new Promise(r=>setTimeout(r,10));}throw Error('Condition timed out: '+fn+' errors='+errors);}
  await page.clock.install();await page.clock.pauseAt(new Date());
  await page.goto(`http://127.0.0.1:${server.address().port}/tests/refresh-fixture.html?${bundle?'bundle=1&':''}${asyncApi?'async=1':''}`);
  await wait(()=>window.fixture&&window.CausalCodex);
  const prefix=`${bundle?'dist':'src'}/${asyncApi?'Promise':'sync'}`;
  const value=()=>page.locator('.meter-number').first().textContent().then(s=>Number(s.match(/\d+/)[0]));
  async function expect(n){await wait(n=>Number(document.querySelector('.causal-codex-host')?.shadowRoot.querySelector('.meter-number')?.textContent.match(/\d+/)?.[0])===n,n);assert.equal(await value(),n);}
  for(const shape of ['message','missing-role','mes']){
   const n=shape==='message'?5:shape==='missing-role'?10:15;
   await page.evaluate(({shape,n})=>{const row=shape==='message'?{role:'assistant',message:fixture.raw(n)}:shape==='missing-role'?{is_user:false,mes:fixture.raw(n)}:{is_user:false,role:'assistant',mes:fixture.raw(n)};fixture.add(row);fixture.emit('MESSAGE_UPDATED');},{shape,n});
   await expect(n);checks.push(`${prefix}: ${shape} immediate event PASS`);
  }
  // Register the writer first: both timers expire at 120ms, as in a delayed host commit.
  await page.evaluate(()=>{setTimeout(()=>{fixture.rows.at(-1).mes=fixture.raw(19);},120);fixture.emit('MESSAGE_UPDATED');});
  await page.clock.runFor(119);assert.equal(await value(),15);
  await page.clock.runFor(1);await expect(19);checks.push(`${prefix}: 120ms second read PASS`);
  await page.evaluate(()=>fixture.add({is_user:false,mes:fixture.raw(20)}));
  await page.clock.runFor(1000);await expect(20);checks.push(`${prefix}: event-free 1000ms polling PASS`);
  await page.evaluate(()=>fixture.add({is_user:false,mes:'<causality>streaming'}));
  await page.clock.runFor(1000);assert.equal(await value(),20);
  await page.evaluate(()=>{fixture.rows.at(-1).mes=fixture.raw(25);});
  await page.clock.runFor(1000);await expect(25);checks.push(`${prefix}: same-id streaming 20 -> incomplete -> 25 PASS`);
  const before=await page.evaluate(()=>({state:fixture.state(),rolls:fixture.counters.rolls,writes:fixture.counters.writes}));
  assert.ok(before.rolls>0,'must actually exercise a death draw');
  await page.clock.runFor(10000);
  assert.deepEqual(await page.evaluate(()=>({state:fixture.state(),rolls:fixture.counters.rolls,writes:fixture.counters.writes})),before);
  checks.push(`${prefix}: ten polls preserve thresholds/death_seen/revive and draw count PASS`);
  // Settle an actual locked ticket and exercise the existing revive button, then poll ten times.
  await page.evaluate(()=>{const s=fixture.state();fixture.add({is_user:false,mes:fixture.raw(25,'死亡',s.pending.name)});fixture.emit('CHARACTER_MESSAGE_RENDERED');});
  await wait(()=>fixture.state().pending===null);
  await page.locator('[data-action="revive"]').click();
  await wait(()=>fixture.state().reviveCount===1);
  const revived=await page.evaluate(()=>({state:fixture.state(),rolls:fixture.counters.rolls,writes:fixture.counters.writes}));
  await page.clock.runFor(10000);
  assert.deepEqual(await page.evaluate(()=>({state:fixture.state(),rolls:fixture.counters.rolls,writes:fixture.counters.writes})),revived);
  checks.push(`${prefix}: revived same-id ten polls remain reviveCount=1 PASS`);
  for(const width of [320,360,390,440]){
   await page.setViewportSize({width,height:844});
   await page.evaluate(()=>{window.originalHost=document.querySelector('.causal-codex-host');fixture.add({is_user:false,mes:fixture.raw(30)});fixture.emit('MESSAGE_UPDATED');});
   await expect(30);
   await page.evaluate(()=>{document.querySelector('#chat > .mes:last-child .mes_text').innerHTML='redrawn';const duplicate=document.createElement('div');duplicate.className='causal-codex-host';document.querySelector('#chat > .mes:first-child .mes_text').append(duplicate);});
   await page.clock.runFor(1000);
   assert.deepEqual(await page.evaluate(()=>({count:document.querySelectorAll('.causal-codex-host').length,same:document.querySelector('.causal-codex-host')===originalHost,latest:document.querySelector('#chat > .mes:last-child .mes_text > .causal-codex-host')===originalHost,overflow:document.documentElement.scrollWidth>innerWidth})),{count:1,same:true,latest:true,overflow:false});
   checks.push(`${prefix}: ${width}px single original host moves and recovers redraw PASS`);
  }
  for(const event of ['CHARACTER_MESSAGE_RENDERED','MESSAGE_UPDATED','MESSAGE_SWIPED','MESSAGE_DELETED','mag_variable_initialized','mag_variable_update_ended','mag_before_message_update','GENERATION_ENDED']){
   const readsBefore=await page.evaluate(()=>fixture.counters.reads);
   await page.evaluate(event=>fixture.emit(event),event);
   await wait(n=>fixture.counters.reads>n,readsBefore);
   const immediateReads=await page.evaluate(()=>fixture.counters.reads);
   await page.clock.runFor(120);await wait(n=>fixture.counters.reads>n,immediateReads);
  }
  checks.push(`${prefix}: all available message/MVU/completion events immediate + delayed PASS`);
  await page.evaluate(()=>{fixture.rows.push({is_user:true,role:'assistant',mes:fixture.raw(90)});fixture.emit('MESSAGE_UPDATED');});
  await page.clock.runFor(120);assert.equal(await value(),30);
  checks.push(`${prefix}: is_user=true excluded even with assistant role PASS`);
  // Hide/remove chat: polling must not read. Dispose must cancel interval and delayed refresh.
  await page.evaluate(()=>{window.chatNode=document.querySelector('#chat');chatNode.remove();});
  const reads=await page.evaluate(()=>fixture.counters.reads);await page.clock.runFor(1000);assert.equal(await page.evaluate(()=>fixture.counters.reads),reads);
  await page.evaluate(()=>{document.body.append(chatNode);Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});});
  await page.clock.runFor(1000);assert.equal(await page.evaluate(()=>fixture.counters.reads),reads);
  await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});fixture.emit('MESSAGE_UPDATED');});
  await page.evaluate(()=>CausalCodex.dispose());
  const disposedReads=await page.evaluate(()=>fixture.counters.reads);await page.clock.runFor(2000);
  assert.equal(await page.evaluate(()=>fixture.counters.reads),disposedReads);assert.equal(await page.locator('.causal-codex-host').count(),0);
  checks.push(`${prefix}: absent chat/hidden page/dispose guards PASS`);
  await context.close();
 }
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(__dirname,'refresh-results.json'),JSON.stringify({passed:checks.length,checks,errors},null,2)+'\n');
 console.log(JSON.stringify({passed:checks.length,checks},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.close();});
