# Deadlock BanPick

一个基于 `Vite + Vue 3 + TypeScript + Express + Socket.IO + MySQL + Prisma` 的 Deadlock 外部 Ban/Pick 平台。

项目当前已经具备完整的房间大厅、密码房间、房主控制、参与者实时 BP、观众观战、暂停恢复、回合倒计时、数据库持久化和大厅列表同步能力。

## 功能概览

- 大厅浏览公开房间，支持搜索房间名和房间码
- 房主创建房间，使用 4 位数字密码控制访问
- 角色分为房主、参与者、观众
- 支持开始 BP、交换阵营、暂停、恢复、返回上一步、重置房间、删除房间
- 观众可实时看到对局进度，但不能参与操作
- 房间创建 2 小时后自动过期清理
- 所有 BP 记录、房间状态和成员关系写入 MySQL

## 技术栈

- 前端：`Vite`、`Vue 3`、`TypeScript`、`Pinia`
- 后端：`Express`、`Socket.IO`
- 数据库：`MySQL`
- ORM：`Prisma`

## 本地运行

在项目根目录执行：

```bash
npm install
```

复制 [server/.env.example](/C:/APP/programs/shixi/deadlock-banpick/server/.env.example) 为 `server/.env`，填入你的 MySQL 连接信息。

例如：

```env
PORT=3000
CLIENT_ORIGIN=http://localhost:5174
DATABASE_URL="mysql://root:your_password@localhost:3306/deadlock_banpick"
```

然后执行：

```bash
npm run prisma:generate
npm run prisma:migrate
npm run dev:server
npm run dev:frontend
```

默认地址：

- 前端：[http://localhost:5174](http://localhost:5174)
- 后端：[http://localhost:3000](http://localhost:3000)
