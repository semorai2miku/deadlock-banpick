<template>
  <main class="room-view">
    <section v-if="store.loading" class="gate-panel">
      <p>房间加载中...</p>
    </section>

    <section v-else-if="!hasAccess" class="gate-panel password-gate">
      <div>
        <p class="gate-label">进入房间</p>
        <h1>输入房间密码以查看 {{ roomNameFromLobby || "该房间" }}</h1>
        <p class="gate-muted">无论是参与者还是观众，都需要先通过房间密码验证。</p>
      </div>

      <form class="gate-form" @submit.prevent="handleUnlockRoom">
        <input
          v-model="accessPassword"
          type="password"
          inputmode="numeric"
          maxlength="4"
          pattern="[0-9]{4}"
          placeholder="请输入 4 位数字密码"
        />
        <button class="button-primary" type="submit">进入房间</button>
      </form>

      <div class="gate-actions">
        <button class="button-secondary" type="button" @click="returnToLobby">返回大厅</button>
      </div>

      <p v-if="store.errorMessage" class="gate-muted">{{ store.errorMessage }}</p>
    </section>

    <section v-else-if="!store.roomState" class="gate-panel">
      <p>房间不存在、密码错误，或已在创建后超过 2 小时自动删除。</p>
      <p class="gate-muted">{{ store.errorMessage || "请返回大厅重新选择房间。" }}</p>
    </section>

    <section v-else-if="!hasJoinedIdentity" class="gate-panel identity-gate">
      <div>
        <p class="gate-label">加入房间</p>
        <h1>{{ store.roomState.name }}</h1>
        <p class="gate-muted">你已经通过密码验证。下一步请选择身份，加入后才会进入 BP 界面。</p>
      </div>

      <div class="identity-summary">
        <article class="summary-card">
          <span>房主</span>
          <strong>{{ store.roomState.host.name }}</strong>
        </article>
        <article class="summary-card">
          <span>参与者</span>
          <strong>{{ store.participants.length }}/2</strong>
        </article>
        <article class="summary-card">
          <span>观众</span>
          <strong>{{ store.spectators.length }}</strong>
        </article>
        <article class="summary-card">
          <span>每回合时间</span>
          <strong>{{ store.roomState.settings.timeLimitSeconds }}s</strong>
        </article>
      </div>

      <form class="gate-form" @submit.prevent="handleJoin('participant')">
        <input
          v-model.trim="participantName"
          type="text"
          maxlength="20"
          required
          placeholder="输入昵称成为参与者"
        />
        <button
          class="button-primary"
          type="submit"
          :disabled="!store.canJoinParticipant || !participantName.trim()"
        >
          加入为参与者
        </button>
      </form>

      <form
        v-if="store.canJoinSpectator"
        class="gate-form"
        @submit.prevent="handleJoin('spectator')"
      >
        <input
          v-model.trim="spectatorName"
          type="text"
          maxlength="20"
          required
          placeholder="输入昵称成为观众"
        />
        <button class="button-secondary" type="submit" :disabled="!spectatorName.trim()">
          作为观众进入
        </button>
      </form>

      <p v-else class="gate-muted">该房间已关闭观众加入。</p>
      <p v-if="store.errorMessage" class="gate-muted">{{ store.errorMessage }}</p>
    </section>

    <template v-else>
      <section class="bp-shell" :style="bpShellStyle">
        <div class="bp-overlay" />

        <header class="bp-topbar">
          <div class="topbar-block">
            <p class="eyebrow">Deadlock Ban/Pick</p>
            <h1>{{ store.roomState.name }}</h1>
            <p class="muted-line">
              房间 {{ store.roomCode }} · {{ timeLimitLabel }} ·
              {{ store.roomState.settings.allowSpectators ? "允许观众" : "观众关闭" }}
            </p>
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
            <article class="status-card">
              <span>我的身份</span>
              <strong>{{ memberLabel }}</strong>
            </article>
          </div>
        </header>

        <section
          class="countdown-banner"
          :class="{
            paused: store.isPaused,
            overtime: !!timedOutSide,
            'side-blue': store.currentTurn?.side === 'blue' && !timedOutSide,
            'side-red': store.currentTurn?.side === 'red' && !timedOutSide,
          }"
        >
          <p class="countdown-eyebrow">Round Timer</p>
          <strong class="countdown-main">{{ countdownLabel }}</strong>
          <span class="countdown-side">
            {{ activeSideLabel }}
            <template v-if="timedOutSide">
              · {{ timedOutSide === "blue" ? "影王已超时" : "元祖已超时" }}
            </template>
          </span>
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
              <p class="center-subtitle">{{ centerDescription }}</p>
            </div>

            <div class="hero-board">
              <button
                v-for="hero in heroTiles"
                :key="hero.name"
                class="hero-tile"
                :class="{
                  interactive: store.canAct,
                  picked: hero.picked,
                  banned: hero.banned,
                  pending: !isSpectatorView && pendingHeroName === hero.name,
                  spectator: isSpectatorView,
                }"
                :style="tileStyle(hero)"
                type="button"
                :disabled="!store.canAct || hero.picked || hero.banned"
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

              <div v-if="store.canAct" class="confirm-actions">
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
                <strong>{{ store.currentTurn?.action || "WAITING" }}</strong>
              </article>
              <article class="meta-chip">
                <span>行动方</span>
                <strong>{{ activeSideLabel }}</strong>
              </article>
              <article class="meta-chip">
                <span>房主</span>
                <strong>{{ store.roomState.host.name }}</strong>
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

        <section class="seat-row seat-row-left">
          <div class="ban-seat-row">
            <article
              v-for="(hero, index) in leftBanCards"
              :key="`left-ban-${index}`"
              class="ban-seat-card"
              :class="{ empty: !hero }"
            >
              <img v-if="hero" class="ban-seat-image" :src="getHeroCardUrl(hero.name)" :alt="hero.name" />
              <span v-if="hero" class="ban-seat-mark">✕</span>
            </article>
          </div>
          <div class="pick-seat-row">
            <article
              v-for="(hero, index) in leftSeatCards"
              :key="`left-seat-${index}`"
              class="seat-card seat-card-left"
              :class="{ empty: !hero }"
            >
              <img v-if="hero" class="seat-card-image" :src="getHeroCardUrl(hero.name)" :alt="hero.name" />
              <div class="seat-copy">
                <span>影王 {{ index + 1 }}</span>
                <strong>{{ hero?.name ?? "Empty" }}</strong>
              </div>
            </article>
          </div>
        </section>

        <section class="seat-row seat-row-right">
          <div class="ban-seat-row ban-seat-row-right">
            <article
              v-for="(hero, index) in rightBanCards"
              :key="`right-ban-${index}`"
              class="ban-seat-card"
              :class="{ empty: !hero }"
            >
              <img v-if="hero" class="ban-seat-image" :src="getHeroCardUrl(hero.name)" :alt="hero.name" />
              <span v-if="hero" class="ban-seat-mark">✕</span>
            </article>
          </div>
          <div class="pick-seat-row pick-seat-row-right">
            <article
              v-for="(hero, index) in rightSeatCards"
              :key="`right-seat-${index}`"
              class="seat-card seat-card-right"
              :class="{ empty: !hero }"
            >
              <img v-if="hero" class="seat-card-image" :src="getHeroCardUrl(hero.name)" :alt="hero.name" />
              <div class="seat-copy">
                <span>元祖 {{ index + 1 }}</span>
                <strong>{{ hero?.name ?? "Empty" }}</strong>
              </div>
            </article>
          </div>
        </section>

        <footer class="bp-bottom">
          <div class="bottom-members">
            <span class="member-pill host">房主 {{ store.roomState.host.name }}</span>
            <span
              v-for="participant in store.participants"
              :key="participant.id"
              class="member-pill"
            >
              {{ participant.name }} · {{ participant.side === "blue" ? "影王" : "元祖" }}
            </span>
            <span v-if="store.spectators.length" class="member-pill spectator">
              观众 {{ store.spectators.length }}
            </span>
          </div>

          <div class="bottom-actions">
            <button class="button-secondary" type="button" @click="returnToLobby">
              返回大厅
            </button>
            <button class="button-secondary" type="button" @click="copyRoomLink">
              {{ copyButtonText }}
            </button>
            <button
              v-if="store.isHost"
              class="button-secondary"
              type="button"
              :disabled="!store.canHostStart"
              @click="store.hostStartDraft"
            >
              开始 BP
            </button>
            <button
              v-if="store.isHost"
              class="button-secondary"
              type="button"
              :disabled="!store.canHostSwapSides"
              @click="store.hostSwapSides"
            >
              交换阵营
            </button>
            <button
              v-if="store.isHost"
              class="button-secondary"
              type="button"
              :disabled="!store.canHostUndo"
              @click="store.hostUndoLastAction"
            >
              返回上一步
            </button>
            <button
              v-if="store.isHost"
              class="button-secondary"
              type="button"
              :disabled="!store.canHostReset"
              @click="store.hostResetRoom"
            >
              重置房间
            </button>
            <button
              v-if="store.isHost && store.canHostPause"
              class="button-secondary"
              type="button"
              @click="store.hostPauseDraft"
            >
              暂停 BP
            </button>
            <button
              v-if="store.isHost && store.canHostResume"
              class="button-secondary"
              type="button"
              @click="store.hostResumeDraft"
            >
              恢复 BP
            </button>
            <button
              v-if="store.isHost"
              class="button-secondary action-danger"
              type="button"
              @click="store.deleteCurrentRoom"
            >
              删除房间
            </button>
          </div>
        </footer>

        <div v-if="store.errorMessage" class="error-toast">{{ store.errorMessage }}</div>
      </section>

      <div v-if="shouldShowPauseOverlay" class="modal-backdrop">
        <section class="pause-modal">
          <p class="pause-label">Paused</p>
          <h2>BP 已暂停</h2>
          <p>房主暂时冻结了当前回合。恢复后会从暂停前的剩余时间继续。</p>
          <button
            v-if="store.isHost && store.canHostResume"
            class="button-primary"
            type="button"
            @click="store.hostResumeDraft"
          >
            恢复 BP
          </button>
        </section>
      </div>

      <div v-if="shouldShowTimeoutModal" class="modal-backdrop" @click.self="acknowledgeTimeout">
        <section class="timeout-modal">
          <h2>你已超时</h2>
          <p>
            当前这 {{ store.roomState.settings.timeLimitSeconds }} 秒内你还没有完成操作。这里只做提醒，不会自动跳过，
            点击确定后仍然可以继续选择。
          </p>
          <button class="button-primary" type="button" @click="acknowledgeTimeout">确定</button>
        </section>
      </div>
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useBanPickStore } from "@/stores/banpick";
import {
  archMotherUrl,
  bpBackgroundUrl,
  getHeroCardUrl,
  getHeroIconUrl,
  getHeroNameImageUrl,
  getHeroRenderUrl,
  hiddenKingUrl,
} from "@/lib/bpAssets";

const route = useRoute();
const router = useRouter();
const store = useBanPickStore();

const participantName = ref("");
const spectatorName = ref("");
const accessPassword = ref("");
const copyButtonText = ref("复制房间链接");
const currentTimestamp = ref(Date.now());
const timeoutAckKey = ref("");

const routeRoomId = computed(() => String(route.params.roomId ?? ""));
const hasAccess = computed(() => !!store.roomPassword);
const hasJoinedIdentity = computed(() => !!store.localMember);
const isSpectatorView = computed(() => store.localMember?.role === "spectator");
const roomNameFromLobby = computed(
  () => store.lobbyRooms.find((room) => room.id === routeRoomId.value)?.name ?? "",
);
const activeTurnKey = computed(() =>
  store.roomState && store.currentTurn
    ? `${store.roomState.id}:${store.roomState.currentTurnIndex}`
    : "",
);

const pendingHeroName = computed(() => {
  if (!store.currentTurn) {
    return "";
  }

  return store.draftPreview[store.currentTurn.side] ?? "";
});

const timeLimitLabel = computed(() =>
  store.roomState?.settings.timeLimitSeconds === 0
    ? "无限制时间"
    : `${store.roomState?.settings.timeLimitSeconds ?? 30}s / 回合`,
);

const countdownSeconds = computed(() => {
  if (!store.roomState || !store.currentTurn || store.roomState.status !== "drafting") {
    return store.roomState?.settings.timeLimitSeconds ?? 30;
  }

  if (store.roomState.settings.timeLimitSeconds === 0) {
    return 0;
  }

  const startedAt = new Date(store.roomState.currentTurnStartedAt).getTime();
  if (Number.isNaN(startedAt)) {
    return store.roomState.settings.timeLimitSeconds;
  }

  return Math.ceil(
    (startedAt + store.roomState.settings.timeLimitSeconds * 1000 - currentTimestamp.value) / 1000,
  );
});

const timedOutSide = computed(() => {
  if (
    !store.currentTurn ||
    store.roomState?.status !== "drafting" ||
    store.roomState.settings.timeLimitSeconds === 0
  ) {
    return null;
  }

  return countdownSeconds.value <= 0 ? store.currentTurn.side : null;
});

const shouldShowTimeoutModal = computed(() => {
  if (!store.localMember || !store.currentTurn || !timedOutSide.value) {
    return false;
  }

  return (
    store.localMember.role === "participant" &&
    store.localMember.side === timedOutSide.value &&
    timeoutAckKey.value !== activeTurnKey.value
  );
});

const shouldShowPauseOverlay = computed(() => store.isPaused);

const bpShellStyle = computed(() => ({
  backgroundImage: `linear-gradient(180deg, rgba(10, 9, 15, 0.38), rgba(7, 6, 12, 0.9)), url("${bpBackgroundUrl}")`,
}));

const countdownLabel = computed(() =>
  store.roomState?.status === "paused"
    ? "PAUSED"
    : store.roomState?.settings.timeLimitSeconds === 0
      ? "∞"
    : store.roomState?.status === "drafting"
      ? `${Math.max(0, countdownSeconds.value)}s`
      : "--",
);

const memberLabel = computed(() => {
  if (!store.localMember) {
    return "未加入";
  }

  if (store.localMember.role === "host") {
    return "房主";
  }

  if (store.localMember.role === "spectator") {
    return "观众";
  }

  return store.localMember.side === "blue" ? "影王阵营" : "元祖阵营";
});

const phaseTitle = computed(() => {
  if (store.isFinished) {
    return "本局已完成";
  }

  if (!store.currentTurn) {
    return "等待房主开始";
  }

  return `${store.currentTurn.side === "blue" ? "影王" : "元祖"} ${store.currentTurn.action}`;
});

const centerTitle = computed(() => {
  if (store.isFinished) {
    return "本局 BP 已完成";
  }

  if (store.isPaused) {
    return "BP 已暂停";
  }

  if (!store.currentTurn) {
    return "等待下一步";
  }

  return `第 ${store.currentTurn.order} 回合 · ${store.currentTurn.action}`;
});

const centerDescription = computed(() => {
  if (store.isFinished) {
    return "房主现在可以重置房间，或者交换阵营开始下一局。";
  }

  if (store.isPaused) {
    return "房主已暂停当前 BP。恢复后将从暂停前的剩余时间继续。";
  }

  if (!store.currentTurn) {
    return "等待房主开始 BP，或等待房间进入下一阶段。";
  }

  if (store.canAct) {
    return "当前回合由你执行操作。";
  }

  if (isSpectatorView.value) {
    return "当前为观战视角。";
  }

  return "当前回合由对方操作。";
});

const activeSideLabel = computed(() => {
  if (!store.currentTurn) {
    return "等待中";
  }

  return store.currentTurn.side === "blue" ? "影王 / Hidden King" : "元祖 / ArchMother";
});

const selectedHeroNames = computed(
  () =>
    new Set([
      ...store.blueBans.map((hero) => hero.name),
      ...store.redBans.map((hero) => hero.name),
      ...store.bluePicks.map((hero) => hero.name),
      ...store.redPicks.map((hero) => hero.name),
    ]),
);

const bannedHeroNames = computed(
  () =>
    new Set([
      ...store.blueBans.map((hero) => hero.name),
      ...store.redBans.map((hero) => hero.name),
    ]),
);

const heroTiles = computed(() => {
  const availableByName = new Map(store.availableHeroes.map((hero) => [hero.name, hero]));

  return (store.roomState?.heroPool ?? []).map((heroName) => ({
    id:
      availableByName.get(heroName)?.id ??
      heroName.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, ""),
    name: heroName,
    iconUrl: getHeroIconUrl(heroName),
    banned: bannedHeroNames.value.has(heroName),
    picked: selectedHeroNames.value.has(heroName) && !bannedHeroNames.value.has(heroName),
  }));
});

const pendingBorderColor = computed(() => {
  if (!store.currentTurn) {
    return "rgba(255,255,255,0.4)";
  }

  if (store.currentTurn.action === "BAN") {
    return "#c43333";
  }

  return store.currentTurn.side === "blue" ? "#e6be61" : "#62a7ff";
});

function getLatestHeroBySide(side: "blue" | "red") {
  for (let index = store.records.length - 1; index >= 0; index -= 1) {
    const record = store.records[index];
    if (record.side === side) {
      return record.heroName;
    }
  }

  return "";
}

const leftDisplayHeroName = computed(() => {
  if (store.currentTurn?.side === "blue" && pendingHeroName.value) {
    return pendingHeroName.value;
  }

  return getLatestHeroBySide("blue");
});

const rightDisplayHeroName = computed(() => {
  if (store.currentTurn?.side === "red" && pendingHeroName.value) {
    return pendingHeroName.value;
  }

  return getLatestHeroBySide("red");
});

const leftDisplayRenderUrl = computed(() =>
  leftDisplayHeroName.value ? getHeroRenderUrl(leftDisplayHeroName.value) : "",
);
const rightDisplayRenderUrl = computed(() =>
  rightDisplayHeroName.value ? getHeroRenderUrl(rightDisplayHeroName.value) : "",
);
const leftDisplayNameImageUrl = computed(() =>
  leftDisplayHeroName.value ? getHeroNameImageUrl(leftDisplayHeroName.value) : "",
);
const rightDisplayNameImageUrl = computed(() =>
  rightDisplayHeroName.value ? getHeroNameImageUrl(rightDisplayHeroName.value) : "",
);
const leftDisplayKey = computed(() => leftDisplayHeroName.value || "hidden-king-default");
const rightDisplayKey = computed(() => rightDisplayHeroName.value || "archmother-default");

const leftSeatCards = computed(() => {
  const picks = [...store.bluePicks];
  if (
    store.currentTurn?.side === "blue" &&
    store.currentTurn.action === "PICK" &&
    pendingHeroName.value &&
    picks.length < 6
  ) {
    picks.push({
      id: pendingHeroName.value,
      name: pendingHeroName.value,
      role: "Preview",
      difficulty: "Medium",
    });
  }

  return Array.from({ length: 6 }, (_, index) => picks[index] ?? null);
});

const rightSeatCards = computed(() => {
  const picks = [...store.redPicks];
  if (
    store.currentTurn?.side === "red" &&
    store.currentTurn.action === "PICK" &&
    pendingHeroName.value &&
    picks.length < 6
  ) {
    picks.push({
      id: pendingHeroName.value,
      name: pendingHeroName.value,
      role: "Preview",
      difficulty: "Medium",
    });
  }

  return Array.from({ length: 6 }, (_, index) => picks[index] ?? null);
});

const leftBanCards = computed(() => {
  const bans = [...store.blueBans];
  if (
    store.currentTurn?.side === "blue" &&
    store.currentTurn.action === "BAN" &&
    pendingHeroName.value &&
    bans.length < 2
  ) {
    bans.push({
      id: pendingHeroName.value,
      name: pendingHeroName.value,
      role: "Preview",
      difficulty: "Medium",
    });
  }

  return Array.from({ length: 2 }, (_, index) => bans[index] ?? null);
});

const rightBanCards = computed(() => {
  const bans = [...store.redBans];
  if (
    store.currentTurn?.side === "red" &&
    store.currentTurn.action === "BAN" &&
    pendingHeroName.value &&
    bans.length < 2
  ) {
    bans.push({
      id: pendingHeroName.value,
      name: pendingHeroName.value,
      role: "Preview",
      difficulty: "Medium",
    });
  }

  return Array.from({ length: 2 }, (_, index) => bans[index] ?? null);
});

let timerId: number | null = null;

function tileStyle(hero: { name: string }) {
  if (isSpectatorView.value) {
    return {};
  }

  if (pendingHeroName.value === hero.name && store.canAct) {
    return {
      borderColor: pendingBorderColor.value,
      boxShadow: `0 0 0 1px ${pendingBorderColor.value}, 0 0 24px ${pendingBorderColor.value}66`,
    };
  }

  return {};
}

function selectHero(heroName: string) {
  if (!store.canAct || isSpectatorView.value || !store.currentTurn) {
    return;
  }

  void store.setDraftPreview(store.currentTurn.side, heroName);
}

async function confirmSelection() {
  if (!store.canAct || !pendingHeroName.value) {
    return;
  }

  const hero = store.availableHeroes.find((item) => item.name === pendingHeroName.value);
  if (!hero) {
    return;
  }

  await store.performDraftAction(hero.id);
}

function resetSelection() {
  if (!store.currentTurn) {
    return;
  }

  void store.setDraftPreview(store.currentTurn.side, null);
}

async function loadRoom() {
  if (!routeRoomId.value || !store.roomPassword) {
    return;
  }

  await store.initializeRoom(routeRoomId.value);
}

async function handleUnlockRoom() {
  if (!routeRoomId.value || !accessPassword.value) {
    return;
  }

  if (!/^\d{4}$/.test(accessPassword.value)) {
    store.clearError();
    store.$patch({ errorMessage: "房间密码必须是 4 位数字。" });
    return;
  }

  await store.unlockRoom(routeRoomId.value, accessPassword.value);
}

async function handleJoin(role: "participant" | "spectator") {
  const name =
    role === "participant" ? participantName.value.trim() : spectatorName.value.trim();

  if (!name) {
    store.$patch({
      errorMessage: role === "participant" ? "请输入参与者昵称。" : "请输入观众昵称。",
    });
    return;
  }

  await store.joinCurrentRoom({ name, role });
  participantName.value = "";
  spectatorName.value = "";
}

async function copyRoomLink() {
  await navigator.clipboard.writeText(window.location.href);
  copyButtonText.value = "复制成功";
  window.setTimeout(() => {
    copyButtonText.value = "复制房间链接";
  }, 1500);
}

async function returnToLobby() {
  await router.push("/");
}

function acknowledgeTimeout() {
  timeoutAckKey.value = activeTurnKey.value;
}

onMounted(async () => {
  timerId = window.setInterval(() => {
    currentTimestamp.value = Date.now();
  }, 1000);

  await store.refreshLobby();
  await loadRoom();
});

onUnmounted(() => {
  if (timerId) {
    window.clearInterval(timerId);
  }
});

watch(routeRoomId, async () => {
  await store.refreshLobby();
  await loadRoom();
});

watch(activeTurnKey, () => {
  if (timeoutAckKey.value && timeoutAckKey.value !== activeTurnKey.value) {
    timeoutAckKey.value = "";
  }
});
</script>

<style scoped>
.room-view {
  min-height: 100vh;
  background: #09070d;
  color: #f8f0df;
}

.gate-panel {
  width: min(760px, calc(100% - 40px));
  margin: 48px auto;
  padding: 28px;
  border-radius: 28px;
  background: linear-gradient(180deg, rgba(20, 18, 29, 0.96), rgba(8, 8, 13, 0.98));
  border: 1px solid rgba(207, 173, 103, 0.2);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35);
}

.gate-label {
  margin: 0 0 10px;
  font-size: 0.84rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(233, 210, 161, 0.72);
}

.gate-panel h1 {
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.2rem);
}

.gate-muted {
  color: rgba(248, 240, 223, 0.7);
}

.gate-form {
  display: flex;
  gap: 12px;
  margin-top: 18px;
}

.gate-actions {
  display: flex;
  justify-content: flex-start;
  margin-top: 12px;
}

.identity-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.summary-card {
  padding: 16px;
  border-radius: 18px;
  border: 1px solid rgba(233, 210, 161, 0.12);
  background: rgba(255, 255, 255, 0.03);
}

.summary-card span {
  display: block;
  color: rgba(248, 240, 223, 0.58);
}

.summary-card strong {
  display: block;
  margin-top: 6px;
  font-size: 1.05rem;
}

.bp-shell {
  position: relative;
  min-height: 100vh;
  padding: 14px 20px 12px;
  background-position: center;
  background-size: cover;
  overflow: hidden;
  box-sizing: border-box;
}

.bp-overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 50%, rgba(16, 11, 23, 0.12), rgba(8, 7, 12, 0.62)),
    linear-gradient(90deg, rgba(236, 192, 91, 0.04), transparent 20%, transparent 80%, rgba(86, 149, 255, 0.06));
  pointer-events: none;
}

.bp-topbar,
.countdown-banner,
.bp-stage,
.bp-bottom,
.seat-row,
.error-toast {
  position: relative;
  z-index: 1;
}

.bp-topbar {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
  margin-bottom: 8px;
}

.countdown-banner {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 4px;
  width: min(420px, calc(100% - 48px));
  margin: 0 auto 6px;
  padding: 10px 20px 12px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(13, 22, 28, 0.88), rgba(10, 16, 22, 0.72));
  border: 1px solid rgba(248, 240, 223, 0.14);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.28);
}

.countdown-banner.paused {
  border-color: rgba(122, 231, 204, 0.34);
}

.countdown-banner.side-blue .countdown-main {
  color: #f0c867;
  text-shadow: 0 0 18px rgba(214, 173, 72, 0.26);
}

.countdown-banner.side-red .countdown-main {
  color: #72afff;
  text-shadow: 0 0 18px rgba(84, 149, 255, 0.26);
}

.countdown-banner.overtime {
  border-color: rgba(214, 57, 57, 0.42);
  box-shadow: 0 0 0 1px rgba(214, 57, 57, 0.15), 0 18px 40px rgba(0, 0, 0, 0.32);
}

.countdown-banner.overtime .countdown-main {
  color: #f24d4d;
  text-shadow: 0 0 18px rgba(214, 57, 57, 0.32);
}

.countdown-banner.paused .countdown-main {
  color: #7ae7cc;
  text-shadow: 0 0 18px rgba(122, 231, 204, 0.24);
}

.countdown-eyebrow {
  margin: 0;
  font-size: 0.68rem;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: rgba(248, 240, 223, 0.56);
}

.countdown-main {
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 0.9;
  letter-spacing: 0.06em;
  transition: color 180ms ease, text-shadow 180ms ease;
}

.countdown-side {
  color: rgba(248, 240, 223, 0.78);
  font-size: 0.88rem;
}

.topbar-block h1 {
  margin: 8px 0 10px;
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 0.95;
}

.eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.24em;
  font-size: 0.76rem;
  color: rgba(233, 210, 161, 0.72);
}

.muted-line {
  margin: 0;
  color: rgba(248, 240, 223, 0.68);
}

.topbar-status {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 180px));
  gap: 12px;
}

.status-card {
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(10, 10, 14, 0.42);
}

.status-card span {
  display: block;
  color: rgba(248, 240, 223, 0.56);
  font-size: 0.82rem;
}

.status-card strong {
  display: block;
  margin-top: 8px;
  font-size: 1.06rem;
}

.bp-stage {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(360px, 480px) minmax(0, 1.2fr);
  gap: 8px;
  align-items: stretch;
  margin-bottom: 4px;
}

.patron-panel,
.draft-center {
  position: relative;
  overflow: hidden;
}

.patron-panel {
  display: grid;
  grid-template-rows: auto 1fr;
  padding-top: 2px;
}

.patron-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 0 18px 2px;
}

.patron-head-right {
  text-align: right;
}

.patron-emblem {
  width: 66px;
  height: 66px;
  object-fit: contain;
  filter: drop-shadow(0 8px 18px rgba(0, 0, 0, 0.32));
}

.patron-title-cn {
  margin: 0;
  font-size: 1.18rem;
  font-weight: 700;
}

.patron-title-en {
  margin: 2px 0 0;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: rgba(248, 240, 223, 0.54);
}

.character-stage {
  position: relative;
  min-height: calc(100vh - 228px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow: hidden;
}

.stage-left {
  background: radial-gradient(circle at 30% 20%, rgba(230, 190, 97, 0.13), transparent 55%);
}

.stage-right {
  background: radial-gradient(circle at 70% 20%, rgba(98, 167, 255, 0.13), transparent 55%);
}

.character-render {
  width: 100%;
  max-height: calc(100vh - 170px);
  object-fit: contain;
  object-position: center top;
  filter: drop-shadow(0 30px 40px rgba(0, 0, 0, 0.35));
  transform: translateY(-52px);
}

.stage-left .character-render {
  transform: translateY(-52px) scaleX(-1);
}

.patron-placeholder {
  width: min(58%, 260px);
  opacity: 0.42;
  object-fit: contain;
}

.character-name-image {
  position: absolute;
  bottom: 124px;
  width: min(60%, 260px);
  object-fit: contain;
  filter: drop-shadow(0 10px 22px rgba(0, 0, 0, 0.5));
  transform-origin: center top;
  animation: name-sway 3.4s ease-in-out infinite;
}

.draft-center {
  display: grid;
  grid-template-rows: auto 1fr auto auto;
  padding: 8px 18px 12px;
}

.center-head {
  text-align: center;
  padding-top: 2px;
}

.center-head h2 {
  margin: 6px 0 8px;
  font-size: clamp(1.8rem, 3vw, 2.8rem);
}

.center-subtitle {
  margin: 0 auto;
  max-width: 430px;
  color: rgba(248, 240, 223, 0.58);
  line-height: 1.45;
}

.hero-board {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 72px));
  justify-content: center;
  gap: 10px;
  padding: 12px 0 10px;
}

.hero-tile {
  position: relative;
  width: 72px;
  aspect-ratio: 1;
  padding: 0;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(18, 16, 24, 0.92);
  overflow: hidden;
  cursor: default;
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease,
    opacity 180ms ease;
}

.hero-tile.interactive {
  cursor: pointer;
}

.hero-tile.interactive:hover {
  transform: translateY(-3px);
  border-color: rgba(233, 210, 161, 0.65);
  box-shadow: 0 14px 26px rgba(0, 0, 0, 0.28);
}

.hero-tile.picked {
  opacity: 0.42;
  filter: grayscale(0.9);
}

.hero-tile.banned {
  opacity: 0.92;
}

.hero-tile.spectator {
  cursor: default;
}

.hero-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.hero-ban-mark {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  z-index: 2;
  font-size: 3.35rem;
  font-weight: 700;
  color: rgba(240, 58, 58, 0.98);
  text-shadow: 0 0 20px rgba(120, 0, 0, 0.95), 0 0 42px rgba(220, 42, 42, 0.6);
  pointer-events: none;
}

.hero-ban-mask {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(180deg, rgba(8, 8, 8, 0.28), rgba(8, 8, 8, 0.62));
  pointer-events: none;
}

.hero-hover-name {
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 8px;
  padding: 6px 8px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.72);
  font-size: 0.72rem;
  text-align: center;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 160ms ease, transform 160ms ease;
  pointer-events: none;
}

.hero-tile:hover .hero-hover-name {
  opacity: 1;
  transform: translateY(0);
}

.confirm-strip {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  padding: 6px 0;
}

.pending-copy strong {
  font-size: 1.12rem;
}

.confirm-actions {
  display: flex;
  gap: 10px;
}

.center-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 6px;
}

.meta-chip {
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
}

.meta-chip span {
  display: block;
  color: rgba(248, 240, 223, 0.5);
  font-size: 0.8rem;
}

.meta-chip strong {
  display: block;
  margin-top: 6px;
}

.seat-row {
  position: absolute;
  bottom: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.seat-row-left {
  left: 18px;
}

.seat-row-right {
  right: 18px;
}

.seat-card {
  position: relative;
  width: 84px;
  height: 118px;
  padding: 0;
  box-sizing: border-box;
  display: block;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(118, 136, 141, 0.16);
  background: rgba(10, 13, 20, 0.72);
  box-shadow: 0 18px 30px rgba(0, 0, 0, 0.32);
  isolation: isolate;
}

.ban-seat-row {
  display: flex;
  gap: 6px;
}

.ban-seat-row-right {
  justify-content: flex-end;
}

.pick-seat-row {
  display: flex;
  gap: 6px;
}

.pick-seat-row-right {
  justify-content: flex-end;
}

.ban-seat-card {
  position: relative;
  width: 60px;
  height: 84px;
  box-sizing: border-box;
  display: block;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(118, 136, 141, 0.18);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02)),
    rgba(12, 13, 16, 0.54);
  backdrop-filter: blur(12px);
}

.ban-seat-card.empty {
  opacity: 0.72;
}

.ban-seat-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  filter: grayscale(1) contrast(1.02) brightness(0.92);
}

.ban-seat-mark {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 1.9rem;
  color: rgba(236, 64, 64, 0.96);
  text-shadow: 0 0 14px rgba(110, 0, 0, 0.9);
}

.seat-card.empty {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.03)),
    rgba(15, 22, 31, 0.26);
  border: 1px solid rgba(178, 194, 198, 0.18);
  backdrop-filter: blur(14px);
}

.seat-card:not(.empty),
.ban-seat-card:not(.empty) {
  border-color: transparent;
}

.seat-card-left {
  box-shadow: 0 18px 30px rgba(118, 88, 12, 0.24);
}

.seat-card-right {
  box-shadow: 0 18px 30px rgba(27, 75, 145, 0.24);
}

.seat-card-image {
  position: absolute;
  inset: -2px;
  width: calc(100% + 4px);
  height: calc(100% + 4px);
  object-fit: cover;
  object-position: center top;
  transform: none;
  display: block;
}

.seat-copy {
  position: absolute;
  left: 6px;
  right: 6px;
  bottom: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 7px 7px 5px;
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.78));
}

.pause-modal {
  width: min(440px, 100%);
  padding: 28px 24px;
  border-radius: 26px;
  background: linear-gradient(180deg, rgba(16, 29, 34, 0.96), rgba(7, 16, 21, 0.96));
  border: 1px solid rgba(122, 231, 204, 0.24);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.42);
  text-align: center;
}

.pause-label {
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.3em;
  color: rgba(122, 231, 204, 0.76);
  font-size: 0.76rem;
}

.pause-modal h2 {
  margin: 0 0 10px;
  font-size: 2rem;
}

.pause-modal p {
  margin: 0 0 18px;
  color: rgba(248, 240, 223, 0.72);
}

.seat-copy span {
  font-size: 0.62rem;
  color: rgba(248, 240, 223, 0.62);
}

.seat-copy strong {
  font-size: 0.72rem;
  line-height: 1.1;
}

.bp-bottom {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 18px;
  align-items: center;
  margin-top: 14px;
  padding: 4px 0;
}

.bottom-members,
.bottom-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.bottom-actions {
  max-width: min(760px, 100%);
}

.action-danger {
  border-color: rgba(194, 73, 73, 0.34);
  color: #ffd7d7;
  background: rgba(81, 22, 27, 0.72);
}

.action-danger:hover:not(:disabled) {
  border-color: rgba(224, 102, 102, 0.46);
  background: rgba(102, 26, 34, 0.84);
}

.member-pill {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.member-pill.host {
  border-color: rgba(233, 210, 161, 0.25);
}

.member-pill.spectator {
  border-color: rgba(98, 167, 255, 0.2);
}

.error-toast {
  margin-top: 14px;
  padding: 14px 16px;
  border-radius: 16px;
  color: #ffd4d8;
  background: rgba(132, 26, 43, 0.36);
  border: 1px solid rgba(255, 113, 141, 0.25);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.68);
  z-index: 10;
}

.timeout-modal {
  width: min(460px, 100%);
  padding: 24px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(26, 22, 35, 0.98), rgba(12, 10, 18, 0.98));
  border: 1px solid rgba(233, 210, 161, 0.15);
}

.timeout-modal h2 {
  margin: 0 0 10px;
}

.timeout-modal p {
  margin: 0 0 18px;
  color: rgba(248, 240, 223, 0.72);
}

.render-fade-enter-active,
.render-fade-leave-active {
  transition: opacity 200ms ease, transform 240ms ease;
}

.render-fade-enter-from,
.render-fade-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.98);
}

@keyframes name-sway {
  0%,
  100% {
    transform: rotate(-3deg);
  }

  50% {
    transform: rotate(3deg);
  }
}

@media (max-width: 1380px) {
  .bp-stage {
    grid-template-columns: 1fr;
  }

  .character-stage {
    min-height: 400px;
  }

  .seat-row {
    position: static;
    justify-content: center;
    margin-top: 18px;
  }

  .ban-seat-row,
  .pick-seat-row,
  .ban-seat-row-right,
  .pick-seat-row-right {
    justify-content: center;
    flex-wrap: wrap;
  }
}

@media (max-width: 920px) {
  .bp-topbar,
  .bp-bottom,
  .gate-form,
  .confirm-strip,
  .topbar-status {
    grid-template-columns: 1fr;
    flex-direction: column;
    align-items: stretch;
  }

  .identity-summary,
  .center-meta {
    grid-template-columns: 1fr 1fr;
  }

  .hero-board {
    grid-template-columns: repeat(5, minmax(0, 68px));
    gap: 10px;
  }

  .hero-tile {
    width: 68px;
    border-radius: 16px;
  }
}

@media (max-width: 640px) {
  .bp-shell {
    padding: 12px 12px 16px;
  }

  .identity-summary,
  .center-meta {
    grid-template-columns: 1fr;
  }

  .hero-board {
    grid-template-columns: repeat(4, minmax(0, 62px));
  }

  .hero-tile {
    width: 62px;
    border-radius: 14px;
  }
}
</style>
