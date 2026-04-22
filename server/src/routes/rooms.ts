import { Router } from "express";
import { roomService } from "../services/roomService.js";
import type { RoomSettings } from "../types/room.js";

const ROOM_PASSWORD_PATTERN = /^\d{4}$/;

export const roomRouter = Router();

roomRouter.get("/", async (_req, res) => {
  try {
    const rooms = await roomService.listRooms();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "加载大厅失败。",
    });
  }
});

roomRouter.post("/", async (req, res) => {
  try {
    const hostName = String(req.body?.hostName ?? "Host").trim();
    const roomName = String(req.body?.roomName ?? "").trim();
    const password = String(req.body?.password ?? "").trim();
    const settings = (req.body?.settings ?? undefined) as Partial<RoomSettings> | undefined;

    if (!hostName || !roomName || !password) {
      res.status(400).json({ message: "请完整填写房主昵称、房间名称和房间密码。" });
      return;
    }

    if (!ROOM_PASSWORD_PATTERN.test(password)) {
      res.status(400).json({ message: "房间密码必须是 4 位数字。" });
      return;
    }

    const result = await roomService.createRoom({ hostName, roomName, password, settings });
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "创建房间失败。",
    });
  }
});

roomRouter.get("/:roomId", async (req, res) => {
  try {
    const password = String(req.query.password ?? "");
    if (!password) {
      res.status(400).json({ message: "缺少房间密码。" });
      return;
    }

    const room = await roomService.watchRoom(req.params.roomId, password);

    if (!room) {
      res.status(404).json({ message: "房间不存在。" });
      return;
    }

    res.json(room);
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : "查询房间失败。",
    });
  }
});

roomRouter.delete("/:roomId", async (req, res) => {
  try {
    const requesterId = String(req.body?.memberId ?? "");
    if (!requesterId) {
      res.status(400).json({ message: "缺少 memberId。" });
      return;
    }

    await roomService.deleteRoom(req.params.roomId, requesterId);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : "删除房间失败。",
    });
  }
});
