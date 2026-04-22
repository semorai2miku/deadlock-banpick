<template>
  <section class="panel action-log">
    <div class="log-header">
      <p class="section-title">操作日志</p>
      <span class="pill">{{ records.length }} 条</span>
    </div>

    <ul v-if="records.length" class="log-list">
      <li v-for="record in records" :key="`${record.order}-${record.heroName}`">
        <strong>#{{ record.order }}</strong>
        <span>{{ label(record.side) }} {{ record.action }} {{ record.heroName }}</span>
        <small>{{ formatTime(record.at) }}</small>
      </li>
    </ul>
    <p v-else class="muted">暂无日志，等待房间开始 BP。</p>
  </section>
</template>

<script setup lang="ts">
import type { DraftRecord, TeamSide } from "@/types/room";

defineProps<{
  records: DraftRecord[];
}>();

function label(side: TeamSide) {
  return side === "blue" ? "阵营A" : "阵营B";
}

function formatTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
}
</script>

<style scoped>
.action-log {
  padding: 20px;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.log-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 10px;
}

.log-list li {
  display: grid;
  grid-template-columns: 70px 1fr auto;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: rgba(8, 16, 28, 0.5);
}

.log-list small {
  color: var(--muted);
}

@media (max-width: 768px) {
  .log-list li {
    grid-template-columns: 1fr;
  }
}
</style>
