# Roshine 纯静态手动维护版

此目录可以直接发布到 GitHub Pages，不包含 Discord 机器人、服务器、数据库、Token 或第三方写入凭据。

## 手动更新库存

1. 打开 GitHub 网站仓库中的 `accounts.json`。
2. 点击右上角铅笔按钮进入编辑模式。
3. 修改 `accounts` 数组中的商品记录。
4. 点击 **Commit changes**，填写本次修改说明并提交到发布分支。
5. GitHub Pages 会在提交后重新发布网站。通常等待几分钟并刷新页面即可看到新库存。

## 常用操作

### 标记已售

将对应记录的状态改为：

```json
"status": "Sold"
```

### 暂时保留

```json
"status": "Pending"
```

### 恢复在售

```json
"status": "In Stock"
```

### 修改价格

```json
"price": "$50"
```

### 添加账号

复制一条现有记录，在数组末尾粘贴，然后修改内容。每条记录之间必须保留英文逗号，并确保 `id` 不重复。

## 安全要求

- 不要在仓库中上传 `.env`、Token、密码、登录凭据或私人密钥。
- 不要上传 `server.js`、`database.sqlite`、`accounts.jsbk` 或 Discord 机器人文件。
- `accounts.json` 会被网站访问者公开读取，所以只能保存商品展示信息，不能存放账号登录信息。
- 发布前可使用 JSON 校验网站检查格式；不要把敏感内容粘贴到第三方校验网站。

## 推荐方案

直接在 GitHub 网页编辑 `accounts.json` 是当前最安全、最简单的维护方式。它不需要自建机器人 Token。GitHub Pages 自己的发布流程由 GitHub 管理，不需要你创建个人访问令牌。
