<template>
  <div class="smart-image" :class="{ loaded: isLoaded, error: hasError }">
    <!-- 占位符 -->
    <div v-if="!isLoaded && !hasError" class="image-placeholder">
      <div v-if="loadingType === 'skeleton'" class="skeleton-loader"></div>
      <div v-else-if="loadingType === 'blur'" class="blur-placeholder"></div>
      <div v-else class="spinner-placeholder">
        <span class="spinner-icon">⏳</span>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-if="hasError" class="image-error">
      <span class="error-icon">🖼️</span>
      <span v-if="errorText" class="error-text">{{ errorText }}</span>
    </div>

    <!-- 实际图片 -->
    <img
      v-show="isLoaded && !hasError"
      :src="finalSrc"
      :alt="alt"
      class="image-element"
      :class="{ 'blur-in': isLoaded }"
      @load="onLoad"
      @error="onError"
      v-lazy="src"
    />

    <!-- 加载完成遮罩 -->
    <div v-if="isLoaded && showMask" class="image-mask"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { lazyLoad } from '../utils/performance'

interface Props {
  src: string
  alt?: string
  placeholder?: string
  errorSrc?: string
  loadingType?: 'skeleton' | 'blur' | 'spinner'
  errorText?: string
  showMask?: boolean
  retryCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  alt: '',
  loadingType: 'skeleton',
  showMask: false,
  retryCount: 3
})

const isLoaded = ref(false)
const hasError = ref(false)
const currentRetry = ref(0)

const finalSrc = computed(() => {
  if (hasError.value && props.errorSrc) {
    return props.errorSrc
  }
  return props.src
})

const onLoad = () => {
  isLoaded.value = true
  hasError.value = false
}

const onError = () => {
  if (currentRetry.value < props.retryCount) {
    currentRetry.value++
    // 延迟重试
    setTimeout(() => {
      // 重新触发加载
      const img = new Image()
      img.onload = onLoad
      img.onerror = onError
      img.src = props.src
    }, 1000 * currentRetry.value)
  } else {
    hasError.value = true
    isLoaded.value = false
  }
}

onMounted(() => {
  // 检查图片是否已经在缓存中
  const img = new Image()
  img.onload = () => {
    isLoaded.value = true
  }
  img.onerror = onError
  img.src = props.src
})
</script>

<style scoped>
.smart-image {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #f5f5f5;
  border-radius: inherit;
}

:global(.dark) .smart-image {
  background: #2a2a2a;
}

.image-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.skeleton-loader {
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

:global(.dark) .skeleton-loader {
  background: linear-gradient(90deg, #2a2a2a 25%, #333 50%, #2a2a2a 75%);
  background-size: 200% 100%;
}

.blur-placeholder {
  width: 100%;
  height: 100%;
  filter: blur(20px);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.spinner-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.05);
}

.spinner-icon {
  font-size: 24px;
  animation: spin 1s linear infinite;
}

.image-error {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #f5f5f5;
  color: #999;
}

:global(.dark) .image-error {
  background: #2a2a2a;
  color: #666;
}

.error-icon {
  font-size: 32px;
  opacity: 0.5;
}

.error-text {
  font-size: 12px;
}

.image-element {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-element.blur-in {
  opacity: 1;
}

.image-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.smart-image.loaded .image-placeholder,
.smart-image.error .image-placeholder {
  display: none;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
