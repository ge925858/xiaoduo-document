# 知笺正式应用

Next.js App Router、MySQL 8.4 和 Drizzle ORM 的模块化单体。

## 本地命令

```powershell
npm install
npm run db:migrate
$env:OWNER_EMAIL="owner@example.com"
$env:OWNER_PASSWORD="replace-with-a-strong-password"
$env:OWNER_NAME="站主昵称"
npm run db:owner:create
npm run dev
```

正式部署不包含自动数据库备份，也不启用 OSS 版本控制。
