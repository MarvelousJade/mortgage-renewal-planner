// Run from repository root after the documented checks; preserves older raw artifacts.
import { execFileSync, spawnSync } from 'node:child_process';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import os from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
const dir = 'docs/evidence/dependency-remediation';
const baseline = 'ce9922763410fb8d7b5801f4ad38ad39e795f659';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const json = async (p) => JSON.parse(await readFile(p, 'utf8'));
const before = await json(`${dir}/audit-before.json`);
const after = await json(`${dir}/audit-after.json`);
const prodBefore = await json(`${dir}/audit-production-before.json`);
const prodAfter = await json(`${dir}/audit-production-after.json`);
const oldLock = JSON.parse(git('show', `${baseline}:frontend/package-lock.json`));
const newLock = await json('frontend/package-lock.json');
const tree = await json(`${dir}/tree-before.json`);
const paths = {};
function walk(node, chain = []) {
  for (const [name, child] of Object.entries(node.dependencies || {})) {
    const next = [...chain, `${name}@${child.version}`];
    if (before.vulnerabilities[name]) (paths[name] ??= []).push(next.join(' > '));
    walk(child, next);
  }
}
walk(tree);
function installed(lock, name) {
  return Object.entries(lock.packages).filter(([path]) => path.endsWith(`node_modules/${name}`))
    .map(([path, value]) => ({ path, version: value.version }));
}
const packages = Object.entries(before.vulnerabilities).map(([name, finding]) => ({
  name, severity: finding.severity, direct: finding.isDirect,
  baselineInstances: installed(oldLock, name), patchedInstances: installed(newLock, name),
  baselineDependencyPaths: paths[name] ?? [], inheritedFrom: finding.via.filter(v => typeof v === 'string'),
  advisories: finding.via.filter(v => typeof v === 'object').map(v => ({ url: v.url, title: v.title, affectedRange: v.range })),
}));
await writeFile(`${dir}/package-remediation.json`, JSON.stringify(packages, null, 2) + '\n');
const lockChanges = [];
for (const path of new Set([...Object.keys(oldLock.packages), ...Object.keys(newLock.packages)])) {
  const from = oldLock.packages[path]?.version;
  const to = newLock.packages[path]?.version;
  if (from !== to) lockChanges.push({ path, from: from ?? null, to: to ?? null });
}
await writeFile(`${dir}/lock-version-changes.json`, JSON.stringify(lockChanges, null, 2) + '\n');
const cleanText = async (file) => (await readFile(`${dir}/${file}`, 'utf8')).replace(/\x1b\[[0-9;]*[A-Za-z]/g, '');
const testLog = await cleanText('tests-after.txt');
assert.match(testLog, /TOTAL: 28 SUCCESS/);
assert.match(await cleanText('xsrf-before-with-origin.txt'), /TOTAL: 4 FAILED, 24 SUCCESS/);
assert.match(await cleanText('backend-verify.txt'), /Tests run: 4, Failures: 0, Errors: 0, Skipped: 0/);
assert.equal(after.metadata.vulnerabilities.total, 0);
assert.equal(prodAfter.metadata.vulnerabilities.total, 0);
assert.deepEqual(after.vulnerabilities, {});
const smoke = await json(`${dir}/browser-smoke.json`);
assert.equal(smoke.passed, true);
assert.equal(smoke.checks.length, 11);
assert(smoke.checks.every(c => c.passed));
const hash = async (path) => createHash('sha256').update(await readFile(path)).digest('hex');
const sourcePaths = ['frontend/package.json', 'frontend/package-lock.json', 'frontend/src/app/app.ts',
  'frontend/src/app/app.html', 'frontend/src/app/http-xsrf.spec.ts', '.github/workflows/ci.yml', 'Jenkinsfile'];
const sources = {};
for (const path of sourcePaths) sources[path] = await hash(path);
const artifacts = {};
for (const entry of await readdir(dir, { withFileTypes: true })) {
  if (entry.isFile() && entry.name !== 'verification.json') artifacts[entry.name] = await hash(join(dir, entry.name));
}
const java = process.env.JAVA_HOME ? spawnSync(join(process.env.JAVA_HOME, 'bin/java'), ['-version'], { encoding: 'utf8' }).stderr : 'not provided';
const report = {
  recordedAt: new Date().toISOString(), baselineRevision: baseline, measuredRevision: git('rev-parse', 'HEAD'),
  workingTree: git('status', '--short'), sources, artifacts,
  environment: { platform: os.platform(), release: os.release(), cpu: os.cpus()[0].model,
    logicalCpus: os.cpus().length, ramBytes: os.totalmem(), node: process.version,
    npm: spawnSync('npm', ['--version'], { encoding: 'utf8', shell: true }).stdout.trim(), java,
    browser: smoke.browser,
  },
  results: {
    fullAudit: { before: before.metadata.vulnerabilities, after: after.metadata.vulnerabilities },
    productionAudit: { before: prodBefore.metadata.vulnerabilities, after: prodAfter.metadata.vulnerabilities },
    same28Cases: { before: { passed: 24, failed: 4 }, after: { passed: 28, failed: 0 } },
    backend: { passed: 4, failed: 0, errors: 0, skipped: 0 },
    smoke: { passed: smoke.checks.length, failed: 0 },
    build: 'passed (build-after.txt)', dependencyTree: 'npm ls exited 0 (tree-after.json)',
  },
  limits: ['Known npm registry findings, not a proof of universal security or production exploitability.',
    'One run per final condition; synthetic transport/XSRF fixtures; no financial or performance claim.',
    'No Maven/container vulnerability scan, Linux build, remote CI execution or new Render deployment.',
    'Clean npm ci succeeded under local npm 12 lifecycle approval policy; retained warnings disclose blocked install scripts.'],
};
await writeFile(`${dir}/verification.json`, JSON.stringify(report, null, 2) + '\n');
for (const p of packages) {
  const versions = (instances) => [...new Set(instances.map(i => i.version))].join(', ');
  console.log(`| ${p.name} | ${p.severity} | ${versions(p.baselineInstances)} | ${versions(p.patchedInstances)} |`);
}
