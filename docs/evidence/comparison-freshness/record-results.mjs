// Run from repository root after verification; fingerprints evidence, not a benchmark.
import { execFileSync, spawnSync } from 'node:child_process';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import os from 'node:os';
import { join } from 'node:path';
const dir = 'docs/evidence/comparison-freshness';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const hash = async (path) => createHash('sha256').update(await readFile(path)).digest('hex');
const sourcePaths = ['frontend/src/app/app.ts', 'frontend/src/app/app.html',
  'frontend/src/app/comparison-freshness.spec.ts', 'frontend/package-lock.json', 'backend/pom.xml'];
const sources = {};
for (const path of sourcePaths) sources[path] = await hash(path);
const artifacts = {};
for (const entry of (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
  if (entry.isFile() && entry.name !== 'final-manifest.json') {
    artifacts[entry.name] = await hash(join(dir, entry.name));
  }
}
const versions = {};
for (const name of ['@angular/core', '@angular/cli', 'rxjs', 'typescript', 'karma']) {
  versions[name] = JSON.parse(await readFile(`frontend/node_modules/${name}/package.json`, 'utf8')).version;
}
const audit = JSON.parse(await readFile(join(dir, 'dependency-audit.json'), 'utf8'));
const report = {
  recordedAt: new Date().toISOString(),
  measuredRevision: git('rev-parse', 'HEAD'),
  baselineRevision: 'dfcd22ce6fd4e9433c58a2ae6c89110ee5b535ed',
  repairRevision: git('rev-parse', '85d66a9'),
  isolatedFaultRevision: git('rev-parse', 'e7f279a'),
  isolatedRepairRevision: git('rev-parse', '3c690af'),
  workingTree: git('status', '--short'),
  environment: { platform: os.platform(), release: os.release(), cpu: os.cpus()[0].model,
    logicalCpus: os.cpus().length, ramBytes: os.totalmem(), node: process.version,
    npm: execFileSync('npm', ['--version'], { encoding: 'utf8', shell: true }).trim(), versions,
    java: process.env.JAVA_HOME ? spawnSync(join(process.env.JAVA_HOME, 'bin/java'), ['-version'], { encoding: 'utf8' }).stderr : 'not provided',
  },
  results: {
    originalSuite: { passed: 3, failed: 0, skipped: 0 },
    sameExpandedSuiteBefore: { passed: 4, failed: 16, skipped: 0 },
    sameExpandedSuiteAfter: { passed: 20, failed: 0, skipped: 0 },
    isolatedFaultWithExtraRegression: { passed: 19, failed: 2, skipped: 0 },
    isolatedRepairedWithExtraRegression: { passed: 21, failed: 0, skipped: 0 },
    deliveredSuite: { passed: 21, failed: 0, skipped: 0 },
    backend: { passed: 4, failed: 0, errors: 0, skipped: 0 },
    dependencyAudit: audit.metadata.vulnerabilities,
  },
  conditions: 'Local synthetic correctness cases, one run per recorded condition; not timing, financial validation, adoption or business impact. Counts are transcribed from retained raw logs. See engineering document for exact procedures and scope.',
  sources, artifacts,
};
await writeFile(join(dir, 'final-manifest.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
