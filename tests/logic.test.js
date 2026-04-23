const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { canDeleteTopLevelGroup } = require('../logic.js');

test('blocks deleting the final top-level group', () => {
  const groups = [{ id: 'root', children: [{ id: 'child' }] }];
  assert.equal(canDeleteTopLevelGroup(groups, 'root'), false);
});

test('allows deleting a subgroup when one top-level group exists', () => {
  const groups = [{ id: 'root', children: [{ id: 'child' }] }];
  assert.equal(canDeleteTopLevelGroup(groups, 'child'), true);
});

test('blocks delete when groups array is empty', () => {
  assert.equal(canDeleteTopLevelGroup([], 'anything'), false);
});

test('allows deleting one top-level group when another top-level group exists', () => {
  const groups = [{ id: 'root-a' }, { id: 'root-b' }];
  assert.equal(canDeleteTopLevelGroup(groups, 'root-a'), true);
});

test('nose_breadth labels in config are trimmed (no trailing spaces)', () => {
  const cfgPath = path.join(__dirname, '..', 'config.js');
  const src = fs.readFileSync(cfgPath, 'utf8');

  assert.equal(src.includes('"Leptorrhine "'), false);
  assert.equal(src.includes('"Platyrrhine "'), false);
  assert.equal(src.includes('"Hyperplatyrrhine "'), false);
});
