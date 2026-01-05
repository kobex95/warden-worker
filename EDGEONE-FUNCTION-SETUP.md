# EdgeOne 函数配置指南

## 问题

EdgeOne Pages 默认只部署静态文件，需要额外配置才能运行函数作为 Bitwarden API 后端。

## 解决方案

### 方案 1: 使用 EdgeOne 函数（推荐）

#### 步骤 1: 确保 API 代码准备就绪

`api/index.js` 已经实现了完整的 Bitwarden 兼容 API，包括：
- `/identity/accounts/prelogin` - 预登录检查
- `/identity/accounts/register/finish` - 注册
- `/identity/connect/token` - 登录和令牌
- `/api/sync` - 数据同步
- `/api/ciphers/*` - 密码管理
- `/api/folders/*` - 文件夹管理
- `/api/config` - 配置

#### 步骤 2: 配置 EdgeOne 函数路由

`edgeone.config.js` 已配置为：
```javascript
functions: {
  handler: {
    handler: 'api/index.js',
  },
}
```

这应该捕获所有 API 和 identity 请求。

#### 步骤 3: 部署

1. 在 IDE 顶部点击 **EdgeOne Pages**
2. 确认已连接
3. 确保 API 文件夹在项目中
4. 部署

#### 步骤 4: 配置环境变量

在 EdgeOne 控制台中设置：
- `SUPABASE_URL` - https://jxngfaycacjetpiqttwb.supabase.co
- `SUPABASE_ANON_KEY` - sb_publishable_Nwca-b4HH9JFDInZgyrAuQ_C0wsGnhs
- `JWT_SECRET` - M3FEZjJSTXVSZm5zcT46QFtKa2poXV9zO2ZIcFpRbDF1Uj9ud1JEVkVAPEFYXEt0bzdJTU9iNU9xT0hjeTpINg==
- `JWT_REFRESH_SECRET` - XndKU3UwWTtGczBtYVNZPWtMOz9lZzlhQ15Ea0FQWDlxZ3lbTFBXVk07RFo9PHBXZkJETjF2UGpUOzJXNUNjWA==
- `SERVER_URL` - 你的实际域名（部署后更新）

### 方案 2: 单独部署 API 到 EdgeOne 函数

如果方案 1 不工作，可以单独部署：

#### 1. 创建独立的 EdgeOne 函数

在 EdgeOne 控制台：
1. 进入"函数"管理
2. 点击"创建函数"
3. 选择源码托管
4. 指向 `api/index.js`
5. 配置环境变量

#### 2. 配置触发器

设置函数的 HTTP 触发器，路径为 `/*`

#### 3. 获取函数 URL

部署后获得函数 URL，例如：
```
https://function-id.ap-hongkong.tencentcloudapi.com
```

#### 4. 配置 Bitwarden 插件

使用函数 URL 作为服务器地址：
```
https://function-id.ap-hongkong.tencentcloudapi.com
```

### 方案 3: 使用 Cloudflare Workers（备选）

如果 EdgeOne 函数有困难，可以使用 Cloudflare Workers：

1. 登录 Cloudflare Dashboard
2. 进入 Workers & Pages
3. 创建新的 Worker
4. 复制 `api/index.js` 的内容到 Worker
5. 配置环境变量
6. 部署

获得的 Worker URL：
```
https://warden-api.your-subdomain.workers.dev
```

## 测试 API

部署后测试：

### 1. 健康检查
```bash
curl https://your-api-url/api/health
```

期望输出：
```json
{"status":"ok"}
```

### 2. 预登录测试
```bash
curl -X POST https://your-api-url/identity/accounts/prelogin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### 3. 配置测试
```bash
curl https://your-api-url/api/config
```

## 配置 Bitwarden 插件

1. 打开 Bitwarden 插件
2. 选择"自托管"
3. 输入 API URL（根据部署方案）：
   - 方案 1: `https://your-edgeone-pages.com`
   - 方案 2: `https://function-id.ap-hongkong.tencentcloudapi.com`
   - 方案 3: `https://warden-api.your-subdomain.workers.dev`
4. 创建账户
5. 登录

## 故障排除

### 问题: 函数未部署

**症状**: 访问 `/api/health` 返回 404

**解决方案**:
1. 检查 EdgeOne 函数是否已创建
2. 查看函数日志
3. 确认环境变量已设置

### 问题: CORS 错误

**症状**: 浏览器控制台显示 CORS 错误

**解决方案**:
API 已配置 CORS 头，但仍需检查：
- 请求头是否正确
- 是否使用了 HTTPS

### 问题: 环境变量未加载

**症状**: 函数报错无法读取环境变量

**解决方案**:
1. 确认在 EdgeOne 控制台设置环境变量
2. 重启函数
3. 查看函数日志

## 推荐方案

**最佳方案**: 方案 1 - EdgeOne Pages + 函数

原因：
- 单一域名
- 自动部署
- 统一管理
- 成本最低

如果遇到问题，请检查 EdgeOne 控制台的函数日志和错误信息。
