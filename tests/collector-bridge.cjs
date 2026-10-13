const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const {execFileSync} = require('node:child_process');
const collector = process.env.COLLECTOR_PACKAGE;
if (!collector) throw new Error('Set COLLECTOR_PACKAGE to the local website-ready collector directory.');
(async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(),'roshine-bridge-test-'));
  try {
    await fs.mkdir(path.join(root,'tools'));
    for (const file of ['hero-gallery-import.mjs','import-hero-gallery-account.mjs']) {
      await fs.copyFile(path.join(__dirname,'../tools',file),path.join(root,'tools',file));
    }
    const stock = '{"accounts":[{"id":123}]}';
    await fs.writeFile(path.join(root,'accounts.json'),stock);
    await fs.writeFile(path.join(root,'account_details.json'),'{"schemaVersion":2,"accounts":{}}');
    const sample = JSON.parse(await fs.readFile(path.join(collector,'examples/example-snapshot.json'),'utf8'));
    sample.accountId = '123';
    const input = path.join(root,'snapshot.json');
    await fs.writeFile(input,JSON.stringify(sample));
    const args = ['-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(collector,'import-to-site.ps1'),'-Snapshot',input,'-SiteRoot',root,'-AccountId','123'];
    execFileSync('powershell.exe',args,{encoding:'utf8'});
    const data = JSON.parse(await fs.readFile(path.join(root,'acc_details/data/123.json'),'utf8'));
    assert.equal(data.inventoryStatus,'complete');
    assert.deepEqual(data.ownedSkinIds,sample.ownedSkinIds);
    assert.equal(data.profile.timePlayedHours,sample.profile.timePlayedHours);
    assert.equal(data.balances.legacyCompetitivePoints,sample.balances.legacyCompetitivePoints);
    assert.equal(await fs.readFile(path.join(root,'accounts.json'),'utf8'),stock);
    sample.inventoryStatus='partial';
    await fs.writeFile(input,JSON.stringify(sample));
    assert.throws(()=>execFileSync('powershell.exe',[...args,'-Replace'],{stdio:'pipe'}));
    execFileSync('powershell.exe',[...args,'-Replace','-AllowPartial'],{encoding:'utf8'});
    assert.equal(JSON.parse(await fs.readFile(path.join(root,'acc_details/data/123.json'),'utf8')).inventoryStatus,'partial');
    sample.accountId='456';await fs.writeFile(input,JSON.stringify(sample));
    assert.throws(()=>execFileSync('powershell.exe',[...args,'-Replace','-AllowPartial'],{stdio:'pipe'}));
    console.log('Collector bridge: example schema, full import, partial guard, replacement and ID binding passed.');
  } finally {await fs.rm(root,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
