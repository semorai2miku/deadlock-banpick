<template>
  <main class="local-draft-view">
    <section class="bp-shell" :style="bpShellStyle">
      <div class="bp-overlay" />

      <header class="bp-topbar">
        <div class="topbar-block">
          <p class="eyebrow">{{ isSpectatorMode ? "Broadcast View" : "Local Draft" }}</p>
          <h1>{{ isSpectatorMode ? "" : "操作台" }}</h1>
        </div>

        <div class="topbar-status">
          <article class="status-card">
            <span>当前阶段</span>
            <strong>{{ phaseTitle }}</strong>
          </article>
          <article class="status-card">
            <span>剩余时间</span>
            <strong>{{ countdownLabel }}</strong>
          </article>
        </div>
      </header>

      <section class="countdown-banner" :class="bannerClass">
        <p class="countdown-eyebrow">Round Timer</p>
        <strong class="countdown-main">{{ countdownLabel }}</strong>
        <span class="countdown-side">{{ activeSideLabel }}</span>
      </section>

      <section class="bp-stage">
        <aside class="patron-panel patron-left">
          <div class="patron-head">
            <img class="patron-emblem" :src="hiddenKingUrl" alt="Hidden King" />
            <div>
              <p class="patron-title-cn">影王</p>
              <p class="patron-title-en">Hidden King</p>
            </div>
          </div>

          <Transition name="render-fade" mode="out-in">
            <div :key="leftDisplayKey" class="character-stage stage-left">
              <img
                v-if="leftDisplayRenderUrl"
                class="character-render"
                :src="leftDisplayRenderUrl"
                :alt="leftDisplayHeroName || 'Hidden King side hero'"
              />
              <img v-else class="patron-placeholder" :src="hiddenKingUrl" alt="Hidden King" />

              <img
                v-if="leftDisplayNameImageUrl"
                class="character-name-image"
                :src="leftDisplayNameImageUrl"
                :alt="leftDisplayHeroName || 'Hidden King hero name'"
              />
            </div>
          </Transition>
        </aside>

        <section class="draft-center">
          <div class="center-head">
            <p class="eyebrow">Hero Selection</p>
            <h2>{{ centerTitle }}</h2>
          </div>

          <div v-if="showSetupPanel" class="setup-panel">
            <div class="setup-copy">
              <p class="setup-title">开局设置</p>
              <p class="setup-subtitle">先设置每回合时间，再开始本局本地 BP。</p>
            </div>

            <div class="time-limit-group">
              <span class="setup-label">BP 时间</span>
              <div class="time-limit-options">
                <button
                  v-for="option in timeLimitOptions"
                  :key="option"
                  class="time-option"
                  :class="{ active: draftState.timeLimitSeconds === option }"
                  type="button"
                  :disabled="!canAdjustTime"
                  @click="setTimeLimit(option)"
                >
                  {{ option === 0 ? "无限制" : `${option}s` }}
                </button>
              </div>
            </div>

            <div class="setup-actions">
              <button class="button-primary" type="button" @click="startDraft">开始 BP</button>
              <button class="button-secondary" type="button" @click="resetDraft">重置对局</button>
            </div>
          </div>

          <div class="hero-board">
            <button
              v-for="hero in heroTiles"
              :key="hero.name"
              class="hero-tile"
              :class="{
                interactive: canOperate,
                picked: hero.picked,
                banned: hero.banned,
                pending: !isSpectatorMode && pendingHeroName === hero.name,
                spectator: isSpectatorMode,
              }"
              :style="tileStyle(hero.name)"
              type="button"
              :disabled="!canOperate || hero.picked || hero.banned"
              :title="hero.name"
              @click="selectHero(hero.name)"
            >
              <img class="hero-icon" :src="hero.iconUrl" :alt="hero.name" />
              <span v-if="hero.banned" class="hero-ban-mask" />
              <span v-if="hero.banned" class="hero-ban-mark">✕</span>
              <span class="hero-hover-name">{{ hero.name }}</span>
            </button>
          </div>

          <div class="confirm-strip">
            <div class="pending-copy">
              <p class="summary-label">当前预选</p>
              <strong>{{ pendingHeroName || "尚未选择英雄" }}</strong>
            </div>

            <div v-if="canOperate" class="confirm-actions">
              <button
                class="button-primary"
                type="button"
                :disabled="!pendingHeroName"
                @click="confirmSelection"
              >
                确认选择
              </button>
              <button
                class="button-secondary"
                type="button"
                :disabled="!pendingHeroName"
                @click="resetSelection"
              >
                重置选择
              </button>
            </div>
          </div>

          <div class="center-meta">
            <article class="meta-chip">
              <span>规则</span>
              <strong>{{ currentTurn?.action || "WAITING" }}</strong>
            </article>
            <article class="meta-chip">
              <span>行动方</span>
              <strong>{{ activeSideLabel }}</strong>
            </article>
          </div>
        </section>

        <aside class="patron-panel patron-right">
          <div class="patron-head patron-head-right">
            <div>
              <p class="patron-title-cn">元祖</p>
              <p class="patron-title-en">ArchMother</p>
            </div>
            <img class="patron-emblem" :src="archMotherUrl" alt="ArchMother" />
          </div>

          <Transition name="render-fade" mode="out-in">
            <div :key="rightDisplayKey" class="character-stage stage-right">
              <img
                v-if="rightDisplayRenderUrl"
                class="character-render"
                :src="rightDisplayRenderUrl"
                :alt="rightDisplayHeroName || 'ArchMother side hero'"
              />
              <img v-else class="patron-placeholder" :src="archMotherUrl" alt="ArchMother" />

              <img
                v-if="rightDisplayNameImageUrl"
                class="character-name-image"
                :src="rightDisplayNameImageUrl"
                :alt="rightDisplayHeroName || 'ArchMother hero name'"
              />
            </div>
          </Transition>
        </aside>
      </section>

      <aside class="seat-row seat-row-left">
        <div class="ban-seat-row">
          <div
            v-for="(hero, index) in leftBanCards"
            :key="`left-ban-${index}`"
            class="ban-seat-card"
            :class="{ empty: !hero }"
          >
            <template v-if="hero">
              <img class="ban-seat-image" :src="getHeroCardUrl(hero)" :alt="hero" />
              <span class="ban-seat-mark">✕</span>
            </template>
          </div>
        </div>

        <div class="pick-seat-row">
          <div
            v-for="(hero, index) in leftSeatCards"
            :key="`left-pick-${index}`"
            class="seat-card seat-card-left"
            :class="{ empty: !hero }"
          >
            <template v-if="hero">
              <img class="seat-card-image" :src="getHeroCardUrl(hero)" :alt="hero" />
              <div class="seat-copy">
                <span>PICK {{ index + 1 }}</span>
                <strong>{{ hero }}</strong>
              </div>
            </template>
          </div>
        </div>
      </aside>

      <aside class="seat-row seat-row-right">
        <div class="ban-seat-row ban-seat-row-right">
          <div
            v-for="(hero, index) in rightBanCards"
            :key="`right-ban-${index}`"
            class="ban-seat-card"
            :class="{ empty: !hero }"
          >
            <template v-if="hero">
              <img class="ban-seat-image" :src="getHeroCardUrl(hero)" :alt="hero" />
              <span class="ban-seat-mark">✕</span>
            </template>
          </div>
        </div>

        <div class="pick-seat-row pick-seat-row-right">
          <div
            v-for="(hero, index) in rightSeatCards"
            :key="`right-pick-${index}`"
            class="seat-card seat-card-right"
            :class="{ empty: !hero }"
          >
            <template v-if="hero">
              <img class="seat-card-image" :src="getHeroCardUrl(hero)" :alt="hero" />
              <div class="seat-copy">
                <span>PICK {{ index + 1 }}</span>
                <strong>{{ hero }}</strong>
              </div>
            </template>
          </div>
        </div>
      </aside>

      <section class="bp-bottom">
        <div v-if="!isSpectatorMode" class="bottom-actions">
          <button class="button-secondary" type="button" @click="returnToLobby">返回大厅</button>
          <button class="button-secondary" type="button" @click="openBroadcastView">
            打开直播页
          </button>
          <button class="button-secondary" type="button" @click="copyBroadcastLink">
            {{ copyButtonText }}
          </button>
          <button
            class="button-secondary"
            type="button"
            :disabled="!records.length"
            @click="undoLastAction"
          >
            返回上一步
          </button>
          <button
            class="button-secondary"
            type="button"
            :disabled="draftState.status === 'waiting' || draftState.status === 'finished'"
            @click="togglePause"
          >
            {{ draftState.status === "paused" ? "继续 BP" : "暂停 BP" }}
          </button>
          <button class="button-secondary" type="button" @click="resetDraft">重置对局</button>
        </div>

        <template v-if="!isSpectatorMode">
          <nav class="author-links" aria-label="Author links">
            <a
              class="author-link"
              href="https://github.com/semorai2miku"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <a
              class="author-link"
              href="https://space.bilibili.com/1497758558"
              target="_blank"
              rel="noopener noreferrer"
            >
              Bilibili
            </a>
          </nav>
        </template>

        <p class="author-credit">作者：semorai_miku@bilibili</p>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { DraftActionType, DraftRuleStep, TeamSide } from "@/types/room";
import {
  archMotherUrl,
  bpBackgroundUrl,
  getHeroCardUrl,
  getHeroIconUrl,
  getHeroNameImageUrl,
  getHeroRenderUrl,
  hiddenKingUrl,
} from "@/lib/bpAssets";

const props = defineProps<{ mode: "operator" | "spectator" }>();

interface LocalDraftTurn { order: number; side: TeamSide; action: DraftActionType }
interface LocalDraftRecord extends LocalDraftTurn { heroName: string; at: string }
interface LocalDraftState {
  sessionId: string;
  status: "waiting" | "drafting" | "paused" | "finished";
  timeLimitSeconds: number;
  currentTurnIndex: number;
  currentTurnStartedAt: string;
  pausedRemainingMs: number | null;
  pending: Record<TeamSide, string | null>;
  blueBans: string[];
  redBans: string[];
  bluePicks: string[];
  redPicks: string[];
  records: LocalDraftRecord[];
  syncToken: string;
  updatedAt: string;
}

const route = useRoute();
const router = useRouter();

const rules: DraftRuleStep[] = [
  { side: "blue", action: "BAN", count: 1 },
  { side: "red", action: "BAN", count: 1 },
  { side: "blue", action: "PICK", count: 1 },
  { side: "red", action: "PICK", count: 2 },
  { side: "blue", action: "PICK", count: 2 },
  { side: "red", action: "PICK", count: 1 },
  { side: "red", action: "BAN", count: 1 },
  { side: "blue", action: "BAN", count: 1 },
  { side: "red", action: "PICK", count: 1 },
  { side: "blue", action: "PICK", count: 2 },
  { side: "red", action: "PICK", count: 2 },
  { side: "blue", action: "PICK", count: 1 },
];

const heroPool = [
  "Abrams","Apollo","Bebop","Billy","Calico","Celeste","Drifter","Dynamo","Graves",
  "Grey Talon","Haze","Holliday","Infernus","Ivy","Kelvin","Lady Geist","Lash","McGinnis",
  "Mina","Mirage","Mo & Krill","Paige","Paradox","Pocket","Rem","Seven","Shiv","Silver",
  "Sinclair","The Doorman","Venator","Victor","Vindicta","Viscous","Vyper","Warden","Wraith","Yamato",
] as const;

const STORAGE_PREFIX = "deadlock-banpick:local-draft:";
const CHANNEL_PREFIX = "deadlock-banpick:local-draft-channel:";
const timeLimitOptions = [15, 30, 45, 60, 90, 0] as const;

let tickTimer: number | null = null;
let syncChannel: BroadcastChannel | null = null;

const copyButtonText = ref("复制直播链接");
const nowMs = ref(Date.now());
const sessionId = computed(() => String(route.query.session ?? "default"));
const isSpectatorMode = computed(() => props.mode === "spectator");

const turns = expandDraftRules(rules);
const draftState = ref<LocalDraftState>(createInitialState(sessionId.value));

const bpShellStyle = computed(() => ({ backgroundImage: `url("${bpBackgroundUrl}")` }));
const currentTurn = computed(() =>
  draftState.value.status === "waiting" || draftState.value.status === "finished"
    ? null
    : turns[draftState.value.currentTurnIndex] ?? null,
);
const records = computed(() => draftState.value.records);
const pendingHeroName = computed(() =>
  currentTurn.value ? draftState.value.pending[currentTurn.value.side] ?? "" : "",
);
const remainingMs = computed(() => {
  if (!currentTurn.value || draftState.value.status === "waiting") return 0;
  if (draftState.value.timeLimitSeconds <= 0) return Number.POSITIVE_INFINITY;
  if (draftState.value.status === "paused" && draftState.value.pausedRemainingMs !== null) {
    return draftState.value.pausedRemainingMs;
  }
  return Math.max(
    draftState.value.timeLimitSeconds * 1000 -
      (nowMs.value - new Date(draftState.value.currentTurnStartedAt).getTime()),
    0,
  );
});
const isOvertime = computed(() =>
  !!currentTurn.value &&
  draftState.value.status !== "paused" &&
  draftState.value.timeLimitSeconds > 0 &&
  remainingMs.value <= 0,
);
const phaseTitle = computed(() =>
  draftState.value.status === "waiting"
    ? "等待开始"
    : !currentTurn.value
      ? "已完成"
      : `${currentTurn.value.side === "blue" ? "影王" : "元祖"} ${currentTurn.value.action === "BAN" ? "禁用" : "选择"}`,
);
const activeSideLabel = computed(() =>
  draftState.value.status === "waiting"
    ? "等待开始"
    : !currentTurn.value
      ? "对局已结束"
      : currentTurn.value.side === "blue"
        ? "影王 / Hidden King"
        : "元祖 / ArchMother",
);
const countdownLabel = computed(() => {
  if (draftState.value.status === "waiting") return "READY";
  if (!currentTurn.value) return "DONE";
  if (draftState.value.timeLimitSeconds <= 0) return "∞";
  return `00:${String(Math.max(Math.ceil(remainingMs.value / 1000), 0)).padStart(2, "0")}`;
});
const timeLimitLabel = computed(() =>
  draftState.value.timeLimitSeconds <= 0 ? "无限制时间" : `${draftState.value.timeLimitSeconds}s / 回合`,
);
const centerTitle = computed(() =>
  draftState.value.status === "waiting"
    ? isSpectatorMode.value
      ? "等待中......"
      : "准备开始"
    : !currentTurn.value
      ? "本局 BP 已完成"
      : isSpectatorMode.value
        ? "Deadlock Ban/Pick"
        : currentTurn.value.action === "BAN"
          ? "选择要禁用的英雄"
          : "选择要锁定的英雄",
);
const selectedHeroNames = computed(
  () => new Set([...draftState.value.blueBans, ...draftState.value.redBans, ...draftState.value.bluePicks, ...draftState.value.redPicks]),
);
const bannedHeroNames = computed(
  () => new Set([...draftState.value.blueBans, ...draftState.value.redBans]),
);
const heroTiles = computed(() =>
  heroPool.map((name) => ({
    name,
    iconUrl: getHeroIconUrl(name),
    banned: bannedHeroNames.value.has(name),
    picked: selectedHeroNames.value.has(name) && !bannedHeroNames.value.has(name),
  })),
);
const pendingBorderColor = computed(() =>
  !currentTurn.value ? "rgba(255,255,255,0.4)" : currentTurn.value.action === "BAN" ? "#c43333" : currentTurn.value.side === "blue" ? "#e6be61" : "#62a7ff",
);
const canOperate = computed(
  () => !isSpectatorMode.value && !!currentTurn.value && draftState.value.status === "drafting",
);
const canAdjustTime = computed(
  () => !isSpectatorMode.value && draftState.value.status === "waiting" && !records.value.length,
);
const showSetupPanel = computed(
  () => draftState.value.status === "waiting" && !isSpectatorMode.value,
);
const bannerClass = computed(() => ({
  waiting: draftState.value.status === "waiting",
  paused: draftState.value.status === "paused",
  overtime: isOvertime.value,
  "side-blue": currentTurn.value?.side === "blue" && !isOvertime.value,
  "side-red": currentTurn.value?.side === "red" && !isOvertime.value,
}));
const leftDisplayHeroName = computed(() =>
  currentTurn.value?.side === "blue" && pendingHeroName.value ? pendingHeroName.value : getLatestHeroBySide("blue"),
);
const rightDisplayHeroName = computed(() =>
  currentTurn.value?.side === "red" && pendingHeroName.value ? pendingHeroName.value : getLatestHeroBySide("red"),
);
const leftDisplayRenderUrl = computed(() => (leftDisplayHeroName.value ? getHeroRenderUrl(leftDisplayHeroName.value) : ""));
const rightDisplayRenderUrl = computed(() => (rightDisplayHeroName.value ? getHeroRenderUrl(rightDisplayHeroName.value) : ""));
const leftDisplayNameImageUrl = computed(() => (leftDisplayHeroName.value ? getHeroNameImageUrl(leftDisplayHeroName.value) : ""));
const rightDisplayNameImageUrl = computed(() => (rightDisplayHeroName.value ? getHeroNameImageUrl(rightDisplayHeroName.value) : ""));
const leftDisplayKey = computed(() => leftDisplayHeroName.value || "left-default");
const rightDisplayKey = computed(() => rightDisplayHeroName.value || "right-default");
const leftSeatCards = computed(() => buildSeatCards("blue", "PICK", 6));
const rightSeatCards = computed(() => buildSeatCards("red", "PICK", 6));
const leftBanCards = computed(() => buildSeatCards("blue", "BAN", 2));
const rightBanCards = computed(() => buildSeatCards("red", "BAN", 2));

function expandDraftRules(input: DraftRuleStep[]) {
  const output: LocalDraftTurn[] = [];
  let order = 1;
  for (const rule of input) {
    for (let i = 0; i < rule.count; i += 1) {
      output.push({ order: order++, side: rule.side, action: rule.action });
    }
  }
  return output;
}

function createInitialState(id: string): LocalDraftState {
  const now = new Date().toISOString();
  return {
    sessionId: id,
    status: "waiting",
    timeLimitSeconds: 30,
    currentTurnIndex: 0,
    currentTurnStartedAt: now,
    pausedRemainingMs: null,
    pending: { blue: null, red: null },
    blueBans: [],
    redBans: [],
    bluePicks: [],
    redPicks: [],
    records: [],
    syncToken: createSyncToken(),
    updatedAt: now,
  };
}

function createSyncToken() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function storageKey(id: string) {
  return `${STORAGE_PREFIX}${id}`;
}

function channelKey(id: string) {
  return `${CHANNEL_PREFIX}${id}`;
}

function loadState(id: string) {
  const raw = window.localStorage.getItem(storageKey(id));
  if (!raw) {
    const initial = createInitialState(id);
    window.localStorage.setItem(storageKey(id), JSON.stringify(initial));
    return initial;
  }

  try {
    const parsed = JSON.parse(raw) as LocalDraftState;
    return parsed.sessionId === id ? parsed : createInitialState(id);
  } catch {
    return createInitialState(id);
  }
}

function syncFromStorage() {
  if (typeof window === "undefined") return;
  replaceState(loadState(sessionId.value));
}

function broadcastState(nextState: LocalDraftState) {
  draftState.value = nextState;
  window.localStorage.setItem(storageKey(sessionId.value), JSON.stringify(nextState));
  syncChannel?.postMessage(nextState);
}

function patchState(mutator: (state: LocalDraftState) => void) {
  const nextState = clone(draftState.value);
  mutator(nextState);
  nextState.sessionId = sessionId.value;
  nextState.updatedAt = new Date().toISOString();
  nextState.syncToken = createSyncToken();
  broadcastState(nextState);
}

function replaceState(incoming: LocalDraftState) {
  if (incoming.sessionId === sessionId.value) {
    draftState.value = incoming;
  }
}

function getLatestHeroBySide(side: TeamSide) {
  for (let i = draftState.value.records.length - 1; i >= 0; i -= 1) {
    if (draftState.value.records[i].side === side) return draftState.value.records[i].heroName;
  }
  return "";
}

function buildSeatCards(side: TeamSide, action: DraftActionType, total: number) {
  const base =
    action === "PICK"
      ? [...(side === "blue" ? draftState.value.bluePicks : draftState.value.redPicks)]
      : [...(side === "blue" ? draftState.value.blueBans : draftState.value.redBans)];

  if (
    currentTurn.value?.side === side &&
    currentTurn.value.action === action &&
    pendingHeroName.value &&
    base.length < total
  ) {
    base.push(pendingHeroName.value);
  }

  return Array.from({ length: total }, (_, index) => base[index] ?? null);
}

function tileStyle(heroName: string) {
  return pendingHeroName.value === heroName && canOperate.value
    ? {
        borderColor: pendingBorderColor.value,
        boxShadow: `0 0 0 1px ${pendingBorderColor.value}, 0 0 24px ${pendingBorderColor.value}66`,
      }
    : {};
}

function setTimeLimit(seconds: number) {
  if (canAdjustTime.value) {
    patchState((state) => {
      state.timeLimitSeconds = seconds;
    });
  }
}

function startDraft() {
  if (!isSpectatorMode.value && draftState.value.status === "waiting") {
    patchState((state) => {
      state.status = "drafting";
      state.currentTurnIndex = 0;
      state.currentTurnStartedAt = new Date().toISOString();
      state.pausedRemainingMs = null;
      state.pending.blue = null;
      state.pending.red = null;
    });
  }
}

function selectHero(heroName: string) {
  if (canOperate.value && !selectedHeroNames.value.has(heroName) && currentTurn.value) {
    patchState((state) => {
      state.pending[currentTurn.value!.side] = heroName;
    });
  }
}

function resetSelection() {
  if (currentTurn.value) {
    patchState((state) => {
      state.pending[currentTurn.value!.side] = null;
    });
  }
}

function confirmSelection() {
  if (!currentTurn.value || !pendingHeroName.value) return;

  const heroName = pendingHeroName.value;
  const turn = currentTurn.value;

  patchState((state) => {
    state.records.push({ ...turn, heroName, at: new Date().toISOString() });
    if (turn.action === "BAN") {
      (turn.side === "blue" ? state.blueBans : state.redBans).push(heroName);
    } else {
      (turn.side === "blue" ? state.bluePicks : state.redPicks).push(heroName);
    }

    state.pending.blue = null;
    state.pending.red = null;
    state.currentTurnIndex += 1;
    state.pausedRemainingMs = null;
    if (state.currentTurnIndex >= turns.length) {
      state.status = "finished";
    } else {
      state.status = "drafting";
      state.currentTurnStartedAt = new Date().toISOString();
    }
  });
}

function rebuildFromRecords(recordsToApply: LocalDraftRecord[]) {
  const next = createInitialState(sessionId.value);
  next.records = clone(recordsToApply);
  next.currentTurnIndex = recordsToApply.length;
  next.currentTurnStartedAt = new Date().toISOString();

  for (const record of recordsToApply) {
    if (record.action === "BAN") {
      (record.side === "blue" ? next.blueBans : next.redBans).push(record.heroName);
    } else {
      (record.side === "blue" ? next.bluePicks : next.redPicks).push(record.heroName);
    }
  }

  next.status = recordsToApply.length === 0 ? "waiting" : "drafting";
  if (next.currentTurnIndex >= turns.length) next.status = "finished";
  return next;
}

function undoLastAction() {
  if (!records.value.length) return;
  const rebuilt = rebuildFromRecords(records.value.slice(0, -1));
  rebuilt.syncToken = createSyncToken();
  rebuilt.updatedAt = new Date().toISOString();
  broadcastState(rebuilt);
}

function resetDraft() {
  const nextState = createInitialState(sessionId.value);
  nextState.syncToken = createSyncToken();
  nextState.updatedAt = new Date().toISOString();
  broadcastState(nextState);
}

function togglePause() {
  if (!currentTurn.value || draftState.value.status === "finished") return;

  patchState((state) => {
    if (state.status === "paused") {
      state.status = "drafting";
      if (state.timeLimitSeconds > 0 && state.pausedRemainingMs !== null) {
        const elapsed = state.timeLimitSeconds * 1000 - state.pausedRemainingMs;
        state.currentTurnStartedAt = new Date(Date.now() - elapsed).toISOString();
      } else {
        state.currentTurnStartedAt = new Date().toISOString();
      }
      state.pausedRemainingMs = null;
      return;
    }

    state.status = "paused";
    state.pausedRemainingMs =
      state.timeLimitSeconds > 0
        ? Math.max(
            state.timeLimitSeconds * 1000 -
              (Date.now() - new Date(state.currentTurnStartedAt).getTime()),
            0,
          )
        : null;
  });
}

function buildViewUrl(targetPath: "/local-draft" | "/local-cast") {
  const sessionQuery = `session=${encodeURIComponent(sessionId.value)}`;
  if (typeof window === "undefined") return `${targetPath}?${sessionQuery}`;
  if (window.location.protocol === "file:" || import.meta.env.MODE === "standalone") {
    const currentUrl = new URL(window.location.href);
    currentUrl.hash = `${targetPath}?${sessionQuery}`;
    currentUrl.search = "";
    return currentUrl.toString();
  }
  return `${window.location.origin}${targetPath}?${sessionQuery}`;
}

async function copyBroadcastLink() {
  const url = buildViewUrl("/local-cast");
  await navigator.clipboard.writeText(url);
  copyButtonText.value = "复制成功";
  window.setTimeout(() => {
    copyButtonText.value = "复制直播链接";
  }, 1600);
}

function openBroadcastView() {
  window.open(buildViewUrl("/local-cast"), "_blank", "noopener,noreferrer");
}

async function returnToLobby() {
  await router.push("/");
}

function bindSyncChannel() {
  syncChannel?.close();
  syncChannel = null;
  if ("BroadcastChannel" in window) {
    syncChannel = new BroadcastChannel(channelKey(sessionId.value));
    syncChannel.onmessage = (event: MessageEvent<LocalDraftState>) => replaceState(event.data);
  }
}

function handleStorage(event: StorageEvent) {
  if (event.key !== storageKey(sessionId.value) || !event.newValue) return;
  try {
    replaceState(JSON.parse(event.newValue) as LocalDraftState);
  } catch {
    // ignore malformed payloads
  }
}

function handleVisibilitySync() {
  if (!document.hidden) {
    syncFromStorage();
  }
}

function handleFocusSync() {
  syncFromStorage();
}

onMounted(() => {
  draftState.value = loadState(sessionId.value);
  bindSyncChannel();
  window.addEventListener("storage", handleStorage);
  window.addEventListener("focus", handleFocusSync);
  window.addEventListener("pageshow", handleFocusSync);
  document.addEventListener("visibilitychange", handleVisibilitySync);
  tickTimer = window.setInterval(() => {
    nowMs.value = Date.now();
    syncFromStorage();
  }, 250);
});

onBeforeUnmount(() => {
  window.removeEventListener("storage", handleStorage);
  window.removeEventListener("focus", handleFocusSync);
  window.removeEventListener("pageshow", handleFocusSync);
  document.removeEventListener("visibilitychange", handleVisibilitySync);
  syncChannel?.close();
  if (tickTimer) window.clearInterval(tickTimer);
});
</script>

<style scoped>
.local-draft-view { min-height: 100vh; background: #09070d; color: #f8f0df; }
.bp-shell { position: relative; min-height: 100vh; padding: 14px 20px 12px; background-position: center; background-size: cover; overflow: hidden; box-sizing: border-box; }
.bp-overlay { position: absolute; inset: 0; background: radial-gradient(circle at 50% 50%, rgba(16, 11, 23, 0.12), rgba(8, 7, 12, 0.62)), linear-gradient(90deg, rgba(236, 192, 91, 0.04), transparent 20%, transparent 80%, rgba(86, 149, 255, 0.06)); pointer-events: none; }
.bp-topbar, .countdown-banner, .bp-stage, .bp-bottom, .seat-row { position: relative; z-index: 1; }
.bp-topbar { display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; margin-bottom: 8px; }
.topbar-block h1 { margin: 8px 0 10px; font-size: clamp(2rem, 4vw, 3rem); line-height: 0.95; }
.eyebrow { margin: 0; text-transform: uppercase; letter-spacing: 0.24em; font-size: 0.76rem; color: rgba(233, 210, 161, 0.72); }
.muted-line { margin: 0; color: rgba(248, 240, 223, 0.68); }
.topbar-status { display: grid; grid-template-columns: repeat(2, minmax(0, 180px)); gap: 12px; }
.status-card { padding: 14px 16px; border-radius: 18px; background: rgba(10, 10, 14, 0.42); }
.status-card span { display: block; color: rgba(248, 240, 223, 0.56); font-size: 0.82rem; }
.status-card strong { display: block; margin-top: 8px; font-size: 1.06rem; }
.countdown-banner { display: grid; justify-items: center; gap: 4px; width: min(420px, calc(100% - 48px)); margin: 0 auto 6px; padding: 10px 20px 12px; border-radius: 999px; background: linear-gradient(180deg, rgba(13, 22, 28, 0.88), rgba(10, 16, 22, 0.72)); border: 1px solid rgba(248, 240, 223, 0.14); box-shadow: 0 18px 40px rgba(0, 0, 0, 0.28); }
.countdown-banner.waiting { border-color: rgba(248, 240, 223, 0.18); }
.countdown-banner.paused { border-color: rgba(122, 231, 204, 0.34); }
.countdown-banner.side-blue .countdown-main { color: #f0c867; }
.countdown-banner.side-red .countdown-main { color: #72afff; }
.countdown-banner.overtime .countdown-main { color: #f24d4d; }
.countdown-banner.paused .countdown-main { color: #7ae7cc; }
.countdown-eyebrow { margin: 0; font-size: 0.68rem; letter-spacing: 0.28em; text-transform: uppercase; color: rgba(248, 240, 223, 0.56); }
.countdown-main { font-size: clamp(2rem, 4vw, 3rem); line-height: 0.9; letter-spacing: 0.06em; }
.countdown-side { color: rgba(248, 240, 223, 0.78); font-size: 0.88rem; }
.bp-stage { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(360px, 480px) minmax(0, 1.2fr); gap: 8px; align-items: stretch; margin-bottom: 4px; }
.patron-panel, .draft-center { position: relative; overflow: hidden; }
.patron-panel { display: grid; grid-template-rows: auto 1fr; padding-top: 2px; }
.patron-head { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 0 18px 2px; }
.patron-head-right { text-align: right; }
.patron-emblem { width: 66px; height: 66px; object-fit: contain; filter: drop-shadow(0 8px 18px rgba(0, 0, 0, 0.32)); }
.patron-title-cn { margin: 0; font-size: 1.18rem; font-weight: 700; }
.patron-title-en { margin: 2px 0 0; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.18em; color: rgba(248, 240, 223, 0.54); }
.character-stage { position: relative; min-height: calc(100vh - 228px); display: flex; align-items: flex-start; justify-content: center; overflow: hidden; }
.stage-left { background: radial-gradient(circle at 30% 20%, rgba(230, 190, 97, 0.13), transparent 55%); }
.stage-right { background: radial-gradient(circle at 70% 20%, rgba(98, 167, 255, 0.13), transparent 55%); }
.character-render { width: 100%; max-height: calc(100vh - 170px); object-fit: contain; object-position: center top; filter: drop-shadow(0 30px 40px rgba(0, 0, 0, 0.35)); transform: translateY(-52px); }
.stage-left .character-render { transform: translateY(-52px) scaleX(-1); }
.patron-placeholder { width: min(58%, 260px); opacity: 0.42; object-fit: contain; }
.character-name-image { position: absolute; bottom: 124px; width: min(60%, 260px); object-fit: contain; filter: drop-shadow(0 10px 22px rgba(0, 0, 0, 0.5)); transform-origin: center top; animation: name-sway 3.4s ease-in-out infinite; }
.draft-center { display: grid; grid-template-rows: auto auto 1fr auto auto; padding: 8px 18px 12px; }
.center-head { text-align: center; padding-top: 2px; }
.center-head h2 { margin: 6px 0 8px; font-size: clamp(1.8rem, 3vw, 2.8rem); }
.setup-panel { margin: 8px auto 12px; width: min(100%, 420px); padding: 16px; border-radius: 18px; background: rgba(10, 12, 18, 0.62); border: 1px solid rgba(248, 240, 223, 0.12); box-shadow: 0 20px 36px rgba(0, 0, 0, 0.24); }
.setup-copy { text-align: center; }
.setup-title { margin: 0; font-size: 1rem; font-weight: 700; }
.setup-subtitle { margin: 6px 0 0; color: rgba(248, 240, 223, 0.66); font-size: 0.9rem; line-height: 1.45; }
.time-limit-group { margin-top: 14px; }
.setup-label { display: block; margin-bottom: 8px; color: rgba(248, 240, 223, 0.7); font-size: 0.82rem; }
.time-limit-options, .setup-actions, .confirm-actions, .bottom-actions, .bottom-members { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
.hero-board { display: grid; grid-template-columns: repeat(6, minmax(0, 72px)); justify-content: center; gap: 10px; padding: 12px 0 10px; }
.hero-tile { position: relative; width: 72px; aspect-ratio: 1; padding: 0; border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.1); background: rgba(18, 16, 24, 0.92); overflow: hidden; cursor: default; transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease, opacity 180ms ease; }
.hero-tile.interactive { cursor: pointer; }
.hero-tile.interactive:hover { transform: translateY(-3px); border-color: rgba(233, 210, 161, 0.65); box-shadow: 0 14px 26px rgba(0, 0, 0, 0.28); }
.hero-tile.picked { opacity: 0.42; filter: grayscale(0.9); }
.hero-tile.banned { opacity: 0.92; }
.hero-icon { width: 100%; height: 100%; object-fit: cover; display: block; }
.hero-ban-mark { position: absolute; inset: 0; display: grid; place-items: center; z-index: 2; font-size: 3.35rem; font-weight: 700; color: rgba(240, 58, 58, 0.98); text-shadow: 0 0 20px rgba(120, 0, 0, 0.95), 0 0 42px rgba(220, 42, 42, 0.6); pointer-events: none; }
.hero-ban-mask { position: absolute; inset: 0; z-index: 1; background: linear-gradient(180deg, rgba(8, 8, 8, 0.28), rgba(8, 8, 8, 0.62)); pointer-events: none; }
.hero-hover-name { position: absolute; left: 8px; right: 8px; bottom: 8px; padding: 6px 8px; border-radius: 999px; background: rgba(0, 0, 0, 0.72); font-size: 0.72rem; text-align: center; opacity: 0; transform: translateY(6px); transition: opacity 160ms ease, transform 160ms ease; pointer-events: none; }
.hero-tile:hover .hero-hover-name { opacity: 1; transform: translateY(0); }
.confirm-strip { display: flex; justify-content: space-between; gap: 14px; align-items: center; padding: 6px 0; }
.pending-copy strong { font-size: 1.12rem; }
.summary-label { margin: 0 0 4px; color: rgba(248, 240, 223, 0.58); font-size: 0.82rem; }
.center-meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 6px; }
.meta-chip { padding: 12px 14px; border-radius: 16px; background: rgba(255, 255, 255, 0.04); }
.meta-chip span { display: block; color: rgba(248, 240, 223, 0.5); font-size: 0.8rem; }
.meta-chip strong { display: block; margin-top: 6px; }
.seat-row { position: absolute; bottom: 14px; display: flex; flex-direction: column; gap: 8px; }
.seat-row-left { left: 18px; }
.seat-row-right { right: 18px; }
.ban-seat-row, .pick-seat-row { display: flex; gap: 6px; }
.ban-seat-row-right, .pick-seat-row-right { justify-content: flex-end; }
.seat-card { position: relative; width: 84px; height: 118px; padding: 0; box-sizing: border-box; display: block; border-radius: 14px; overflow: hidden; border: 1px solid rgba(118, 136, 141, 0.16); background: rgba(10, 13, 20, 0.72); box-shadow: 0 18px 30px rgba(0, 0, 0, 0.32); }
.ban-seat-card { position: relative; width: 60px; height: 84px; box-sizing: border-box; display: block; border-radius: 12px; overflow: hidden; border: 1px solid rgba(118, 136, 141, 0.18); background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02)), rgba(12, 13, 16, 0.54); backdrop-filter: blur(12px); }
.seat-card.empty { background: linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.03)), rgba(15, 22, 31, 0.26); border: 1px solid rgba(178, 194, 198, 0.18); backdrop-filter: blur(14px); }
.ban-seat-card.empty { opacity: 0.72; }
.seat-card-left { box-shadow: 0 18px 30px rgba(118, 88, 12, 0.24); }
.seat-card-right { box-shadow: 0 18px 30px rgba(27, 75, 145, 0.24); }
.seat-card-image { position: absolute; inset: -2px; width: calc(100% + 4px); height: calc(100% + 4px); object-fit: cover; object-position: center top; display: block; }
.ban-seat-image { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center top; filter: grayscale(1) contrast(1.02) brightness(0.92); }
.ban-seat-mark { position: absolute; inset: 0; display: grid; place-items: center; font-size: 1.9rem; color: rgba(236, 64, 64, 0.96); text-shadow: 0 0 14px rgba(110, 0, 0, 0.9); }
.seat-copy { position: absolute; left: 6px; right: 6px; bottom: 6px; display: flex; flex-direction: column; gap: 2px; padding: 7px 7px 5px; border-radius: 10px; background: linear-gradient(180deg, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.78)); }
.seat-copy span { font-size: 0.62rem; color: rgba(248, 240, 223, 0.62); }
.seat-copy strong { font-size: 0.72rem; line-height: 1.1; }
.bp-bottom { display: flex; flex-direction: column; justify-content: center; gap: 18px; align-items: center; margin-top: 14px; padding: 4px 0; }
.author-links { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; }
.author-link { padding: 8px 14px; border-radius: 999px; border: 1px solid rgba(255, 255, 255, 0.12); background: rgba(255, 255, 255, 0.05); color: #f8f0df; text-decoration: none; transition: 160ms ease; }
.author-link:hover { transform: translateY(-1px); border-color: rgba(233, 210, 161, 0.5); color: #fff3d1; }
.author-credit { margin: -6px 0 0; font-size: 0.82rem; letter-spacing: 0.04em; color: rgba(248, 240, 223, 0.68); text-align: center; }
.member-pill { padding: 8px 12px; border-radius: 999px; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.08); }
.helper-copy { margin: 0; text-align: center; color: rgba(248, 240, 223, 0.7); }
.button-primary, .button-secondary, .time-option { padding: 10px 16px; border-radius: 999px; border: 1px solid transparent; font: inherit; cursor: pointer; transition: 160ms ease; }
.button-primary { background: linear-gradient(135deg, #dcb560, #f0d88a); color: #17120b; }
.button-secondary, .time-option { background: rgba(255, 255, 255, 0.06); color: #f8f0df; border-color: rgba(255, 255, 255, 0.12); }
.time-option.active { background: rgba(233, 210, 161, 0.16); border-color: rgba(233, 210, 161, 0.48); }
.button-primary:hover:not(:disabled), .button-secondary:hover:not(:disabled), .time-option:hover:not(:disabled) { transform: translateY(-1px); }
.button-primary:disabled, .button-secondary:disabled, .time-option:disabled { opacity: 0.45; cursor: not-allowed; }
.render-fade-enter-active, .render-fade-leave-active { transition: opacity 200ms ease, transform 240ms ease; }
.render-fade-enter-from, .render-fade-leave-to { opacity: 0; transform: translateY(16px) scale(0.98); }
@keyframes name-sway { 0%, 100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
@media (max-width: 1380px) { .bp-stage { grid-template-columns: 1fr; } .character-stage { min-height: 400px; } .seat-row { position: static; justify-content: center; margin-top: 18px; } .ban-seat-row, .pick-seat-row, .ban-seat-row-right, .pick-seat-row-right { justify-content: center; flex-wrap: wrap; } }
@media (max-width: 920px) { .bp-topbar, .bp-bottom, .confirm-strip, .topbar-status { flex-direction: column; align-items: stretch; } .center-meta { grid-template-columns: 1fr 1fr; } .hero-board { grid-template-columns: repeat(5, minmax(0, 68px)); gap: 10px; } .hero-tile { width: 68px; } }
@media (max-width: 640px) { .bp-shell { padding: 12px 12px 16px; } .center-meta, .topbar-status { grid-template-columns: 1fr; } .hero-board { grid-template-columns: repeat(4, minmax(0, 68px)); } }
</style>
