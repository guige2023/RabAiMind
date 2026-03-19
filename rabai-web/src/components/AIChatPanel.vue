<template>
  <div class="ai-chat-panel" :class="{ open: isOpen }">
    <!-- Toggle Button -->
    <button class="chat-toggle" @click="isOpen = !isOpen">
      <svg v-if="!isOpen" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
      <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }}</span>
    </button>

    <!-- Chat Panel -->
    <Transition name="slide">
      <div v-if="isOpen" class="chat-modal">
        <!-- Header -->
        <div class="chat-header">
          <div class="header-info">
            <span class="ai-avatar">🤖</span>
            <div class="header-text">
              <h3>AI 助手</h3>
              <span class="status">在线</span>
            </div>
          </div>
          <button class="clear-btn" @click="handleClear" title="清除对话">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>

        <!-- Messages -->
        <div class="chat-messages" ref="messagesContainer">
          <div
            v-for="message in messages"
            :key="message.id"
            class="message"
            :class="message.role"
          >
            <div class="message-avatar">
              {{ message.role === 'user' ? '👤' : '🤖' }}
            </div>
            <div class="message-content">
              <div v-if="message.loading" class="loading-dots">
                <span></span><span></span><span></span>
              </div>
              <template v-else>
                <p v-html="formatMessage(message.content)"></p>
                <div v-if="message.suggestions?.length" class="message-suggestions">
                  <button
                    v-for="suggestion in message.suggestions"
                    :key="suggestion"
                    class="suggestion-btn"
                    @click="handleSuggestion(suggestion)"
                  >
                    {{ suggestion }}
                  </button>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Quick Replies -->
        <div v-if="messages.length <= 2" class="quick-replies">
          <button
            v-for="reply in quickReplies"
            :key="reply.id"
            class="quick-reply"
            @click="handleSuggestion(reply.text)"
          >
            <span class="reply-icon">{{ reply.icon }}</span>
            <span class="reply-text">{{ reply.text }}</span>
          </button>
        </div>

        <!-- Input -->
        <div class="chat-input">
          <input
            v-model="inputMessage"
            type="text"
            placeholder="输入您的问题..."
            @keyup.enter="handleSend"
            :disabled="isLoading"
          />
          <button
            class="send-btn"
            @click="handleSend"
            :disabled="!inputMessage.trim() || isLoading"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, onMounted } from 'vue'
import { useAIChat, quickReplies } from '../composables/useAIChat'

const isOpen = ref(false)
const inputMessage = ref('')
const unreadCount = ref(0)
const messagesContainer = ref<HTMLElement | null>(null)

const {
  messages,
  isLoading,
  initChat,
  sendMessage,
  clearHistory
} = useAIChat()

// Initialize
onMounted(() => {
  initChat()
})

// Watch messages to scroll
watch(messages, async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}, { deep: true })

// Watch open state
watch(isOpen, (open) => {
  if (open) {
    unreadCount.value = 0
  }
})

const handleSend = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return
  const msg = inputMessage.value
  inputMessage.value = ''
  await sendMessage(msg)
}

const handleSuggestion = async (suggestion: string) => {
  inputMessage.value = suggestion
  await handleSend()
}

const handleClear = () => {
  clearHistory()
}

const formatMessage = (content: string): string => {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
    .replace(/• /g, '<br>• ')
}
</script>

<style scoped>
.ai-chat-panel {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
}

/* Toggle Button */
.chat-toggle {
  width: 56px;
  height: 56px;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
  transition: all 0.3s;
  position: relative;
}

.chat-toggle:hover {
  transform: scale(1.1);
}

.chat-toggle svg {
  width: 26px;
  height: 26px;
  color: white;
}

.unread-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 22px;
  height: 22px;
  background: #FF3B30;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Chat Modal */
.chat-modal {
  position: absolute;
  bottom: 72px;
  right: 0;
  width: 380px;
  height: 520px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:global(.dark) .chat-modal {
  background: #1a1a1a;
}

/* Header */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-avatar {
  font-size: 28px;
}

.header-text h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.status {
  font-size: 12px;
  opacity: 0.9;
}

.clear-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.clear-btn svg {
  width: 16px;
  height: 16px;
  color: white;
}

/* Messages */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  display: flex;
  gap: 10px;
  max-width: 85%;
}

.message.user {
  flex-direction: row-reverse;
  align-self: flex-end;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.message.assistant .message-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.message-content {
  background: #f5f5f5;
  padding: 12px 14px;
  border-radius: 14px;
  font-size: 14px;
  line-height: 1.5;
}

:global(.dark) .message-content {
  background: #2a2a2a;
}

.message.user .message-content {
  background: #667eea;
  color: white;
}

.message-content p {
  margin: 0;
}

.message-content :deep(strong) {
  font-weight: 600;
}

/* Loading */
.loading-dots {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}

.loading-dots span {
  width: 8px;
  height: 8px;
  background: #999;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out;
}

.loading-dots span:nth-child(1) { animation-delay: -0.32s; }
.loading-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* Suggestions */
.message-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.suggestion-btn {
  padding: 6px 12px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

:global(.dark) .suggestion-btn {
  background: #333;
  border-color: #444;
  color: #fff;
}

.suggestion-btn:hover {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

/* Quick Replies */
.quick-replies {
  display: flex;
  gap: 8px;
  padding: 0 16px 12px;
  overflow-x: auto;
}

.quick-reply {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #f5f5f5;
  border: none;
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

:global(.dark) .quick-reply {
  background: #2a2a2a;
}

.quick-reply:hover {
  background: #667eea;
  color: white;
}

.reply-icon {
  font-size: 14px;
}

/* Input */
.chat-input {
  display: flex;
  gap: 10px;
  padding: 16px;
  border-top: 1px solid #e0e0e0;
  background: #fafafa;
}

:global(.dark) .chat-input {
  border-color: #333;
  background: #1a1a1a;
}

.chat-input input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 24px;
  font-size: 14px;
  outline: none;
}

:global(.dark) .chat-input input {
  background: #2a2a2a;
  border-color: #444;
  color: #fff;
}

.chat-input input:focus {
  border-color: #667eea;
}

.send-btn {
  width: 44px;
  height: 44px;
  border: none;
  background: #667eea;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.send-btn:hover:not(:disabled) {
  background: #5568d3;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn svg {
  width: 20px;
  height: 20px;
  color: white;
}

/* Transition */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
</style>
