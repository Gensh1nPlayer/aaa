const balanceKeys = ['mythicPrisms', 'overwatchCoins', 'credits', 'competitivePoints', 'legacyCompetitivePoints', 'lootBoxes'];
const rankKeys = ['tank', 'damage', 'support', 'openQueue'];
const roleKeys = ['tank', 'damage', 'support'];

function text(value, max = 60) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function number(value, name, { integer = true, min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isSafeInteger(value))) {
    throw new Error(`${name} 必须是有效数字或 null`);
  }
  return value;
}

function record(value, name) {
  if (value === undefined || value === null) return {};
  if (typeof value !== 'object' || Array.isArray(value)) throw new Error(`${name} 必须是对象`);
  return value;
}

export function normalizeForSite(input, accountId) {
  if (!/^[A-Za-z0-9_-]{1,60}$/.test(accountId)) throw new Error('站内账号 ID 只能使用 1–60 位英文字母、数字、下划线或连字符');
  const source = record(input, '快照');
  if (source.accountId !== undefined && String(source.accountId) !== accountId) throw new Error('快照 accountId 与商品 ID 不一致');
  if (source.inventoryStatus !== undefined && !['complete', 'partial'].includes(source.inventoryStatus)) throw new Error('inventoryStatus 必须是 complete 或 partial');
  if (!Array.isArray(source.ownedSkinIds) || source.ownedSkinIds.length > 5000) throw new Error('ownedSkinIds 必须是最多 5000 条的数组');
  const ownedSkinIds = [...new Set(source.ownedSkinIds.map((id) => {
    if (typeof id !== 'string' || !id || id.length > 300 || /[\u0000-\u001f]/.test(id)) throw new Error('皮肤 ID 无效');
    return id;
  }))];
  const weaponIds = source.ownedWeaponSkinIds ?? [];
  if (!Array.isArray(weaponIds) || weaponIds.length > 500) throw new Error('ownedWeaponSkinIds 必须是最多 500 条的数组');
  const ownedWeaponSkinIds = [...new Set(weaponIds.map((id) => {
    if (typeof id !== 'string' || !/^weapon\/[A-Za-z0-9_]+\/[A-Za-z0-9_]+$/.test(id)) throw new Error('武器皮肤 ID 无效');
    return id;
  }))];
  const variants = source.ownedWeaponVariants ?? [];
  if (!Array.isArray(variants) || variants.length > 500) throw new Error('ownedWeaponVariants 必须是最多 500 条的数组');
  const variantNames = new Set(['Golden', 'Jade', 'Galactic', 'Crimson Wolf']);
  const ownedWeaponVariants = [...new Map(variants.map((item) => {
    const variant = record(item, '武器变体');
    const hero = text(variant.hero);
    const name = text(variant.name);
    if (!hero || !variantNames.has(name)) throw new Error('武器变体名称或英雄无效');
    return [`${hero}/${name}`, { hero, name }];
  })).values()];
  const uncataloguedInput = source.uncataloguedOwnedItems ?? [];
  if (!Array.isArray(uncataloguedInput) || uncataloguedInput.length > 500) throw new Error('uncataloguedOwnedItems 必须是最多 500 条的数组');
  const uncataloguedOwnedItems = [...new Map(uncataloguedInput.map((item) => {
    const entry = record(item, '目录外物品');
    const hero = text(entry.hero);
    const name = text(entry.name, 100);
    const category = entry.category;
    if (!hero || !name || name !== entry.name?.trim() || !['skins', 'weapons', 'variants'].includes(category) ||
        /[\u0000-\u001f]/.test(name) || ['OVERWATCH', 'OVERWATCHCLASSIC', 'DEFAULT', 'RANDOMFROMFAVORITES'].includes(name.toUpperCase().replace(/[^A-Z0-9]/g, ''))) {
      throw new Error('目录外物品的英雄、分类或游戏原名无效');
    }
    return [`${category}/${hero.toUpperCase()}/${name.toUpperCase()}`, { hero, category, name }];
  })).values()];

  const balancesInput = record(source.balances, 'balances');
  const balances = Object.fromEntries(balanceKeys.map((key) => [key, number(balancesInput[key], key)]));
  const competitiveInput = record(source.competitive, 'competitive');
  const ranksInput = record(competitiveInput.ranks, 'competitive.ranks');
  const competitive = {
    season: text(competitiveInput.season, 40),
    ranks: Object.fromEntries(rankKeys.map((key) => [key, text(ranksInput[key], 40)]))
  };

  const profileInput = record(source.profile, 'profile');
  const roleStatsInput = record(profileInput.roleStats, 'profile.roleStats');
  const roleStats = Object.fromEntries(roleKeys.map((key) => {
    const role = record(roleStatsInput[key], `profile.roleStats.${key}`);
    return [key, {
      timePlayedHours: number(role.timePlayedHours, `${key} 时长`, { integer: false }),
      gamesWon: number(role.gamesWon, `${key} 胜场`)
    }];
  }));
  const heroesPlayed = Array.isArray(profileInput.heroesPlayed) ? profileInput.heroesPlayed.slice(0, 100).map((item) => {
    const hero = record(item, 'heroesPlayed 项');
    return {
      hero: text(hero.hero),
      level: number(hero.level, '英雄等级'),
      timePlayedHours: number(hero.timePlayedHours, '英雄时长', { integer: false })
    };
  }).filter((item) => item.hero) : [];
  const historicalRanks = Array.isArray(profileInput.historicalRanks) ? profileInput.historicalRanks.slice(0, 100).map((item) => {
    const history = record(item, 'historicalRanks 项');
    const ranks = record(history.ranks, 'historicalRanks.ranks');
    return {
      season: text(history.season, 40),
      ranks: Object.fromEntries(rankKeys.map((key) => [key, text(ranks[key], 40)]))
    };
  }).filter((item) => item.season && Object.values(item.ranks).some(Boolean)) : [];
  const profile = {
    endorsementLevel: number(profileInput.endorsementLevel, '赞赏等级', { min: 0, max: 5 }),
    accountLevel: number(profileInput.accountLevel, '账号等级'),
    timePlayedHours: number(profileInput.timePlayedHours, '总时长', { integer: false }),
    gamesPlayed: number(profileInput.gamesPlayed, 'Games Played'),
    gamesWon: number(profileInput.gamesWon, 'Games Won'),
    roleStats,
    heroesPlayed,
    historicalRanks
  };
  if (profile.gamesPlayed !== null && profile.gamesWon !== null && profile.gamesWon > profile.gamesPlayed) throw new Error('Games Won 不能超过 Games Played');
  const capturedAt = text(source.capturedAt, 80);
  if (capturedAt && Number.isNaN(Date.parse(capturedAt))) throw new Error('capturedAt 时间无效');

  return {
    accountId,
    accountLabel: `Account #${accountId}`,
    region: text(source.region, 16),
    capturedAt,
    inventoryStatus: source.inventoryStatus === 'complete' ? 'complete' : 'partial',
    balances,
    competitive,
    profile,
    ownedSkinIds,
    ownedWeaponSkinIds,
    ownedWeaponVariants,
    uncataloguedOwnedItems
  };
}
