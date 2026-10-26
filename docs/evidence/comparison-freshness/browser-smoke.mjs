// Run from repository root after ./mvnw verify and npm run build.
// Uses a private local Java process and Chrome profile; never contacts Render.
import { spawn, spawnSync, execFileSync } from 'node:child_process';
import { createServer, request as httpRequest } from 'node:http';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join, extname } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const dir = process.env.EVIDENCE_DIR || 'docs/evidence/comparison-freshness';
const chromePath = process.env.CHROME_BIN;
assert(chromePath && process.env.JAVA_HOME, 'Set CHROME_BIN and JAVA_HOME');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(fn, description) {
  for (let n = 0; n < 200; n++) {
    try { const result = await fn(); if (result) return result; } catch {}
    await sleep(100);
  }
  throw new Error(`Timed out: ${description}`);
}
const report = {
  date: new Date().toISOString(),
  revision: execFileSync('git', ['rev-parse', 'HEAD']).toString().trim(),
  sourceHashes: {},
  java: spawnSync(join(process.env.JAVA_HOME, 'bin/java'), ['-version'], { encoding: 'utf8' }).stderr,
  node: process.version,
  checks: [],
  warnings: ['Programmatic browser interaction, not human usability testing; delayed/error responses are local proxy fixtures.'],
};
for (const path of ['frontend/src/app/app.ts', 'frontend/src/app/app.html']) {
  report.sourceHashes[path] = createHash('sha256').update(await readFile(path)).digest('hex');
}
const profile = await mkdtemp(join(tmpdir(), 'freshness-chrome-'));
let java, chrome, server, ws;
let backendOutput = '';
let mode = 'normal';
let pending = 0;
let requests = 0;
let id = 0;
const callbacks = new Map();
const browserErrors = [];
async function cdp(method, params = {}) {
  return new Promise((resolve, reject) => {
    const key = ++id;
    const timer = setTimeout(() => { callbacks.delete(key); reject(new Error(method + ' timeout')); }, 20000);
    callbacks.set(key, (message) => {
      clearTimeout(timer);
      message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result);
    });
    ws.send(JSON.stringify({ id: key, method, params }));
  });
}
async function evaluate(expression) {
  const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
const click = (selector) => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
const fill = (selector, value) => evaluate(`(() => {
  const input = document.querySelector(${JSON.stringify(selector)});
  input.value = ${JSON.stringify(String(value))}; input.dispatchEvent(new Event('input', {bubbles:true}));
})()`);
const hasResults = () => evaluate('!!document.querySelector("#results")');
function pass(name) { report.checks.push({ name, passed: true }); }

try {
  // Reserve a free local port without assuming another agent's 8080 is free.
  const reservation = createServer();
  await new Promise((r) => reservation.listen(0, '127.0.0.1', r));
  const backendPort = reservation.address().port;
  await new Promise((r) => reservation.close(r));
  java = spawn(join(process.env.JAVA_HOME, 'bin/java'), [
    '-jar', 'backend/target/backend-0.0.1-SNAPSHOT.jar', `--server.port=${backendPort}`,
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  java.stdout.on('data', (b) => backendOutput += b);
  java.stderr.on('data', (b) => backendOutput += b);
  await until(async () => (await fetch(`http://127.0.0.1:${backendPort}/actuator/health`)).ok, 'private API health');
  pass('Java API installation and launch');

  server = createServer(async (req, res) => {
    if (req.url.startsWith('/api/')) {
      requests++;
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = Buffer.concat(chunks);
      const requestMode = mode;
      if (requestMode === 'delay') { pending++; await sleep(900); pending--; }
      if (requestMode === 'error') {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Local smoke fixture: service unavailable' }));
        return;
      }
      const proxy = httpRequest({ hostname: '127.0.0.1', port: backendPort, path: req.url, method: req.method,
        headers: { 'Content-Type': 'application/json', 'Content-Length': body.length } }, (upstream) => {
        res.writeHead(upstream.statusCode, upstream.headers); upstream.pipe(res);
      });
      proxy.on('error', () => { res.writeHead(502); res.end(); });
      proxy.end(body);
      return;
    }
    const path = resolve('frontend/dist/frontend/browser', req.url === '/' ? 'index.html' : '.' + req.url);
    const root = resolve('frontend/dist/frontend/browser');
    if (!path.startsWith(root + '/') && !path.startsWith(root + '\\')) { res.writeHead(403); res.end(); return; }
    try {
      const bytes = await readFile(path);
      res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' })[extname(path)] ?? 'application/octet-stream');
      res.end(bytes);
    } catch { res.writeHead(404); res.end(); }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${server.address().port}`;
  chrome = spawn(chromePath, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
  const debugPort = await until(async () => (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0], 'Chrome debugging port');
  const pages = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
  ws = new WebSocket(pages.find((p) => p.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, reject) => { ws.onopen = r; ws.onerror = reject; });
  ws.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) { callbacks.get(message.id)?.(message); callbacks.delete(message.id); }
    if (message.method === 'Runtime.exceptionThrown') browserErrors.push(message.params);
  };
  await cdp('Runtime.enable');
  report.browser = await cdp('Browser.getVersion');
  await cdp('Page.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await cdp('Page.navigate', { url });
  await until(() => evaluate('!!document.querySelector(".submit-button")'), 'Angular bootstrap');
  pass('Production Angular assets load and bootstrap');
  await click('nav a[href="#methodology"]');
  assert.equal(await evaluate('location.hash'), '#methodology');
  pass('Methodology anchor navigation');

  await click('.submit-button');
  await until(hasResults, 'initial real API comparison');
  assert.equal(await evaluate('document.querySelectorAll(".result-card").length'), 2);
  pass('Default two-offer comparison through real Java API');
  await fill('[formControlName="principal"]', 400000);
  await until(async () => !(await hasResults()), 'immediate invalidation');
  assert.match(await evaluate('document.querySelector("[role=status]").textContent'), /Inputs changed/);
  pass('Completed results disappear on actual input event');

  mode = 'delay';
  await click('.submit-button');
  await until(() => pending === 1, 'proxy holds response');
  await fill('[formControlName="principal"]', 390000);
  await until(() => evaluate('!document.querySelector(".submit-button").disabled'), 'cancel releases loading');
  await sleep(1300);
  assert.equal(await hasResults(), false);
  pass('Delayed real API response cannot restore stale results after edit');

  mode = 'normal';
  await click('.submit-button');
  await until(hasResults, 'new input comparison');
  assert.match(await evaluate('document.querySelector(".results-heading").textContent'), /390,000/);
  pass('Re-comparison uses changed principal');

  await click('.add-button');
  await until(async () => !(await hasResults()), 'add invalidates');
  assert.equal(await evaluate('document.querySelectorAll(".offer-card").length'), 3);
  await click('.submit-button');
  await until(hasResults, 'three offers');
  assert.equal(await evaluate('document.querySelectorAll(".result-card").length'), 3);
  await click('.remove-button');
  await until(async () => !(await hasResults()), 'remove invalidates');
  pass('Repeated add/compare/remove workflows');

  mode = 'error';
  await click('.submit-button');
  await until(() => evaluate('!!document.querySelector("[role=alert]")'), 'error message');
  assert.match(await evaluate('document.querySelector("[role=alert]").textContent'), /Local smoke fixture/);
  assert.equal(await evaluate('document.querySelector("[formControlName=principal]").value'), '390000');
  mode = 'normal';
  await click('.submit-button');
  await until(hasResults, 'retry');
  pass('Injected local 503 preserves inputs and retry succeeds');

  const screenshot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(join(dir, 'browser-results.png'), Buffer.from(screenshot.data, 'base64'));
  await fill('[formControlName="principal"]', 0);
  const before = requests;
  await click('.submit-button');
  await until(() => evaluate('document.querySelector("[role=alert]")?.textContent.includes("highlighted")'), 'invalid input feedback');
  assert.equal(requests, before);
  assert.equal(await hasResults(), false);
  pass('Invalid balance displays feedback and sends no API request');
  assert.deepEqual(browserErrors, []);
  pass('No uncaught browser runtime exceptions');
  report.passed = true;
} catch (error) {
  report.passed = false;
  report.error = String(error.stack || error);
  process.exitCode = 1;
} finally {
  report.browserErrors = browserErrors;
  await writeFile(join(dir, 'browser-smoke.json'), JSON.stringify(report, null, 2) + '\n');
  await writeFile(join(dir, 'browser-backend.txt'), backendOutput);
  ws?.close();
  chrome?.kill();
  java?.kill();
  server?.closeAllConnections();
  server?.close();
  await sleep(500);
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}
console.log(JSON.stringify(report, null, 2));
