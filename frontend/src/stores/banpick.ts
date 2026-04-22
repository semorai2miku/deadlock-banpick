import { computed, ref } from "vue";
import { defineStore } from "pinia";
import type { Socket } from "socket.io-client";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import type {
  CreateRoomResponse,
  DraftActionType,
  DraftRuleStep,
  DraftTurn,
  Hero,
  LobbyRoomSummary,
  MemberState,
  RoomSettings,
  RoomState,
} from "@/types/room";

const MEMBER_STORAGE_PREFIX = "deadlock-banpick:member:";
const ROOM_PASSWORD_PREFIX = "deadlock-banpick:room-password:";

const heroPool: Hero[] = [
  { id: "abrams", name: "Abrams", role: "Vanguard", difficulty: "Medium" },
  { id: "apollo", name: "Apollo", role: "Striker", difficulty: "Medium" },
  { id: "bebop", name: "Bebop", role: "Disruptor", difficulty: "Medium" },
  { id: "billy", name: "Billy", role: "Marksman", difficulty: "Hard" },
  { id: "calico", name: "Calico", role: "Skirmisher", difficulty: "Medium" },
  { id: "celeste", name: "Celeste", role: "Caster", difficulty: "Hard" },
  { id: "drifter", name: "Drifter", role: "Roamer", difficulty: "Medium" },
  { id: "dynamo", name: "Dynamo", role: "Tank", difficulty: "Easy" },
  { id: "graves", name: "Graves", role: "Bruiser", difficulty: "Medium" },
  { id: "grey-talon", name: "Grey Talon", role: "Hunter", difficulty: "Hard" },
  { id: "haze", name: "Haze", role: "Carry", difficulty: "Hard" },
  { id: "holliday", name: "Holliday", role: "Sniper", difficulty: "Medium" },
  { id: "inferno", name: "Inferno", role: "Initiator", difficulty: "Medium" },
  { id: "ivy", name: "Ivy", role: "Support", difficulty: "Medium" },
  { id: "kelvin", name: "Kelvin", role: "Controller", difficulty: "Medium" },
  { id: "lady-geist", name: "Lady Geist", role: "Mage", difficulty: "Hard" },
  { id: "lash", name: "Lash", role: "Diver", difficulty: "Hard" },
  { id: "mcginnis", name: "McGinnis", role: "Builder", difficulty: "Medium" },
  { id: "mina", name: "Mina", role: "Caster", difficulty: "Hard" },
  { id: "mirage", name: "Mirage", role: "Assassin", difficulty: "Hard" },
  { id: "mo-krill", name: "Mo & Krill", role: "Duo", difficulty: "Medium" },
  { id: "paige", name: "Paige", role: "Support", difficulty: "Medium" },
  { id: "paradox", name: "Paradox", role: "Specialist", difficulty: "Hard" },
  { id: "pocket", name: "Pocket", role: "Playmaker", difficulty: "Hard" },
  { id: "rem", name: "Rem", role: "Controller", difficulty: "Medium" },
  { id: "seven", name: "Seven", role: "Marksman", difficulty: "Easy" },
  { id: "shiv", name: "Shiv", role: "Bruiser", difficulty: "Medium" },
  { id: "silver", name: "Silver", role: "Striker", difficulty: "Medium" },
  { id: "sinclair", name: "Sinclair", role: "Assassin", difficulty: "Hard" },
  { id: "the-doorman", name: "The Doorman", role: "Specialist", difficulty: "Medium" },
  { id: "venator", name: "Venator", role: "Hunter", difficulty: "Medium" },
  { id: "victor", name: "Victor", role: "Bruiser", difficulty: "Easy" },
  { id: "vindicta", name: "Vindicta", role: "Sniper", difficulty: "Medium" },
  { id: "viscous", name: "Viscous", role: "Controller", difficulty: "Hard" },
  { id: "vyper", name: "Vyper", role: "Assassin", difficulty: "Medium" },
  { id: "warden", name: "Warden", role: "Frontline", difficulty: "Easy" },
  { id: "wraith", name: "Wraith", role: "Trickster", difficulty: "Hard" },
  { id: "yamato", name: "Yamato", role: "Duelist", difficulty: "Medium" },
];

interface DraftPreviewState {
  blue: string | null;
  red: string | null;
}

interface SocketAck {
  ok: boolean;
  room?: RoomState;
  rooms?: LobbyRoomSummary[];
  member?: MemberState;
  message?: string;
}

function memberStorageKey(roomId: string) {
  return `${MEMBER_STORAGE_PREFIX}${roomId}`;
}

function roomPasswordStorageKey(roomId: string) {
  return `${ROOM_PASSWORD_PREFIX}${roomId}`;
}

function heroByName(heroName: string) {
  return (
    heroPool.find((hero) => hero.name === heroName) ?? {
      id: heroName.toLowerCase(),
      name: heroName,
      role: "Unknown",
      difficulty: "Medium" as const,
    }
  );
}

function roomMembers(room: RoomState) {
  return [room.host, ...room.participants, ...room.spectators];
}

function expandDraftRules(rules: DraftRuleStep[]): DraftTurn[] {
  const turns: DraftTurn[] = [];
  let order = 1;

  for (const step of rules) {
    for (let index = 0; index < step.count; index += 1) {
      turns.push({
        order,
        side: step.side,
        action: step.action,
        count: step.count,
      });
      order += 1;
    }
  }

  return turns;
}

export const useBanPickStore = defineStore("banpick", () => {
  const lobbyRooms = ref<LobbyRoomSummary[]>([]);
  const roomState = ref<RoomState | null>(null);
  const localMember = ref<MemberState | null>(null);
  const roomPassword = ref("");
  const connectionState = ref<"disconnected" | "connecting" | "connected">("disconnected");
  const draftPreview = ref<DraftPreviewState>({ blue: null, red: null });
  const loading = ref(false);
  const lobbyLoading = ref(false);
  const errorMessage = ref("");

  let socket: Socket | null = null;
  let socketBound = false;

  const roomId = computed(() => roomState.value?.id ?? "");
  const roomCode = computed(() => roomState.value?.code ?? "");
  const draftTurns = computed(() => expandDraftRules(roomState.value?.settings.draftRules ?? []));
  const currentTurn = computed(() => {
    if (
      !roomState.value ||
      (roomState.value.status !== "drafting" && roomState.value.status !== "paused")
    ) {
      return null;
    }

    return draftTurns.value[roomState.value.currentTurnIndex] ?? null;
  });
  const isFinished = computed(() => roomState.value?.status === "finished");
  const isPaused = computed(() => roomState.value?.status === "paused");
  const selectedHeroNames = computed(
    () => new Set(roomState.value?.records.map((record) => record.heroName) ?? []),
  );
  const availableHeroes = computed(() =>
    heroPool.filter((hero) => !selectedHeroNames.value.has(hero.name)),
  );
  const blueBans = computed(() => (roomState.value?.blueBans ?? []).map(heroByName));
  const redBans = computed(() => (roomState.value?.redBans ?? []).map(heroByName));
  const bluePicks = computed(() => (roomState.value?.bluePicks ?? []).map(heroByName));
  const redPicks = computed(() => (roomState.value?.redPicks ?? []).map(heroByName));
  const records = computed(() => roomState.value?.records ?? []);
  const participants = computed(() => roomState.value?.participants ?? []);
  const spectators = computed(() => roomState.value?.spectators ?? []);
  const isHost = computed(() => localMember.value?.role === "host");
  const hasTwoParticipants = computed(() => participants.value.length === 2);
  const canHostStart = computed(
    () =>
      isHost.value &&
      hasTwoParticipants.value &&
      roomState.value?.status === "waiting" &&
      records.value.length === 0,
  );
  const canHostSwapSides = computed(
    () => isHost.value && hasTwoParticipants.value && roomState.value?.status !== "drafting",
  );
  const canHostReset = computed(
    () =>
      isHost.value &&
      !!roomState.value &&
      (records.value.length > 0 || roomState.value.status !== "waiting"),
  );
  const canHostPause = computed(() => isHost.value && roomState.value?.status === "drafting");
  const canHostResume = computed(() => isHost.value && roomState.value?.status === "paused");
  const canHostUndo = computed(
    () =>
      isHost.value &&
      !!roomState.value &&
      records.value.length > 0 &&
      roomState.value.status !== "waiting",
  );
  const canJoinParticipant = computed(() => !localMember.value && participants.value.length < 2);
  const canJoinSpectator = computed(
    () => !localMember.value && (roomState.value?.settings.allowSpectators ?? true),
  );
  const canAct = computed(() => {
    if (!roomState.value || !localMember.value || !currentTurn.value) {
      return false;
    }

    return (
      localMember.value.role === "participant" &&
      localMember.value.side === currentTurn.value.side &&
      roomState.value.status === "drafting"
    );
  });

  function setError(message: string) {
    errorMessage.value = message;
  }

  function clearError() {
    errorMessage.value = "";
  }

  function persistMember(member: MemberState, targetRoomId: string) {
    localStorage.setItem(memberStorageKey(targetRoomId), JSON.stringify(member));
    localMember.value = member;
  }

  function clearStoredMember(targetRoomId: string) {
    localStorage.removeItem(memberStorageKey(targetRoomId));
  }

  function persistRoomPassword(targetRoomId: string, password: string) {
    localStorage.setItem(roomPasswordStorageKey(targetRoomId), password);
    roomPassword.value = password;
  }

  function clearStoredRoomPassword(targetRoomId: string) {
    localStorage.removeItem(roomPasswordStorageKey(targetRoomId));
  }

  function restoreMember(targetRoomId: string, room: RoomState) {
    const raw = localStorage.getItem(memberStorageKey(targetRoomId));
    if (!raw) {
      localMember.value = null;
      return;
    }

    try {
      const stored = JSON.parse(raw) as MemberState;
      const match = roomMembers(room).find((member) => member.id === stored.id);
      if (!match) {
        clearStoredMember(targetRoomId);
        localMember.value = null;
        return;
      }

      localMember.value = match;
    } catch {
      clearStoredMember(targetRoomId);
      localMember.value = null;
    }
  }

  function syncRoom(room: RoomState) {
    roomState.value = room;
    restoreMember(room.id, room);
  }

  function restoreRoomPassword(targetRoomId: string) {
    const saved = localStorage.getItem(roomPasswordStorageKey(targetRoomId)) ?? "";
    roomPassword.value = saved;
    return saved;
  }

  function ensureSocket() {
    if (!socket) {
      socket = getSocket();
    }

    if (socketBound) {
      if (!socket.connected) {
        connectionState.value = "connecting";
        socket.connect();
      }
      return socket;
    }

    socketBound = true;
    socket.on("connect", () => {
      connectionState.value = "connected";
    });
    socket.on("disconnect", () => {
      connectionState.value = "disconnected";
    });
    socket.on("lobby:rooms", (rooms: LobbyRoomSummary[]) => {
      lobbyRooms.value = rooms;
    });
    socket.on("room:state", (room: RoomState) => {
      syncRoom(room);
    });
    socket.on("draft:preview-state", (preview: DraftPreviewState) => {
      draftPreview.value = preview;
    });
    socket.on("room:error", (payload: { message: string }) => {
      setError(payload.message);
    });
    socket.on("room:deleted", (payload: { roomId: string }) => {
      if (roomState.value?.id === payload.roomId) {
        clearStoredMember(payload.roomId);
        clearStoredRoomPassword(payload.roomId);
        localMember.value = null;
        roomPassword.value = "";
        roomState.value = null;
        draftPreview.value = { blue: null, red: null };
        setError("房间已被房主删除。");
      }
    });

    connectionState.value = "connecting";
    socket.connect();

    return socket;
  }

  async function emitWithAck(event: string, payload?: unknown) {
    const activeSocket = ensureSocket();

    return new Promise<SocketAck>((resolve, reject) => {
      const callback = (response: SocketAck) => {
        if (!response.ok) {
          reject(new Error(response.message ?? "Socket request failed"));
          return;
        }

        resolve(response);
      };

      if (typeof payload === "undefined") {
        activeSocket.emit(event, callback);
        return;
      }

      activeSocket.emit(event, payload, callback);
    });
  }

  async function refreshLobby() {
    lobbyLoading.value = true;
    clearError();

    try {
      const rooms = await api.listRooms();
      lobbyRooms.value = rooms;
      ensureSocket();
      const socketResponse = await emitWithAck("lobby:list");
      if (socketResponse.rooms) {
        lobbyRooms.value = socketResponse.rooms;
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "加载大厅失败。");
    } finally {
      lobbyLoading.value = false;
    }
  }

  async function watchRoom(targetRoomId: string) {
    const password = roomPassword.value || restoreRoomPassword(targetRoomId);
    if (!password) {
      throw new Error("请输入房间密码。");
    }

    const response = await emitWithAck("room:watch", {
      roomId: targetRoomId,
      password,
    });

    if (response.room) {
      syncRoom(response.room);
    }
  }

  async function initializeRoom(targetRoomId: string) {
    loading.value = true;
    clearError();

    try {
      const password = roomPassword.value || restoreRoomPassword(targetRoomId);
      if (!password) {
        roomState.value = null;
        draftPreview.value = { blue: null, red: null };
        return;
      }

      const room = await api.getRoom(targetRoomId, password);
      syncRoom(room);
      await watchRoom(targetRoomId);
    } catch (error) {
      setError(error instanceof Error ? error.message : "加载房间失败。");
    } finally {
      loading.value = false;
    }
  }

  async function createRoom(params: {
    hostName: string;
    roomName: string;
    password: string;
    settings?: Partial<RoomSettings>;
  }) {
    clearError();
    const result: CreateRoomResponse = await api.createProtectedRoom(params);
    syncRoom(result.room);
    persistMember(result.member, result.room.id);
    persistRoomPassword(result.room.id, params.password);
    await watchRoom(result.room.id);
    await refreshLobby();
    return result.room;
  }

  async function joinCurrentRoom(params: {
    name: string;
    role: "participant" | "spectator";
  }) {
    if (!roomState.value) {
      throw new Error("房间尚未加载。");
    }

    clearError();
    const response = await emitWithAck("room:join", {
      roomId: roomState.value.id,
      name: params.name,
      role: params.role,
      password: roomPassword.value,
    });

    if (!response.room || !response.member) {
      throw new Error("加入房间失败。");
    }

    syncRoom(response.room);
    persistMember(response.member, response.room.id);
    await refreshLobby();
  }

  async function setDraftPreview(side: "blue" | "red", heroName: string | null) {
    if (!roomState.value) {
      return;
    }

    await emitWithAck("draft:preview", {
      roomId: roomState.value.id,
      side,
      heroName,
    });
  }

  async function performDraftAction(heroId: string) {
    if (!roomState.value || !localMember.value || !currentTurn.value || !canAct.value) {
      return;
    }

    const hero = heroPool.find((item) => item.id === heroId);
    if (!hero || !localMember.value.side) {
      return;
    }

    clearError();

    const response = await emitWithAck("draft:action", {
      roomId: roomState.value.id,
      actorId: localMember.value.id,
      side: localMember.value.side,
      action: currentTurn.value.action as DraftActionType,
      heroName: hero.name,
    });

    if (response.room) {
      syncRoom(response.room);
    }
  }

  async function hostStartDraft() {
    if (!roomState.value || !localMember.value) {
      throw new Error("当前房间无法开始。");
    }

    const response = await emitWithAck("room:start", {
      roomId: roomState.value.id,
      requesterId: localMember.value.id,
    });

    if (response.room) {
      syncRoom(response.room);
    }
  }

  async function hostSwapSides() {
    if (!roomState.value || !localMember.value) {
      throw new Error("当前房间无法交换阵营。");
    }

    const response = await emitWithAck("room:swap-sides", {
      roomId: roomState.value.id,
      requesterId: localMember.value.id,
    });

    if (response.room) {
      syncRoom(response.room);
    }
  }

  async function hostResetRoom() {
    if (!roomState.value || !localMember.value) {
      throw new Error("当前房间无法重置。");
    }

    const response = await emitWithAck("room:reset", {
      roomId: roomState.value.id,
      requesterId: localMember.value.id,
    });

    if (response.room) {
      syncRoom(response.room);
    }
  }

  async function hostPauseDraft() {
    if (!roomState.value || !localMember.value) {
      throw new Error("当前房间无法暂停。");
    }

    const response = await emitWithAck("room:pause", {
      roomId: roomState.value.id,
      requesterId: localMember.value.id,
    });

    if (response.room) {
      syncRoom(response.room);
    }
  }

  async function hostResumeDraft() {
    if (!roomState.value || !localMember.value) {
      throw new Error("当前房间无法恢复。");
    }

    const response = await emitWithAck("room:resume", {
      roomId: roomState.value.id,
      requesterId: localMember.value.id,
    });

    if (response.room) {
      syncRoom(response.room);
    }
  }

  async function hostUndoLastAction() {
    if (!roomState.value || !localMember.value) {
      throw new Error("当前没有可撤回的操作。");
    }

    const response = await emitWithAck("room:undo", {
      roomId: roomState.value.id,
      requesterId: localMember.value.id,
    });

    if (response.room) {
      syncRoom(response.room);
    }
  }

  async function deleteCurrentRoom() {
    if (!roomState.value || !localMember.value) {
      throw new Error("当前没有可删除的房间。");
    }

    clearError();

    await emitWithAck("room:delete", {
      roomId: roomState.value.id,
      requesterId: localMember.value.id,
    });

    clearStoredMember(roomState.value.id);
    clearStoredRoomPassword(roomState.value.id);
    roomState.value = null;
    localMember.value = null;
    roomPassword.value = "";
    await refreshLobby();
  }

  async function unlockRoom(targetRoomId: string, password: string) {
    persistRoomPassword(targetRoomId, password);
    await initializeRoom(targetRoomId);
  }

  return {
    lobbyRooms,
    roomState,
    roomId,
    roomCode,
    localMember,
    roomPassword,
    participants,
    spectators,
    draftPreview,
    connectionState,
    loading,
    lobbyLoading,
    errorMessage,
    currentTurn,
    availableHeroes,
    records,
    blueBans,
    redBans,
    bluePicks,
    redPicks,
    isFinished,
    isPaused,
    isHost,
    hasTwoParticipants,
    canHostStart,
    canHostSwapSides,
    canHostReset,
    canHostPause,
    canHostResume,
    canHostUndo,
    canJoinParticipant,
    canJoinSpectator,
    canAct,
    refreshLobby,
    initializeRoom,
    unlockRoom,
    createRoom,
    joinCurrentRoom,
    hostStartDraft,
    hostSwapSides,
    hostResetRoom,
    hostPauseDraft,
    hostResumeDraft,
    hostUndoLastAction,
    performDraftAction,
    setDraftPreview,
    deleteCurrentRoom,
    watchRoom,
    clearError,
  };
});
