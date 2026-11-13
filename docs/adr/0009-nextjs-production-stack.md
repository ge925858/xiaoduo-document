# 正式版采用 Next.js 公共站与写作后台

Status: accepted

公开知识网站需要稳定 URL、SEO、RSS、站点地图和按发布内容重新生成页面，而现有 Vite 原型只用于快速确认交互。正式版采用 Next.js App Router + TypeScript + React + Tailwind + Tiptap 的模块化单体：公开页通过 Server Components、SSR 和按需重新验证输出，`/studio` 使用服务端路由处理 HttpOnly Cookie 会话、权限、内容写入和 Markdown 导入。数据使用 MySQL 8.4 + Drizzle，图片继续使用阿里云 OSS。这个方案取代 ADR-0005 中独立的 Vite 前端与 Fastify API 组合。
