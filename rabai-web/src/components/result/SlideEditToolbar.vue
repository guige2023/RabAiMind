<template>
  <div class="function-toolbar" role="toolbar" aria-label="演示文稿工具栏">
    <!-- R142: 字号调整 (A- / A+) -->
    <div class="font-size-controls" role="group" aria-label="字体大小调整">
      <button
        class="toolbar-btn font-size-btn"
        @click="$emit('adjustFontSize', -1)"
        :disabled="currentSlideFontSize <= 12"
        title="缩小字体 (A-)"
        aria-label="缩小字体，当前字号"
        :aria-valuenow="currentSlideFontSize"
        aria-valuemin="12"
        aria-valuemax="32"
      >A-</button>
      <span class="font-size-indicator" aria-hidden="true">{{ currentSlideFontSize }}</span>
      <button
        class="toolbar-btn font-size-btn"
        @click="$emit('adjustFontSize', 1)"
        :disabled="currentSlideFontSize >= 32"
        title="放大字体 (A+)"
        aria-label="放大字体，当前字号"
        :aria-valuenow="currentSlideFontSize"
        aria-valuemin="12"
        aria-valuemax="32"
      >A+</button>
    </div>
    <button class="toolbar-btn ai-toolbar-btn" @click="$emit('toggleSmartDesign')" title="智能设计" :class="{ active: showSmartDesignPanel }" aria-label="智能设计面板" :aria-pressed="showSmartDesignPanel">
      ✨
    </button>
    <button class="toolbar-btn ai-toolbar-btn" @click="$emit('toggleSmartContent')" title="智能内容建议" :class="{ active: showSmartContentSuggestions }" aria-label="智能内容建议面板" :aria-pressed="showSmartContentSuggestions">
      💡
    </button>
    <button class="toolbar-btn" @click="$emit('toggleLayoutPanel')" title="快速调优" aria-label="快速调优面板" :aria-pressed="showLayoutPanel">
      🎨
    </button>
    <button class="toolbar-btn" @click="$emit('toggleChartEditor')" title="图表编辑" aria-label="图表编辑器" :aria-pressed="showChartEditor">
      📊
    </button>
    <button class="toolbar-btn" @click="$emit('toggleElementEditor')" title="元素微调" aria-label="元素微调面板" :aria-pressed="showElementEditor">
      🛠️
    </button>
    <button class="toolbar-btn" @click="$emit('toggleTransitionPanel')" title="幻灯片过渡" aria-label="幻灯片过渡面板" :aria-pressed="showTransitionPanel">
      🔀
    </button>
    <button class="toolbar-btn" @click="$emit('openMasterEditor')" title="母版编辑" aria-label="母版编辑器">
      🎚️
    </button>
    <button class="toolbar-btn" @click="$emit('openAnimationComposer')" title="动画设置" aria-label="动画设置面板" :aria-pressed="false">
      🎬
    </button>
    <button class="toolbar-btn" @click="$emit('replayAnimation')" title="重播当前页动画" aria-label="重播当前页动画">
      🔄
    </button>
    <button class="toolbar-btn" @click="$emit('toggleBatchTheme')" title="批量主题" aria-label="批量主题面板" :aria-pressed="showBatchThemeModal">
      🌈
    </button>
    <button class="toolbar-btn" @click="$emit('toggleTeamWorkspace')" title="团队协作" :class="{ active: showTeamWorkspace }" aria-label="团队协作面板" :aria-pressed="showTeamWorkspace">
      👥
    </button>
    <button class="toolbar-btn" @click="$emit('toggleActivityFeed')" title="团队动态" :class="{ active: showActivityFeed }" aria-label="团队动态面板" :aria-pressed="showActivityFeed">
      📋
    </button>
    <button class="toolbar-btn" @click="$emit('toggleCommentsPanel')" title="评论/建议" :class="{ active: showCommentsPanel }" aria-label="评论建议面板" :aria-pressed="showCommentsPanel">
      💬
    </button>
    <button class="toolbar-btn ai-toolbar-btn" @click="$emit('toggleAdvancedAI')" title="AI高级功能" :class="{ active: showAdvancedAIPanel }" aria-label="AI高级功能面板" :aria-pressed="showAdvancedAIPanel">
      🤖
    </button>
    <button class="toolbar-btn ai-toolbar-btn" @click="$emit('togglePresentationCoach')" title="AI演讲教练" :class="{ active: showPresentationCoach }" aria-label="AI演讲教练面板" :aria-pressed="showPresentationCoach">
      🎯
    </button>
    <button class="toolbar-btn" @click="$emit('toggleAccessibility')" title="无障碍与通用设计" :class="{ active: showAccessibilityPanel }" aria-label="无障碍与通用设计面板" :aria-pressed="showAccessibilityPanel">
      ♿
    </button>
    <button class="toolbar-btn ai-toolbar-btn" @click="$emit('toggleLocalize')" title="翻译演示文稿" :class="{ active: showLocalizeModal }" aria-label="翻译演示文稿面板" :aria-pressed="showLocalizeModal">
      🌐
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  currentSlideFontSize: number
  showSmartDesignPanel: boolean
  showSmartContentSuggestions: boolean
  showLayoutPanel: boolean
  showChartEditor: boolean
  showElementEditor: boolean
  showTransitionPanel: boolean
  showBatchThemeModal: boolean
  showTeamWorkspace: boolean
  showActivityFeed: boolean
  showCommentsPanel: boolean
  showAdvancedAIPanel: boolean
  showPresentationCoach: boolean
  showAccessibilityPanel: boolean
  showLocalizeModal: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'adjustFontSize', delta: number): void
  (e: 'toggleSmartDesign'): void
  (e: 'toggleSmartContent'): void
  (e: 'toggleLayoutPanel'): void
  (e: 'toggleChartEditor'): void
  (e: 'toggleElementEditor'): void
  (e: 'toggleTransitionPanel'): void
  (e: 'openMasterEditor'): void
  (e: 'openAnimationComposer'): void
  (e: 'replayAnimation'): void
  (e: 'toggleBatchTheme'): void
  (e: 'toggleTeamWorkspace'): void
  (e: 'toggleActivityFeed'): void
  (e: 'toggleCommentsPanel'): void
  (e: 'toggleAdvancedAI'): void
  (e: 'togglePresentationCoach'): void
  (e: 'toggleAccessibility'): void
  (e: 'toggleLocalize'): void
}>()
</script>

<style scoped>
.function-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  padding: 12px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  margin: 20px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.font-size-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.font-size-indicator {
  min-width: 24px;
  text-align: center;
  font-weight: 600;
  color: #333;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: white;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.toolbar-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.toolbar-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.font-size-btn {
  font-weight: 700;
  font-size: 16px;
}

.ai-toolbar-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.ai-toolbar-btn.active {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}
</style>
