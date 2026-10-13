const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');

(async () => {
  const site = path.resolve(__dirname, '..');
  const { normalizeForSite } = await import(pathToFileURL(path.join(site, 'tools/hero-gallery-import.mjs')));
  const { importAccountSnapshot } = await import(pathToFileURL(path.join(site, 'tools/import-hero-gallery-account.mjs')));
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'roshine-details-test-'));
  try {
    const stock = '{"accounts":[{"id":123,"screenshot":"https://example.invalid/old"},{"id":456}]}';
    await fs.writeFile(path.join(root, 'accounts.json'), stock);
    await fs.writeFile(path.join(root, 'account_details.json'), '{"schemaVersion":2,"accounts":{}}');
    const source = {
      accountId:'123', inventoryStatus:'complete', ownedSkinIds:['D.Va/ACADEMY', 'D.Va/ACADEMY'],
      balances:{credits:0, overwatchCoins:null}, capturedAt:'2026-10-13T12:00:00Z',
      profile:{gamesPlayed:10,gamesWon:6}, email:'secret@example.invalid', battleTag:'PRIVATE#1234',
      ownedWeaponSkinIds:['weapon/Reaper/Hard_Light'], ownedWeaponVariants:[{hero:'D.Va',name:'Golden'}]
    };
    assert.equal(normalizeForSite(source, '123').inventoryStatus, 'complete');
    assert.equal(normalizeForSite({...source,inventoryStatus:'partial'}, '123').inventoryStatus, 'partial');
    assert.throws(() => normalizeForSite({...source,accountId:'456'}, '123'), /ID/);
    assert.throws(() => normalizeForSite({...source,inventoryStatus:'bogus'}, '123'), /inventoryStatus/);
    const input = path.join(root,'input.json');
    await fs.writeFile(input,JSON.stringify(source));
    await importAccountSnapshot(input,'123',{root});
    const manifest = JSON.parse(await fs.readFile(path.join(root,'account_details.json'),'utf8'));
    assert.equal(manifest.schemaVersion,2);
    assert.equal(manifest.accounts['123'].file,'acc_details/data/123.json');
    const entry = JSON.parse(await fs.readFile(path.join(root,manifest.accounts['123'].file),'utf8'));
    assert.equal(entry.inventoryStatus,'complete');
    assert.deepEqual(entry.ownedSkinIds,['D.Va/ACADEMY']);
    assert.equal(entry.balances.credits,0);
    assert.equal(entry.balances.overwatchCoins,null);
    assert(!JSON.stringify(entry).includes('PRIVATE'));
    assert.equal(entry.email,undefined);
    assert.equal(await fs.readFile(path.join(root,'accounts.json'),'utf8'),stock);
    await assert.rejects(() => importAccountSnapshot(input,'123',{root}), /已有展示资料/);
    await importAccountSnapshot(input,'123',{root,replace:true});
    await assert.rejects(() => importAccountSnapshot(input,'999',{root}), /恰好一个商品账号/);
    console.log('Details contract: complete/partial, ID binding, privacy, atomic import, immutable stock passed.');
  } finally {
    await fs.rm(root,{recursive:true,force:true});
  }
})().catch(error => {console.error(error);process.exitCode=1;});
