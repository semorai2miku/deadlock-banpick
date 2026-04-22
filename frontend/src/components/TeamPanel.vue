<template>
  <section class="panel team-panel" :data-side="side">
    <div class="team-header">
      <div>
        <h3>{{ title }}</h3>
        <p class="muted team-player">{{ participantLabel }}</p>
      </div>
      <span class="pill">{{ side === "blue" ? "阵营A" : "阵营B" }}</span>
    </div>

    <div class="team-columns">
      <div>
        <p class="muted">Bans</p>
        <ul>
          <li v-for="hero in bans" :key="hero.id">{{ hero.name }}</li>
          <li v-if="!bans.length" class="muted">暂无</li>
        </ul>
      </div>
      <div>
        <p class="muted">Picks</p>
        <ul>
          <li v-for="hero in picks" :key="hero.id">{{ hero.name }}</li>
          <li v-if="!picks.length" class="muted">暂无</li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Hero, MemberState, TeamSide } from "@/types/room";

const props = defineProps<{
  title: string;
  side: TeamSide;
  participant: MemberState | null;
  bans: Hero[];
  picks: Hero[];
}>();

const participantLabel = computed(() =>
  props.participant ? `当前参与者：${props.participant.name}` : "当前暂无参与者",
);
</script>

<style scoped>
.team-panel {
  padding: 20px;
}

.team-panel[data-side="blue"] {
  border-color: rgba(96, 165, 250, 0.35);
}

.team-panel[data-side="red"] {
  border-color: rgba(251, 113, 133, 0.35);
}

.team-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  margin-bottom: 16px;
}

h3 {
  margin: 0 0 6px;
}

.team-player {
  margin: 0;
}

.team-columns {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

ul {
  margin: 10px 0 0;
  padding-left: 18px;
}

li + li {
  margin-top: 8px;
}

@media (max-width: 768px) {
  .team-columns {
    grid-template-columns: 1fr;
  }
}
</style>
