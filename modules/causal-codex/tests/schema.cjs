// npm install --prefix /tmp/schema-check zod@4
// ZOD_MODULE=/tmp/schema-check/node_modules/zod node tests/schema.cjs
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const z=require(process.env.ZOD_MODULE || 'zod');let registered;
const file=path.join(__dirname,'../src/schema.js');
let script=fs.readFileSync(file,'utf8').replace(/^import .*\n/m,'').replace(/^export /gm,'');
const context={z,registerMvuSchema:value=>{registered=value},$:callback=>callback()};
vm.runInNewContext(script,context);
const first=registered.parse({existing:{coin:7}}),second=registered.parse(first);
assert.equal(JSON.stringify(first),JSON.stringify(second));assert.equal(first.existing.coin,7);
assert.deepEqual(Object.keys(first._causal_codex._death_seen),[]);
assert.equal(registered.parse({_causal_codex:{_revive_count:-8}})._causal_codex._revive_count,0);
console.log('PASS Zod 4: registrar, prefault, idempotency, host passthrough, clamp');
