import { readFile, writeFile, rename, unlink, mkdir, open } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeForSite } from './hero-gallery-import.mjs';

const siteRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export async function importAccountSnapshot(jsonPath, accountId, { replace = false, root = siteRoot } = {}) {
  if (!/^[1-9]\d{0,9}$/.test(accountId)) throw new Error('商品账号 ID 必须是正整数，例如 18');

  const stock = JSON.parse((await readFile(join(root, 'accounts.json'), 'utf8')).replace(/^\uFEFF/, ''));
  if (!Array.isArray(stock.accounts)) throw new Error('accounts.json 缺少商品列表');
  if (stock.accounts.filter((account) => String(account.id) === accountId).length !== 1) {
    throw new Error(`accounts.json 中需要恰好一个商品账号 #${accountId}`);
  }

  const sourceBytes = await readFile(jsonPath);
  if (sourceBytes.length > 5_000_000) throw new Error('采集 JSON 超过 5 MB');
  const snapshot = normalizeForSite(JSON.parse(sourceBytes.toString('utf8').replace(/^\uFEFF/, '')), accountId);
  const detailsPath = join(root, 'account_details.json');
  const lockPath = `${detailsPath}.lock`;
  const lock = await open(lockPath, 'wx').catch(() => { throw new Error('另一导入正在执行，稍后重试；异常中断后请确认进程已退出再删除 account_details.json.lock'); });
  try {
    const documentData = JSON.parse((await readFile(detailsPath, 'utf8')).replace(/^\uFEFF/, ''));
    if (![1, 2].includes(documentData.schemaVersion) || !documentData.accounts || typeof documentData.accounts !== 'object' || Array.isArray(documentData.accounts)) {
      throw new Error('account_details.json 格式无效');
    }
    if (Object.prototype.hasOwnProperty.call(documentData.accounts, accountId) && !replace) {
      throw new Error('此账号已有展示资料；确认更新后加 --replace');
    }
    const relative = `acc_details/data/${accountId}.json`;
    await mkdir(join(root, 'acc_details/data'), { recursive: true });
    await atomicJson(join(root, relative), snapshot);
    documentData.schemaVersion = 2;
    documentData.accounts[accountId] = { file: relative, capturedAt: snapshot.capturedAt, inventoryStatus: snapshot.inventoryStatus };
    await atomicJson(detailsPath, documentData);
  } finally {
    await lock.close();
    await unlink(lockPath);
  }
  return { accountId, detailsPath, customerUrl: `/acc_details/#${accountId}`, inventoryStatus: snapshot.inventoryStatus };
}

async function atomicJson(file, data) {
  const temporary = `${file}.${process.pid}.tmp`;
  try {
    await writeFile(temporary, `${JSON.stringify(data, null, 2)}\n`, { flag: 'wx' });
    await rename(temporary, file);
  } catch (error) {
    await unlink(temporary).catch(() => {});
    throw error;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [jsonPath, accountId, option] = process.argv.slice(2);
  if (!jsonPath || !accountId || (option && option !== '--replace')) {
    console.error('用法：node tools/import-hero-gallery-account.mjs <本地采集JSON> <现有商品账号ID> [--replace]');
    process.exitCode = 2;
  } else {
    importAccountSnapshot(jsonPath, accountId, { replace: option === '--replace' })
      .then(({ detailsPath, customerUrl }) => {
        console.log(`已更新：${detailsPath}`);
        console.log(`客户页面：${customerUrl}`);
      })
      .catch((error) => { console.error(`导入失败：${error.message}`); process.exitCode = 1; });
  }
}
