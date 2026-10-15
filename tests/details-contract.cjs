const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const { syncBuiltinESMExports } = require('node:module');

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

    // Inject failures at the filesystem boundary; all writes stay in temporary fixtures.
    async function failedManifestCommit({ schemaVersion = 2, existing = true, orphan = false, rollbackFails = false } = {}) {
      const fixture = await fs.mkdtemp(path.join(root, 'commit-failure-'));
      const detailsPath = path.join(fixture, 'account_details.json');
      const snapshotPath = path.join(fixture, 'acc_details/data/123.json');
      const dataDir = path.dirname(snapshotPath);
      const oldManifest = Buffer.from('\uFEFF' + JSON.stringify({ schemaVersion, accounts: existing ? {
        '123': { file: 'acc_details/data/123.json', capturedAt: 'old', inventoryStatus: 'partial' }
      } : {} }, null, 3) + '\r\n');
      const oldSnapshot = Buffer.from('\uFEFF{ "accountId": "123", "ownedSkinIds": ["old"] }\r\n');
      await fs.mkdir(dataDir, { recursive: true });
      await fs.writeFile(path.join(fixture, 'accounts.json'), stock);
      await fs.writeFile(detailsPath, oldManifest);
      if (existing || orphan) await fs.writeFile(snapshotPath, oldSnapshot);
      const unrelated = path.join(dataDir, '456.json');
      await fs.writeFile(unrelated, 'unrelated snapshot');
      const originalRename = fs.rename;
      const originalUnlink = fs.unlink;
      let manifestAttempts = 0;
      let snapshotCommits = 0;
      fs.rename = async (from, to) => {
        if (to === detailsPath) {
          manifestAttempts++;
          throw new Error('injected manifest commit failure');
        }
        if (to === snapshotPath) {
          if (rollbackFails && snapshotCommits) throw new Error('injected rollback failure');
          snapshotCommits++;
        }
        return originalRename(from, to);
      };
      fs.unlink = async (file) => {
        if (rollbackFails && !existing && !orphan && file === snapshotPath) throw new Error('injected rollback failure');
        return originalUnlink(file);
      };
      syncBuiltinESMExports();
      let failure;
      try {
        await assert.rejects(() => importAccountSnapshot(input, '123', { root: fixture, replace: existing }), error => {
          failure = error;
          return /injected manifest commit failure/.test(error.message);
        });
      } finally {
        fs.rename = originalRename;
        fs.unlink = originalUnlink;
        syncBuiltinESMExports();
      }
      assert.equal(manifestAttempts, 1, 'failure must occur at the second commit');
      assert(snapshotCommits >= 1, 'snapshot must have been committed before the injected failure');
      assert.deepEqual(await fs.readFile(detailsPath), oldManifest, 'manifest must retain its exact original bytes');
      assert.equal(await fs.readFile(unrelated, 'utf8'), 'unrelated snapshot');
      assert.equal(await fs.readFile(path.join(fixture, 'accounts.json'), 'utf8'), stock);
      await assert.rejects(fs.stat(`${detailsPath}.lock`), { code: 'ENOENT' });
      const leftovers = (await fs.readdir(dataDir)).filter(name => name !== '123.json' && name !== '456.json');
      if (rollbackFails) {
        assert.match(failure.message, /回滚失败/);
        assert.match(failure.message, /injected rollback failure/);
        if (existing || orphan) {
          assert.equal(leftovers.length, 1, 'retain one recoverable backup');
          const backup = path.join(dataDir, leftovers[0]);
          assert.deepEqual(await fs.readFile(backup), oldSnapshot);
          assert(failure.message.includes(backup), 'error must identify the recovery backup');
        } else {
          assert(failure.message.includes(snapshotPath), 'error must identify the newly created snapshot to remove');
          assert.equal(leftovers.length, 0);
        }
        assert.equal(JSON.parse(await fs.readFile(snapshotPath, 'utf8')).inventoryStatus, 'complete');
      } else {
        assert.equal(leftovers.length, 0, 'successful recovery must clean backup and staging files');
        if (existing || orphan) assert.deepEqual(await fs.readFile(snapshotPath), oldSnapshot, 'restore exact original bytes');
        else await assert.rejects(fs.stat(snapshotPath), { code: 'ENOENT' });
      }
    }
    await failedManifestCommit({ schemaVersion: 1 });
    await failedManifestCommit({ schemaVersion: 2 });
    await failedManifestCommit({ existing: false });
    await failedManifestCommit({ existing: false, orphan: true });
    await failedManifestCommit({ rollbackFails: true });
    await failedManifestCommit({ existing: false, rollbackFails: true });

    for (const operation of ['copyFile', 'rename']) {
      const snapshotPath = path.join(root, 'acc_details/data/123.json');
      const detailsPath = path.join(root, 'account_details.json');
      const oldSnapshot = await fs.readFile(snapshotPath);
      const oldManifest = await fs.readFile(detailsPath);
      const original = fs[operation];
      let attempts = 0;
      fs[operation] = async (from, to, ...options) => {
        if ((operation === 'copyFile' && from === snapshotPath) || (operation === 'rename' && to === snapshotPath)) {
          attempts++;
          throw new Error(`injected ${operation} failure before manifest commit`);
        }
        return original(from, to, ...options);
      };
      syncBuiltinESMExports();
      try {
        await assert.rejects(() => importAccountSnapshot(input, '123', { root, replace: true }), /before manifest commit/);
      } finally {
        fs[operation] = original;
        syncBuiltinESMExports();
      }
      assert.equal(attempts, 1);
      assert.deepEqual(await fs.readFile(snapshotPath), oldSnapshot);
      assert.deepEqual(await fs.readFile(detailsPath), oldManifest);
      assert.deepEqual(await fs.readdir(path.dirname(snapshotPath)), ['123.json']);
      await assert.rejects(fs.stat(`${detailsPath}.lock`), { code: 'ENOENT' });
    }

    await fs.writeFile(path.join(root, 'account_details.json'), '{"schemaVersion":1,"accounts":{}}');
    await importAccountSnapshot(input, '123', { root });
    assert.equal(JSON.parse(await fs.readFile(path.join(root, 'account_details.json'), 'utf8')).schemaVersion, 2);
    assert.deepEqual((await fs.readdir(path.join(root, 'acc_details/data'))).sort(), ['123.json']);
    const lockPath = path.join(root, 'account_details.json.lock');
    await fs.writeFile(lockPath, 'another importer');
    await assert.rejects(() => importAccountSnapshot(input, '123', { root, replace: true }), /另一导入正在执行/);
    assert.equal(await fs.readFile(lockPath, 'utf8'), 'another importer');
    console.log('Details contract: complete/partial, ID binding, privacy, schema 1/2, explicit replace, locking, second-commit recovery and rollback-failure backups, immutable stock passed.');
  } finally {
    await fs.rm(root,{recursive:true,force:true});
  }
})().catch(error => {console.error(error);process.exitCode=1;});
