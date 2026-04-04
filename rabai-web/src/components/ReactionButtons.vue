<template>
  <div class="reaction-buttons" :class="{ compact }">
    <!-- Reaction Buttons -->
    <div class="reaction-group">
      <button
        v-for="reaction in reactions"
        :key="reaction.type"
        class="reaction-btn"
        :class="{ active: userReaction === reaction.type, [reaction.type]: true }"
        @click="handleReaction(reaction.type)"
        :title="reaction.label"
      >
        <span class="reaction-emoji">{{ reaction.emoji }}</span>
        <span v-if="!compact" class="reaction-count">{{ getCount(reaction.type) }}</span>
      </button>
    </div>

    <!-- Stats Summary (non-compact mode) -->
    <div v-if="!compact && totalCount > 0" class="stats-summary">
      <span class="total-label">共</span>
      <span class="total-count">{{ totalCount }}</span>
      <span class="total-label">次互动</span>
      <span v-if="viewCount > 0" class="view-count">
        <span class="view-icon">👁</span>
        {{ formatCount(viewCount) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  stats: {
    likes: number
    fires: number
    hearts: number
    view_count: number
  } | null
  userReaction: string | null
  compact?: boolean
}

interface Emits {
  (e: 'react', type: 'like' | 'fire' | 'heart'): void
  (e: 'remove'): void
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
  stats: null
})

const emit = defineEmits<Emits>()

const reactions = [
  { type: 'like' as const, emoji: '👍', label: '很棒', countKey: 'likes' },
  { type: 'fire' as const, emoji: '🔥', label: '超火', countKey: 'fires' },
  { type: 'heart' as const, emoji: '❤️', label: '喜欢', countKey: 'hearts' }
]

const getCount = (type: 'like' | 'fire' | 'heart') => {
  if (!props.stats) return 0
  return props.stats[type === 'like' ? 'likes' : type === 'fire' ? 'fires' : 'hearts']
}

const totalCount = computed(() => {
  if (!props.stats) return 0
  return props.stats.likes + props.stats.fires + props.stats.hearts
})

const viewCount = computed(() => props.stats?.view_count || 0)

const formatCount = (n: number): string => {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return n.toString()
}

const handleReaction = (type: 'like' | 'fire' | 'heart') => {
  if (props.userReaction === type) {
    emit('remove')
  } else {
    emit('react', type)
  }
}
</script>

<style scoped>
.reaction-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
}

.reaction-group {
  display: flex;
  gap: 6px;
}

.reaction-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
}

:global(.dark) .reaction-btn {
  background: #2a2a2a;
  border-color: #444;
}

.reaction-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:global(.dark) .reaction-btn:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.reaction-btn.active {
  border-color: transparent;
}

.reaction-btn.active.like {
  background: linear-gradient(135deg, #e6f7ff, #b3e0ff);
  border-color: #1890ff;
}

:global(.dark) .reaction-btn.active.like {
  background: linear-gradient(135deg, #1a3a4a, #0d2840);
  border-color: #1890ff;
}

.reaction-btn.active.fire {
  background: linear-gradient(135deg, #fff2e6, #ffb366);
  border-color: #ff6600;
}

:global(.dark) .reaction-btn.active.fire {
  background: linear-gradient(135deg, #3a2a1a, #401a00);
  border-color: #ff6600;
}

.reaction-btn.active.heart {
  background: linear-gradient(135deg, #fff0f0, #ffb3b3);
  border-color: #e60012;
}

:global(.dark) .reaction-btn.active.heart {
  background: linear-gradient(135deg, #3a1a1a, #400a0a);
  border-color: #e60012;
}

.reaction-emoji {
  font-size: 16px;
}

.reaction-count {
  font-size: 12px;
  font-weight: 600;
  color: #555;
}

:global(.dark) .reaction-count {
  color: #aaa;
}

.reaction-btn.active .reaction-count {
  color: inherit;
}

/* Compact mode */
.compact .reaction-btn {
  padding: 4px 8px;
}

.compact .reaction-emoji {
  font-size: 14px;
}

/* Stats */
.stats-summary {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #888;
}

:global(.dark) .stats-summary {
  color: #aaa;
}

.total-count {
  font-weight: 600;
  color: #333;
}

:global(.dark) .total-count {
  color: #eee;
}

.view-count {
  display: flex;
  align-items: center;
  gap: 3px;
  margin-left: 8px;
  padding-left: 8px;
  border-left: 1px solid #e0e0e0;
}

:global(.dark) .view-count {
  border-color: #444;
}

.view-icon {
  font-size: 12px;
}
</style>
