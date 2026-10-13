const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function main() {
  const testsDir = __dirname;
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
    console.log('Account details import: passed');
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
