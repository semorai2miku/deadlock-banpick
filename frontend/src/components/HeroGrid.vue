<template>
  <section class="panel hero-grid">
    <div class="grid-header">
      <div>
        <p class="section-title">角色池</p>
        <p class="muted">
          {{ interactive ? "当前回合可点击角色执行操作" : "当前仅同步展示，等待正确身份和回合后才能操作" }}
        </p>
      </div>
      <span class="pill">可选 {{ heroes.length }}</span>
    </div>

    <div class="grid-list">
      <button
        v-for="hero in heroes"
        :key="hero.id"
        class="hero-card"
        :class="{ disabled: !interactive }"
        type="button"
        :disabled="!interactive"
        @click="$emit('select', hero.id)"
      >
        <strong>{{ hero.name }}</strong>
        <span>{{ hero.role }}</span>
        <small>{{ hero.difficulty }}</small>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Hero } from "@/types/room";

defineProps<{
  heroes: Hero[];
  interactive: boolean;
}>();

defineEmits<{
  select: [heroId: string];
}>();
</script>

<style scoped>
.hero-grid {
  padding: 20px;
}

.grid-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.grid-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
}

.hero-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  color: var(--text);
  text-align: left;
  background: linear-gradient(180deg, rgba(16, 32, 59, 0.96), rgba(9, 17, 31, 0.96));
  border: 1px solid var(--line);
  border-radius: 18px;
  cursor: pointer;
}

.hero-card strong {
  font-size: 1rem;
}

.hero-card span,
.hero-card small {
  color: var(--muted);
}

.hero-card:hover {
  border-color: rgba(94, 234, 212, 0.5);
}

.hero-card.disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
</style>
