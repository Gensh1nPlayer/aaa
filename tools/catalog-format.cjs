// Compact, lossless storage for acc_details/catalog.js.
// Most URLs in the catalog follow fixed patterns (preview = image at 600px, GitHub image = id + .webp,
// a handful of source pages), so the file stores only what cannot be derived and rebuilds the full
// records when it loads. window.HERO_GALLERY_CATALOG ends up exactly as before for every reader.
const fs = require('node:fs'), vm = require('node:vm');

const GITHUB = 'https://raw.githubusercontent.com/ValentinZeller/overwatch_skins/main/image/hero/';
const FANDOM = 'https://static.wikia.nocookie.net/overwatch_gamepedia/images/';
const FOXY = 'https://foxyjr.cloudns.ph/overwatch_skins/hero.php?id=';
const FIELDS = ['id', 'hero', 'name', 'rarity', 'preview', 'image', 'sourcePage', 'fallbackImage', 'fallbackPreview',
  'referenceOrder', 'acquisition', 'acquisitionSource', 'gameVersion'];

// Runs in the browser (iOS 14 included) and in the manager's code-generation-free sandbox, so it is
// plain functions and string operations only.
const DECODER = `function(sources, rows) {
  var G = ${JSON.stringify(GITHUB)}, F = ${JSON.stringify(FANDOM)}, X = ${JSON.stringify(FOXY)};
  function url(code, fallback) { return code === undefined ? fallback : code.charAt(0) === '~' ? F + code.slice(1) : code; }
  function preview(image) {
    if (image.indexOf(G) === 0) return image.replace(/\\.webp$/, '_web.webp');
    return image.replace('/revision/latest', '/revision/latest/scale-to-width-down/600');
  }
  return rows.map(function(row) {
    var id = row.i.indexOf('/') < 0 ? row.h + '/' + row.i : row.i;
    var image = url(row.m, G + id + '.webp');
    var item = {id: id, hero: row.h, name: row.n, rarity: row.r};
    item.preview = row.P === undefined ? preview(image) : row.P;
    item.image = image;
    item.sourcePage = sources[row.s];
    if (row.f !== undefined) {
      item.fallbackImage = url(row.f);
      item.fallbackPreview = row.Q === undefined ? preview(item.fallbackImage) : row.Q;
    }
    if (row.o !== undefined) item.referenceOrder = row.o;
    if (row.a !== undefined) item.acquisition = row.a;
    if (row.q !== undefined) item.acquisitionSource = typeof row.q === 'number' ? X + row.q : row.q;
    if (row.g !== undefined) item.gameVersion = row.g;
    return item;
  });
}`;

const decode = new vm.Script(`(${DECODER})`).runInNewContext({});
const shrink = value => value.startsWith(FANDOM) ? '~' + value.slice(FANDOM.length) : value;
// Records are compared field by field; key order inside a record carries no meaning for any reader.
const canonical = item => JSON.stringify(FIELDS.filter(key => item[key] !== undefined).map(key => [key, item[key]]));

function encode(items) {
  for (const item of items) {
    const unknown = Object.keys(item).filter(key => !FIELDS.includes(key));
    if (unknown.length) throw new Error(`${item.id}: unknown catalog field ${unknown.join(', ')}; extend tools/catalog-format.cjs first`);
    for (const key of ['id', 'hero', 'name', 'rarity', 'image', 'sourcePage']) if (typeof item[key] !== 'string') throw new Error(`${item.id}: ${key} must be text`);
  }
  const sources = [...new Set(items.map(item => item.sourcePage))];
  const rows = items.map(item => {
    const tail = item.id.startsWith(item.hero + '/') && !item.id.slice(item.hero.length + 1).includes('/') ? item.id.slice(item.hero.length + 1) : item.id;
    const row = {i: tail, h: item.hero, n: item.name, r: item.rarity};
    const image = decode([''], [{i: item.id, h: item.hero, r: ''}])[0].image === item.image ? undefined : shrink(item.image);
    if (image !== undefined) row.m = image;
    row.s = sources.indexOf(item.sourcePage);
    if (item.fallbackImage !== undefined) row.f = shrink(item.fallbackImage);
    for (const [key, field] of [['o', 'referenceOrder'], ['a', 'acquisition'], ['g', 'gameVersion']]) if (item[field] !== undefined) row[key] = item[field];
    if (item.acquisitionSource !== undefined) {
      const number = item.acquisitionSource.startsWith(FOXY) && item.acquisitionSource.slice(FOXY.length);
      row.q = number && /^[1-9]\d{0,8}$/.test(number) ? Number(number) : item.acquisitionSource;
    }
    // Previews are stored only when they break the usual pattern.
    const probe = decode(sources, [row])[0];
    if (probe.preview !== item.preview) row.P = item.preview;
    if (item.fallbackImage !== undefined && probe.fallbackPreview !== item.fallbackPreview) row.Q = item.fallbackPreview;
    return row;
  });
  return {sources, rows};
}

function read(file) {
  const window = {};
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), {window});
  if (!Array.isArray(window.HERO_GALLERY_CATALOG)) throw new Error('catalog.js did not define HERO_GALLERY_CATALOG');
  return JSON.parse(JSON.stringify(window.HERO_GALLERY_CATALOG));
}

function write(file, items, header) {
  const {sources, rows} = encode(items);
  const decoded = decode(sources, rows);
  if (decoded.length !== items.length || decoded.some((item, index) => canonical(item) !== canonical(items[index]))) {
    throw new Error('Compact catalog did not round-trip; catalog.js was not changed.');
  }
  const firstLine = (header || fs.readFileSync(file, 'utf8').split('\n')[0]).trim();
  const source = `${firstLine}\n// Compact form written by tools/catalog-format.cjs; it expands to the full records when loaded.\n` +
    `window.HERO_GALLERY_CATALOG = (${DECODER})(${JSON.stringify(sources)},\n${JSON.stringify(rows)});\n`;
  fs.writeFileSync(file, source);
}

module.exports = {read, write, encode, decode, canonical};

// node tools/catalog-format.cjs  ->  rewrite acc_details/catalog.js in compact form (content unchanged)
if (require.main === module) {
  const file = require('node:path').join(__dirname, '..', 'acc_details', 'catalog.js');
  const before = fs.statSync(file).size, items = read(file);
  write(file, items);
  console.log(JSON.stringify({items: items.length, bytesBefore: before, bytesAfter: fs.statSync(file).size}));
}
