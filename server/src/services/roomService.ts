import {
  DraftActionType as PrismaDraftActionType,
  MatchStatus,
  Prisma,
  RoomRole as PrismaRoomRole,
  RoomStatus,
  TeamSide as PrismaTeamSide,
} from "@prisma/client";
import { createHash, randomUUID } from "node:crypto";
import { defaultDraftRules, defaultHeroes } from "../constants/draft.js";
import { prisma } from "../lib/prisma.js";
import type {
  DraftActionType,
  DraftRuleStep,
  DraftTurn,
  LobbyRoomSummary,
  MemberState,
  RoomRole,
  RoomSettings,
  RoomState,
  TeamSide,
} from "../types/room.js";

const ROOM_TTL_MS = 2 * 60 * 60 * 1000;
const MIN_TIME_LIMIT = 15;
const MAX_TIME_LIMIT = 90;
const ROOM_PASSWORD_PATTERN = /^\d{4}$/;

const roomInclude = {
  host: true,
  members: {
    include: {
      user: true,
    },
    orderBy: {
      joinedAt: "asc",
    },
  },
  matches: {
    take: 1,
    orderBy: {
      startedAt: "desc",
    },
    include: {
      actions: {
        orderBy: {
          turnOrder: "asc",
        },
      },
    },
  },
} satisfies Prisma.RoomInclude;

type RoomWithRelations = Prisma.RoomGetPayload<{
  include: typeof roomInclude;
}>;

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

function validateRoomPassword(password: string) {
  if (!ROOM_PASSWORD_PATTERN.test(password)) {
    throw new Error("房间密码必须是 4 位数字。");
  }
}

function mapSide(side: PrismaTeamSide | null): TeamSide | null {
  if (!side) {
    return null;
  }

  return side === "BLUE" ? "blue" : "red";
}

function mapRole(role: PrismaRoomRole): RoomRole {
  if (role === "HOST") {
    return "host";
  }

  if (role === "SPECTATOR") {
    return "spectator";
  }

  return "participant";
}

function mapRoomStatus(status: RoomStatus): RoomState["status"] {
  if (status === "DRAFTING") {
    return "drafting";
  }

  if (status === "PAUSED") {
    return "paused";
  }

  if (status === "FINISHED") {
    return "finished";
  }

  return "waiting";
}

function toPrismaSide(side: TeamSide): PrismaTeamSide {
  return side === "blue" ? "BLUE" : "RED";
}

function toPrismaAction(action: DraftActionType): PrismaDraftActionType {
  return action;
}

function normalizeTimeLimit(value: number) {
  if (!Number.isFinite(value)) {
    return 30;
  }

  if (value <= 0) {
    return 0;
  }

  const rounded = Math.round(value / 5) * 5;
  return Math.min(MAX_TIME_LIMIT, Math.max(MIN_TIME_LIMIT, rounded));
}

function expandDraftRules(rules: DraftRuleStep[]): DraftTurn[] {
  const expanded: DraftTurn[] = [];
  let order = 1;

  for (const step of rules) {
    for (let index = 0; index < step.count; index += 1) {
      expanded.push({
        order,
        side: step.side,
        action: step.action,
        count: step.count,
      });
      order += 1;
    }
  }

  return expanded;
}

function normalizeDraftRules(value: unknown): DraftRuleStep[] {
  if (!Array.isArray(value) || !value.length) {
    return defaultDraftRules;
  }

  const normalized = value
    .map((step) => {
      if (!step || typeof step !== "object") {
        return null;
      }

      const candidate = step as Record<string, unknown>;
      const side = candidate.side === "red" ? "red" : candidate.side === "blue" ? "blue" : null;
      const action =
        candidate.action === "BAN" ? "BAN" : candidate.action === "PICK" ? "PICK" : null;
      const count = Number(candidate.count);

      if (!side || !action || !Number.isInteger(count) || count < 1 || count > 2) {
        return null;
      }

      return {
        side,
        action,
        count,
      } satisfies DraftRuleStep;
    })
    .filter((step): step is DraftRuleStep => !!step);

  if (!normalized.length) {
    return defaultDraftRules;
  }

  const totalPicks = normalized.reduce(
    (sum, step) => sum + (step.action === "PICK" ? step.count : 0),
    0,
  );
  const totalBans = normalized.reduce(
    (sum, step) => sum + (step.action === "BAN" ? step.count : 0),
    0,
  );
  const bluePicks = normalized.reduce(
    (sum, step) => sum + (step.side === "blue" && step.action === "PICK" ? step.count : 0),
    0,
  );
  const redPicks = normalized.reduce(
    (sum, step) => sum + (step.side === "red" && step.action === "PICK" ? step.count : 0),
    0,
  );
  const blueBans = normalized.reduce(
    (sum, step) => sum + (step.side === "blue" && step.action === "BAN" ? step.count : 0),
    0,
  );
  const redBans = normalized.reduce(
    (sum, step) => sum + (step.side === "red" && step.action === "BAN" ? step.count : 0),
    0,
  );

  if (bluePicks !== redPicks || blueBans !== redBans || totalPicks < 2 || totalBans < 2) {
    throw new Error("BP 规则无效，请保证双方的 pick 和 ban 数量一致。");
  }

  return normalized;
}

function normalizeRoomSettings(value: Partial<RoomSettings> | undefined): RoomSettings {
  return {
    timeLimitSeconds: normalizeTimeLimit(value?.timeLimitSeconds ?? 30),
    draftRules: normalizeDraftRules(value?.draftRules),
    isPublic: value?.isPublic ?? true,
    allowSpectators: value?.allowSpectators ?? true,
  };
}

function toDraftRulesJson(rules: DraftRuleStep[]): Prisma.InputJsonValue {
  return rules as unknown as Prisma.InputJsonValue;
}

function parseRoomSettings(
  room: Pick<
    RoomWithRelations,
    "timeLimitSeconds" | "draftRules" | "isPublic" | "allowSpectators"
  >,
): RoomSettings {
  return {
    timeLimitSeconds: normalizeTimeLimit(room.timeLimitSeconds),
    draftRules: normalizeDraftRules(room.draftRules),
    isPublic: room.isPublic,
    allowSpectators: room.allowSpectators,
  };
}

function toMemberState(member: RoomWithRelations["members"][number]): MemberState {
  return {
    id: member.user.id,
    name: member.user.name,
    role: mapRole(member.role),
    side: mapSide(member.side),
  };
}

function serializeRoom(room: RoomWithRelations): RoomState {
  const latestMatch = room.matches[0];
  const actions = latestMatch?.actions ?? [];
  const members = room.members.map(toMemberState);
  const hostMember =
    members.find((member) => member.role === "host") ?? {
      id: room.host.id,
      name: room.host.name,
      role: "host" as const,
      side: null,
    };

  return {
    id: room.id,
    code: room.code,
    name: room.name,
    hostId: room.hostId,
    status: mapRoomStatus(room.status),
    settings: parseRoomSettings(room),
    host: hostMember,
    participants: members.filter((member) => member.role === "participant"),
    spectators: members.filter((member) => member.role === "spectator"),
    heroPool: defaultHeroes,
    currentTurnIndex: latestMatch?.currentTurnIndex ?? 0,
    currentTurnStartedAt: (latestMatch?.turnStartedAt ?? room.createdAt).toISOString(),
    pausedAt: latestMatch?.pausedAt?.toISOString() ?? null,
    expiresAt: room.expiresAt.toISOString(),
    blueBans: actions
      .filter((action) => action.side === "BLUE" && action.actionType === "BAN")
      .map((action) => action.heroName),
    redBans: actions
      .filter((action) => action.side === "RED" && action.actionType === "BAN")
      .map((action) => action.heroName),
    bluePicks: actions
      .filter((action) => action.side === "BLUE" && action.actionType === "PICK")
      .map((action) => action.heroName),
    redPicks: actions
      .filter((action) => action.side === "RED" && action.actionType === "PICK")
      .map((action) => action.heroName),
    records: actions.map((action) => ({
      order: action.turnOrder,
      side: mapSide(action.side)!,
      action: action.actionType as DraftActionType,
      heroName: action.heroName,
      actorId: action.actorId,
      at: action.createdAt.toISOString(),
    })),
  };
}

function serializeLobbyRoom(room: RoomWithRelations): LobbyRoomSummary {
  const latestMatch = room.matches[0];
  const participants = room.members.filter((member) => member.role === "PARTICIPANT");
  const spectators = room.members.filter((member) => member.role === "SPECTATOR");

  return {
    id: room.id,
    code: room.code,
    name: room.name,
    status: mapRoomStatus(room.status),
    settings: {
      timeLimitSeconds: normalizeTimeLimit(room.timeLimitSeconds),
      isPublic: room.isPublic,
      allowSpectators: room.allowSpectators,
    },
    hostName: room.host.name,
    participantCount: participants.length,
    spectatorCount: spectators.length,
    currentTurnIndex: latestMatch?.currentTurnIndex ?? 0,
    expiresAt: room.expiresAt.toISOString(),
    updatedAt: room.updatedAt.toISOString(),
  };
}

async function cleanupExpiredRooms(tx: Prisma.TransactionClient | typeof prisma = prisma) {
  await tx.room.deleteMany({
    where: {
      expiresAt: {
        lte: new Date(),
      },
    },
  });
}

async function loadRoom(roomId: string, tx: Prisma.TransactionClient | typeof prisma = prisma) {
  return tx.room.findUnique({
    where: { id: roomId },
    include: roomInclude,
  });
}

async function setRoomAndMatchStatus(
  tx: Prisma.TransactionClient | typeof prisma,
  roomId: string,
  roomStatus: RoomStatus,
  matchStatus: MatchStatus,
  currentTurnIndex?: number,
  turnStartedAt?: Date,
  pausedAt?: Date | null,
) {
  await tx.room.update({
    where: { id: roomId },
    data: {
      status: roomStatus,
    },
  });

  const match = await tx.match.findFirst({
    where: { roomId },
    orderBy: { startedAt: "desc" },
  });

  if (!match) {
    return;
  }

  await tx.match.update({
    where: { id: match.id },
    data: {
      status: matchStatus,
      currentTurnIndex: currentTurnIndex ?? match.currentTurnIndex,
      turnStartedAt: turnStartedAt ?? match.turnStartedAt,
      pausedAt: typeof pausedAt === "undefined" ? match.pausedAt : pausedAt,
      finishedAt: matchStatus === "FINISHED" ? new Date() : null,
    },
  });
}

async function assertRoomPassword(
  roomId: string,
  password: string,
  tx: Prisma.TransactionClient | typeof prisma = prisma,
) {
  const room = await tx.room.findUnique({
    where: { id: roomId },
    select: {
      passwordHash: true,
      expiresAt: true,
    },
  });

  if (!room || room.expiresAt <= new Date()) {
    throw new Error("房间不存在或已过期。");
  }

  if (room.passwordHash !== hashPassword(password)) {
    throw new Error("房间密码错误。");
  }
}

async function assertHost(
  roomId: string,
  requesterId: string,
  tx: Prisma.TransactionClient | typeof prisma,
) {
  const room = await tx.room.findUnique({
    where: { id: roomId },
    select: {
      hostId: true,
      expiresAt: true,
    },
  });

  if (!room || room.expiresAt <= new Date()) {
    throw new Error("房间不存在或已过期。");
  }

  if (room.hostId !== requesterId) {
    throw new Error("只有房主可以执行这个操作。");
  }
}

async function listRooms() {
  await cleanupExpiredRooms();

  const rooms = await prisma.room.findMany({
    where: {
      isPublic: true,
    },
    include: roomInclude,
    orderBy: {
      updatedAt: "desc",
    },
  });

  return rooms.map(serializeLobbyRoom);
}

async function createRoom(params: {
  hostName: string;
  roomName: string;
  password: string;
  settings?: Partial<RoomSettings>;
}) {
  return prisma.$transaction(async (tx) => {
    await cleanupExpiredRooms(tx);
    validateRoomPassword(params.password);

    const settings = normalizeRoomSettings(params.settings);

    const host = await tx.user.create({
      data: {
        name: params.hostName,
      },
    });

    const room = await tx.room.create({
      data: {
        code: randomUUID().slice(0, 6).toUpperCase(),
        name: params.roomName,
        passwordHash: hashPassword(params.password),
        status: "WAITING",
        hostId: host.id,
        timeLimitSeconds: settings.timeLimitSeconds,
        draftRules: toDraftRulesJson(settings.draftRules),
        isPublic: settings.isPublic,
        allowSpectators: settings.allowSpectators,
        expiresAt: new Date(Date.now() + ROOM_TTL_MS),
        members: {
          create: {
            userId: host.id,
            role: "HOST",
            side: null,
          },
        },
        matches: {
          create: {
            status: "WAITING",
            currentTurnIndex: 0,
            turnStartedAt: new Date(),
            pausedAt: null,
          },
        },
      },
      include: roomInclude,
    });

    return {
      room: serializeRoom(room),
      member: {
        id: host.id,
        name: host.name,
        role: "host" as const,
        side: null,
      },
    };
  });
}

async function getRoom(roomId: string) {
  await cleanupExpiredRooms();
  const room = await loadRoom(roomId);
  return room ? serializeRoom(room) : null;
}

async function joinRoom(params: {
  roomId: string;
  name: string;
  role: "participant" | "spectator";
  password: string;
}) {
  return prisma.$transaction(async (tx) => {
    await cleanupExpiredRooms(tx);
    await assertRoomPassword(params.roomId, params.password, tx);

    const room = await loadRoom(params.roomId, tx);

    if (!room) {
      return null;
    }

    const participantMembers = room.members.filter((member) => member.role === "PARTICIPANT");

    if (params.role === "participant" && participantMembers.length >= 2) {
      throw new Error("参与者名额已满。");
    }

    if (params.role === "spectator" && !room.allowSpectators) {
      throw new Error("当前房间未开放观众加入。");
    }

    const user = await tx.user.create({
      data: {
        name: params.name,
      },
    });

    let side: PrismaTeamSide | null = null;
    let role: PrismaRoomRole = "SPECTATOR";

    if (params.role === "participant") {
      role = "PARTICIPANT";
      side = participantMembers.some((member) => member.side === "BLUE") ? "RED" : "BLUE";
    }

    await tx.roomMember.create({
      data: {
        roomId: params.roomId,
        userId: user.id,
        role,
        side,
      },
    });

    const updatedRoom = await loadRoom(params.roomId, tx);
    if (!updatedRoom) {
      throw new Error("房间不存在或已过期。");
    }

    return {
      room: serializeRoom(updatedRoom),
      member: {
        id: user.id,
        name: user.name,
        role: params.role,
        side: mapSide(side),
      },
    };
  });
}

async function watchRoom(roomId: string, password: string) {
  await cleanupExpiredRooms();
  await assertRoomPassword(roomId, password);
  const room = await loadRoom(roomId);
  return room ? serializeRoom(room) : null;
}

async function startDraft(roomId: string, requesterId: string) {
  return prisma.$transaction(async (tx) => {
    await cleanupExpiredRooms(tx);
    await assertHost(roomId, requesterId, tx);

    const room = await loadRoom(roomId, tx);
    if (!room) {
      throw new Error("房间不存在或已过期。");
    }

    const participants = room.members.filter((member) => member.role === "PARTICIPANT");
    if (participants.length !== 2) {
      throw new Error("需要两位参与者都加入后才能开始 BP。");
    }

    const latestMatch = room.matches[0];
    if (!latestMatch) {
      throw new Error("房间缺少对局记录。");
    }

    if (room.status === "DRAFTING" || room.status === "PAUSED") {
      throw new Error("当前房间已经开始 BP。");
    }

    if (latestMatch.actions.length > 0) {
      throw new Error("当前对局已有操作记录，请先重置房间。");
    }

    await setRoomAndMatchStatus(tx, roomId, "DRAFTING", "DRAFTING", 0, new Date());

    const updatedRoom = await loadRoom(roomId, tx);
    if (!updatedRoom) {
      throw new Error("房间不存在或已过期。");
    }

    return serializeRoom(updatedRoom);
  });
}

async function swapParticipantSides(roomId: string, requesterId: string) {
  return prisma.$transaction(async (tx) => {
    await cleanupExpiredRooms(tx);
    await assertHost(roomId, requesterId, tx);

    const room = await loadRoom(roomId, tx);
    if (!room) {
      throw new Error("房间不存在或已过期。");
    }

    if (room.status === "DRAFTING" || room.status === "PAUSED") {
      throw new Error("BP 进行中不能交换阵营。");
    }

    const participants = room.members.filter((member) => member.role === "PARTICIPANT");
    if (participants.length !== 2 || !participants[0].side || !participants[1].side) {
      throw new Error("需要两位参与者都加入后才能交换阵营。");
    }

    for (const participant of participants) {
      await tx.roomMember.update({
        where: { id: participant.id },
        data: {
          side: participant.side === "BLUE" ? "RED" : "BLUE",
        },
      });
    }

    const updatedRoom = await loadRoom(roomId, tx);
    if (!updatedRoom) {
      throw new Error("房间不存在或已过期。");
    }

    return serializeRoom(updatedRoom);
  });
}

async function resetRoom(roomId: string, requesterId: string) {
  return prisma.$transaction(async (tx) => {
    await cleanupExpiredRooms(tx);
    await assertHost(roomId, requesterId, tx);

    const room = await loadRoom(roomId, tx);
    if (!room) {
      throw new Error("房间不存在或已过期。");
    }

    await tx.match.create({
      data: {
        roomId,
        status: "WAITING",
        currentTurnIndex: 0,
        turnStartedAt: new Date(),
        pausedAt: null,
      },
    });

    await tx.room.update({
      where: { id: roomId },
      data: {
        status: "WAITING",
      },
    });

    const updatedRoom = await loadRoom(roomId, tx);
    if (!updatedRoom) {
      throw new Error("房间不存在或已过期。");
    }

    return serializeRoom(updatedRoom);
  });
}

async function pauseDraft(roomId: string, requesterId: string) {
  return prisma.$transaction(async (tx) => {
    await cleanupExpiredRooms(tx);
    await assertHost(roomId, requesterId, tx);

    const room = await loadRoom(roomId, tx);
    if (!room) {
      throw new Error("房间不存在或已过期。");
    }

    const latestMatch = room.matches[0];
    if (!latestMatch || room.status !== "DRAFTING" || latestMatch.status !== "DRAFTING") {
      throw new Error("当前房间不在进行中的 BP 状态。");
    }

    const pausedAt = new Date();
    await setRoomAndMatchStatus(tx, roomId, "PAUSED", "PAUSED", undefined, undefined, pausedAt);

    const updatedRoom = await loadRoom(roomId, tx);
    if (!updatedRoom) {
      throw new Error("房间不存在或已过期。");
    }

    return serializeRoom(updatedRoom);
  });
}

async function resumeDraft(roomId: string, requesterId: string) {
  return prisma.$transaction(async (tx) => {
    await cleanupExpiredRooms(tx);
    await assertHost(roomId, requesterId, tx);

    const room = await loadRoom(roomId, tx);
    if (!room) {
      throw new Error("房间不存在或已过期。");
    }

    const latestMatch = room.matches[0];
    if (!latestMatch || room.status !== "PAUSED" || latestMatch.status !== "PAUSED") {
      throw new Error("当前房间不在暂停状态。");
    }

    const now = new Date();
    const pausedAt = latestMatch.pausedAt ?? now;
    const pauseDuration = now.getTime() - pausedAt.getTime();
    const resumedTurnStartedAt = new Date(latestMatch.turnStartedAt.getTime() + pauseDuration);

    await setRoomAndMatchStatus(
      tx,
      roomId,
      "DRAFTING",
      "DRAFTING",
      undefined,
      resumedTurnStartedAt,
      null,
    );

    const updatedRoom = await loadRoom(roomId, tx);
    if (!updatedRoom) {
      throw new Error("房间不存在或已过期。");
    }

    return serializeRoom(updatedRoom);
  });
}

async function undoLastAction(roomId: string, requesterId: string) {
  return prisma.$transaction(async (tx) => {
    await cleanupExpiredRooms(tx);
    await assertHost(roomId, requesterId, tx);

    const room = await loadRoom(roomId, tx);
    if (!room) {
      throw new Error("房间不存在或已过期。");
    }

    const latestMatch = room.matches[0];
    if (!latestMatch) {
      throw new Error("房间缺少对局记录。");
    }

    const latestAction = latestMatch.actions[latestMatch.actions.length - 1];
    if (!latestAction) {
      throw new Error("当前没有可撤回的操作。");
    }

    await tx.draftAction.delete({
      where: { id: latestAction.id },
    });

    const remainingCount = latestMatch.actions.length - 1;
    const shouldStayPaused = room.status === "PAUSED" || latestMatch.status === "PAUSED";

    await setRoomAndMatchStatus(
      tx,
      roomId,
      shouldStayPaused ? "PAUSED" : "DRAFTING",
      shouldStayPaused ? "PAUSED" : "DRAFTING",
      Math.max(0, remainingCount),
      new Date(),
      shouldStayPaused ? latestMatch.pausedAt ?? new Date() : null,
    );

    const updatedRoom = await loadRoom(roomId, tx);
    if (!updatedRoom) {
      throw new Error("房间不存在或已过期。");
    }

    return serializeRoom(updatedRoom);
  });
}

async function actDraft(params: {
  roomId: string;
  actorId: string;
  side: TeamSide;
  action: DraftActionType;
  heroName: string;
}) {
  return prisma.$transaction(async (tx) => {
    await cleanupExpiredRooms(tx);

    const room = await loadRoom(params.roomId, tx);

    if (!room) {
      throw new Error("房间不存在或已过期。");
    }

    const currentMatch = room.matches[0];
    if (!currentMatch) {
      throw new Error("房间缺少对局记录。");
    }

    const actor = room.members.find((member) => member.userId === params.actorId);
    if (!actor || actor.role !== "PARTICIPANT") {
      throw new Error("只有参与者可以执行 BP 操作。");
    }

    if (mapSide(actor.side) !== params.side) {
      throw new Error("玩家阵营与操作阵营不一致。");
    }

    if (room.status !== "DRAFTING" || currentMatch.status !== "DRAFTING") {
      throw new Error("当前房间尚未开始 BP。");
    }

    const draftScript = expandDraftRules(parseRoomSettings(room).draftRules);
    const currentTurn = draftScript[currentMatch.currentTurnIndex] ?? null;
    if (!currentTurn) {
      throw new Error("当前对局已经结束。");
    }

    if (currentTurn.side !== params.side || currentTurn.action !== params.action) {
      throw new Error("当前不是你的操作回合。");
    }

    const alreadySelected = currentMatch.actions.some((record) => record.heroName === params.heroName);
    if (alreadySelected) {
      throw new Error("该英雄已经被选择。");
    }

    await tx.draftAction.create({
      data: {
        matchId: currentMatch.id,
        actorId: params.actorId,
        side: toPrismaSide(params.side),
        actionType: toPrismaAction(params.action),
        heroName: params.heroName,
        turnOrder: currentTurn.order,
      },
    });

    const nextTurnIndex = currentMatch.currentTurnIndex + 1;
    const finished = nextTurnIndex >= draftScript.length;

    await setRoomAndMatchStatus(
      tx,
      params.roomId,
      finished ? "FINISHED" : "DRAFTING",
      finished ? "FINISHED" : "DRAFTING",
      nextTurnIndex,
      new Date(),
    );

    const updatedRoom = await loadRoom(params.roomId, tx);
    if (!updatedRoom) {
      throw new Error("房间不存在或已过期。");
    }

    return serializeRoom(updatedRoom);
  });
}

async function deleteRoom(roomId: string, requesterId: string) {
  return prisma.$transaction(async (tx) => {
    await cleanupExpiredRooms(tx);
    await assertHost(roomId, requesterId, tx);

    const room = await tx.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new Error("房间不存在或已过期。");
    }

    await tx.room.delete({
      where: { id: roomId },
    });

    return { roomId };
  });
}

export const roomService = {
  listRooms,
  createRoom,
  getRoom,
  watchRoom,
  joinRoom,
  startDraft,
  swapParticipantSides,
  resetRoom,
  pauseDraft,
  resumeDraft,
  undoLastAction,
  actDraft,
  deleteRoom,
};
