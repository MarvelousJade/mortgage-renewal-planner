import fs from 'node:fs';
import assert from 'node:assert/strict';
import os from 'node:os';
const dir = new URL('./', import.meta.url);
const target = process.argv[2] || 'http://127.0.0.1:8081';
const label = process.argv[3] || 'local';
const fixture = {principal:425000,remainingAmortizationMonths:264,offers:[{name:'Current lender',annualInterestRate:4.79,termMonths:60,paymentFrequency:'MONTHLY',lumpSumPayment:0,additionalPaymentPerPeriod:0}]};
fs.writeFileSync(new URL('fixture.json',dir),JSON.stringify(fixture,null,2)+'\n');
const output = {target, date:new Date().toISOString(),environment:{node:process.version,os:os.type(),release:os.release(),cpu:os.cpus()[0].model,ramBytes:os.totalmem()},checks:[]};
async function get(path,options){const r=await fetch(target+path,{...options,signal:AbortSignal.timeout(120000)});const body=await r.text();output.checks.push({path,status:r.status,body});assert.equal(r.status,200);return body;}
try {
const html=await get('/');assert.match(html,/<app-root/);
const assets=[...html.matchAll(/(?:src|href)="([^\"]+\.(?:js|css))"/g)].map(m=>m[1]);assert.ok(assets.length>0);
for(const asset of assets) await get('/'+asset.replace(/^\//,''));
assert.equal(JSON.parse(await get('/actuator/health')).status,'UP');
const actual=JSON.parse(await get('/api/v1/mortgage-comparisons',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(fixture)}));
const baselinePath=new URL('baseline-comparison.json',dir);
const baseline=JSON.parse(fs.readFileSync(baselinePath,'utf8'));
// Response timestamps vary; every calculation field must remain identical.
assert.ok(actual.generatedAt); delete actual.generatedAt; delete baseline.generatedAt;
assert.deepEqual(actual,baseline);
output.passed=true;
} catch(e){output.passed=false;output.error=String(e);process.exitCode=1;} finally {
// Save full HTTP bodies separately; do not turn these smoke checks into latency claims.
fs.writeFileSync(new URL(label+'-smoke.json',dir),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({target,passed:output.passed,error:output.error}));
}
