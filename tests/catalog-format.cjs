// The compact catalog.js must expand to the same records it replaced, and must survive a rewrite unchanged.
const assert = require('node:assert/strict'), fs = require('node:fs'), os = require('node:os'), path = require('node:path'), vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const format = require('../tools/catalog-format.cjs');
const root = path.join(__dirname, '..'), file = path.join(root, 'acc_details/catalog.js');
const load = source => { const window = {}; vm.runInNewContext(source, {window}); return window.HERO_GALLERY_CATALOG; };

const current = load(fs.readFileSync(file, 'utf8'));
assert(current.length > 4000, 'catalog loads');
assert(fs.statSync(file).size < 1.5e6, 'catalog.js stays compact');

// Compare with the committed version (which may still be the plain JSON form).
const committed = load(execFileSync('git', ['show', 'HEAD:acc_details/catalog.js'], {cwd: root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024}));
const byId = new Map(current.map(item => [item.id, item]));
for (const item of committed) {
  assert(byId.has(item.id), 'keeps ' + item.id);
  assert.equal(format.canonical(byId.get(item.id)), format.canonical(item), 'same record ' + item.id);
}

// Rewriting is stable, and irregular URLs or unknown fields are handled instead of silently lost.
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'catalog-format-'));
try {
  const copy = path.join(temporary, 'catalog.js');
  fs.copyFileSync(file, copy);
  format.write(copy, current);
  assert.equal(fs.readFileSync(copy, 'utf8'), fs.readFileSync(file, 'utf8'), 'rewrite is byte-identical');
  const odd = [{id: 'Ana/ODD', hero: 'Ana', name: 'Odd “Name”', rarity: 'epic', preview: 'https://example.com/p.png', image: 'https://example.com/i.png',
    sourcePage: 'https://example.com/', fallbackImage: 'https://example.com/f.png', fallbackPreview: 'https://example.com/fp.png',
    referenceOrder: 0, acquisitionSource: 'https://foxyjr.cloudns.ph/overwatch_skins/hero.php?id=007'},
    {id: 'Soldier_76/GOLFER_76', hero: 'Soldier: 76', name: 'Golfer 76', rarity: 'legendary', preview: 'x', image: 'y', sourcePage: 'z'}];
  format.write(copy, odd);
  assert.equal(JSON.stringify(load(fs.readFileSync(copy, 'utf8')).map(format.canonical)), JSON.stringify(odd.map(format.canonical)));
  assert.throws(() => format.write(copy, [{...odd[0], newField: 1}]), /unknown catalog field/);
} finally { fs.rmSync(temporary, {recursive: true, force: true}); }
console.log(JSON.stringify({records: current.length, committed: committed.length, bytes: fs.statSync(file).size, roundTrip: true}));
