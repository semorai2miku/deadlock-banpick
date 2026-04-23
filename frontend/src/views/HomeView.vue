<template>
  <main class="home-view" :style="pageStyle">
    <div class="home-overlay" />

    <section class="home-stage">
      <section class="hero-panel">
        <div class="hero-copy">
          <div class="brand-stack">
            <img class="brand-mark" :src="siteLogoUrl" alt="Deadlock BanPick logo" />
            <img class="brand-name" :src="siteNameUrl" alt="Deadlock BanPick" />
          </div>

          <p class="hero-kicker">Deadlock Ban/Pick Lobby</p>
          <h1>Deadlock 在线 Ban/Pick 平台</h1>
          <p class="hero-lead">
            这是一个面向 Deadlock 自定义对局的外部 Ban/Pick 平台。房主可以创建房间，参与者完成实时 BP，观众则可以随时进入查看当前对局。
          </p>

          <div class="hero-actions">
            <button class="button-primary" type="button" @click="openCreateModal">创建房间</button>
            <button class="button-secondary" type="button" @click="openJoinModal">
              输入房间码
            </button>
            <button class="button-secondary" type="button" @click="goToLocalDraft">
              本地演示模式
            </button>
            <button class="button-secondary ghost-button" type="button" @click="store.refreshLobby">
              {{ store.lobbyLoading ? "刷新中..." : "刷新大厅" }}
            </button>
          </div>

          <p
            v-if="!showCreateModal && !showJoinModal && store.errorMessage"
            class="inline-feedback error"
          >
            {{ store.errorMessage }}
          </p>
        </div>

        <div class="hero-stats">
          <article class="stat-card">
            <span>公开房间</span>
            <strong>{{ store.lobbyRooms.length }}</strong>
          </article>
          <article class="stat-card">
            <span>访问方式</span>
            <strong>4 位数字密码</strong>
          </article>
          <article class="stat-card">
            <span>房间时效</span>
            <strong>2 小时自动清理</strong>
          </article>
        </div>
      </section>

      <section class="lobby-surface">
        <header class="lobby-toolbar">
          <div>
            <p class="section-kicker">Lobby</p>
            <h2>当前开放的房间</h2>
            <p class="toolbar-copy">公开房间会显示在大厅中，私密房间可通过房间码直接进入。</p>
          </div>

          <div class="toolbar-actions">
            <input
              v-model.trim="searchKeyword"
              class="search-input"
              type="text"
              placeholder="搜索房间名或房间码"
            />
          </div>
        </header>

        <div v-if="filteredRooms.length" class="room-grid">
          <article v-for="room in filteredRooms" :key="room.id" class="room-card">
            <div class="room-card-top">
              <div>
                <p class="room-code">{{ room.code }}</p>
                <h3>{{ room.name }}</h3>
              </div>
              <span class="status-badge" :class="room.status">{{ statusLabel(room.status) }}</span>
            </div>

            <div class="room-meta">
              <span>房主：{{ room.hostName }}</span>
              <span>参与者：{{ room.participantCount }}/2</span>
              <span>观众：{{ room.spectatorCount }}</span>
              <span>回合时间：{{ formatTimeLimit(room.settings.timeLimitSeconds) }}</span>
              <span>观众权限：{{ room.settings.allowSpectators ? "开启" : "关闭" }}</span>
              <span>失效时间：{{ formatExpire(room.expiresAt) }}</span>
            </div>

            <div class="room-card-actions">
              <button class="button-secondary" type="button" @click="goToRoom(room.id)">
                进入房间
              </button>
            </div>
          </article>
        </div>

        <div v-else class="empty-state">
          <p v-if="store.lobbyRooms.length">没有匹配到房间，请换个关键词再试试。</p>
          <p v-else>大厅里还没有公开房间，先创建一间新的房间开始吧。</p>
        </div>
      </section>
    </section>

    <footer class="home-footer">
      <p class="footer-title">Links</p>
      <nav class="footer-links" aria-label="External links">
        <a
          href="https://github.com/semorai2miku"
          target="_blank"
          rel="noopener noreferrer"
          class="footer-link"
          title="GitHub"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M12 2C6.48 2 2 6.58 2 12.23c0 4.51 2.87 8.34 6.84 9.69.5.1.68-.22.68-.49 0-.24-.01-1.03-.01-1.86-2.78.62-3.37-1.21-3.37-1.21-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.09 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05A9.3 9.3 0 0 1 12 6.84c.85 0 1.71.12 2.51.36 1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.96-2.34 4.83-4.57 5.08.36.32.68.95.68 1.92 0 1.39-.01 2.5-.01 2.84 0 .27.18.59.69.49A10.24 10.24 0 0 0 22 12.23C22 6.58 17.52 2 12 2Z"
            />
          </svg>
          <span>GitHub</span>
        </a>

        <a
          href="https://space.bilibili.com/1497758558"
          target="_blank"
          rel="noopener noreferrer"
          class="footer-link"
          title="Bilibili"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M7.5 4.5 5.8 2.8a1 1 0 1 1 1.4-1.4L9.6 3.8a1 1 0 0 1-1.4 1.4Zm8.9.3a1 1 0 0 1 0-1.4l2.4-2.4a1 1 0 1 1 1.4 1.4l-2.4 2.4a1 1 0 0 1-1.4 0ZM6 6h12a4 4 0 0 1 4 4v5a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5v-5a4 4 0 0 1 4-4Zm0 2a2 2 0 0 0-2 2v5a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-5a2 2 0 0 0-2-2H6Zm2.5 2.8a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Zm7 0a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Zm-5.8 4.6a3.6 3.6 0 0 0 4.6 0 1 1 0 0 1 1.3 1.6 5.6 5.6 0 0 1-7.2 0 1 1 0 0 1 1.3-1.6Z"
            />
          </svg>
          <span>Bilibili</span>
        </a>
      </nav>
    </footer>

    <div v-if="showCreateModal" class="modal-backdrop" @click.self="closeCreateModal">
      <section class="modal-card">
        <div class="modal-header">
          <div>
            <p class="section-kicker">Create Room</p>
            <h2>创建房间</h2>
          </div>
          <button class="button-secondary" type="button" @click="closeCreateModal">关闭</button>
        </div>

        <form class="modal-form" @submit.prevent="handleCreateRoom">
          <label>
            <span>房主昵称</span>
            <input v-model.trim="hostName" type="text" maxlength="20" placeholder="输入房主昵称" />
          </label>

          <label>
            <span>房间名称</span>
            <input
              v-model.trim="roomName"
              type="text"
              maxlength="40"
              placeholder="输入房间名称"
            />
          </label>

          <label>
            <span>房间密码</span>
            <input
              v-model="roomPassword"
              type="password"
              inputmode="numeric"
              maxlength="4"
              placeholder="输入 4 位数字密码"
            />
          </label>

          <section class="config-card">
            <div class="config-head">
              <div>
                <p class="section-kicker">Turn Timer</p>
                <h3>每回合时间</h3>
              </div>
              <strong>{{ formatTimeLimit(createSettings.timeLimitSeconds) }}</strong>
            </div>

            <input
              v-model.number="createSettings.timeLimitSeconds"
              class="slider-input"
              type="range"
              min="15"
              max="90"
              step="5"
              :disabled="createSettings.timeLimitSeconds === 0"
            />

            <div class="slider-labels">
              <span v-for="tick in timeLimitTicks" :key="tick">{{ tick }}s</span>
            </div>

            <label class="toggle-row">
              <span>无限制时间</span>
              <input
                :checked="createSettings.timeLimitSeconds === 0"
                type="checkbox"
                @change="toggleUnlimitedTime(($event.target as HTMLInputElement).checked)"
              />
            </label>
          </section>

          <section class="config-card">
            <div class="config-head">
              <div>
                <p class="section-kicker">Room Options</p>
                <h3>房间选项</h3>
              </div>
            </div>

            <label class="toggle-row">
              <span>显示在大厅</span>
              <input v-model="createSettings.isPublic" type="checkbox" />
            </label>

            <label class="toggle-row">
              <span>允许观众加入</span>
              <input v-model="createSettings.allowSpectators" type="checkbox" />
            </label>
          </section>

          <button class="button-primary" type="submit" :disabled="submitting">
            {{ submitting ? "创建中..." : "创建并进入房间" }}
          </button>

          <p v-if="createFeedback.message" class="inline-feedback" :class="createFeedback.type">
            {{ createFeedback.message }}
          </p>
        </form>
      </section>
    </div>

    <div v-if="showJoinModal" class="modal-backdrop" @click.self="closeJoinModal">
      <section class="modal-card join-card">
        <div class="modal-header">
          <div>
            <p class="section-kicker">Join Room</p>
            <h2>通过房间码进入</h2>
          </div>
          <button class="button-secondary" type="button" @click="closeJoinModal">关闭</button>
        </div>

        <form class="modal-form" @submit.prevent="handleJoinByCode">
          <label>
            <span>房间码</span>
            <input v-model.trim="joinCode" type="text" maxlength="12" placeholder="输入房间码" />
          </label>

          <button class="button-primary" type="submit">进入房间</button>

          <p v-if="joinFeedback.message" class="inline-feedback" :class="joinFeedback.type">
            {{ joinFeedback.message }}
          </p>
        </form>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useBanPickStore } from "@/stores/banpick";
import type { DraftRuleStep, RoomSettings, RoomState } from "@/types/room";

const defaultDraftRules: DraftRuleStep[] = [
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

const PASSWORD_PATTERN = /^\d{4}$/;

const router = useRouter();
const store = useBanPickStore();
const showCreateModal = ref(false);
const showJoinModal = ref(false);
const hostName = ref("");
const roomName = ref("");
const roomPassword = ref("");
const joinCode = ref("");
const searchKeyword = ref("");
const submitting = ref(false);
const createFeedback = ref<{ type: "success" | "error"; message: string }>({
  type: "error",
  message: "",
});
const joinFeedback = ref<{ type: "success" | "error"; message: string }>({
  type: "error",
  message: "",
});
const createSettings = ref<RoomSettings>({
  timeLimitSeconds: 30,
  draftRules: defaultDraftRules.map((rule) => ({ ...rule })),
  isPublic: true,
  allowSpectators: true,
});
const timeLimitTicks = [15, 30, 45, 60, 75, 90];
const homeBackgroundUrl = new URL("../../../assets/Background/Home-Background.jpg", import.meta.url)
  .href;
const siteLogoUrl = new URL("../../../assets/Background/Logo.png", import.meta.url).href;
const siteNameUrl = new URL("../../../assets/Background/Name.png", import.meta.url).href;

const filteredRooms = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  if (!keyword) {
    return store.lobbyRooms;
  }

  return store.lobbyRooms.filter((room) => {
    return room.name.toLowerCase().includes(keyword) || room.code.toLowerCase().includes(keyword);
  });
});

const pageStyle = computed(() => ({
  backgroundImage: `linear-gradient(180deg, rgba(5, 11, 14, 0.03), rgba(4, 7, 10, 0.1)), url("${homeBackgroundUrl}")`,
}));

function resetCreateForm() {
  hostName.value = "";
  roomName.value = "";
  roomPassword.value = "";
  createSettings.value = {
    timeLimitSeconds: 30,
    draftRules: defaultDraftRules.map((rule) => ({ ...rule })),
    isPublic: true,
    allowSpectators: true,
  };
}

function statusLabel(status: RoomState["status"]) {
  if (status === "drafting") {
    return "进行中";
  }

  if (status === "finished") {
    return "已结束";
  }

  if (status === "paused") {
    return "已暂停";
  }

  return "等待中";
}

function formatExpire(value: string) {
  return new Date(value).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function openCreateModal() {
  createFeedback.value = { type: "error", message: "" };
  resetCreateForm();
  showCreateModal.value = true;
}

function closeCreateModal() {
  showCreateModal.value = false;
}

function openJoinModal() {
  joinFeedback.value = { type: "error", message: "" };
  joinCode.value = "";
  showJoinModal.value = true;
}

function closeJoinModal() {
  showJoinModal.value = false;
}

function formatTimeLimit(value: number) {
  return value <= 0 ? "无限制" : `${value}s / 回合`;
}

function toggleUnlimitedTime(checked: boolean) {
  createSettings.value.timeLimitSeconds = checked ? 0 : 30;
}

async function handleCreateRoom() {
  if (!hostName.value || !roomName.value || !roomPassword.value) {
    createFeedback.value = {
      type: "error",
      message: "请完整填写房主昵称、房间名称和房间密码。",
    };
    return;
  }

  if (!PASSWORD_PATTERN.test(roomPassword.value)) {
    createFeedback.value = {
      type: "error",
      message: "房间密码必须是 4 位数字。",
    };
    return;
  }

  submitting.value = true;
  createFeedback.value = { type: "error", message: "" };

  try {
    const room = await store.createRoom({
      hostName: hostName.value,
      roomName: roomName.value,
      password: roomPassword.value,
      settings: {
        ...createSettings.value,
        draftRules: createSettings.value.draftRules.map((rule) => ({ ...rule })),
      },
    });
    createFeedback.value = { type: "success", message: "房间创建成功，正在进入..." };
    await new Promise((resolve) => window.setTimeout(resolve, 260));
    closeCreateModal();
    await router.push(`/room/${room.id}`);
  } catch (error) {
    createFeedback.value = {
      type: "error",
      message: error instanceof Error ? error.message : "创建房间失败。",
    };
  } finally {
    submitting.value = false;
  }
}

async function handleJoinByCode() {
  const code = joinCode.value.trim().toUpperCase();
  if (!code) {
    joinFeedback.value = { type: "error", message: "请输入房间码。" };
    return;
  }

  const matchedRoom = store.lobbyRooms.find((room) => room.code.toUpperCase() === code);
  if (!matchedRoom) {
    joinFeedback.value = { type: "error", message: "没有找到对应的公开房间。" };
    return;
  }

  joinFeedback.value = { type: "success", message: "房间匹配成功，正在进入..." };
  await new Promise((resolve) => window.setTimeout(resolve, 180));
  closeJoinModal();
  await router.push(`/room/${matchedRoom.id}`);
}

async function goToRoom(roomId: string) {
  await router.push(`/room/${roomId}`);
}

async function goToLocalDraft() {
  await router.push("/local-draft");
}

onMounted(() => {
  store.refreshLobby();
});
</script>

<style scoped>
.home-view {
  position: relative;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 28px 24px;
  background-position: center;
  background-size: cover;
  overflow: hidden;
}

.home-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(3, 8, 10, 0.06), rgba(3, 8, 10, 0.14)),
    radial-gradient(circle at 22% 18%, rgba(112, 222, 196, 0.14), transparent 32%),
    radial-gradient(circle at 84% 20%, rgba(247, 198, 104, 0.12), transparent 26%);
  pointer-events: none;
}

.home-stage {
  position: relative;
  z-index: 1;
  width: min(1580px, calc(100vw - 48px));
  min-height: calc(100vh - 56px);
  display: grid;
  grid-template-rows: minmax(260px, auto) minmax(320px, 1fr);
  gap: 18px;
}

.home-footer {
  position: relative;
  z-index: 1;
  width: min(1580px, calc(100vw - 48px));
  display: grid;
  gap: 12px;
  padding: 0 4px 8px;
}

.footer-title {
  margin: 0;
  font-size: 0.78rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(224, 236, 232, 0.66);
}

.footer-links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.footer-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 16px;
  background: rgba(10, 19, 25, 0.42);
  border: 1px solid rgba(190, 220, 212, 0.14);
  color: rgba(239, 246, 255, 0.9);
  transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
}

.footer-link:hover {
  transform: translateY(-1px);
  background: rgba(12, 24, 31, 0.56);
  border-color: rgba(190, 220, 212, 0.24);
}

.footer-link svg {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
}

.hero-panel,
.lobby-surface {
  border-radius: 30px;
  border: 1px solid rgba(180, 220, 211, 0.14);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.16);
  backdrop-filter: blur(5px);
}

.hero-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(260px, 0.7fr);
  gap: 22px;
  padding: 30px 32px;
  background: linear-gradient(180deg, rgba(8, 18, 23, 0.3), rgba(8, 16, 21, 0.36));
}

.brand-stack {
  display: grid;
  gap: 12px;
  margin-bottom: 16px;
}

.brand-mark {
  width: 72px;
  height: 72px;
  object-fit: contain;
}

.brand-name {
  width: min(440px, 100%);
  object-fit: contain;
}

.hero-kicker,
.section-kicker {
  margin: 0 0 10px;
  font-size: 0.74rem;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: rgba(216, 235, 229, 0.78);
}

.hero-copy h1 {
  margin: 0;
  max-width: 10ch;
  font-size: clamp(2.8rem, 4vw, 4.4rem);
  line-height: 1.02;
}

.hero-lead {
  margin: 18px 0 0;
  max-width: 680px;
  line-height: 1.72;
  color: rgba(235, 242, 240, 0.92);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}

.ghost-button {
  background: rgba(9, 19, 25, 0.36);
}

.hero-stats {
  display: grid;
  gap: 14px;
  align-content: end;
}

.stat-card {
  padding: 18px;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(10, 22, 27, 0.5), rgba(10, 17, 22, 0.58));
  border: 1px solid rgba(184, 219, 210, 0.14);
}

.stat-card span {
  display: block;
  font-size: 0.78rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(212, 231, 224, 0.68);
}

.stat-card strong {
  display: block;
  margin-top: 10px;
  font-size: clamp(1.3rem, 2vw, 1.9rem);
}

.lobby-surface {
  padding: 24px;
  display: grid;
  grid-template-rows: auto 1fr;
  background: linear-gradient(180deg, rgba(8, 16, 21, 0.34), rgba(7, 13, 18, 0.42));
}

.lobby-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 18px;
  margin-bottom: 18px;
}

.lobby-toolbar h2 {
  margin: 0;
  font-size: 1.8rem;
}

.toolbar-copy {
  margin: 8px 0 0;
  color: rgba(236, 242, 240, 0.82);
}

.toolbar-actions {
  min-width: min(320px, 100%);
}

.search-input {
  width: min(320px, 100%);
  background: rgba(6, 13, 18, 0.42);
}

.room-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  align-content: start;
}

.room-card {
  display: grid;
  gap: 14px;
  padding: 18px;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(11, 20, 26, 0.6), rgba(10, 16, 22, 0.68));
  border: 1px solid rgba(188, 219, 210, 0.12);
  user-select: text;
  -webkit-user-select: text;
}

.room-card-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: start;
}

.room-code {
  margin: 0 0 6px;
  font-size: 0.82rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(214, 232, 226, 0.64);
}

.room-card h3 {
  margin: 0;
  font-size: 1.18rem;
}

.status-badge {
  padding: 8px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  white-space: nowrap;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
}

.status-badge.waiting {
  color: #f8e1a9;
  border-color: rgba(248, 225, 169, 0.26);
}

.status-badge.drafting {
  color: #91d4ff;
  border-color: rgba(145, 212, 255, 0.26);
}

.status-badge.paused {
  color: #9ff2d8;
  border-color: rgba(159, 242, 216, 0.26);
}

.status-badge.finished {
  color: #d8d8d8;
  border-color: rgba(216, 216, 216, 0.24);
}

.room-meta {
  display: grid;
  gap: 8px;
  color: rgba(236, 242, 240, 0.82);
}

.room-card-actions {
  display: flex;
  justify-content: flex-start;
}

.empty-state {
  padding: 28px 0 8px;
  color: rgba(236, 242, 240, 0.84);
}

.inline-feedback {
  margin: 12px 0 0;
  padding: 12px 14px;
  border-radius: 14px;
  font-size: 0.95rem;
}

.inline-feedback.success {
  color: #d8fff0;
  background: rgba(18, 97, 72, 0.24);
  border: 1px solid rgba(91, 216, 167, 0.24);
}

.inline-feedback.error {
  color: #ffd5d5;
  background: rgba(125, 33, 44, 0.26);
  border: 1px solid rgba(255, 129, 129, 0.22);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(4, 7, 10, 0.56);
  backdrop-filter: blur(4px);
}

.modal-card {
  width: min(640px, 100%);
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  padding: 24px;
  border-radius: 28px;
  background: linear-gradient(180deg, rgba(9, 17, 23, 0.96), rgba(8, 13, 19, 0.98));
  border: 1px solid rgba(188, 219, 210, 0.14);
  box-shadow: 0 32px 90px rgba(0, 0, 0, 0.34);
}

.join-card {
  width: min(520px, 100%);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  margin-bottom: 18px;
}

.modal-header h2,
.config-head h3 {
  margin: 0;
}

.modal-form {
  display: grid;
  gap: 14px;
}

.modal-form label {
  display: grid;
  gap: 8px;
}

.modal-form span {
  color: rgba(228, 237, 234, 0.78);
}

.config-card {
  display: grid;
  gap: 14px;
  padding: 18px;
  border-radius: 18px;
  background: rgba(12, 21, 27, 0.72);
  border: 1px solid rgba(188, 219, 210, 0.12);
}

.config-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.slider-input {
  width: 100%;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  color: rgba(221, 234, 230, 0.62);
  font-size: 0.9rem;
}

.toggle-row {
  display: flex !important;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

@media (max-width: 1180px) {
  .home-stage {
    width: min(100%, calc(100vw - 36px));
    min-height: auto;
  }

  .home-footer {
    width: min(100%, calc(100vw - 36px));
  }
}

@media (max-width: 920px) {
  .home-view {
    padding: 18px 14px;
  }

  .hero-panel,
  .lobby-toolbar,
  .modal-header,
  .config-head,
  .toggle-row {
    grid-template-columns: 1fr;
    flex-direction: column;
    align-items: stretch;
  }

  .hero-panel {
    padding: 24px;
  }

  .hero-copy h1 {
    max-width: none;
  }

  .toolbar-actions,
  .search-input {
    width: 100%;
    min-width: 0;
  }
}
</style>
