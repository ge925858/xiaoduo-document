# 知笺生产部署

## 拓扑

单台腾讯云服务器通过 Docker Compose 运行 `web`、`mysql`、`nginx` 和 `cron`。
MySQL 只在 Compose 内部网络提供 3306，不映射宿主端口。公网只开放 Nginx 的
80/443；Nginx 终止 TLS，并覆盖 `X-Real-IP` 后转发给 Next.js。

## 首次部署

1. 安装 Docker Engine 与 Compose 插件。
2. 将 `deploy/certs/fullchain.pem` 和 `deploy/certs/privkey.pem` 放入证书目录。
3. 从 `.env.example` 创建 `.env`，替换数据库、认证、OSS、分析哈希和站主密码。
4. 确认 `APP_ORIGIN=https://实际域名`，且腾讯云防火墙只开放 22、80、443。
5. 构建并启动：

```sh
docker compose build
docker compose up -d mysql
docker compose run --rm web npx tsx scripts/migrate.ts
docker compose run --rm web npx tsx scripts/create-owner.ts
docker compose up -d
```

6. 检查 `https://实际域名/health` 返回 `{"status":"ok","database":"ok"}`。

## Cron

`cron` 容器启动后立即执行一次 `scripts/cron.ts`，之后每小时运行：

- 清理超过 30 天的章节回收站；
- 重新聚合最近 30 天访问统计；
- 删除超过 30 天的原始访问事件和完整访客 IP。

任务输出为结构化 JSON，可通过 `docker compose logs cron` 查看。

## 可观测性

应用输出结构化 JSON 日志。配置 `SENTRY_DSN` 后，请求错误和未处理异常会同时
发送到 Sentry，并在本地日志中保留事件名、请求路径和错误摘要。日志不得记录
密码、会话 token、邀请 token、访客 IP 或正文内容。

## 明确风险

MVP 不包含自动数据库备份，也不启用 OSS 版本控制。服务器、磁盘、数据库损坏
或误执行破坏性 SQL 可能造成不可恢复的数据丢失。站主应手工执行整站导出，
并按运营要求将导出文件保存到服务器之外。

## 发布后检查

- 公开章节、搜索、RSS、sitemap 和 OG 图片可访问；
- 站主、协作者、读者权限符合权限矩阵；
- `/studio` 未出现在公开导航；
- Nginx 日志能够看到真实来源 IP，应用报表按 `Asia/Shanghai` 聚合；
- 未授权 API 不返回草稿、版本、访客 IP 或报表；
- 上传 Bucket 配置 CORS，仅允许站点来源执行受控 PUT。
