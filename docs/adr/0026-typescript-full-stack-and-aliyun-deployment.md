# 正式技术基线采用 TypeScript 全栈、腾讯云应用与阿里云 OSS

Status: accepted

正式版采用 Next.js App Router 模块化单体：React 负责界面，Server Components 和 Route Handlers 负责公开渲染、会话、权限、写入、RSS、站点地图与统计接口，业务代码和 Zod Schema 全部使用 TypeScript 在同一仓库维护。应用使用 Node.js standalone 产物，通过 Docker 运行在腾讯云服务器，由 Nginx 终止 TLS 和转发请求；图片使用阿里云 OSS。MVP 阶段 Next.js 与 MySQL 8.4 部署在同一台腾讯云服务器，通过 Docker Compose 编排，前端和后端在概念上分层但不拆分独立服务。

数据访问采用 Drizzle ORM 和 SQL migration。认证优先采用支持数据库会话、HttpOnly Cookie 和邮箱密码登录的成熟 TypeScript 认证库，候选为 Better Auth；具体版本在实施前完成 MySQL 与 Drizzle 兼容性验证。Tiptap 继续作为编辑器，数据库保存可编辑 JSON、canonical Markdown 和不可变版本。全文搜索使用 MySQL FULLTEXT 与 `ngram` 解析器。访问统计使用自建事件表和聚合表，IP 归属地使用本地 IP 数据库解析。定时清理和日聚合任务使用轻量 Cron Worker，不引入 Redis 和消息队列。

MVP 明确不启用自动数据库备份和 OSS 版本控制。应用内回收站只覆盖章节软删除，不提供数据库损坏、服务器故障或误执行 SQL 后的恢复能力；这一数据丢失风险由站主接受。以后增加 Cron 备份和 OSS 版本控制不需要改变业务模型。
