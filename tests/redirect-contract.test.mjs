import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const redirectFile = resolve(repoRoot, 'public/_redirects');

function readRules() {
  return readFileSync(redirectFile, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.split(/\s+/));
}

test('only the exact permanent disclaimer redirect is configured', () => {
  assert.deepEqual(readRules(), [['/disclaimer/', '/terms/', '301']]);
});

test('legacy sources and destinations have no wildcard catch or obsolete target', () => {
  const rules = readRules();
  const legacyPrefixes = ['/articles/', '/categories/', '/tags/'];

  for (const [source, destination] of rules) {
    assert.equal(source.includes('*'), false, `wildcard source: ${source}`);
    assert.equal(destination.includes('*'), false, `wildcard destination: ${destination}`);
    assert.equal(legacyPrefixes.some((prefix) => destination.startsWith(prefix)), false, `obsolete destination: ${destination}`);
  }
});

test('redirect sources are unique and cannot form loops or chains', () => {
  const rules = readRules();
  const sources = rules.map(([source]) => source);
  const sourceSet = new Set(sources);

  assert.equal(sourceSet.size, sources.length, 'duplicate redirect source');
  for (const [source, destination] of rules) {
    assert.notEqual(source, destination, `self redirect: ${source}`);
    assert.equal(sourceSet.has(destination), false, `redirect chain or cycle through ${destination}`);
  }
});
