<template>
  <div class="collab-overlay" v-if="show">
    <!-- Live Cursors -->
    <div
      v-for="[userId, cursor] in visibleCursors"
      :key="userId"
      class="live-cursor"
      :style="cursorStyle(cursor)"
      :class="{ editing: cursor.is_editing }"
    >
      <!-- Cursor pointer SVG -->
      <svg
        class="cursor-svg"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
      >
        <path
          d="M4 2L16 10L10 11L8 17L4 2Z"
          :fill="cursor.color"
          stroke="white"
          stroke-width="1.5"
          stroke-linejoin="round"
        />
      </svg>
      <!-- Name label -->
      <div
        class="cursor-label"
        :style="{ background: cursor.color }"
      >
        {{ cursor.user_name }}
        <span v-if="cursor.is_editing" class="editing-indicator">✏️</span>
      </div>
      <!-- Selection highlight -->
      <div
        v-if="cursor.selection"
        class="selection-highlight"
        :style="selectionStyle(cursor)"
      ></div>
    </div>

    <!-- Presence Bar (Top Right) -->
    <div class="presence-bar">
      <div class="presence-avatars">
        <div
          v-for="user in presenceList"
          :key="user.user_id"
          class="presence-avatar"
          :class="{ active: isUserActive(user) }"
          :style="{ borderColor: user.color }"
          :title="`${user.user_name} (${user.role})`"
          @click="toggleFollow(user.user_id)"
        >
          <img
            v-if="user.user_avatar"
            :src="user.user_avatar"
            :alt="user.user_name"
            class="avatar-img"
          />
          <span v-else class="avatar-initial">{{ user.user_name.charAt(0) }}</span>
          <!-- Active dot -->
          <span
            class="active-dot"
            :style="{ background: user.color }"
          ></span>
          <!-- Following indicator -->
          <span v-if="followingUserId === user.user_id" class="following-badge">👁️</span>
        </div>
        <!-- Self avatar -->
        <div
          class="presence-avatar self"
          :style="{ borderColor: myColor }"
          title="你自己"
        >
          <span class="avatar-initial" :style="{ background: myColor }">
            {{ currentUser?.name?.charAt(0) || '我' }}
          </span>
        </div>
      </div>

      <!-- Connection status -->
      <div class="connection-status" :class="{ connected }">
        <span class="status-dot"></span>
        <span class="status-text">{{ connected ? '在线' : '重连中...' }}</span>
      </div>
    </div>

    <!-- Follow Mode Banner -->
    <div v-if="followingUserId && followedUser" class="follow-banner">
      <span>👁️ 正在跟随 {{ followedUser.user_name }}</span>
      <button class="stop-follow-btn" @click="handleStopFollow">停止跟随</button>
    </div>

    <!-- @mention suggestion dropdown -->
    <div
      v-if="mentionDropdown.visible && mentionDropdown.users.length > 0"
      class="mention-dropdown"
      :style="mentionDropdown.style"
    >
      <div
        v-for="user in mentionDropdown.users"
        :key="user.user_id"
        class="mention-item"
        @click="selectMention(user)"
      >
        <div class="mention-avatar" :style="{ background: user.color }">
          {{ user.user_name.charAt(0) }}
        </div>
        <div class="mention-info">
          <span class="mention-name">{{ user.user_name }}</span>
          <span class="mention-role">{{ user.role }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

interface CursorPosition {
  user_id: string
  user_name: string
  user_avatar: string
  x: number
  y: number
  slide_num: number
  viewport_zoom: number
  color: string
  is_editing: boolean
  selection?: { start: number; end: number; text: string } | null
}

interface PresenceInfo {
  user_id: string
  user_name: string
  user_avatar: string
  role: string
  color: string
  slide_num: number
  last_ping: number
}

const props = defineProps<{
  show: boolean
  cursors: Map<string, CursorPosition>
  presenceList: PresenceInfo[]
  currentUser: { id: string; name: string; avatar: string; role: string }
  connected: boolean
  myColor: string
  followingUserId: string | null
  followViewport: any
  currentSlideNum: number
  editorRef?: HTMLElement | null
}>()

const emit = defineEmits<{
  (e: 'update:cursor', x: number, y: number): void
  (e: 'startFollow', userId: string): void
  (e: 'stopFollow'): void
  (e: 'mentionSelect', userId: string, userName: string): void
}>()

// Cursor throttle
let cursorThrottleTimer: number | null = null
const CURSOR_THROTTLE_MS = 50 // 20fps

// Only show cursors on the same slide
const visibleCursors = computed(() => {
  const entries: [string, CursorPosition][] = []
  props.cursors.forEach((cursor, userId) => {
    if (cursor.slide_num === props.currentSlideNum) {
      entries.push([userId, cursor])
    }
  })
  return entries
})

const followedUser = computed(() =>
  props.presenceList.find(p => p.user_id === props.followingUserId)
)

const isUserActive = (user: PresenceInfo) => {
  return Date.now() - user.last_ping < 30000
}

const cursorStyle = (cursor: CursorPosition) => {
  const zoom = cursor.viewport_zoom || 1
  return {
    left: `${cursor.x * 100}%`,
    top: `${cursor.y * 100}%`,
    '--cursor-color': cursor.color,
    transform: `translate(-2px, -2px) scale(${1 / zoom})`,
  }
}

const selectionStyle = (cursor: CursorPosition) => {
  if (!cursor.selection) return {}
  return {
    left: `${cursor.x * 100}%`,
    top: `${cursor.y * 100 + 20}px`,
    width: `${Math.max(cursor.selection.text.length * 8, 20)}px`,
    background: cursor.color + '33',
    borderBottom: `2px solid ${cursor.color}`,
  }
}

const toggleFollow = (userId: string) => {
  if (props.followingUserId === userId) {
    emit('stopFollow')
  } else {
    emit('startFollow', userId)
  }
}

const handleStopFollow = () => {
  emit('stopFollow')
}

// ─── @mention support ───────────────────────────────────────────────────────

const mentionDropdown = ref({
  visible: false,
  users: [] as PresenceInfo[],
  style: { left: '0px', top: '0px' },
  query: '',
})

// Called by parent (SlideCommentsPanel) when user types @
const showMentionDropdown = (query: string, position: { left: number; top: number }) => {
  const filtered = props.presenceList.filter(p =>
    p.user_name.toLowerCase().includes(query.toLowerCase()) ||
    p.user_id.toLowerCase().includes(query.toLowerCase())
  )
  mentionDropdown.value = {
    visible: true,
    users: filtered,
    style: { left: `${position.left}px`, top: `${position.top}px` },
    query,
  }
}

const hideMentionDropdown = () => {
  mentionDropdown.value.visible = false
}

const selectMention = (user: PresenceInfo) => {
  emit('mentionSelect', user.user_id, user.user_name)
  mentionDropdown.value.visible = false
}

// Expose for parent component
defineExpose({ showMentionDropdown, hideMentionDropdown })
</script>

<style scoped>
.collab-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
}

/* Live Cursors */
.live-cursor {
  position: absolute;
  pointer-events: none;
  z-index: 100;
  transition: left 0.05s linear, top 0.05s linear;
}

.cursor-svg {
  filter: drop-shadow(0 1px 3px rgba(0,0,0,0.3));
}

.cursor-label {
  position: absolute;
  top: 18px;
  left: 12px;
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 3px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
}

.editing-indicator {
  font-size: 10px;
}

.selection-highlight {
  position: absolute;
  height: 16px;
  pointer-events: none;
}

/* Presence Bar */
.presence-bar {
  position: fixed;
  top: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  pointer-events: auto;
  z-index: 100;
}

.presence-avatars {
  display: flex;
  flex-direction: row-reverse;
  gap: -8px;
}

.presence-avatar {
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2.5px solid;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  margin-left: -6px;
}

.presence-avatar:hover {
  transform: scale(1.15) translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  z-index: 1;
}

.presence-avatar.self {
  cursor: default;
  margin-left: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-initial {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  font-weight: 700;
}

.active-dot {
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid white;
}

.following-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  font-size: 12px;
  background: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
}

/* Connection Status */
.connection-status {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  background: rgba(0,0,0,0.7);
  border-radius: 12px;
  backdrop-filter: blur(4px);
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #EF4444;
  transition: background 0.3s;
}

.connection-status.connected .status-dot {
  background: #10B981;
}

.status-text {
  color: white;
  font-size: 11px;
  font-weight: 500;
}

/* Follow Banner */
.follow-banner {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.85);
  backdrop-filter: blur(8px);
  color: white;
  padding: 10px 20px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
  font-weight: 500;
  z-index: 200;
  pointer-events: auto;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

.stop-follow-btn {
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.3);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: background 0.15s;
}

.stop-follow-btn:hover {
  background: rgba(255,255,255,0.25);
}

/* Mention Dropdown */
.mention-dropdown {
  position: fixed;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  min-width: 200px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10000;
  pointer-events: auto;
}

.mention-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.1s;
}

.mention-item:hover {
  background: #F3F4F6;
}

.mention-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.mention-info {
  display: flex;
  flex-direction: column;
}

.mention-name {
  font-size: 13px;
  font-weight: 600;
  color: #1F2937;
}

.mention-role {
  font-size: 11px;
  color: #6B7280;
}
</style>
