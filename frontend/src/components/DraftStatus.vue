<template>
  <section class="panel draft-status">
    <div>
      <p class="section-title">当前阶段</p>
      <h2>{{ title }}</h2>
      <p class="muted">{{ description }}</p>
      <p v-if="showCountdown" class="countdown">
        当前回合剩余：<strong>{{ countdownLabel }}</strong>
      </p>
      <p v-if="timeoutNotice" class="timeout-text">{{ timeoutNotice }}</p>
    </div>
    <button class="button-secondary" type="button" @click="$emit('refresh')">
      重新同步房间
    </button>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { DraftTurn, MemberState, RoomState, TeamSide } from "@/types/room";

const props = defineProps<{
  currentTurn: DraftTurn | null;
  finished: boolean;
  canAct: boolean;
  localMember: MemberState | null;
  roomStatus: RoomState["status"];
  participantCount: number;
  countdownSeconds: number;
  timedOutSide: TeamSide | null;
  timeLimitSeconds: number;
}>();

defineEmits<{
  refresh: [];
}>();

const title = computed(() => {
  if (props.finished) {
    return "本局 BP 已完成";
  }

  if (props.roomStatus === "waiting") {
    return "等待房主开始 BP";
  }

  if (!props.currentTurn) {
    return "等待开始";
  }

  const sideLabel = props.currentTurn.side === "blue" ? "阵营A" : "阵营B";
  return `第 ${props.currentTurn.order} 手 · ${sideLabel} ${props.currentTurn.action}`;
});

const description = computed(() => {
  if (props.finished) {
    return "房主现在可以交换阵营，或者点击再来一局重置房间状态。";
  }

  if (props.roomStatus === "waiting") {
    if (props.localMember?.role === "host") {
      return `当前参与者人数：${props.participantCount}/2。两位参与者到齐后，可由你手动开始 BP。`;
    }

    return `当前参与者人数：${props.participantCount}/2。等待房主确认阵容并手动开始 BP。`;
  }

  if (!props.localMember) {
    return "你当前只是游客。你可以选择加入成为参与者或观众，也可以只浏览实时状态。";
  }

  if (props.canAct) {
    return `现在轮到你操作。每一手有 ${props.timeLimitSeconds} 秒时间，超时只会提醒，不会自动跳过。`;
  }

  if (props.localMember.role === "host") {
    return "你是房主，负责开始 BP、交换阵营和重置房间，也会收到超时提醒。";
  }

  if (props.localMember.role === "spectator") {
    return "你是观众，只能查看双方 BP 进度和超时提示，不能执行任何操作。";
  }

  return "当前不是你的回合，等待另一位参与者操作即可。";
});

const showCountdown = computed(
  () => props.roomStatus === "drafting" && !props.finished && !!props.currentTurn,
);
const countdownLabel = computed(() => `${Math.max(0, props.countdownSeconds)}s`);

const timeoutNotice = computed(() => {
  if (!props.timedOutSide || !props.currentTurn) {
    return "";
  }

  const sideLabel = props.timedOutSide === "blue" ? "阵营A" : "阵营B";

  if (props.localMember?.role === "host") {
    return `提示：${sideLabel} 已超时，房主可以继续观察当前局势并等待该方继续操作。`;
  }

  if (props.localMember?.role === "spectator" || !props.localMember) {
    return `提示：${sideLabel} 当前回合已超时。`;
  }

  return "";
});
</script>

<style scoped>
.draft-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 20px 24px;
}

h2 {
  margin: 0 0 8px;
  font-size: 1.5rem;
}

.countdown {
  margin: 10px 0 0;
  color: #bfdbfe;
}

.timeout-text {
  margin: 10px 0 0;
  color: #fbbf24;
}

@media (max-width: 768px) {
  .draft-status {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
