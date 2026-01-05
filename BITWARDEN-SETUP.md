# Warden - Bitwarden 兼容服务器使用指南

## 📋 概述

Warden 是一个自托管的 Bitwarden 兼容密码管理服务器，支持：

- ✅ 使用官方 Bitwarden 浏览器插件
- ✅ 使用官方 Bitwarden 移动应用
- ✅ 完整的密码管理功能
- ✅ 数据存储在你自己的 Supabase 数据库中

## 🚀 使用 Bitwarden 浏览器插件

### 1. 安装 Bitwarden 浏览器插件

在浏览器中安装官方 Bitwarden 插件：
- **Chrome**: https://chrome.google.com/webstore/detail/bitwarden-password-manager/nngceckbapebfimnlniiiahkandclblb
- **Firefox**: https://addons.mozilla.org/firefox/addon/bitwarden-password-manager/
- **Edge**: https://microsoftedge.microsoft.com/addons/detail/bitwarden-free-password/jbkfoedolllekgbhcbcoahefnbnhhlj

### 2. 配置自托管服务器

安装插件后：

1. **点击 Bitwarden 图标**打开插件
2. 点击 **"创建账户"**
3. 在服务器选择页面，点击 **"自托管"** 或 **"Advanced Options"**
4. 输入你的服务器地址：
   ```
   https://your-edgeone-domain.com
   ```
   将 `your-edgeone-domain.com` 替换为你的实际域名

### 3. 注册账户

1. 输入邮箱地址
2. 设置主密码（至少8个字符）
3. 点击"创建账户"

### 4. 登录

使用刚才创建的账户登录即可开始使用。

## 🌐 API 端点

Warden 实现了以下 Bitwarden 兼容 API：

### 认证相关
- `POST /identity/accounts/prelogin` - 获取 KDF 设置
- `POST /identity/accounts/register/finish` - 完成注册
- `POST /identity/connect/token` - 获取访问令牌
- `POST /identity/accounts/register/send-verification-email` - 发送验证邮件

### 同步相关
- `GET /api/sync` - 同步所有数据
- `GET /api/config` - 获取服务器配置

### 密码项管理
- `POST /api/ciphers/create` - 创建密码项
- `PUT /api/ciphers/{id}` - 更新密码项
- `PUT /api/ciphers/{id}/delete` - 删除密码项

### 文件夹管理
- `POST /api/folders` - 创建文件夹
- `PUT /api/folders/{id}` - 更新文件夹
- `DELETE /api/folders/{id}` - 删除文件夹

### 健康检查
- `GET /api/health` - 健康检查

## 🔧 环境变量

确保以下环境变量已正确配置：

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
SERVER_URL=https://your-domain.com
```

## 📱 支持的客户端

- ✅ Chrome/Brave/Edge 插件
- ✅ Firefox 插件
- ✅ Safari 插件
- ✅ Bitwarden 移动应用（Android/iOS）- 需要在应用设置中配置自托管服务器
- ✅ Bitwarden 桌面应用（Windows/Mac/Linux）

## 🔒 安全特性

- 密码使用 PBKDF2 + SHA-256 哈希存储
- JWT 访问令牌认证
- 所有 API 端点都需要认证（除注册和登录外）
- 支持刷新令牌
- 跨域资源共享（CORS）配置

## ⚠️ 重要提示

1. **HTTPS 必需**：自托管服务器必须使用 HTTPS
2. **备份重要**：定期备份 Supabase 数据库
3. **密码强度**：使用强主密码
4. **更新及时**：保持 Bitwarden 插件为最新版本

## 🐛 故障排除

### 无法连接到服务器

1. 检查服务器 URL 是否正确
2. 确认服务器可以访问
3. 检查浏览器控制台是否有错误信息

### 登录失败

1. 检查邮箱和密码是否正确
2. 尝试清除插件缓存
3. 检查服务器日志

### 同步失败

1. 检查网络连接
2. 确认服务器运行正常
3. 检查 Supabase 数据库连接

## 📞 支持

如有问题，请：
1. 检查浏览器控制台错误信息
2. 查看 EdgeOne 函数日志
3. 检查 Supabase 数据库状态

## 📄 许可证

MIT License
