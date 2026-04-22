import type { Server, Socket } from "socket.io";
import { roomService } from "../services/roomService.js";
import type {
  DraftActionType,
  LobbyRoomSummary,
  MemberState,
  RoomState,
  TeamSide,
} from "../types/room.js";

interface RoomAck {
  ok: boolean;
  room?: RoomState;
  rooms?: LobbyRoomSummary[];
  message?: string;
}

interface JoinAck extends RoomAck {
  member?: MemberState;
}

interface DeleteAck {
  ok: boolean;
  roomId?: string;
  message?: string;
}

interface DraftPreviewState {
  blue: string | null;
  red: string | null;
}

const roomDraftPreviews = new Map<string, DraftPreviewState>();

function getDraftPreviewState(roomId: string): DraftPreviewState {
  return roomDraftPreviews.get(roomId) ?? { blue: null, red: null };
}

function broadcastPreview(io: Server, roomId: string) {
  io.to(roomId).emit("draft:preview-state", getDraftPreviewState(roomId));
}

function setDraftPreview(roomId: string, side: TeamSide, heroName: string | null) {
  const nextState = {
    ...getDraftPreviewState(roomId),
    [side]: heroName,
  } satisfies DraftPreviewState;

  roomDraftPreviews.set(roomId, nextState);
  return nextState;
}

function clearDraftPreview(roomId: string) {
  roomDraftPreviews.delete(roomId);
}

async function broadcastLobby(io: Server) {
  const rooms = await roomService.listRooms();
  io.emit("lobby:rooms", rooms);
}

async function broadcastRoom(io: Server, room: RoomState) {
  io.to(room.id).emit("room:state", room);
  await broadcastLobby(io);
}

export function registerRoomHandlers(io: Server, socket: Socket) {
  socket.on("lobby:list", async (callback?: (response: RoomAck) => void) => {
    try {
      const rooms = await roomService.listRooms();
      callback?.({ ok: true, rooms });
    } catch (error) {
      callback?.({
        ok: false,
        message: error instanceof Error ? error.message : "加载大厅失败。",
      });
    }
  });

  socket.on(
    "room:watch",
    async (
      payload: { roomId: string; password: string },
      callback?: (response: RoomAck) => void,
    ) => {
      try {
        const room = await roomService.watchRoom(payload.roomId, payload.password);

        if (!room) {
          callback?.({ ok: false, message: "房间不存在。" });
          return;
        }

        socket.join(room.id);
        socket.emit("draft:preview-state", getDraftPreviewState(room.id));
        callback?.({ ok: true, room });
      } catch (error) {
        callback?.({
          ok: false,
          message: error instanceof Error ? error.message : "订阅房间失败。",
        });
      }
    },
  );

  socket.on(
    "room:join",
    async (
      payload: {
        roomId: string;
        name: string;
        role: "participant" | "spectator";
        password: string;
      },
      callback?: (response: JoinAck) => void,
    ) => {
      try {
        const result = await roomService.joinRoom(payload);

        if (!result) {
          callback?.({ ok: false, message: "房间不存在。" });
          return;
        }

        socket.join(result.room.id);
        socket.emit("draft:preview-state", getDraftPreviewState(result.room.id));
        callback?.({ ok: true, room: result.room, member: result.member });
        await broadcastRoom(io, result.room);
      } catch (error) {
        const message = error instanceof Error ? error.message : "加入房间失败。";
        socket.emit("room:error", { message });
        callback?.({ ok: false, message });
      }
    },
  );

  socket.on(
    "room:start",
    async (
      payload: { roomId: string; requesterId: string },
      callback?: (response: RoomAck) => void,
    ) => {
      try {
        const room = await roomService.startDraft(payload.roomId, payload.requesterId);
        clearDraftPreview(payload.roomId);
        broadcastPreview(io, payload.roomId);
        callback?.({ ok: true, room });
        await broadcastRoom(io, room);
      } catch (error) {
        const message = error instanceof Error ? error.message : "开始 BP 失败。";
        socket.emit("room:error", { message });
        callback?.({ ok: false, message });
      }
    },
  );

  socket.on(
    "room:swap-sides",
    async (
      payload: { roomId: string; requesterId: string },
      callback?: (response: RoomAck) => void,
    ) => {
      try {
        const room = await roomService.swapParticipantSides(payload.roomId, payload.requesterId);
        clearDraftPreview(payload.roomId);
        broadcastPreview(io, payload.roomId);
        callback?.({ ok: true, room });
        await broadcastRoom(io, room);
      } catch (error) {
        const message = error instanceof Error ? error.message : "交换阵营失败。";
        socket.emit("room:error", { message });
        callback?.({ ok: false, message });
      }
    },
  );

  socket.on(
    "room:reset",
    async (
      payload: { roomId: string; requesterId: string },
      callback?: (response: RoomAck) => void,
    ) => {
      try {
        const room = await roomService.resetRoom(payload.roomId, payload.requesterId);
        clearDraftPreview(payload.roomId);
        broadcastPreview(io, payload.roomId);
        callback?.({ ok: true, room });
        await broadcastRoom(io, room);
      } catch (error) {
        const message = error instanceof Error ? error.message : "重置房间失败。";
        socket.emit("room:error", { message });
        callback?.({ ok: false, message });
      }
    },
  );

  socket.on(
    "room:pause",
    async (
      payload: { roomId: string; requesterId: string },
      callback?: (response: RoomAck) => void,
    ) => {
      try {
        const room = await roomService.pauseDraft(payload.roomId, payload.requesterId);
        callback?.({ ok: true, room });
        await broadcastRoom(io, room);
      } catch (error) {
        const message = error instanceof Error ? error.message : "暂停 BP 失败。";
        socket.emit("room:error", { message });
        callback?.({ ok: false, message });
      }
    },
  );

  socket.on(
    "room:resume",
    async (
      payload: { roomId: string; requesterId: string },
      callback?: (response: RoomAck) => void,
    ) => {
      try {
        const room = await roomService.resumeDraft(payload.roomId, payload.requesterId);
        callback?.({ ok: true, room });
        await broadcastRoom(io, room);
      } catch (error) {
        const message = error instanceof Error ? error.message : "恢复 BP 失败。";
        socket.emit("room:error", { message });
        callback?.({ ok: false, message });
      }
    },
  );

  socket.on(
    "room:undo",
    async (
      payload: { roomId: string; requesterId: string },
      callback?: (response: RoomAck) => void,
    ) => {
      try {
        const room = await roomService.undoLastAction(payload.roomId, payload.requesterId);
        clearDraftPreview(payload.roomId);
        broadcastPreview(io, payload.roomId);
        callback?.({ ok: true, room });
        await broadcastRoom(io, room);
      } catch (error) {
        const message = error instanceof Error ? error.message : "撤回上一步失败。";
        socket.emit("room:error", { message });
        callback?.({ ok: false, message });
      }
    },
  );

  socket.on(
    "draft:action",
    async (
      payload: {
        roomId: string;
        actorId: string;
        side: TeamSide;
        action: DraftActionType;
        heroName: string;
      },
      callback?: (response: RoomAck) => void,
    ) => {
      try {
        const room = await roomService.actDraft(payload);
        clearDraftPreview(payload.roomId);
        broadcastPreview(io, payload.roomId);
        callback?.({ ok: true, room });
        await broadcastRoom(io, room);
      } catch (error) {
        const message = error instanceof Error ? error.message : "执行 BP 操作失败。";
        socket.emit("room:error", { message });
        callback?.({ ok: false, message });
      }
    },
  );

  socket.on(
    "draft:preview",
    async (
      payload: { roomId: string; side: TeamSide; heroName: string | null },
      callback?: (response: { ok: boolean; message?: string }) => void,
    ) => {
      try {
        setDraftPreview(payload.roomId, payload.side, payload.heroName);
        broadcastPreview(io, payload.roomId);
        callback?.({ ok: true });
      } catch (error) {
        callback?.({
          ok: false,
          message: error instanceof Error ? error.message : "同步预选失败。",
        });
      }
    },
  );

  socket.on(
    "room:delete",
    async (
      payload: { roomId: string; requesterId: string },
      callback?: (response: DeleteAck) => void,
    ) => {
      try {
        const result = await roomService.deleteRoom(payload.roomId, payload.requesterId);
        clearDraftPreview(payload.roomId);
        io.to(payload.roomId).emit("room:deleted", { roomId: payload.roomId });
        callback?.({ ok: true, roomId: result.roomId });
        await broadcastLobby(io);
      } catch (error) {
        const message = error instanceof Error ? error.message : "删除房间失败。";
        socket.emit("room:error", { message });
        callback?.({ ok: false, message });
      }
    },
  );
}
