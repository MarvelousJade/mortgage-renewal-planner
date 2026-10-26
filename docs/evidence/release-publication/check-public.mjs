// Authorized public smoke: fictional financial inputs, no accounts, no service mutations.
// Run from repository root: CHROME_BIN=/path/to/chrome node <this file> [HTTPS origin]
import { spawn, execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const target = process.argv[2] || 'https://renewalready.onrender.com';
assert.equal(new URL(target).protocol, 'https:');
const dir = new URL('./', import.meta.url);
const fixture = JSON.parse(await readFile(new URL('../render-deployment/fixture.json', dir), 'utf8'));
const baseline = JSON.parse(await readFile(new URL('../render-deployment/baseline-comparison.json', dir), 'utf8'));
const report = { date: new Date().toISOString(), target,
  releaseRevision: 'e4711bbf2d8bf117c6a9f5b4d292923aac561ab4',
  localRevision: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  node: process.version, fixture, http: [], checks: [], runtimeErrors: [] };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function until(fn, label) {
  for (let i = 0; i < 300; i++) {
    try { const v = await fn(); if (v) return v; } catch {}
    await sleep(200);
  }
  throw new Error(`Timed out: ${label}`);
}
async function get(path, options, expected = 200) {
  const r = await fetch(target + path, { ...options, signal: AbortSignal.timeout(120000) });
  const body = await r.text();
  report.http.push({ path, status: r.status, contentType: r.headers.get('content-type'), bytes: Buffer.byteLength(body),
    sha256: createHash('sha256').update(body).digest('hex'),
    ...(path.startsWith('/api/') || path === '/actuator/health' ? { body } : {}) });
  assert.equal(r.status, expected, path);
  return body;
}
function pass(name) { report.checks.push({ name, passed: true }); }
let chrome, ws, profile;
let id = 0;
const callbacks = new Map();
let apiRequests = 0;
async function cdp(method, params = {}) {
  return new Promise((resolve, reject) => {
    const key = ++id;
    const timer = setTimeout(() => { callbacks.delete(key); reject(new Error(`${method} timeout`)); }, 20000);
    callbacks.set(key, m => { clearTimeout(timer); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result); });
    ws.send(JSON.stringify({ id: key, method, params }));
  });
}
async function evaluate(expression) {
  const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
const click = (selector) => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
const fill = (value) => evaluate(`(() => { const input=document.querySelector('[formControlName="principal"]'); input.value=${JSON.stringify(String(value))}; input.dispatchEvent(new Event('input',{bubbles:true})); })()`);
const hasResults = () => evaluate('!!document.querySelector("#results")');
try {
  const html = await get('/');
  assert.match(html, /<app-root/);
  const assets = [...html.matchAll(/(?:src|href)="([^\"]+\.(?:js|css))"/g)].map(m => m[1]);
  assert(assets.length > 0);
  for (const asset of assets) await get('/' + asset.replace(/^\//, ''));
  pass('Public HTML and referenced JS/CSS return 200');
  assert.equal(JSON.parse(await get('/actuator/health')).status, 'UP');
  pass('Public API health is UP');
  const actual = JSON.parse(await get('/api/v1/mortgage-comparisons', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fixture),
  }));
  assert(actual.generatedAt); delete actual.generatedAt; delete baseline.generatedAt;
  assert.deepEqual(actual, baseline);
  pass('Public synthetic comparison matches saved baseline in every calculation field');
  await get('/api/v1/mortgage-comparisons', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...fixture, principal: 0 }) }, 400);
  pass('Invalid API principal returns 400');

  assert(process.env.CHROME_BIN, 'CHROME_BIN required');
  profile = await mkdtemp(join(tmpdir(), 'renewalready-public-'));
  chrome = spawn(process.env.CHROME_BIN, ['--headless=new', '--disable-gpu', '--no-first-run',
    '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
  const debugPort = await until(async () => (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0], 'Chrome port');
  const pages = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
  ws = new WebSocket(pages.find(p => p.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  ws.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) { callbacks.get(message.id)?.(message); callbacks.delete(message.id); }
    if (message.method === 'Runtime.exceptionThrown') report.runtimeErrors.push(message.params);
    if (message.method === 'Network.requestWillBeSent' && message.params.request.url.endsWith('/api/v1/mortgage-comparisons')) apiRequests++;
  };
  await cdp('Runtime.enable'); await cdp('Network.enable'); await cdp('Page.enable');
  report.browser = await cdp('Browser.getVersion');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await cdp('Page.navigate', { url: target });
  await until(() => evaluate('!!document.querySelector(".submit-button")'), 'live Angular bootstrap');
  report.angularVersion = await evaluate('document.querySelector("app-root").getAttribute("ng-version")');
  assert.equal(report.angularVersion, '20.3.34');
  pass('Live Angular bootstraps with patched version 20.3.34');
  await click('nav a[href="#methodology"]');
  assert.equal(await evaluate('location.hash'), '#methodology');
  pass('Live methodology navigation');
  await click('.submit-button'); await until(hasResults, 'default live comparison');
  assert.equal(await evaluate('document.querySelectorAll(".result-card").length'), 2);
  pass('Live default two-offer comparison renders');
  await fill(400000);
  await until(async () => !(await hasResults()), 'live edit invalidation');
  assert.match(await evaluate('document.querySelector("[role=status]").textContent'), /Inputs changed/);
  await click('.submit-button'); await until(hasResults, 'updated live comparison');
  assert.match(await evaluate('document.querySelector(".results-heading").textContent'), /400,000/);
  pass('Live input edit clears old results and re-comparison uses new balance');
  await click('.add-button'); await until(async () => !(await hasResults()), 'live add invalidation');
  await click('.submit-button'); await until(hasResults, 'three live offers');
  assert.equal(await evaluate('document.querySelectorAll(".result-card").length'), 3);
  await click('.remove-button'); await until(async () => !(await hasResults()), 'live remove invalidation');
  pass('Live add/compare/remove workflow');
  await fill(0);
  const before = apiRequests;
  await click('.submit-button');
  await until(() => evaluate('document.querySelector("[role=alert]")?.textContent.includes("highlighted")'), 'live validation');
  assert.equal(apiRequests, before);
  pass('Live invalid balance gives feedback without an API request');
  await fill(390000);
  await cdp('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await click('.submit-button');
  await until(() => evaluate('document.querySelector("[role=alert]")?.textContent.includes("unavailable")'), 'browser-local offline failure');
  assert.equal(await evaluate('document.querySelector("[formControlName=principal]").value'), '390000');
  await cdp('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await click('.submit-button'); await until(hasResults, 'live retry');
  pass('Browser-local offline failure preserves inputs and live retry succeeds');
  assert.deepEqual(report.runtimeErrors, []);
  pass('No uncaught live browser runtime exceptions');
  const screenshot = await cdp('Page.captureScreenshot', { format: 'png' });
  await writeFile(new URL('public-browser.png', dir), Buffer.from(screenshot.data, 'base64'));
  report.apiRequestsObservedInBrowser = apiRequests;
  report.passed = true;
} catch (error) {
  report.passed = false; report.error = String(error.stack || error); process.exitCode = 1;
} finally {
  ws?.close(); chrome?.kill();
  await sleep(500);
  if (profile) await rm(profile, { recursive: true, force: true }).catch(() => {});
  report.limits = ['Programmatic desktop Chrome checks, not human usability/accessibility testing.',
    'Offline failure is simulated only in the private browser; the shared service is not modified.',
    'Saved-baseline equality is one synthetic fixture, not independent finance validation or a benchmark.'];
  await writeFile(new URL('public-smoke.json', dir), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks, error: report.error }, null, 2));
}
