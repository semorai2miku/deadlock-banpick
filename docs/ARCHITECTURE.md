# 项目架构说明

## 项目目标

这个项目是一个运行在游戏外部的 Deadlock Ban/Pick 网站，核心目标是让房主、两位参与者和观众在同一个房间中完成一整局可观战、可回退、可持久化的 BP 流程。

## 角色模型

一个房间内有三类用户：

- 房主：创建房间、控制流程、管理房间，不直接参与 BP
- 参与者：各自占据一个阵营位置，负责 Ban/Pick 操作
- 观众：只能查看，不能操作

## 前后端职责划分

### 前端

前端负责展示房间大厅、房间页和 BP 界面，并维护当前用户的本地身份。

核心文件：

- [frontend/src/views/HomeView.vue](/C:/APP/programs/shixi/deadlock-banpick/frontend/src/views/HomeView.vue)
  大厅页，负责展示公开房间、搜索房间、创建房间和通过房间码进入。
- [frontend/src/views/RoomView.vue](/C:/APP/programs/shixi/deadlock-banpick/frontend/src/views/RoomView.vue)
  房间页，负责密码进入、身份加入、BP 展示、房主管理按钮和席位展示。
- [frontend/src/stores/banpick.ts](/C:/APP/programs/shixi/deadlock-banpick/frontend/src/stores/banpick.ts)
  统一维护大厅状态、房间状态、Socket 同步、本地身份恢复和房主管理操作。

### 后端

后端负责房间规则校验、数据库持久化、实时广播和权限控制。

核心文件：

- [server/src/routes/rooms.ts](/C:/APP/programs/shixi/deadlock-banpick/server/src/routes/rooms.ts)
  提供大厅查询、创建房间、获取房间状态等 REST 接口。
- [server/src/socket/registerRoomHandlers.ts](/C:/APP/programs/shixi/deadlock-banpick/server/src/socket/registerRoomHandlers.ts)
  负责大厅列表广播、房间订阅、加入房间、实时 BP、暂停恢复、返回上一步等 Socket 事件。
- [server/src/services/roomService.ts](/C:/APP/programs/shixi/deadlock-banpick/server/src/services/roomService.ts)
  项目核心服务层，处理房间状态机、权限校验、房间密码、过期清理、对局推进和数据序列化。

## 数据库设计

数据库使用 MySQL，通过 Prisma 管理模型和迁移。

相关文件：

- [prisma/schema.prisma](/C:/APP/programs/shixi/deadlock-banpick/prisma/schema.prisma)

核心表：

- `Room`
  保存房间基础信息、密码哈希、是否公开、是否允许观众、回合时间和过期时间。
- `RoomMember`
  保存房间成员与身份，包括房主、参与者、观众，以及参与者所属阵营。
- `Match`
  保存一局 BP 的状态，例如当前回合、开始时间、暂停时间和是否结束。
- `DraftAction`
  保存每一手实际发生的 ban 或 pick 记录。

## 业务流程

### 1. 创建房间

房主在大厅中填写：

- 房主昵称
- 房间名称
- 4 位数字密码
- 回合时间
- 是否公开
- 是否允许观众

房间创建后会立即写入数据库，并同步出现在大厅中。

### 2. 进入房间

用户进入房间链接后，必须先输入房间密码。验证通过后，才能继续选择身份：

- 参与者
- 观众

### 3. 开始 BP

当两位参与者都到位后，房主可以手动开始 BP。BP 过程中，服务端会根据房间配置中的规则和时间限制推进对局。

### 4. 实时同步

Socket.IO 负责将以下变化即时广播给房间内所有人：

- 房间状态变化
- 当前回合变化
- 预选状态变化
- 已确认的 ban/pick 记录
- 房主的暂停、恢复、重置、撤回和删除操作

### 5. 持久化与恢复

房间、成员、对局与每一手 DraftAction 都写入数据库，因此服务重启后仍可恢复。

此外，前端会把当前房间密码和本地成员身份记录在 `localStorage` 中，用于刷新页面后的身份恢复。

## 为什么这样设计

### REST 负责“初始化”

REST 更适合做：

- 获取大厅初始列表
- 创建房间
- 首次读取房间状态

### Socket 负责“持续同步”

Socket 更适合做：

- 房间实时更新
- 预选同步
- 行为广播
- 大厅自动刷新

这样的拆分让项目结构更清晰，也更接近真实线上协作系统的设计方式。
