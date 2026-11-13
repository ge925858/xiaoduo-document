# 采用 TypeScript 全栈模块化单体

知笺的块编辑器会产生复杂且持续演进的 JSON 内容结构。我们选择 React + TypeScript 前端与 Node.js + Fastify + TypeScript 后端，共享 Zod Schema、内容类型和 API 校验，而不是拆分出 Java 后端。这个选择优先保证内容模型的一致性、单开发者效率和模块化单体的可维护性；代价是必须在运行时执行严格校验，并把图片处理交给 Sharp 等原生能力而不是在事件循环中执行 CPU 密集任务。
