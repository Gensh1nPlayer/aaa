# 皮肤视觉分级与名称规则

核对日期：2026-09-12。以 GitHub 的 assets/main.js、assets/main.css 为实际规则来源。

这是 Roshine 的展示层级，不是 Blizzard 的官方稀有度分类；也不表示某皮肤目前绝版或只能付费取得。商店名单是已核实的首批名单，不是全游戏所有历史付费皮肤的穷尽清单。未确认名字保留普通样式。

## 视觉方案

| 展示层级 | 色彩 | 字重 / 字号 | 发光 |
| --- | --- | --- | --- |
| 顶级收藏 | 珊瑚红 #ff8295 | 800 / 1.06em | 最明显的双层红光 |
| 次级稀有 | 暖金 #f8d58b | 600 / 原字号 | 中等金色柔光 |
| 联赛、战队 | 亮冰蓝 #a5efff | 650 / 原字号 | 增强双层冰蓝柔光 |
| 商店／联动／普通 Bundle | 玫瑰红 → 粉色 → 金色渐变 | 600 / 原字号 | 双层粉红柔光 |
| Mythic | 与商店／Bundle 共用上述渐变 | 600 / 原字号 | 双层粉红柔光 |
| OWL Tokens / Mythic Prisms | 与上述渐变一致 | 600 / 原字号 | 数值与名称一起着色 |

保留 Noire / Demon Hunter 的既有收藏配色；Midas 并入次级稀有，Heart of Hope 并入 Mythic。Nerf Sungerang / Slingerang Weapon 与 Nerf Gelfire Pro Weapon 共用黄橙红蓝渐变。
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
英雄名仍保持普通文字。Owl Guardian 按完整商店皮肤名处理，不误判为 OWL；OWL Tokens 在赛事缩写之前匹配，并包含前面的金额。

参考：[OWL 战队名单](https://overwatch.fandom.com/wiki/Overwatch_League)、[Blizzard OWL 库存公告](https://overwatch.blizzard.com/en-us/news/24096017/complete-your-collection-with-the-overwatch-league-inventory-sale/)、[2023 战队皮肤更新](https://overwatch.blizzard.com/en-us/news/patch-notes/live/2023/03/)。

## 商店／联动／Bundle 皮肤名单：76 个名称 / 别名条目

名称可能有简写或合写，因此 76 个条目不等于 76 款不同皮肤。这一展示层级也涵盖活动、礼包和系列外观，不代表每款皮肤只可付费取得。

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

## 2026-09-12 新增名单及来源

神话补充：
- Tokyo Rebel（Hanzo）：[官方 Season 3 公告](https://overwatch.blizzard.com/en-us/news/24271881/)。
- Void Dancer（Widowmaker）：官方 @PlayOverwatch 发布文案的[可检索镜像](https://www.sotwe.com/playoverwatch)，并与 [Blizzard Steam 新神话礼包（9 月 8 日）](https://store.steampowered.com/app/4815800/)交叉核对。官方新闻正文抓取未成功，不声称已完整读取该篇公告。
- Heart of Hope（Juno）：本次由专属样式迁入神话规则。
- Koi of Duality、Eternal Crystal 已存在，依据[官方 Season 4 公告](https://news.blizzard.com/en-us/article/24295381/reign-of-talon-season-4-heroes-of-busan-brings-out-the-best)保留。

新增 27 个商店／Bundle 名称及别名：
| 系列 | 新增匹配名称 | 对应英雄或范围 |
| --- | --- | --- |
| Hello Kitty and Friends | Hello Kitty、Cinnamoroll、Pompompurin、My Melody、Kuromi、Keroppi | Juno、Kiriko、Mercy、D.Va、Widowmaker、Lúcio |
| Nyan Café | Nyan Café、Nyan Cafe（无重音别名） | Orisa、Reaper、Ashe、Kiriko、Sierra |
| Formalwear | Formalwear、Heir、Evening Wear | Formalwear Mercy、Heir Hanzo、Evening Wear Tracer；同时兼容其他 Formalwear 系列名称 |
| Project YoRHa | 2B、9S、A2、Commander White、Adam | Kiriko、Wuyang、Vendetta、Mercy、Lifeweaver |
| Young Gods | Izanami、Sekhmet、Nezha、Artemis、Shango | Kiriko、Jetpack Cat、Wuyang、Freja、Doomfist |
| Fleece and Fangs | Fancy Fleece、Fancy Fangs | Juno / Mei / Hanzo；Reaper / Vendetta / Mercy |
| Street Rebels | Street Rebel | 系列名称 |
| 已有用户礼包用例 | Poolside、Witch、FEARLESS | 不带 Bundle 后缀时也识别 |

资料：
- [Hello Kitty 官方联动公告](https://overwatch.blizzard.com/en-us/news/24244456/amicizia-ma-eroica-grazie-a-overwatch-x-hello-kitty-friends/)
- [Nyan Café / Street Rebels 官方公告](https://overwatch.blizzard.com/en-us/news/24271881/)
- [Project YoRHa 官方公告（德语）](https://news.blizzard.com/de-de/article/24266704/die-mitte-von-saison-1-setzt-eure-eroberung-der-neuen-aera-fort)
- [Formalwear 官方冬季活动公告](https://overwatch.blizzard.com/en-us/news/24033785/a-flurry-of-fun-returns-to-overwatch-2-winter-wonderland-begins-december-19/)
- [Formalwear Mega Bundle 具体内容核对](https://esportsinsider.com/overwatch-2-formalwear-mega-bundle-details)
- [Young Gods / Fleece and Fangs 官方公告](https://news.blizzard.com/en-us/article/24295381/reign-of-talon-season-4-heroes-of-busan-brings-out-the-best)

上述为本次已收集并加入的系列；没有声明穷尽所有历史商店礼包。用户之前列出的 Lunar New Year / Invasion 等完整 Bundle 名称仍由通用 Bundle 规则着色，但不从礼包标题猜测具体皮肤名称。

## 货币效果

- 数值和货币名一起匹配，如 `2,100 OWL Tokens`、`80 Mythic Prisms`。
- 支持普通数值、逗号千分位、空格／不换行空格千分位；保留原始文字格式。
- 卡片的 Mythic Prisms 独立栏也使用相同彩色效果，所有正数均着色；原先大于 50 的粉色条件由本次规则取代。
- 所有语言共用颜色样式；独立栏目继续显示已有翻译。

## 匹配与维护

- 特殊名字优先于普通短词；同组内优先匹配较长名称。
- Bundle 作为完整名称匹配，支持小写、Café 等重音字母、Mega / Ultra 和 and / &。
- Bundle 命中更高等级皮肤时整体沿用该等级，避免一段名称产生互相嵌套的颜色。优先顺序：ultra-rare → collector → rare → mythic → esports → shop；普通 Bundle 与 shop 共用视觉样式。
- 分隔符支持英文、中文逗号及分号，保留原始标点。
- 保护 Soldier: 76 中的冒号，不将其识别为栏目标题。
- 保留 ✨ 后空格、库存中的换行及原有皮肤拼写。
- 同一规则用于星标描述与普通描述/武器详情，不新增需要翻译的页面文案。所有站点语言共用库存名称和颜色规则。
- 新名字优先加入 rareSkinNames / shopSkinNames；新队名和别名加入 owlTeamNames。不要重新添加独立 replace 颜色代码。
