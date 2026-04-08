<template>
  <div class="result-actions">
    <button class="btn btn-primary btn-lg" @click="$emit('download')">
      <span>⬇️</span> 下载 PPT
    </button>
    <button class="btn btn-lg btn-outline-edit" @click="$emit('toggleEditMode')">
      <span>📝</span> {{ isEditMode ? '完成编辑' : '编辑内容' }}
    </button>
    <button class="btn btn-lg btn-presentation" @click="$emit('startPresentation')">
      <span>🎬</span> 演示模式
    </button>
    <!-- 更多操作下拉菜单 -->
    <div class="more-actions-dropdown">
      <button class="btn btn-lg" @click="toggleMenu">
        <span>⋯</span> 更多
      </button>
      <div v-if="showMenu" class="more-menu">
        <button @click="$emit('toggleFavorite')">
          <span>{{ isFavorite ? '⭐' : '☆' }}</span> {{ isFavorite ? '已收藏' : '收藏' }}
        </button>
        <button @click="$emit('openExportMenu')">
          <span>📄</span> 导出其他格式
        </button>
        <button @click="$emit('openShareMenu')">
          <span>📤</span> 分享
        </button>
        <button @click="$emit('openSaveTemplate')">
          <span>📁</span> 存为模板
        </button>
        <button @click="$emit('shareToTeam')">
          <span>👥</span> 分享到团队模板
        </button>
        <button @click="$emit('openVersionHistory')">
          <span>📜</span> 版本历史
        </button>
        <button @click="$emit('openRecording')">
          <span>🎬</span> 录制成视频
        </button>
        <!-- AR/VR 模式 -->
        <div class="menu-separator">— AR/VR 沉浸模式 —</div>
        <button @click="$emit('openARVR', 'vr')">
          <span>🕶</span> VR 沉浸演示
        </button>
        <button @click="$emit('openARVR', 'panorama')">
          <span>🌐</span> 360° 全景模式
        </button>
        <button @click="$emit('openARVR', 'ar')">
          <span>📷</span> AR 叠加演示
        </button>
        <button @click="$emit('openARVR', 'hologram')">
          <span>🔮</span> 全息投影模式
        </button>
        <button @click="$emit('openARVR', 'auditorium')">
          <span>🏛</span> 虚拟礼堂模式
        </button>
        <button @click="$emit('openEmbedCode')">
          <span>🔗</span> 嵌入代码
        </button>
        <button @click="$emit('createNew')">
          <span>✨</span> 创建新的
        </button>
        <button @click="$emit('startReadAloud')">
          <span>🔊</span> 朗读当前页
        </button>
        <button @click="$emit('openVoicePanel')">
          <span>🎙️</span> 语音设置 / 配音
        </button>
        <button @click="$emit('openSecurity')">
          <span>🔒</span> 安全设置
        </button>
        <button @click="$emit('openBackup')">
          <span>💾</span> 备份管理
        </button>
        <button @click="$emit('openSchedule')">
          <span>📅</span> 定时发布
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  isEditMode: boolean
  isFavorite: boolean
  showMenu: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'download'): void
  (e: 'toggleEditMode'): void
  (e: 'startPresentation'): void
  (e: 'toggleFavorite'): void
  (e: 'openExportMenu'): void
  (e: 'openShareMenu'): void
  (e: 'openSaveTemplate'): void
  (e: 'shareToTeam'): void
  (e: 'openVersionHistory'): void
  (e: 'openRecording'): void
  (e: 'openARVR', mode: 'vr' | 'panorama' | 'ar' | 'hologram' | 'auditorium'): void
  (e: 'openEmbedCode'): void
  (e: 'createNew'): void
  (e: 'startReadAloud'): void
  (e: 'openVoicePanel'): void
  (e: 'openSecurity'): void
  (e: 'openBackup'): void
  (e: 'openSchedule'): void
}>()

function toggleMenu() {
  emit('toggleFavorite') // This will be handled by parent, just toggle
}
</script>

<style scoped>
.result-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin: 25px 0;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-lg {
  padding: 14px 28px;
  font-size: 16px;
}

.btn-outline-edit {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
}

.btn-outline-edit:hover {
  background: #667eea;
  color: white;
}

.btn-presentation {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.btn-presentation:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 87, 108, 0.4);
}

.more-actions-dropdown {
  position: relative;
}

.more-menu {
  position: absolute;
  right: 0;
  top: 100%;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  padding: 8px 0;
  min-width: 200px;
  z-index: 100;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.more-menu button {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 16px;
  border: none;
  background: none;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  text-align: left;
}

.more-menu button:hover {
  background: #f8f9fa;
}

.menu-separator {
  padding: 8px 16px;
  font-size: 12px;
  color: #999;
  text-align: center;
  background: #f8f9fa;
  margin: 4px 0;
}
</style>
