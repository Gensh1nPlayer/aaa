const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function main() {
  const testsDir = __dirname;
  const { normalizeForSite } = await import(pathToFileURL(path.join(testsDir, '..', 'tools', 'hero-gallery-import.mjs')));
  assert.equal(normalizeForSite({ownedSkinIds:[],accountVersion:'OW1'},'123').accountVersion,'OW1');
  assert.equal(normalizeForSite({ownedSkinIds:[]},'123').accountVersion,'');
  assert.throws(()=>normalizeForSite({ownedSkinIds:[],accountVersion:'OW3'},'123'),/accountVersion/);
  for(const raw of ['111 - OW2','111 - OW1','1 + 222 - OW1'])assert.equal(normalizeForSite({ownedSkinIds:[],profile:{accountLevel:raw}},'123').profile.accountLevel,raw);
  for(const raw of ['347 + 361 - OW1 Plat Border Stacked Account','111 - OW1 Golden Border','111 - OW1 Platinum Border'])assert.equal(normalizeForSite({ownedSkinIds:[],profile:{accountLevel:raw}},'123').profile.accountLevel,raw);
  for(const raw of ['arbitrary text','111 - OW3','<script>111</script>','-1','1 +','1'.repeat(501)])assert.throws(()=>normalizeForSite({ownedSkinIds:[],profile:{accountLevel:raw}},'123'),/等级/);
  for (const balances of [undefined, null, {}, {mythicPrisms:null,competitivePoints:null},
    {mythicPrisms:0,competitivePoints:0}, {mythicPrisms:80,competitivePoints:3000,overwatchCoins:0,legacyCompetitivePoints:50}]) {
    const input={ownedSkinIds:[],balances};
    const before=JSON.stringify(input);
    const normalized=normalizeForSite(input,'123');
    assert.equal(normalized.balances.mythicPrisms,balances?.mythicPrisms??0);
    assert.equal(normalized.balances.competitivePoints,balances?.competitivePoints??0);
    for(const key of ['overwatchCoins','credits','legacyCompetitivePoints','lootBoxes']) {
      assert.equal(normalized.balances[key],balances?.[key]??null);
    }
    assert.equal(JSON.stringify(input),before,'raw input must not change');
  }
  for(const value of [-1,'80',1.5]) {
    for(const key of ['mythicPrisms','competitivePoints']) {
      assert.throws(()=>normalizeForSite({ownedSkinIds:[],balances:{[key]:value}},'123'),/有效数字/);
    }
  }
  const root = await fs.mkdtemp(path.join(testsDir, '.tmp-account-details-'));
  if (!root.startsWith(`${testsDir}${path.sep}`)) throw new Error('测试目录不在 tests 内');
  try {
    const stockText = '{"accounts":[{"id":123,"price":"$10"},{"id":456,"status":"Sold"}]}';
    await fs.writeFile(path.join(root, 'accounts.json'), stockText);
    await fs.writeFile(path.join(root, 'account_details.json'), '{"schemaVersion":1,"accounts":{"456":{"accountId":"456","ownedSkinIds":[]}}}\n');
    const snapshotPath = path.join(root, 'snapshot.json');
    await fs.writeFile(snapshotPath, JSON.stringify({
      accountLabel: 'Secret BattleTag',
      email: 'private@example.invalid',
      password: 'do-not-publish',
      ownedSkinIds: ['D.Va/ACADEMY'],
      ownedWeaponSkinIds: ['weapon/Reaper/Hard_Light'],
      ownedWeaponVariants: [{ hero: 'D.Mon', name: 'Golden' }],
      uncataloguedOwnedItems: [{ hero: 'Mauga', category: 'skins', name: 'Jotunn' }],
      balances: { mythicPrisms: 80, overwatchCoins: 100 },
      profile: { endorsementLevel: 3, accountLevel: 669, gamesPlayed: 10, gamesWon: 6 }
    }));
    const { importAccountSnapshot } = await import(pathToFileURL(path.join(testsDir, '..', 'tools', 'import-hero-gallery-account.mjs')));
    await assert.rejects(() => importAccountSnapshot(snapshotPath, '999', { root }), /恰好一个商品账号/);
    await importAccountSnapshot(snapshotPath, '123', { root });
    const result = JSON.parse(await fs.readFile(path.join(root, 'account_details.json'), 'utf8'));
    const account = JSON.parse(await fs.readFile(path.join(root, result.accounts['123'].file), 'utf8'));
    assert.equal(account.accountId, '123');
    assert.equal(account.accountLabel, 'Account #123');
    assert.equal(account.inventoryStatus, 'partial');
    assert.equal(account.balances.mythicPrisms, 80);
    assert.equal(account.balances.competitivePoints, 0);
    assert.equal(account.balances.credits, null);
    assert.equal(account.profile.endorsementLevel, 3);
    assert.equal(account.profile.accountLevel, 669);
    assert.equal(account.profile.gamesWon, 6);
    assert.deepEqual(account.ownedSkinIds, ['D.Va/ACADEMY']);
    assert.deepEqual(account.ownedWeaponSkinIds, ['weapon/Reaper/Hard_Light']);
    assert.deepEqual(account.ownedWeaponVariants, [{ hero: 'D.Mon', name: 'Golden' }]);
    assert.deepEqual(account.uncataloguedOwnedItems, [{ hero: 'Mauga', category: 'skins', name: 'Jotunn' }]);
    assert.equal(account.email, undefined);
    assert.equal(account.password, undefined);
    assert.deepEqual(result.accounts['456'], { accountId: '456', ownedSkinIds: [] });
    assert.equal(await fs.readFile(path.join(root, 'accounts.json'), 'utf8'), stockText);
    await assert.rejects(() => importAccountSnapshot(snapshotPath, '123', { root }), /已有展示资料/);
    await importAccountSnapshot(snapshotPath, '123', { root, replace: true });
    for(const raw of ['111 - OW2','111 - OW1','1 + 222 - OW1']){
      const input={accountId:'123',ownedSkinIds:[],profile:{accountLevel:raw}};
      const clean=normalizeForSite(input,'123');
      await fs.writeFile(snapshotPath,JSON.stringify(clean));
      await importAccountSnapshot(snapshotPath,'123',{root,replace:true});
      const index=JSON.parse(await fs.readFile(path.join(root,'account_details.json'),'utf8'));
      const saved=JSON.parse(await fs.readFile(path.join(root,index.accounts['123'].file),'utf8'));
      assert.equal(saved.profile.accountLevel,raw,'normalize -> import -> repository snapshot retains level text');
      assert.equal(await fs.readFile(path.join(root,'accounts.json'),'utf8'),stockText,'import does not implicitly sync Stock');
    }
    console.log('Account details import: passed');
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
