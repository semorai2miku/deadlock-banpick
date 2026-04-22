<template>
  <section class="panel room-header">
    <div>
      <p class="pill">房间 {{ roomCode || roomId }}</p>
      <h1>Deadlock BP Room</h1>
      <p class="muted">
        房主负责开房和删房，不参与 BP。两位参与者分别担任阵营A和阵营B，其他用户可以作为观众观看。
      </p>
    </div>

    <div class="room-meta">
      <div class="meta-box">
        <span class="muted">连接状态</span>
        <strong>{{ connectionText }}</strong>
      </div>
      <div class="meta-box">
        <span class="muted">我的身份</span>
        <strong>{{ memberText }}</strong>
      </div>
      <div class="meta-box">
        <span class="muted">当前行动方</span>
        <strong>{{ turnLabel }}</strong>
      </div>
      <div class="meta-box">
        <span class="muted">房主</span>
        <strong>{{ host.name }}</strong>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { DraftTurn, MemberState } from "@/types/room";

const props = defineProps<{
  roomId: string;
  roomCode: string;
  connectionState: "disconnected" | "connecting" | "connected";
  currentTurn: DraftTurn | null;
  localMember: MemberState | null;
  host: MemberState;
}>();

const connectionText = computed(() => {
  if (props.connectionState === "connected") {
    return "Socket 已连接";
  }

  if (props.connectionState === "connecting") {
    return "连接中";
  }

  return "未连接";
});

const memberText = computed(() => {
  if (!props.localMember) {
    return "游客 / 未加入";
  }

  if (props.localMember.role === "host") {
    return `${props.localMember.name} · 房主`;
  }

  if (props.localMember.role === "spectator") {
    return `${props.localMember.name} · 观众`;
  }

  return `${props.localMember.name} · ${
    props.localMember.side === "blue" ? "参与者 / 阵营A" : "参与者 / 阵营B"
  }`;
});

const turnLabel = computed(() => {
  if (!props.currentTurn) {
    return "等待参与者 / 对局结束";
  }

  return `${props.currentTurn.side === "blue" ? "阵营A" : "阵营B"} ${props.currentTurn.action}`;
});
</script>

<style scoped>
.room-header {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 24px;
}

h1 {
  margin: 14px 0 10px;
  font-size: clamp(1.8rem, 4vw, 2.6rem);
}

.room-meta {
  display: grid;
  gap: 12px;
  min-width: 260px;
}

.meta-box {
  padding: 16px;
  border-radius: 16px;
  background: rgba(8, 16, 28, 0.66);
  border: 1px solid var(--line);
}

.meta-box span,
.meta-box strong {
  display: block;
}

.meta-box strong {
  margin-top: 6px;
}

@media (max-width: 768px) {
  .room-header {
    flex-direction: column;
  }
}
</style>
