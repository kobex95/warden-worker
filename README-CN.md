# Warden: Bitwarden 兼容的密码管理器

这是一个自托管的 Bitwarden 兼容密码管理器，部署在 EdgeOne Pages 上，使用 Supabase 作为后端数据库。

## 功能特性

*   **核心密码库功能:** 创建、读取、更新、删除密码和文件夹
*   **Bitwarden 兼容:** 支持官方 Bitwarden 浏览器插件和移动应用
*   **Web 界面:** 现代化的网页界面，支持密码管理
*   **搜索功能:** 快速搜索和过滤密码
*   **密码生成器:** 生成强密码，支持自定义选项
*   **收藏功能:** 标记重要密码为收藏
*   **密码强度:** 可视化密码强度指示器
*   **安全:** 数据存储在你自己的 Supabase 数据库中

## 快速开始

### 方式 1: 使用 Web 界面

直接在浏览器中打开部署的 URL：
1. 点击"立即注册"创建账户
2. 使用邮箱和密码登录
3. 开始添加和管理密码

### 方式 2: 使用 Bitwarden 浏览器插件

详细说明请查看 [BITWARDEN-SETUP.md](BITWARDEN-SETUP.md)

1. 安装官方 [Bitwarden 浏览器插件](https://bitwarden.com/download/)
2. 点击 Bitwarden 图标
3. 选择"自托管"
4. 输入你的服务器地址：`https://your-domain.com`
5. 创建账户并登录

## 系统架构

- **前端:** 纯 JavaScript 网页应用
- **后端:** EdgeOne 函数（Bitwarden 兼容 API）
- **数据库:** Supabase PostgreSQL
- **部署:** EdgeOne Pages

## 支持的客户端

*   **浏览器插件:** Chrome, Firefox, Safari, Edge
*   **移动应用:** Android 和 iOS Bitwarden 应用
*   **桌面应用:** Windows, Mac, Linux Bitwarden 应用

## 安全特性

*   密码使用 PBKDF2 + SHA-256 哈希存储
*   基于 JWT 的身份验证
*   所有 API 端点需要认证（注册和登录除外）
*   需要 HTTPS
*   数据存储在你私有的 Supabase 数据库中

## API 端点

项目实现了完整的 Bitwarden 兼容 API，包括：

- `POST /identity/accounts/prelogin` - 获取 KDF 设置
- `POST /identity/accounts/register/finish` - 完成注册
- `POST /identity/connect/token` - 获取访问令牌
- `GET /api/sync` - 同步所有数据
- `GET /api/config` - 获取服务器配置
- `POST /api/ciphers/create` - 创建密码项
- `PUT /api/ciphers/{id}` - 更新密码项
- `PUT /api/ciphers/{id}/delete` - 删除密码项
- `POST /api/folders` - 创建文件夹
- `PUT /api/folders/{id}` - 更新文件夹
- `DELETE /api/folders/{id}` - 删除文件夹

详细 API 文档请查看 [BITWARDEN-SETUP.md](BITWARDEN-SETUP.md)

## 许可证

本项目采用 MIT 许可证。详见 `LICENSE` 文件。
