# Roshine Account Details

只读客户展示页： https://roshine.love/acc_details/ 。可输入商品数字 ID，或访问 /acc_details/#18。
支持 EN / FR / DE / AR / JA；语言优先级与主站一致：有效 URL 参数 → 保存偏好 → 主站预设语言 → 浏览器 → 英文。
切换语言保留当前账号 ID，导航回主站时保留语言。英雄、皮肤、段位原名不机器翻译。

## 当前库存保持不变

accounts.json 不因整合或导入而变动。所有卡片按钮改名 View Details：
- 没有导入详情：保持原 screenshot 链接。
- 导入了详情：自动链接 /acc_details/?lang=en#商品ID。
- 两者都缺失：提示暂无详情，不跳转其他账号。
- 详情索引请求失败：现有库存仍正常显示，保留原截图链接。

当前索引为空，不把示例或其他账号资料冒充真实库存。未来新账号先按原流程添加商品，再导入它的快照。

## 导入真实快照

在网站仓库运行：

```powershell
node tools/import-hero-gallery-account.mjs C:\path\to\snapshot.json 18
```

18 必须存在于 accounts.json，且与快照 accountId 一致。更新已存在详情需明确加 --replace。
脚本固定名称为 Account #ID，只保留展示白名单；校验数字、完整/部分状态、重复商品和身份绑定。
使用文件锁防止并行导入互相覆盖。异常中断遗留 account_details.json.lock 时，先确认导入进程已结束再处理锁。

导入生成两个文件，确认后一起提交：
- account_details.json：轻量索引（schemaVersion 2）。
- acc_details/data/18.json：该账号的公开快照。

只选择当前账号的数据文件，不下载全库存的皮肤详情。兼容原 schemaVersion 1 内嵌快照。
导入保留其他账号、已确认的 0 和 complete / partial。神话棱镜、当前竞技点缺失或为 null 时默认 0；其他未知余额仍为 null。详情页兼容旧快照的相同规则，默认值不等于已扫描确认。
完整采集不代表拥有完整目录；未采集物品不推断为未拥有。未知目录 ID 与联赛原名保留为暂无图片。
目前展示 5 种货币、6 个栏目；lootBoxes 保留字段但不显示。

## 本地预览与验证

在网站根目录运行 HTTP 服务，再访问 http://127.0.0.1:8767/acc_details/ 。不要用 file:// 打开。
运行 node tests/details-contract.cjs、node tests/hero-gallery-import.cjs 和 node tests/details-browser.cjs。
浏览器测试使用 Playwright；具体环境配置见 tests/README.md。
皮肤图片优先使用 https://github.com/ValentinZeller/overwatch_skins ，存在对应文件时使用该仓库的原图和 _web 缩略图；找不到或加载失败再使用 https://overwatch.fandom.com/wiki/Heroes_skins 的已收录图片。两个来源都缺失时保留占位，不用相似皮肤冒充。
更新图片路径运行 node tools/prioritize-skin-images.cjs；通过 GitHub 文件树核对路径，只更新图片与来源，不改皮肤 ID、目录顺序或账号拥有数据。外部目录未必收录所有新皮肤。
武器皮肤在该 GitHub 图库未收录时继续使用原 Fandom 武器图片。
旧浏览器使用弹窗回退，不依赖 Safari 16.4 的正则后行断言或新版 Array.at。

## 隐私边界

公开静态 JSON 可被任何访问者读取，不是私密存储。
禁止上传 BattleTag、邮箱、密码、验证码、游戏截图、OCR 原文、日志、runs 或 .venv。
采集器仅本地使用，不随网站发布。该版本不提供登录、远程采集或账号编辑接口。
