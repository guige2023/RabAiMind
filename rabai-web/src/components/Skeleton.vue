<template>
  <div class="skeleton" :class="[variant, { animated }]">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  variant?: 'text' | 'rect' | 'circle' | 'card'
  animated?: boolean
}>()
</script>

<style scoped>
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
}

.skeleton.animated {
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton.text {
  height: 16px;
  width: 100%;
  border-radius: 4px;
}

.skeleton.rect {
  height: 100px;
  width: 100%;
  border-radius: 8px;
}

.skeleton.circle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
}

.skeleton.card {
  height: 200px;
  width: 100%;
  border-radius: 12px;
}

/* Dark mode */
:global(.dark) .skeleton {
  background: linear-gradient(90deg, #2a2a2a 25%, #333 50%, #2a2a2a 75%);
  background-size: 200% 100%;
}
</style>
