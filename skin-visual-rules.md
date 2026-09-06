# 皮肤视觉分级与名称规则

核对日期：2026-09-06。以 GitHub 的 assets/main.js、assets/main.css 为实际规则来源。

这是 Roshine 的展示层级，不是 Blizzard 的官方稀有度分类；也不表示某皮肤目前绝版或只能付费取得。商店名单是已核实的首批名单，不是全游戏所有历史付费皮肤的穷尽清单。未确认名字保留普通样式。

## 视觉方案

| 展示层级 | 色彩 | 字重 / 字号 | 发光 |
| --- | --- | --- | --- |
| 顶级收藏 | 珊瑚红 #ff8295 | 800 / 1.06em | 最明显的双层红光 |
| 次级稀有 | 暖金 #f8d58b | 600 / 原字号 | 中等金色柔光 |
| Midas | 亮金 #facc15 | 600 / 原字号 | 保留专属金光 |
| 联赛、战队 | 冰蓝 #93ddea | 500 / 原字号 | 轻量冰蓝光 |
| 已核实的商店皮肤 | 淡紫 #c7b9ed | 400 / 原字号 | 轻量紫光 |
| 普通 Bundle | 薰衣草紫 #d3c3ff | 500 / 原字号 | 双层柔光 |
| Mythic | 粉紫 → 浅紫 → 冰青渐变 | 600 / 原字号 | 增强文字柔光及微弱投影 |

保留 Noire / Demon Hunter 的既有收藏配色、Heart of Hope 与武器的专属色。
效果为静态柔光，支持正常换行，不新增循环动画。高对比度系统模式回退到实色文字。

## 顶级收藏

原有：Illidan、Tyrande、BlizzCon Bastion（含 2016）、BlizzCon Winston（含 2017）。

补充：BlizzCon Virtual Ticket 2016，整段名称使用顶级红色高亮，支持大小写与连续空白差异；不扩展到其他年份的 Virtual Ticket。

新增：Pink、Pink Mercy、Rose Gold、Rose Gold Mercy、Brick、LEGO Brick；兼容 Brick Bastion / LEGO Brick Bastion。
Pink、Brick 缩写受边界与后缀限制，避免把 Pink Cat、Brickhouse 等提升为顶级。

## 次级稀有

MM；Ange de la Mort；Pirate Ship；Happi、Dallas Happi、Shanghai Happi、Dallas Summer、Shanghai Summer；Royal（含 LA Gladiators 注释）；Rock Climber；Midas；Chained King；Wicked / Wicked Reign；Luchador / Tiger Luchador / Lion Luchador；Royal Knight / Royal Gladiator；Clockwork；Thunder；Flying Ace；Sylvanas / Sylvanas Windrunner；Zhulong（兼容资料中的 Zhulang 写法）；Solaris；Haroeris；Dance Party；Good and Evil；Mayhem Biker；Zen-Nakji；Crimson Summer；Boleiro；GOAT / GOATS；Charged Climber / Reigning Climber。

All-Stars / All-Stars Skins，以及 Atlantic / Pacific 前缀（可带年份）的 All-Star / All-Stars。包括用户列出的 2019 Atlantic、2020 Atlantic、2020 Pacific。
避免把 All-Star Cassidy (Stadium) 误判为 OWL All-Stars。

重复名单已合并；连续空格和常见大小写变化可匹配。
MM 仅按用户提供的精确大写缩写匹配，尚未确认对应全名，不猜测扩展。

## OWL 战队与库存缩写

| 官方或历史队名 | 支持的库存写法 |
| --- | --- |
| Atlanta Reign | ATL |
| Boston Uprising | BOS |
| Chengdu Hunters | CDH |
| Dallas Fuel | DAL |
| Florida Mayhem | FLO Mayhem、FLA |
| Guangzhou Charge | GZC |
| Hangzhou Spark | HZS |
| Houston Outlaws | HOU |
| London Spitfire | LDN |
| Los Angeles Gladiators | LA Gladiators、LAG、GLA |
| Los Angeles Valiant | LA Valiant、LAV |
| New York Excelsior | NY Excelsior、NYXL、NYE |
| Paris Eternal | PAR |
| Philadelphia Fusion | PHL Fusion、PHI |
| San Francisco Shock | SF Shock、SFS |
| Seoul Dynasty | SEO |
| Seoul Infernal | SIN |
| Shanghai Dragons | SH Dragon、SH Dragons、SHD |
| Toronto Defiant | TOR |
| Vancouver Titans | VAN |
| Vegas Eternal | VEG |
| Washington Justice | WAS |

完整队名不区分大小写；纯缩写要求大写，避免将英文 was、sin 等普通词染色。
这些缩写是库存兼容规则，并非全部声称为官方缩写。

兼容 OW1 / OW2 前缀、年份、斜杠英雄列表与括号：
OW1 SFS 2018 Hanzo/Rein、OW1 TOR(Rein/Hog/Ball/Cass)、OW2 HZS(Echo/Kiri) 等。

赛事标识：OWL、OWCS、OWWC、Contenders，以及完整英文名称。
栏目标签：OWL Collection、OW1 Team Skin、OW1 League White/Gray Skins 等。
英雄名仍保持普通文字。Owl Guardian 按完整商店皮肤名处理，不误判为 OWL；OWL Tokens 保持货币规则。

参考：[OWL 战队名单](https://overwatch.fandom.com/wiki/Overwatch_League)、[Blizzard OWL 库存公告](https://overwatch.blizzard.com/en-us/news/24096017/complete-your-collection-with-the-overwatch-league-inventory-sale/)、[2023 战队皮肤更新](https://overwatch.blizzard.com/en-us/news/patch-notes/live/2023/03/)。

## 首批商店皮肤名单：49 个名称 / 别名条目

名称可能有简写或合写，因此 49 个条目不等于 49 款不同皮肤。

| 来源 / 系列 | 纳入规则的名称 |
| --- | --- |
| One-Punch Man | Saitama、Terrible Tornado、Genos |
| Cowboy Bebop | Spike Spiegel / Spike、Faye Valentine / Faye、Ed、Jet Black / Jet |
| Porsche | Porsche |
| World of Warcraft | Lich King、Thrall、Diamond Magni；Sylvanas 按用户要求采用次级稀有效果 |
| My Hero Academia | Deku、Uravity、All Might、Himiko Toga、Tomura Shigaraki |
| Street Fighter 6 | Chun-Li、Juri、Cammy、Ryu、Dhalsim、Guile、M. Bison、Blanka |
| Transformers | Optimus Prime、Megatron、Bumblebee、Arcee |
| LE SSERAFIM | ANTIFRAGILE Dazzle、ANTIFRAGILE Traysi、ANTIFRAGILE Kira-Kira、ANTIFRAGILE BB、ANTIFRAGILE Slay Star、LE SSERAFIM FEARLESS、LE SSERAFIM |
| 其他商店 / 付费礼包名称 | Cardboard、Turtleship / Turtle Ship、Cyberdragon / Cyber Dragon、Street Runner、Honey Bee、Cleric、Beach Rescue、Owl Guardian、Gilded Hunter |

没有将 Ein、Mumen Rider 等活动免费奖励自动归为付费皮肤。
没有使用“所有传奇皮肤 = 商店皮肤”的推断。
Gilded Hunter 先于 Gilded 匹配，不套用神话外观样式。
对 Bee/Honey Bee 等短词采用库存中的明确名称，避免普通词泛匹配。

资料：
- [Blizzard：One-Punch Man](https://overwatch.blizzard.com/en-us/news/23916447/)
- [Blizzard：Cowboy Bebop](https://overwatch.blizzard.com/en-us/news/24064743/)
- [Blizzard：Porsche](https://overwatch.blizzard.com/en-us/news/24072111/)
- [Blizzard：World of Warcraft](https://overwatch.blizzard.com/en-us/news/24135750/overwatch-2-x-world-of-warcraft-collab/)
- [Blizzard：My Hero Academia](https://overwatch.blizzard.com/en-us/news/24142481/)
- [Blizzard：Street Fighter 6](https://overwatch.blizzard.com/en-us/news/24178101/overwatch-2-street-fighter-6/)
- [Blizzard：LE SSERAFIM](https://overwatch.blizzard.com/en-us/news/24014297/)
- [Blizzard：Transformers / 夏季商店](https://overwatch.blizzard.com/en-us/news/24104748/)
- [Blizzard：Season 12 / Game Pass 商店皮肤](https://overwatch.blizzard.com/en-us/news/24116736/)
- [用户指定的 Skins 索引](https://overwatch.fandom.com/wiki/Skins)
- [Owl Guardian 商店礼包交叉核对](https://overwatch.fandom.com/wiki/Mercy/Quotes)

Fandom 正文直连被站点限制；使用可检索的索引摘录交叉核对，未声称完整抓取全部皮肤资料。

## 匹配与维护

- 特殊名字优先于普通短词；同组内优先匹配较长名称。
- Bundle 作为完整名称匹配，支持小写、Café 等重音字母、Mega / Ultra 和 and / &。
- Bundle 命中更高等级皮肤时整体沿用该等级，避免一段名称产生互相嵌套的颜色。
- 分隔符支持英文、中文逗号及分号，保留原始标点。
- 保护 Soldier: 76 中的冒号，不将其识别为栏目标题。
- 保留 ✨ 后空格、库存中的换行及原有皮肤拼写。
- 同一规则用于星标描述与普通描述/武器详情，不新增需要翻译的页面文案。所有站点语言共用库存名称和颜色规则。
- 新名字优先加入 rareSkinNames / shopSkinNames；新队名和别名加入 owlTeamNames。不要重新添加独立 replace 颜色代码。
