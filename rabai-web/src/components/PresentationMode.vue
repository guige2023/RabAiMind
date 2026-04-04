<template>
  <Teleport to="body">
    <div
      v-if="isActive"
      class="presentation-overlay"
      :class="{ 'laser-active': laserPointerActive }"
      @click="handleOverlayClick"
      @mousemove="handleMouseMove"
    >
      <!-- 顶部工具栏 -->
      <div class="presentation-toolbar" @click.stop>
        <span class="slide-counter">{{ currentSlide + 1 }} / {{ totalSlides }}</span>

        <!-- 计时器显示 -->
        <div class="timer-display">
          <span class="timer-elapsed" :class="{ 'overtime': isOvertime }">
            ⏱ {{ formatTime(elapsedSeconds) }}
          </span>
          <span v-if="timerDurationMinutes > 0" class="timer-remaining" :class="{ 'overtime': isOvertime, 'warning': remainingSeconds <= 60 && remainingSeconds > 0 }">
            / {{ isOvertime ? '+' : '' }}{{ formatTime(Math.abs(remainingSeconds)) }}
          </span>
          <button
            v-if="!timerRunning && elapsedSeconds === 0"
            class="timer-btn"
            @click="showTimerSetup = !showTimerSetup"
            title="设置计时器"
          >
            ⏱
          </button>
          <button
            v-if="timerRunning"
            class="timer-btn"
            @click="pauseTimer"
            title="暂停"
          >
            ⏸
          </button>
          <button
            v-if="!timerRunning && elapsedSeconds > 0"
            class="timer-btn"
            @click="resumeTimer"
            title="继续"
          >
            ▶
          </button>
          <button
            v-if="elapsedSeconds > 0"
            class="timer-btn"
            @click="resetTimer"
            title="重置"
          >
            ↺
          </button>
          <!-- 计时器设置下拉 -->
          <div v-if="showTimerSetup" class="timer-setup-dropdown">
            <div class="timer-setup-row">
              <label>目标时长:</label>
              <div class="timer-input-group">
                <input
                  type="number"
                  v-model.number="timerSetupMinutes"
                  min="0"
                  max="300"
                  class="timer-input"
                />
                <span>分钟</span>
              </div>
            </div>
            <div class="timer-setup-row">
              <button class="btn btn-sm" @click="startTimerWithSetup">开始计时</button>
              <button class="btn btn-sm btn-outline" @click="startTimerNoLimit">不限时</button>
            </div>
          </div>
        </div>

        <!-- 过渡效果选择 -->
        <div class="transition-selector">
          <select v-model="selectedTransition" class="transition-select" title="过渡效果">
            <option value="slide">滑动</option>
            <option value="fade">淡入淡出</option>
            <option value="zoom">缩放</option>
            <option value="flip">翻转</option>
          </select>
        </div>

        <!-- 过渡速度 -->
        <div class="duration-selector">
          <button
            v-for="d in durationOptions"
            :key="d.value"
            class="duration-btn"
            :class="{ active: selectedDuration === d.value }"
            @click="selectedDuration = d.value"
            :title="d.label"
          >
            {{ d.label }}
          </button>
        </div>

        <!-- 自动播放计时器 -->
        <div class="auto-advance" v-if="autoAdvanceEnabled">
          <span class="auto-advance-label">⏱ {{ autoAdvanceCountdown }}s</span>
        </div>

        <!-- 排练模式 -->
        <button
          v-if="!rehearsalMode"
          class="toolbar-btn"
          @click="startRehearsal"
          title="开始排练"
        >
          🎯 排练
        </button>
        <button
          v-if="rehearsalMode"
          class="toolbar-btn rehearsal-active"
          @click="stopRehearsal"
          title="停止排练"
        >
          ⏹ 排练中
        </button>
        <span v-if="recordedTimings.length > 0 && autoBasedOnRecording" class="timing-badge">
          📊 {{ recordedTimings.length }}页
        </span>
        <button
          class="toolbar-btn"
          @click="showImportModal = true"
          title="导入时间"
        >
          📥
        </button>

        <!-- 演讲者视图按钮 -->
        <button
          class="toolbar-btn presenter-btn"
          :class="{ active: presenterWindowOpen }"
          @click="openPresenterView"
          title="演讲者视图 (P)"
        >
          🖥
        </button>

        <!-- 聚光灯按钮 -->
        <button
          class="toolbar-btn spotlight-btn"
          :class="{ active: spotlightActive }"
          @click="toggleSpotlight"
          title="聚光灯 (S)"
        >
          🔦
        </button>

        <!-- 激光笔按钮 + 颜色选择 -->
        <div class="laser-pointer-controls" @click.stop>
          <button
            class="toolbar-btn laser-btn"
            :class="{ active: laserPointerActive }"
            @click="toggleLaserPointer"
            title="激光笔 (L)"
          >
            <span class="laser-icon" :style="{ color: laserColor }">●</span>
          </button>
          <input
            v-if="laserPointerActive"
            type="color"
            v-model="laserColor"
            class="laser-color-picker"
            title="激光笔颜色"
          />
        </div>

        <!-- 演讲者备注按钮 -->
        <button
          class="toolbar-btn notes-btn"
          :class="{ active: showPresenterNotes }"
          @click="showPresenterNotes = !showPresenterNotes"
          title="演讲者备注 (N)"
        >
          📋
        </button>

        <!-- Q&A / 投票模式按钮 -->
        <button
          class="toolbar-btn qa-btn"
          :class="{ active: showQAPanel }"
          @click="toggleQAPanel"
          title="Q&A / 投票 (Q)"
        >
          ❓
        </button>

        <!-- AI 演讲教练按钮 -->
        <button
          class="toolbar-btn coach-btn"
          :class="{ active: showCoachPanel }"
          @click="showCoachPanel = !showCoachPanel"
          title="AI 演讲教练 (C)"
        >
          🎯
        </button>

        <!-- AR模式 -->
        <button
          class="toolbar-btn ar-btn"
          :class="{ active: arvrActive }"
          @click="enterARMode"
          title="AR模式 (A)"
        >
          📷 AR
        </button>
        <!-- VR模式 -->
        <button
          class="toolbar-btn vr-btn"
          :class="{ active: arvrActive }"
          @click="enterVRMode"
          title="VR模式 (V)"
        >
          🕶 VR
        </button>
        <!-- 3D过渡效果 -->
        <button
          class="toolbar-btn"
          :class="{ active: show3DTransitions }"
          @click="show3DTransitions = !show3DTransitions"
          title="3D过渡效果 (T)"
        >
          🎲
        </button>
        <button class="toolbar-btn" @click="toggleFullscreen" title="全屏 (F)">
          {{ isFullscreen ? '⛶' : '⛶' }}
        </button>
        <button class="toolbar-btn" @click="exitPresentation" title="退出 (ESC)">
          ✕
        </button>
      </div>

      <!-- 聚光灯遮罩 -->
      <div
        v-if="spotlightActive"
        class="spotlight-overlay"
        :style="spotlightOverlayStyle"
      ></div>

      <!-- 聚光灯光圈 -->
      <div
        v-if="spotlightActive"
        class="spotlight-ring"
        :style="spotlightRingStyle"
      ></div>

      <!-- 激光笔光斑 -->
      <div
        v-if="laserPointerActive"
        class="laser-dot"
        :style="laserDotStyle"
      ></div>
      <div
        v-if="laserPointerActive && isDrawingLaser"
        class="laser-trail"
        :style="laserTrailStyle"
      ></div>

      <!-- 幻灯片内容 -->
      <div class="slides-container" ref="slidesRef" :style="slidesContainerStyle">
        <!-- Swipe hint on mobile -->
        <div class="presentation-swipe-hint" v-if="slides.length > 1">
          <span>👆 左右滑动切换</span>
        </div>
        <div
          v-for="(slide, index) in slides"
          :key="index"
          class="slide"
          :class="getSlideClass(index)"
          :style="getSlideStyle(index)"
        >
          <div class="slide-content">
          <!-- SVG 模式：显示真实幻灯片 -->
          <img
            v-if="slide.svgUrl"
            :src="slide.svgUrl"
            :alt="slide.title"
            class="slide-svg"
            :style="{ cursor: laserPointerActive ? 'none' : 'default' }"
          />
          <!-- 文本模式：显示文字内容（降级） -->
          <template v-else>
            <h2 class="slide-title">{{ slide.title }}</h2>
            <p class="slide-text" if="slide.content">{{ slide.content }}</p>
            <div class="slide-bullets" v-if="slide.bullets && slide.bullets.length">
              <li v-for="(bullet, i) in slide.bullets" :key="i">{{ bullet }}</li>
            </div>
          </template>
          </div>
        </div>
      </div>

      <!-- Webcam Overlay -->
      <div
        v-if="webcamConfig?.enabled && webcamStreamRef"
        class="webcam-overlay"
        :class="`webcam-${webcamConfig.position}`"
        :style="{
          '--cam-width': webcamConfig.size + 'px',
          '--cam-radius': webcamConfig.borderRadius + '%',
        }"
      >
        <video
          ref="webcamVideoRef"
          class="webcam-video"
          :class="{ mirror: webcamConfig.mirror }"
          :style="{ borderRadius: webcamConfig.borderRadius + '%', border: webcamConfig.border ? '2px solid white' : 'none' }"
          autoplay
          muted
          playsinline
        />
      </div>

      <!-- Recording indicator -->
      <div v-if="recordingMode" class="recording-indicator">
        <span class="recording-dot"></span>
        <span>REC</span>
      </div>

      <!-- Pinch-to-zoom indicator -->
      <Transition name="fade-indicator">
        <div v-if="showPinchIndicator && pinchScale !== 1" class="pinch-zoom-indicator">
          <span>🔍 {{ Math.round(pinchScale * 100) }}%</span>
          <span class="pinch-reset-hint" @click="() => { resetPinchScale(); pinchScale = 1 }">双击重置</span>
        </div>
      </Transition>

      <!-- 演讲者备注面板 -->
      <Transition name="slide-up">
        <div v-if="showPresenterNotes" class="presenter-notes-panel" @click.stop>
          <div class="notes-panel-header">
            <span>📋 演讲者备注</span>
            <button class="notes-close-btn" @click="showPresenterNotes = false">✕</button>
          </div>
          <div class="notes-panel-content">
            <div v-if="currentSlideNotes" class="notes-text">
              {{ currentSlideNotes }}
            </div>
            <div v-else class="notes-empty">
              本页暂无备注
            </div>
          </div>
          <div class="notes-panel-footer">
            <span class="notes-slide-hint">第 {{ currentSlide + 1 }} 页 / {{ totalSlides }} 页</span>
          </div>
        </div>
      </Transition>

      <!-- Q&A / 投票侧边面板 -->
      <Transition name="slide-right">
        <div v-if="showQAPanel" class="qa-panel" @click.stop>
          <div class="qa-panel-header">
            <div class="qa-tabs">
              <button
                :class="['qa-tab', { active: qaActiveTab === 'qa' }]"
                @click="qaActiveTab = 'qa'"
              >
                ❓ 问答
              </button>
              <button
                :class="['qa-tab', { active: qaActiveTab === 'poll' }]"
                @click="qaActiveTab = 'poll'"
              >
                📊 投票
              </button>
            </div>
            <button class="qa-close-btn" @click="showQAPanel = false">✕</button>
          </div>

          <!-- Q&A 模式 -->
          <div v-if="qaActiveTab === 'qa'" class="qa-content">
            <!-- 提问输入 -->
            <div class="qa-input-section">
              <input
                v-model="newQuestion"
                class="qa-input"
                placeholder="输入你的问题..."
                @keyup.enter="submitQuestion"
              />
              <button class="qa-submit-btn" @click="submitQuestion" :disabled="!newQuestion.trim()">
                提问
              </button>
            </div>

            <!-- 问题列表 -->
            <div class="qa-list">
              <TransitionGroup name="qa-item">
                <div
                  v-for="q in sortedQuestions"
                  :key="q.id"
                  class="qa-item"
                  :class="{ 'highlight-vote': q.votes >= 3 }"
                >
                  <div class="qa-item-vote">
                    <button class="vote-btn" @click="upvoteQuestion(q.id)">
                      ▲
                    </button>
                    <span class="vote-count">{{ q.votes }}</span>
                  </div>
                  <div class="qa-item-content">
                    <div class="qa-item-text">{{ q.text }}</div>
                    <div class="qa-item-meta">
                      {{ q.author || '听众' }} · {{ formatTimeAgo(q.timestamp) }}
                    </div>
                  </div>
                </div>
              </TransitionGroup>
              <div v-if="questions.length === 0" class="qa-empty">
                <p>还没有问题</p>
                <p class="qa-empty-hint">点击上方"提问"按钮提出你的问题</p>
              </div>
            </div>
          </div>

          <!-- 投票模式 -->
          <div v-if="qaActiveTab === 'poll'" class="poll-content">
            <!-- 创建投票 -->
            <div class="poll-create-section" v-if="!activePoll">
              <div class="poll-question-input">
                <input
                  v-model="newPollQuestion"
                  class="qa-input"
                  placeholder="投票问题..."
                />
              </div>
              <div class="poll-options-input">
                <div
                  v-for="(opt, idx) in newPollOptions"
                  :key="idx"
                  class="poll-option-row"
                >
                  <input
                    v-model="newPollOptions[idx]"
                    class="qa-input"
                    :placeholder="`选项 ${idx + 1}`"
                  />
                  <button
                    v-if="newPollOptions.length > 2"
                    class="poll-remove-btn"
                    @click="newPollOptions.splice(idx, 1)"
                  >
                    ✕
                  </button>
                </div>
                <button class="poll-add-option-btn" @click="newPollOptions.push('')">
                  + 添加选项
                </button>
              </div>
              <button
                class="qa-submit-btn"
                @click="createPoll"
                :disabled="!newPollQuestion.trim() || newPollOptions.filter(o => o.trim()).length < 2"
              >
                发布投票
              </button>
            </div>

            <!-- 显示投票 -->
            <div class="poll-display-section" v-if="activePoll">
              <div class="poll-question-display">{{ activePoll.question }}</div>
              <div class="poll-options-display">
                <div
                  v-for="(opt, idx) in activePoll.options"
                  :key="idx"
                  class="poll-option-item"
                  :class="{
                    'voted': votedOptionIdx === idx,
                    'show-results': showPollResults
                  }"
                  @click="!votedOptionIdx && votePoll(idx)"
                >
                  <div class="poll-option-bar-bg">
                    <div
                      class="poll-option-bar-fill"
                      :style="{ width: showPollResults ? getPollPercent(opt.votes) + '%' : '0%' }"
                    ></div>
                  </div>
                  <div class="poll-option-label">
                    <span>{{ opt.text }}</span>
                    <span v-if="showPollResults" class="poll-option-percent">
                      {{ getPollPercent(opt.votes) }}%
                    </span>
                  </div>
                  <div v-if="!showPollResults && votedOptionIdx === null" class="poll-option-vote-hint">
                    点击投票
                  </div>
                  <div v-if="votedOptionIdx === idx" class="poll-option-voted-mark">✓</div>
                </div>
              </div>
              <div class="poll-meta">
                <span>{{ activePoll.totalVotes }} 票</span>
                <button
                  v-if="votedOptionIdx !== null && !showPollResults"
                  class="btn btn-sm"
                  @click="showPollResults = true"
                >
                  查看结果
                </button>
                <button
                  v-if="votedOptionIdx !== null"
                  class="btn btn-sm btn-outline"
                  @click="closePoll"
                >
                  结束投票
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- AI 演讲教练面板 -->
      <Transition name="slide-right">
        <div v-if="showCoachPanel" class="coach-panel" @click.stop>
          <div class="coach-panel-header">
            <span>🎯 AI 演讲教练</span>
            <button class="coach-close-btn" @click="showCoachPanel = false">✕</button>
          </div>

          <div class="coach-content">
            <!-- 练习模式开关 -->
            <div class="coach-section">
              <div class="coach-section-title">🎭 练习模式</div>
              <div class="coach-toggle-row">
                <label class="coach-toggle">
                  <input type="checkbox" v-model="practiceModeEnabled" />
                  <span>开启模拟观众</span>
                </label>
              </div>
              <!-- 模拟观众反应 -->
              <div v-if="practiceModeEnabled" class="simulated-audience">
                <div class="audience-label">现场反应：</div>
                <div class="audience-reactions">
                  <TransitionGroup name="reaction-pop">
                    <span
                      v-for="reaction in visibleReactions"
                      :key="reaction.id"
                      class="audience-reaction-emoji"
                    >{{ reaction.emoji }}</span>
                  </TransitionGroup>
                  <span v-if="visibleReactions.length === 0" class="audience-waiting">🙂 等待中...</span>
                </div>
              </div>
            </div>

            <!-- 每页计时反馈 -->
            <div class="coach-section">
              <div class="coach-section-title">⏱ 计时反馈</div>
              <div class="timing-feedback">
                <div class="timing-current">
                  <span class="timing-label">本页用时：</span>
                  <span class="timing-value">{{ formatTime(currentSlideTime) }}</span>
                  <span class="timing-indicator" :class="timingStatus.class">{{ timingStatus.text }}</span>
                </div>
                <div class="timing-history">
                  <div
                    v-for="(entry, idx) in slideTimingHistory"
                    :key="idx"
                    class="timing-entry"
                    :class="entry.status"
                  >
                    <span class="timing-entry-slide">第{{ idx + 1 }}页</span>
                    <span class="timing-entry-time">{{ formatTime(entry.duration) }}</span>
                    <span class="timing-entry-status">{{ entry.statusText }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 填充词检测 -->
            <div class="coach-section">
              <div class="coach-section-title">🗣 填充词检测</div>
              <div class="filler-input-wrapper">
                <textarea
                  v-model="speechInput"
                  class="filler-input"
                  placeholder="在此输入你说的内容，实时检测填充词（um, uh, like, so, basically...）"
                  rows="3"
                  @input="detectFillerWords"
                ></textarea>
              </div>
              <div v-if="detectedFillers.length > 0" class="filler-alerts">
                <TransitionGroup name="filler-alert">
                  <div
                    v-for="filler in detectedFillers"
                    :key="filler.id"
                    class="filler-alert-item"
                    :class="{ 'filler-high': filler.count > 3 }"
                  >
                    <span class="filler-word">"{{ filler.word }}"</span>
                    <span class="filler-count">×{{ filler.count }}</span>
                    <span class="filler-advice">{{ filler.advice }}</span>
                  </div>
                </TransitionGroup>
              </div>
              <div v-else class="filler-empty">
                <span>✅ 暂无填充词，继续保持！</span>
              </div>
              <div class="filler-summary">
                共检测到 {{ totalFillerCount }} 次填充词
              </div>
            </div>

            <!-- 自信度评分 -->
            <div class="coach-section">
              <div class="coach-section-title">👁 自信度评分</div>
              <div class="confidence-display">
                <div class="confidence-score-ring">
                  <svg viewBox="0 0 120 120" class="confidence-ring-svg">
                    <circle cx="60" cy="60" r="50" class="confidence-ring-bg" />
                    <circle
                      cx="60" cy="60" r="50"
                      class="confidence-ring-fill"
                      :class="confidenceLevelClass"
                      :stroke-dasharray="`${confidenceScore * 3.14} 314`"
                    />
                  </svg>
                  <div class="confidence-score-text">
                    <span class="confidence-number">{{ confidenceScore }}</span>
                    <span class="confidence-label">/ 100</span>
                  </div>
                </div>
                <div class="confidence-breakdown">
                  <div class="confidence-factor">
                    <span class="factor-name">眼神接触</span>
                    <div class="factor-bar-bg">
                      <div class="factor-bar-fill eye-contact" :style="{ width: eyeContactPercent + '%' }"></div>
                    </div>
                    <span class="factor-value">{{ eyeContactPercent }}%</span>
                  </div>
                  <div class="confidence-factor">
                    <span class="factor-name">语速稳定</span>
                    <div class="factor-bar-bg">
                      <div class="factor-bar-fill pace" :style="{ width: paceScore + '%' }"></div>
                    </div>
                    <span class="factor-value">{{ paceScore }}%</span>
                  </div>
                  <div class="confidence-factor">
                    <span class="factor-name">填充词控制</span>
                    <div class="factor-bar-bg">
                      <div class="factor-bar-fill fillers" :style="{ width: fillerControlScore + '%' }"></div>
                    </div>
                    <span class="factor-value">{{ fillerControlScore }}%</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 语音命令 -->
            <div class="coach-section">
              <div class="coach-section-title">🎤 语音命令</div>
              <div class="voice-command-controls">
                <div class="toggle-row">
                  <span>启用语音命令</span>
                  <label class="coach-toggle">
                    <input type="checkbox" v-model="voiceSettings.enabled" @change="updateVoiceSettingsLocal" />
                    <span></span>
                  </label>
                </div>
                <div class="voice-lang-row">
                  <select v-model="voiceSettings.language" class="form-select-sm" @change="updateVoiceSettingsLocal">
                    <option value="zh-CN">中文</option>
                    <option value="en-US">English</option>
                    <option value="ja-JP">日本語</option>
                  </select>
                  <button
                    class="btn btn-sm"
                    :class="isVoiceListening ? 'btn-danger' : 'btn-primary'"
                    @click="toggleVoiceListening"
                  >
                    {{ isVoiceListening ? '⏹️ 停止' : '🎤 监听' }}
                  </button>
                </div>
                <div v-if="currentTranscript" class="transcript-preview">
                  识别: {{ currentTranscript }}
                </div>
                <div v-if="voiceLastCommand" class="command-confirmed">
                  ✅ {{ voiceLastCommand }}
                </div>
                <!-- Voice commands help -->
                <div class="voice-commands-help">
                  <div class="help-title">可用命令:</div>
                  <div class="help-cmd">"下一页" "上一页" "第5页" "朗读" "停止"</div>
                </div>
              </div>
            </div>

            <!-- 实时字幕 -->
            <div class="coach-section">
              <div class="coach-section-title">📝 实时字幕</div>
              <div class="captions-controls">
                <div class="toggle-row">
                  <span>开启字幕</span>
                  <label class="coach-toggle">
                    <input type="checkbox" v-model="captionsEnabled" @change="toggleCaptionsLocal" />
                    <span></span>
                  </label>
                </div>
                <div class="captions-preview">
                  <div class="captions-box" :class="{ visible: captionsVisible }">
                    <div v-if="!captionsVisible" class="captions-hint">点击上方开启实时字幕</div>
                    <div v-for="(cap, i) in voiceCaptions.slice(-3)" :key="i" class="caption-item" :class="{ final: cap.isFinal }">
                      {{ cap.text }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 朗读当前页 -->
            <div class="coach-section">
              <div class="coach-section-title">🔊 朗读</div>
              <div class="read-controls">
                <div class="voice-select-row">
                  <select v-model="voiceSettings.ttsVoice" class="form-select-sm" @change="updateVoiceSettingsLocal">
                    <option value="zh-CN-Xiaoxiao">晓晓 (女声)</option>
                    <option value="zh-CN-Yunxi">云希 (男声)</option>
                    <option value="en-US-Jenny">Jenny (EN)</option>
                    <option value="ja-JP-Nanami">七海 (JP)</option>
                  </select>
                </div>
                <div class="read-btns">
                  <button
                    class="btn btn-sm btn-primary"
                    :disabled="isVoiceSpeaking"
                    @click="readCurrentSlide"
                  >
                    {{ isVoiceSpeaking ? '🔊 朗读中...' : '🔊 朗读当前页' }}
                  </button>
                  <button v-if="isVoiceSpeaking" class="btn btn-sm" @click="stopVoiceSpeaking">
                    ⏹️ 停止
                  </button>
                </div>
              </div>
            </div>

            <!-- 表达建议 -->
            <div class="coach-section">
              <div class="coach-section-title">💡 表达建议</div>
              <div class="delivery-tips">
                <div
                  v-for="tip in deliveryTips"
                  :key="tip.id"
                  class="delivery-tip-item"
                  :class="tip.type"
                >
                  <span class="tip-icon">{{ tip.icon }}</span>
                  <span class="tip-text">{{ tip.text }}</span>
                </div>
                <div v-if="deliveryTips.length === 0" class="tips-empty">
                  开始练习后，这里会出现个性化建议
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- 排练结果面板 -->
      <div v-if="showRehearsalPanel && recordedTimings.length > 0" class="rehearsal-panel" @click.stop>
        <div class="rehearsal-panel-header">
          <span>🎯 排练结果</span>
          <button class="coach-close-btn" @click="showRehearsalPanel = false">✕</button>
        </div>
        <div class="rehearsal-content">
          <div class="rehearsal-summary">
            <div class="rehearsal-stat">
              <span class="stat-num">{{ recordedTimings.length }}</span>
              <span class="stat-label">页数</span>
            </div>
            <div class="rehearsal-stat">
              <span class="stat-num">{{ formatTime(recordedTimings.reduce((s, t) => s + t.duration, 0)) }}</span>
              <span class="stat-label">总时长</span>
            </div>
            <div class="rehearsal-stat">
              <span class="stat-num">{{ Math.round(recordedTimings.reduce((s, t) => s + t.duration, 0) / recordedTimings.length) }}s</span>
              <span class="stat-label">平均/页</span>
            </div>
          </div>
          <div class="rehearsal-timing-list">
            <div
              v-for="(timing, idx) in recordedTimings"
              :key="idx"
              class="rehearsal-timing-item"
            >
              <span class="rt-slide-num">P{{ idx + 1 }}</span>
              <span class="rt-title">{{ timing.title || `第${idx + 1}页` }}</span>
              <span class="rt-duration">{{ formatTime(timing.duration) }}</span>
            </div>
          </div>
          <div class="rehearsal-actions">
            <input
              v-model="rehearsalSessionName"
              class="rehearsal-name-input"
              placeholder="输入名称保存排练..."
              @keyup.enter="saveRehearsalSession"
            />
            <div class="rehearsal-btn-row">
              <button class="btn btn-sm" @click="saveRehearsalSession">💾 保存</button>
              <button class="btn btn-sm" @click="exportTimings">📤 导出</button>
              <button class="btn btn-sm btn-primary" @click="applyTimingsToAutoAdvance">⏱ 应用时间</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 导入时间弹窗 -->
      <div v-if="showImportModal" class="import-modal-overlay" @click.self="showImportModal = false">
        <div class="import-modal">
          <div class="import-modal-header">
            <span>📥 导入时间数据</span>
            <button @click="showImportModal = false">✕</button>
          </div>
          <div class="import-modal-content">
            <div v-if="savedRehearsals.length > 0" class="import-section">
              <h4>已保存的排练</h4>
              <div class="saved-rehearsal-list">
                <div v-for="session in savedRehearsals" :key="session.id" class="saved-rehearsal-item">
                  <div class="sr-info">
                    <span class="sr-name">{{ session.name }}</span>
                    <span class="sr-meta">{{ formatTime(session.totalSeconds) }} · {{ session.slideCount }}页 · {{ new Date(session.date).toLocaleDateString() }}</span>
                  </div>
                  <div class="sr-actions">
                    <button class="btn btn-xs" @click="importRehearsalTiming(session)">导入</button>
                    <button class="btn btn-xs btn-danger" @click="deleteRehearsal(session.id)">删除</button>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="import-empty">
              <p>暂无保存的排练记录</p>
            </div>
            <div class="import-section">
              <h4>从文件导入</h4>
              <label class="file-import-label">
                <input type="file" accept=".json" @change="importTimingsFromFile(($event.target as HTMLInputElement).files![0])" />
                <span>选择 JSON 文件</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部导航 -->
      <div class="presentation-nav" @click.stop>
        <button class="nav-btn" @click="prevSlide" :disabled="currentSlide === 0">
          ◀ 上一页
        </button>
        <div class="nav-dots">
          <button
            v-for="(_, index) in slides"
            :key="index"
            class="dot"
            :class="{ active: index === currentSlide }"
            @click="goToSlide(index)"
          ></button>
        </div>
        <button class="nav-btn" @click="nextSlide" :disabled="currentSlide === slides.length - 1">
          下一页 ▶
        </button>

        <!-- 自动播放控制 -->
        <div class="auto-play-controls">
          <label class="auto-play-label">
            <input type="checkbox" v-model="autoAdvanceEnabled" />
            自动播放
          </label>
          <select v-if="autoAdvanceEnabled" v-model="autoAdvanceDelay" class="auto-delay-select" @change="resetAutoAdvance">
            <option :value="3000">3秒</option>
            <option :value="5000">5秒</option>
            <option :value="8000">8秒</option>
            <option :value="10000">10秒</option>
            <option :value="15000">15秒</option>
          </select>
        </div>
      </div>
    </div>

    <!-- AR/VR Presentation Mode -->
    <ARVRMode
      v-model:isActive="arvrActive"
      :slides="slides"
      :initialSlide="currentSlide"
      @slideChange="onARVRSlideChange"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, reactive } from 'vue'
import { useSwipeGesture } from '../composables/useSwipeGesture'
import { usePinchZoom } from '../composables/usePinchZoom'
import { recordHeatmapPoint } from '../composables/usePresentationAnalytics'
import { useVoiceCommands } from '../composables/useVoiceCommands'
import ARVRMode from './ARVRMode.vue'

export interface Slide {
  title: string
  content?: string
  bullets?: string[]
  background?: string
  svgUrl?: string
  transition?: 'slide' | 'fade' | 'zoom' | 'flip' | '3d'
  transition3d?: 'cube' | 'cylinder' | 'carousel' | 'flip' | 'depth' | 'flythrough'
  presenterNotes?: string  // 演讲者备注
}

export interface QAQuestion {
  id: string
  text: string
  author?: string
  votes: number
  timestamp: number
}

export interface PollOption {
  text: string
  votes: number
}

export interface Poll {
  id: string
  question: string
  options: PollOption[]
  active: boolean
  totalVotes: number
  createdAt: number
}

export interface TransitionSettings {
  type: 'slide' | 'fade' | 'zoom' | 'flip'
  duration: 'fast' | 'normal' | 'slow'
  autoAdvance: boolean
  autoDelay: number
}

export interface RecordedSlideTiming {
  slideIndex: number
  duration: number
  title?: string
}

export interface RehearsalSession {
  id: string
  name: string
  date: number
  totalSeconds: number
  slideTimings: RecordedSlideTiming[]
  slideCount: number
}

export interface PaceSuggestion {
  slideIndex: number
  suggestedSeconds: number
  contentScore: number
  reason: string
}

const props = defineProps<{
  slides: Slide[]
  active: boolean
  transitionSettings?: TransitionSettings
  initialQuestions?: QAQuestion[]
  initialPolls?: Poll[]
  replayAnimationSignal?: number  // changing number triggers animation replay
  // Webcam overlay config
  webcamConfig?: {
    enabled: boolean
    position: string
    size: number
    borderRadius: number
    mirror: boolean
    border: boolean
    stream?: MediaStream | null
  }
  // Recording mode
  recordingMode?: boolean
  // AI Coach timing data
  coachTimingData?: any
}>()

const emit = defineEmits<{
  (e: 'update:active', value: boolean): void
  (e: 'question-submitted', question: QAQuestion): void
  (e: 'poll-created', poll: Poll): void
  (e: 'poll-voted', pollId: string, optionIndex: number): void
  (e: 'poll-closed', pollId: string): void
  (e: 'add-chapter', time: number): void
}>()

const isActive = ref(false)
const currentSlide = ref(0)
const isFullscreen = ref(false)
const slidesRef = ref<HTMLElement | null>(null)
const webcamVideoRef = ref<HTMLVideoElement | null>(null)
const webcamStreamRef = ref<MediaStream | null>(null)

// Touch swipe: navigate slides with swipe gestures
useSwipeGesture({
  element: slidesRef,
  onSwipeLeft: () => nextSlide(),
  onSwipeRight: () => prevSlide(),
  threshold: 60
})

// Pinch-to-zoom: scale slide content with two-finger pinch
const pinchScale = ref(1)
const showPinchIndicator = ref(false)
let pinchIndicatorTimer: ReturnType<typeof setTimeout> | null = null

const { scale: activePinchScale, resetScale: resetPinchScale } = usePinchZoom({
  element: slidesRef,
  minScale: 0.5,
  maxScale: 3.0,
  onScaleChange: (s) => {
    pinchScale.value = s
    showPinchIndicator.value = true
    if (pinchIndicatorTimer) clearTimeout(pinchIndicatorTimer)
    pinchIndicatorTimer = setTimeout(() => {
      showPinchIndicator.value = false
    }, 1500)
  },
  onDoubleTap: () => {
    resetPinchScale()
    pinchScale.value = 1
  }
})

const slidesContainerStyle = computed(() => ({
  transform: pinchScale.value !== 1 ? `scale(${pinchScale.value})` : undefined,
  transformOrigin: 'center center',
  transition: 'transform 0.1s ease-out'
}))

// =====================
// TIMER FEATURE
// =====================
const timerRunning = ref(false)
const elapsedSeconds = ref(0)
const timerDurationMinutes = ref(0)  // 0 = no limit
const showTimerSetup = ref(false)
const timerSetupMinutes = ref(10)
let timerInterval: ReturnType<typeof setInterval> | null = null

const remainingSeconds = computed(() => {
  if (timerDurationMinutes.value === 0) return 0
  return timerDurationMinutes.value * 60 - elapsedSeconds.value
})

const isOvertime = computed(() => remainingSeconds.value < 0)

const formatTime = (seconds: number): string => {
  const abs = Math.abs(seconds)
  const m = Math.floor(abs / 60)
  const s = abs % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

const startTimerWithSetup = () => {
  timerDurationMinutes.value = timerSetupMinutes.value
  showTimerSetup.value = false
  startTimer()
}

const startTimerNoLimit = () => {
  timerDurationMinutes.value = 0
  showTimerSetup.value = false
  startTimer()
}

const startTimer = () => {
  stopTimer()
  timerRunning.value = true
  timerInterval = setInterval(() => {
    elapsedSeconds.value++
  }, 1000)
}

const pauseTimer = () => {
  timerRunning.value = false
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

const resumeTimer = () => {
  startTimer()
}

const resetTimer = () => {
  pauseTimer()
  elapsedSeconds.value = 0
  timerDurationMinutes.value = 0
  showTimerSetup.value = false
}

// =====================
// REHEARSAL MODE
// =====================
const rehearsalMode = ref(false)
const rehearsalStartTime = ref(0)
const currentSlideStartTime = ref(0)
const recordedTimings = ref<RecordedSlideTiming[]>([])
const autoBasedOnRecording = ref(false)
const showRehearsalPanel = ref(false)
const showImportModal = ref(false)
const savedRehearsals = ref<RehearsalSession[]>([])
const rehearsalSessionName = ref('')
const perSlideAutoDelay = ref<number[]>([])

const loadSavedRehearsals = () => {
  try {
    const stored = localStorage.getItem('rabai_rehearsals')
    if (stored) savedRehearsals.value = JSON.parse(stored)
  } catch {}
}

const persistRehearsals = () => {
  try {
    localStorage.setItem('rabai_rehearsals', JSON.stringify(savedRehearsals.value))
  } catch {}
}

const startRehearsal = () => {
  rehearsalMode.value = true
  recordedTimings.value = []
  rehearsalStartTime.value = Date.now()
  currentSlideStartTime.value = Date.now()
  perSlideAutoDelay.value = []
  startTimerNoLimit()
  stopAutoAdvance()
  autoBasedOnRecording.value = false
  showRehearsalPanel.value = false
}

const stopRehearsal = () => {
  if (currentSlideStartTime.value > 0) {
    const slideDuration = Math.round((Date.now() - currentSlideStartTime.value) / 1000)
    if (slideDuration > 0 && currentSlide.value < props.slides.length) {
      recordedTimings.value.push({
        slideIndex: currentSlide.value,
        duration: slideDuration,
        title: props.slides[currentSlide.value]?.title
      })
    }
  }
  rehearsalMode.value = false
  if (recordedTimings.value.length > 0) {
    showRehearsalPanel.value = true
    computePerSlideAutoDelays()
  }
}

const cancelRehearsal = () => {
  rehearsalMode.value = false
  recordedTimings.value = []
  currentSlideStartTime.value = 0
  showRehearsalPanel.value = false
  autoBasedOnRecording.value = false
}

const recordSlideEntry = (slideIndex: number) => {
  if (rehearsalMode.value) {
    if (currentSlideStartTime.value > 0) {
      const slideDuration = Math.round((Date.now() - currentSlideStartTime.value) / 1000)
      if (slideDuration > 0) {
        const existingIdx = recordedTimings.value.findIndex(t => t.slideIndex === slideIndex)
        if (existingIdx >= 0) {
          recordedTimings.value[existingIdx].duration = slideDuration
        } else {
          recordedTimings.value.push({
            slideIndex,
            duration: slideDuration,
            title: props.slides[slideIndex]?.title
          })
        }
      }
    }
    currentSlideStartTime.value = Date.now()
  }
}

const computePerSlideAutoDelays = () => {
  perSlideAutoDelay.value = props.slides.map((_, i) => {
    const timing = recordedTimings.value.find(t => t.slideIndex === i)
    return timing ? (timing.duration * 1.2) * 1000 : 5000
  })
}

const calculatePaceSuggestions = (): PaceSuggestion[] => {
  return props.slides.map((slide, i) => {
    const text = [slide.title, slide.content, ...(slide.bullets || [])].filter(Boolean).join(' ')
    const wordCount = text.length
    const bulletCount = (slide.bullets || []).length
    const contentScore = Math.min(100, Math.round((wordCount / 20) + bulletCount * 15))
    const baseSeconds = 30
    const extraSeconds = Math.round((contentScore / 100) * 90)
    const suggestedSeconds = baseSeconds + extraSeconds
    let reason = ''
    if (contentScore < 30) reason = '内容简洁，可简短过渡'
    else if (contentScore < 60) reason = '中等内容，保持稳定节奏'
    else reason = '内容丰富，建议充分讲解'
    return { slideIndex: i, suggestedSeconds, contentScore, reason }
  })
}

const applyTimingsToAutoAdvance = () => {
  if (recordedTimings.value.length === 0) return
  computePerSlideAutoDelays()
  autoBasedOnRecording.value = true
  autoAdvanceEnabled.value = true
  autoAdvanceDelay.value = perSlideAutoDelay.value[0] || 5000
  resetAutoAdvance()
  showRehearsalPanel.value = false
}

const applyPaceSuggestions = () => {
  const suggestions = calculatePaceSuggestions()
  perSlideAutoDelay.value = suggestions.map(s => s.suggestedSeconds * 1000)
  autoBasedOnRecording.value = false
  autoAdvanceEnabled.value = true
  autoAdvanceDelay.value = perSlideAutoDelay.value[0] || 5000
  resetAutoAdvance()
  showRehearsalPanel.value = false
}

const getCurrentSlideAutoDelay = (): number => {
  if (autoBasedOnRecording.value && perSlideAutoDelay.value.length > 0) {
    return perSlideAutoDelay.value[currentSlide.value] || autoAdvanceDelay.value
  }
  return autoAdvanceDelay.value
}

const saveRehearsalSession = () => {
  if (recordedTimings.value.length === 0) return
  const name = rehearsalSessionName.value.trim() || `排练 ${savedRehearsals.value.length + 1}`
  const totalSeconds = recordedTimings.value.reduce((sum, t) => sum + t.duration, 0)
  const session: RehearsalSession = {
    id: `rehearsal_${Date.now()}`,
    name,
    date: Date.now(),
    totalSeconds,
    slideTimings: [...recordedTimings.value],
    slideCount: recordedTimings.value.length
  }
  savedRehearsals.value.unshift(session)
  if (savedRehearsals.value.length > 20) savedRehearsals.value = savedRehearsals.value.slice(0, 20)
  persistRehearsals()
  rehearsalSessionName.value = ''
}

const deleteRehearsal = (id: string) => {
  savedRehearsals.value = savedRehearsals.value.filter(r => r.id !== id)
  persistRehearsals()
}

const importRehearsalTiming = (session: RehearsalSession) => {
  recordedTimings.value = [...session.slideTimings]
  computePerSlideAutoDelays()
  autoBasedOnRecording.value = true
  autoAdvanceEnabled.value = true
  autoAdvanceDelay.value = perSlideAutoDelay.value[0] || 5000
  resetAutoAdvance()
  showImportModal.value = false
}

const exportTimings = () => {
  if (recordedTimings.value.length === 0) return
  const data = {
    exportedAt: new Date().toISOString(),
    slideCount: props.slides.length,
    totalSeconds: recordedTimings.value.reduce((s, t) => s + t.duration, 0),
    timings: recordedTimings.value
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `rabai_timing_${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const importTimingsFromFile = (file: File) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)
      if (data.timings && Array.isArray(data.timings)) {
        recordedTimings.value = data.timings
        computePerSlideAutoDelays()
        autoBasedOnRecording.value = true
        showImportModal.value = false
      }
    } catch {}
  }
  reader.readAsText(file)
}

loadSavedRehearsals()

// =====================
// LASER POINTER FEATURE
// =====================
const laserPointerActive = ref(false)
const laserColor = ref('#ff0000')
const isDrawingLaser = ref(false)
const laserPosition = ref({ x: 0, y: 0 })
const laserTrailPoints = ref<Array<{ x: number; y: number }>>([])
let laserTrailTimer: ReturnType<typeof setTimeout> | null = null

const laserDotStyle = computed(() => {
  const color = laserColor.value
  return {
    left: `${laserPosition.value.x}px`,
    top: `${laserPosition.value.y}px`,
    background: `radial-gradient(circle, ${color} 0%, ${color}88 40%, transparent 70%)`,
    boxShadow: `0 0 10px 4px ${color}99, 0 0 20px 8px ${color}4D`
  }
})

const laserTrailStyle = computed(() => {
  if (laserTrailPoints.value.length < 2) return {}
  const points = laserTrailPoints.value
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  return {
    d: pathD,
    stroke: `${laserColor.value}66`
  }
})

const toggleLaserPointer = () => {
  laserPointerActive.value = !laserPointerActive.value
  if (!laserPointerActive.value) {
    isDrawingLaser.value = false
    laserTrailPoints.value = []
  }
}

const handleOverlayClick = (e: MouseEvent) => {
  if (laserPointerActive.value) {
    isDrawingLaser.value = !isDrawingLaser.value
    if (!isDrawingLaser.value) {
      laserTrailPoints.value = []
    }
  }
}

const handleMouseMove = (e: MouseEvent) => {
  if (laserPointerActive.value) {
    laserPosition.value = { x: e.clientX, y: e.clientY }
    if (isDrawingLaser.value) {
      laserTrailPoints.value.push({ x: e.clientX, y: e.clientY })
      if (laserTrailPoints.value.length > 50) {
        laserTrailPoints.value.shift()
      }
    }
  }
  if (spotlightActive.value) {
    spotlightPosition.value = { x: e.clientX, y: e.clientY }
  }
  // Track heatmap attention data
  const nx = e.clientX / window.innerWidth
  const ny = e.clientY / window.innerHeight
  recordHeatmapPoint(nx, ny, 1)
}

// =====================
// SPOTLIGHT FEATURE
// =====================
const spotlightActive = ref(false)
const spotlightPosition = ref({ x: 0, y: 0 })
const spotlightSize = ref(160)  // diameter in px

const spotlightRingStyle = computed(() => ({
  left: `${spotlightPosition.value.x}px`,
  top: `${spotlightPosition.value.y}px`,
  width: `${spotlightSize.value}px`,
  height: `${spotlightSize.value}px`
}))

const toggleSpotlight = () => {
  spotlightActive.value = !spotlightActive.value
  if (spotlightActive.value) {
    laserPointerActive.value = false  // disable laser when spotlight on
  }
}

// =====================
// PRESENTER NOTES FEATURE
// =====================
const showPresenterNotes = ref(false)

const currentSlideNotes = computed(() => {
  return props.slides[currentSlide.value]?.presenterNotes || ''
})

// =====================
// Q&A FEATURE
// =====================
const showQAPanel = ref(false)
const qaActiveTab = ref<'qa' | 'poll'>('qa')
const questions = ref<QAQuestion[]>([])
const newQuestion = ref('')

const sortedQuestions = computed(() => {
  return [...questions.value].sort((a, b) => b.votes - a.votes)
})

const submitQuestion = () => {
  const text = newQuestion.value.trim()
  if (!text) return
  const q: QAQuestion = {
    id: Date.now().toString(),
    text,
    author: '听众',
    votes: 0,
    timestamp: Date.now()
  }
  questions.value.push(q)
  newQuestion.value = ''
  emit('question-submitted', q)
}

const upvoteQuestion = (id: string) => {
  const q = questions.value.find(q => q.id === id)
  if (q) q.votes++
}

const formatTimeAgo = (timestamp: number): string => {
  const diff = Date.now() - timestamp
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  return `${Math.floor(diff / 3600000)}小时前`
}

// =====================
// POLL FEATURE
// =====================
const newPollQuestion = ref('')
const newPollOptions = ref(['', ''])
const activePoll = ref<Poll | null>(null)
const votedOptionIdx = ref<number | null>(null)
const showPollResults = ref(false)

const createPoll = () => {
  const validOptions = newPollOptions.value
    .map(o => o.trim())
    .filter(o => o.length > 0)
  if (!newPollQuestion.value.trim() || validOptions.length < 2) return

  const poll: Poll = {
    id: Date.now().toString(),
    question: newPollQuestion.value.trim(),
    options: validOptions.map(text => ({ text, votes: 0 })),
    active: true,
    totalVotes: 0,
    createdAt: Date.now()
  }
  activePoll.value = poll
  votedOptionIdx.value = null
  showPollResults.value = false
  newPollQuestion.value = ''
  newPollOptions.value = ['', '']
  emit('poll-created', poll)
}

const votePoll = (optionIndex: number) => {
  if (!activePoll.value || votedOptionIdx.value !== null) return
  activePoll.value.options[optionIndex].votes++
  activePoll.value.totalVotes++
  votedOptionIdx.value = optionIndex
  emit('poll-voted', activePoll.value.id, optionIndex)
}

const getPollPercent = (votes: number): number => {
  if (!activePoll.value || activePoll.value.totalVotes === 0) return 0
  return Math.round((votes / activePoll.value.totalVotes) * 100)
}

const closePoll = () => {
  if (activePoll.value) {
    showPollResults.value = true
    emit('poll-closed', activePoll.value.id)
  }
}

const toggleQAPanel = () => {
  showQAPanel.value = !showQAPanel.value
}

// =====================
// TRANSITION SETTINGS
// =====================
const durationOptions = [
  { label: '快', value: 'fast' as const },
  { label: '中', value: 'normal' as const },
  { label: '慢', value: 'slow' as const }
]

const durationMap = {
  fast: 0.3,
  normal: 0.5,
  slow: 0.8
}

const selectedTransition = ref<'slide' | 'fade' | 'zoom' | 'flip' | '3d'>('slide')

// AR/VR state
const arvrActive = ref(false)
const show3DTransitions = ref(false)

function enterARMode() { arvrActive.value = true }
function enterVRMode() { arvrActive.value = true }

function onARVRSlideChange(index: number) {
  currentSlide.value = index
}
const selectedDuration = ref<'fast' | 'normal' | 'slow'>('normal')
const autoAdvanceEnabled = ref(false)
const autoAdvanceDelay = ref(5000)
const autoAdvanceCountdown = ref(0)

let autoAdvanceTimer: ReturnType<typeof setInterval> | null = null
let countdownTimer: ReturnType<typeof setInterval> | null = null

// Watch for prop changes
watch(() => props.active, (val) => {
  isActive.value = val
  if (val) {
    document.body.style.overflow = 'hidden'
    resetAutoAdvance()
  } else {
    document.body.style.overflow = ''
    stopAutoAdvance()
    pauseTimer()
  }
}, { immediate: true })

// Watch for transition settings prop changes
watch(() => props.transitionSettings, (settings) => {
  if (settings) {
    selectedTransition.value = settings.type
    selectedDuration.value = settings.duration
    autoAdvanceEnabled.value = settings.autoAdvance
    autoAdvanceDelay.value = settings.autoDelay
  }
}, { immediate: true })

// Watch for initial questions
watch(() => props.initialQuestions, (qs) => {
  if (qs && qs.length > 0) {
    questions.value = [...qs]
  }
}, { immediate: true })

// Watch for replay animation signal
watch(() => props.replayAnimationSignal, (signal) => {
  if (signal && signal > 0) {
    replayCurrentSlideAnimation()
  }
})

// Watch for webcam config changes
watch(() => props.webcamConfig, (config) => {
  if (config?.stream) {
    webcamStreamRef.value = config.stream
    nextTick(() => {
      if (webcamVideoRef.value) {
        webcamVideoRef.value.srcObject = config.stream
      }
    })
  } else {
    webcamStreamRef.value = null
  }
}, { deep: true })

// Watch for AI coach timing data - apply to auto-advance
watch(() => props.coachTimingData, (data) => {
  if (!data || !data.per_slide_seconds) return
  // Convert AI timing to per-slide delays
  perSlideAutoDelay.value = props.slides.map((_, i) => {
    const slideTiming = data.per_slide_seconds.find((s: any) => s.slide_num === i + 1)
    return slideTiming ? slideTiming.suggested_seconds * 1000 : 5000
  })
  autoBasedOnRecording.value = false  // this is AI-suggested, not recorded
  autoAdvanceEnabled.value = true
  autoAdvanceDelay.value = perSlideAutoDelay.value[0] || 5000
  resetAutoAdvance()
})
// Replay animation for current slide
const isReplayingAnimation = ref(false)
const replayAnimationClass = ref('')

const replayCurrentSlideAnimation = () => {
  if (!isActive.value) return
  isReplayingAnimation.value = false
  // Force reflow to restart animation
  nextTick(() => {
    isReplayingAnimation.value = true
    replayAnimationClass.value = `replay-${Date.now()}`
    setTimeout(() => {
      isReplayingAnimation.value = false
    }, 1500)
  })
}

const totalSlides = computed(() => props.slides.length)

// Current transition duration in seconds
const currentDuration = computed(() => durationMap[selectedDuration.value])

// Get per-slide or global transition
const getSlideTransition = (index: number): string => {
  return props.slides[index]?.transition || selectedTransition.value
}

// Get slide CSS class based on current slide and transition type
const getSlideClass = (index: number) => {
  const transition = getSlideTransition(index)
  const classes: string[] = []

  if (index === currentSlide.value) {
    classes.push('active')
  } else if (index < currentSlide.value) {
    classes.push('prev')
  } else {
    classes.push('next')
  }

  classes.push(`transition-${transition}`)

  return classes
}

// Get slide inline style
const getSlideStyle = (index: number) => {
  const transition = getSlideTransition(index)
  const dur = currentDuration.value

  const baseStyle: Record<string, string> = {
    transition: `all ${dur}s cubic-bezier(0.4, 0, 0.2, 1)`,
    background: props.slides[index]?.background || 'linear-gradient(135deg, #667eea, #764ba2)'
  }

  if (transition === 'fade') {
    baseStyle.opacity = index === currentSlide.value ? '1' : '0'
    baseStyle.transform = 'none'
  } else if (transition === 'zoom') {
    if (index === currentSlide.value) {
      baseStyle.opacity = '1'
      baseStyle.transform = 'scale(1)'
    } else {
      baseStyle.opacity = '0'
      baseStyle.transform = 'scale(0.8)'
    }
  } else if (transition === 'flip') {
    if (index === currentSlide.value) {
      baseStyle.opacity = '1'
      baseStyle.transform = 'rotateY(0deg)'
    } else if (index < currentSlide.value) {
      baseStyle.opacity = '0'
      baseStyle.transform = 'rotateY(-90deg)'
    } else {
      baseStyle.opacity = '0'
      baseStyle.transform = 'rotateY(90deg)'
    }
  } else {
    baseStyle.opacity = index === currentSlide.value ? '1' : '0'
  }

  return baseStyle
}

const nextSlide = () => {
  if (currentSlide.value < props.slides.length - 1) {
    recordSlideEntry(currentSlide.value + 1)
    currentSlide.value++
    saveStateToStorage()
    resetAutoAdvance()
    if (autoBasedOnRecording.value) {
      autoAdvanceDelay.value = getCurrentSlideAutoDelay()
    }
    bc?.postMessage({ type: 'navigate', data: { slide: currentSlide.value } })
  } else if (autoAdvanceEnabled.value) {
    stopAutoAdvance()
  }
}

const prevSlide = () => {
  if (currentSlide.value > 0) {
    recordSlideEntry(currentSlide.value - 1)
    currentSlide.value--
    saveStateToStorage()
    resetAutoAdvance()
    if (autoBasedOnRecording.value) {
      autoAdvanceDelay.value = getCurrentSlideAutoDelay()
    }
    bc?.postMessage({ type: 'navigate', data: { slide: currentSlide.value } })
  }
}

const goToSlide = (index: number) => {
  recordSlideEntry(index)
  currentSlide.value = index
  saveStateToStorage()
  resetAutoAdvance()
  if (autoBasedOnRecording.value) {
    autoAdvanceDelay.value = getCurrentSlideAutoDelay()
  }
  bc?.postMessage({ type: 'navigate', data: { slide: index } })
}

const exitPresentation = () => {
  isActive.value = false
  emit('update:active', false)
  document.body.style.overflow = ''
  stopAutoAdvance()
  pauseTimer()
  if (document.fullscreenElement) {
    document.exitFullscreen()
    isFullscreen.value = false
  }
  if (presenterWindow && !presenterWindow.closed) {
    presenterWindow.close()
    presenterWindowOpen.value = false
    presenterWindow = null
  }
  bc?.close()
  bc = null
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

// Auto-advance logic
const startAutoAdvance = () => {
  stopAutoAdvance()
  if (!autoAdvanceEnabled.value) return

  const delay = getCurrentSlideAutoDelay()
  autoAdvanceCountdown.value = Math.ceil(delay / 1000)

  countdownTimer = setInterval(() => {
    autoAdvanceCountdown.value--
    if (autoAdvanceCountdown.value <= 0) {
      if (autoBasedOnRecording.value) {
        const nextDelay = currentSlide.value < props.slides.length - 1
          ? (perSlideAutoDelay.value[currentSlide.value + 1] || autoAdvanceDelay.value)
          : autoAdvanceDelay.value
        autoAdvanceCountdown.value = Math.ceil(nextDelay / 1000)
      } else {
        autoAdvanceCountdown.value = Math.ceil(autoAdvanceDelay.value / 1000)
      }
      nextSlide()
    }
  }, 1000)
}

const stopAutoAdvance = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  if (autoAdvanceTimer) {
    clearInterval(autoAdvanceTimer)
    autoAdvanceTimer = null
  }
  autoAdvanceCountdown.value = 0
}

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

const resetAutoAdvance = () => {
  if (autoAdvanceEnabled.value && isActive.value) {
    startAutoAdvance()
  }
}

// Watch auto-advance toggle
watch(autoAdvanceEnabled, (enabled) => {
  if (enabled) {
    startAutoAdvance()
  } else {
    stopAutoAdvance()
  }
})

const handleKeydown = (e: KeyboardEvent) => {
  if (!isActive.value) return

  switch (e.key) {
    case 'ArrowRight':
    case ' ':
    case 'PageDown':
      e.preventDefault()
      nextSlide()
      break
    case 'ArrowLeft':
    case 'PageUp':
      e.preventDefault()
      prevSlide()
      break
    case 'Home':
      e.preventDefault()
      goToSlide(0)
      break
    case 'End':
      e.preventDefault()
      goToSlide(props.slides.length - 1)
      break
    case 'Escape':
      e.preventDefault()
      exitPresentation()
      break
    case 'f':
    case 'F':
      e.preventDefault()
      toggleFullscreen()
      break
    case 'l':
    case 'L':
      e.preventDefault()
      toggleLaserPointer()
      break
    case 'n':
    case 'N':
      e.preventDefault()
      showPresenterNotes.value = !showPresenterNotes.value
      break
    case 'q':
    case 'Q':
      e.preventDefault()
      toggleQAPanel()
      break
    case 'p':
    case 'P':
      e.preventDefault()
      openPresenterView()
      break
    case 's':
    case 'S':
      e.preventDefault()
      toggleSpotlight()
      break
    case '0':
    case ')':
      e.preventDefault()
      resetPinchScale()
      pinchScale.value = 1
      break
    case 'c':
    case 'C':
      e.preventDefault()
      showCoachPanel.value = !showCoachPanel.value
      break
    case 'a':
    case 'A':
      e.preventDefault()
      enterARMode()
      break
    case 'v':
    case 'V':
      e.preventDefault()
      enterVRMode()
      break
    case 't':
    case 'T':
      e.preventDefault()
      show3DTransitions.value = !show3DTransitions.value
      break
    case 'm':
    case 'M':
      e.preventDefault()
      if (props.recordingMode) {
        emit('add-chapter', elapsedSeconds.value)
      }
      break
  }
}

// =====================
// PRESENTER VIEW (Second Screen)
// =====================
const presenterWindowOpen = ref(false)
let presenterWindow: Window | null = null
let bc: BroadcastChannel | null = null

const saveStateToStorage = () => {
  try {
    localStorage.setItem('rabai_presentation_state', JSON.stringify({
      slides: props.slides,
      currentSlide: currentSlide.value,
      elapsedSeconds: elapsedSeconds.value,
      timerDurationMinutes: timerDurationMinutes.value,
      timerRunning: timerRunning.value,
      lastUpdate: Date.now()
    }))
  } catch (e) {
    console.warn('Failed to save state to storage:', e)
  }
}

const setupBroadcastChannel = () => {
  try {
    bc = new BroadcastChannel('rabai_presentation')
    bc.onmessage = (event) => {
      const { type, data } = event.data
      if (type === 'navigate') {
        if (data.action === 'next') {
          if (currentSlide.value < props.slides.length - 1) {
            currentSlide.value++
            saveStateToStorage()
            resetAutoAdvance()
          }
        } else if (data.action === 'prev') {
          if (currentSlide.value > 0) {
            currentSlide.value--
            saveStateToStorage()
            resetAutoAdvance()
          }
        } else if (typeof data.slide === 'number') {
          currentSlide.value = data.slide
          saveStateToStorage()
          resetAutoAdvance()
        }
      }
    }
  } catch (e) {
    console.warn('BroadcastChannel not supported:', e)
  }
}

// Broadcast AI coach data to presenter view
const broadcastCoachUpdate = () => {
  bc?.postMessage({
    type: 'coach_update',
    data: {
      confidenceScore: confidenceScore.value,
      eyeContact: eyeContactPercent.value,
      paceScore: paceScore.value,
      fillerControl: fillerControlScore.value,
      fillerCount: totalFillerCount.value,
      latestTip: deliveryTips.value[0] || null
    }
  })
}

const openPresenterView = async () => {
  if (presenterWindowOpen.value && presenterWindow && !presenterWindow.closed) {
    presenterWindow.focus()
    return
  }

  saveStateToStorage()

  let presenterUrl = '/presenter'
  let presenterFeatures = 'width=1200,height=800,menubar=no,toolbar=no,location=no,status=no'

  try {
    if ('getScreenDetails' in window) {
      const screenDetails = await (window as any).getScreenDetails()
      if (screenDetails.screens && screenDetails.screens.length > 1) {
        const secondaryScreen = screenDetails.screens.find((s: any) => !s.isPrimary)
        if (secondaryScreen) {
          const { availLeft, availTop, availWidth, availHeight } = secondaryScreen
          presenterFeatures = `width=${Math.min(availWidth, 1400)},height=${Math.min(availHeight, 900)},left=${availLeft},top=${availTop},menubar=no,toolbar=no,location=no,status=no`
        }
      }
    }
  } catch (e) {
    // Fallback
  }

  presenterWindow = window.open(presenterUrl, 'presenter_view', presenterFeatures)

  if (presenterWindow) {
    presenterWindowOpen.value = true
    presenterWindow.addEventListener('load', () => {
      saveStateToStorage()
    })
    const checkClosed = setInterval(() => {
      if (presenterWindow?.closed) {
        clearInterval(checkClosed)
        presenterWindowOpen.value = false
        presenterWindow = null
      }
    }, 500)
  } else {
    presenterWindowOpen.value = false
    console.warn('Failed to open presenter view: popup blocked')
  }
}

// =====================
// AI PRESENTATION COACH
// =====================

// Practice Mode
const showCoachPanel = ref(false)
const practiceModeEnabled = ref(false)

interface Reaction {
  id: number
  emoji: string
}
const visibleReactions = ref<Reaction[]>([])
let reactionInterval: ReturnType<typeof setInterval> | null = null

const audienceEmojis = ['👏', '😮', '🤔', '😴', '😊', '😅', '👍', '🤩']

const startAudienceSimulation = () => {
  if (reactionInterval) return
  reactionInterval = setInterval(() => {
    if (Math.random() < 0.4) {
      const emoji = audienceEmojis[Math.floor(Math.random() * audienceEmojis.length)]
      const id = Date.now() + Math.random()
      visibleReactions.value.push({ id, emoji })
      setTimeout(() => {
        visibleReactions.value = visibleReactions.value.filter(r => r.id !== id)
      }, 3000)
    }
  }, 2000)
}

const stopAudienceSimulation = () => {
  if (reactionInterval) {
    clearInterval(reactionInterval)
    reactionInterval = null
  }
  visibleReactions.value = []
}

watch(practiceModeEnabled, (enabled) => {
  if (enabled) {
    startAudienceSimulation()
  } else {
    stopAudienceSimulation()
  }
})

// Per-slide timing feedback
const currentSlideTime = ref(0)
const slideTimingHistory = ref<Array<{ duration: number; status: string; statusText: string }>>([])
let slideTimeInterval: ReturnType<typeof setInterval> | null = null
let lastSlideChangeTime = 0

const OPTIMAL_TIME_PER_SLIDE = 60  // seconds - typical presentation pace
const TOLERANCE = 15  // seconds tolerance

const updateTimingStatus = () => {
  if (!timerRunning.value) return
  currentSlideTime.value++
}

const recordSlideTiming = () => {
  if (currentSlideTime.value > 0) {
    const duration = currentSlideTime.value
    let status = 'just-right'
    let statusText = '✅ 节奏刚好'
    if (duration < OPTIMAL_TIME_PER_SLIDE - TOLERANCE) {
      status = 'too-fast'
      statusText = '⚡ 节奏偏快'
    } else if (duration > OPTIMAL_TIME_PER_SLIDE + TOLERANCE * 2) {
      status = 'too-slow'
      statusText = '🐢 节奏偏慢'
    }
    slideTimingHistory.value.push({ duration, status, statusText })
    currentSlideTime.value = 0
    generateTimingTip(duration, status)
  }
}

const timingStatus = computed(() => {
  const t = currentSlideTime.value
  if (t < OPTIMAL_TIME_PER_SLIDE - TOLERANCE) {
    return { class: 'timing-fast', text: '⚡ 偏快' }
  } else if (t > OPTIMAL_TIME_PER_SLIDE + TOLERANCE * 2) {
    return { class: 'timing-slow', text: '🐢 偏慢' }
  }
  return { class: 'timing-good', text: '✅ 节奏好' }
})

// Filler word detection
const FILLER_WORDS = [
  { word: 'um', advice: '尝试停顿代替"um"' },
  { word: 'uh', advice: '用沉默代替"uh"' },
  { word: 'like', advice: '减少"like"的使用' },
  { word: 'so', advice: '避免句首用"so"开头' },
  { word: 'basically', advice: '删除这个填充词' },
  { word: 'actually', advice: '检查是否真正需要' },
  { word: 'literally', advice: '这是强化词，可删除' },
  { word: 'you know', advice: '用停顿代替' },
  { word: 'I mean', advice: '直接表达观点' },
  { word: 'right', advice: '确认而非填充' }
]

const speechInput = ref('')
const detectedFillers = ref<Array<{ word: string; count: number; advice: string; id: number }>>([])
const totalFillerCount = ref(0)

// ── Voice Commands (useVoiceCommands) ─────────────────────────────────────
const voicePM = useVoiceCommands()
const voiceSettings = reactive({
  enabled: true,
  language: 'zh-CN',
  ttsVoice: 'zh-CN-Xiaoxiao',
  ttsRate: '+0%',
  ttsVolume: '+0%',
  ttsPitch: '+0Hz',
  captionsEnabled: true,
  captionsLanguage: 'zh-CN',
  commandFeedback: true,
})
const captionsEnabled = ref(true)

const isVoiceListening = voicePM.isListening
const isVoiceSpeaking = voicePM.isSpeaking
const currentTranscript = voicePM.currentTranscript
const voiceLastCommand = voicePM.lastRecognizedCommand
const voiceCaptions = voicePM.captions
const captionsVisible = voicePM.captionsVisible

function updateVoiceSettingsLocal() {
  voicePM.updateSettings({ ...voiceSettings })
}

function toggleVoiceListening() {
  voicePM.toggleListening()
}

function toggleCaptionsLocal() {
  if (captionsEnabled.value) {
    voicePM.startCaptions()
  } else {
    voicePM.stopCaptions()
  }
}

async function readCurrentSlide() {
  const slide = slides[currentSlide.value]
  if (!slide) return
  const text = [slide.title, slide.content].filter(Boolean).join('。')
  if (!text) return
  await voicePM.readSlideAloud(text)
}

function stopVoiceSpeaking() {
  voicePM.stopSpeaking()
}

// Set up voice navigation to control presentation slides
voicePM.setNavigationHandler((action, value) => {
  if (value === 'next') {
    nextSlide()
  } else if (value === 'prev') {
    prevSlide()
  } else if (value === 'first') {
    goToSlide(0)
  } else if (value === 'last') {
    goToSlide(slides.length - 1)
  } else if (value?.startsWith('slide:')) {
    const num = parseInt(value.split(':')[1]) - 1
    if (num >= 0 && num < slides.length) {
      goToSlide(num)
    }
  }
})

voicePM.setControlHandler((action, value) => {
  if (value === 'read') {
    readCurrentSlide()
  } else if (value === 'stop') {
    stopVoiceSpeaking()
  } else if (value === 'captions') {
    captionsEnabled.value = !captionsEnabled.value
    toggleCaptionsLocal()
  }
})

const detectFillerWords = () => {
  const text = speechInput.value.toLowerCase()
  const results: Record<string, number> = {}

  for (const filler of FILLER_WORDS) {
    const regex = new RegExp(`\\b${filler.word.replace(/\\s+/g, '\\s+')}\\b`, 'gi')
    const matches = text.match(regex)
    if (matches && matches.length > 0) {
      results[filler.word] = matches.length
    }
  }

  detectedFillers.value = Object.entries(results).map(([word, count], idx) => {
    const fillerInfo = FILLER_WORDS.find(f => f.word === word) || { advice: '减少使用' }
    return {
      word,
      count,
      advice: fillerInfo.advice,
      id: Date.now() + idx
    }
  }).sort((a, b) => b.count - a.count)

  totalFillerCount.value = detectedFillers.value.reduce((sum, f) => sum + f.count, 0)
  broadcastCoachUpdate()

  // Update filler control score
  fillerControlScore.value = Math.max(0, 100 - totalFillerCount.value * 8)

  // Generate tip if too many fillers
  if (totalFillerCount.value > 5) {
    addDeliveryTip('warning', '⚠️', `检测到 ${totalFillerCount.value} 次填充词，尝试放慢语速或停顿`)
  }
}

// Confidence Score
const confidenceScore = ref(75)
const eyeContactPercent = ref(65)
const paceScore = ref(80)
const fillerControlScore = ref(90)

const confidenceLevelClass = computed(() => {
  if (confidenceScore.value >= 80) return 'confidence-high'
  if (confidenceScore.value >= 60) return 'confidence-medium'
  return 'confidence-low'
})

// Simulate eye contact changes when practice mode is on
let eyeContactInterval: ReturnType<typeof setInterval> | null = null

const startEyeContactSimulation = () => {
  if (eyeContactInterval) return
  eyeContactInterval = setInterval(() => {
    // Randomly vary eye contact between 50-90%
    eyeContactPercent.value = Math.floor(Math.random() * 40 + 50)
    paceScore.value = Math.floor(Math.random() * 30 + 60)
    updateConfidenceScore()
  }, 5000)
}

const stopEyeContactSimulation = () => {
  if (eyeContactInterval) {
    clearInterval(eyeContactInterval)
    eyeContactInterval = null
  }
}

const updateConfidenceScore = () => {
  confidenceScore.value = Math.floor(
    eyeContactPercent.value * 0.4 +
    paceScore.value * 0.3 +
    fillerControlScore.value * 0.3
  )
  broadcastCoachUpdate()
}

watch(practiceModeEnabled, (enabled) => {
  if (enabled) {
    startEyeContactSimulation()
    startTimingTracking()
  } else {
    stopEyeContactSimulation()
    stopTimingTracking()
  }
}, { immediate: true })

// Timing tracking per slide
const startTimingTracking = () => {
  if (slideTimeInterval) return
  lastSlideChangeTime = Date.now()
  slideTimeInterval = setInterval(() => {
    if (timerRunning.value) {
      currentSlideTime.value++
    }
  }, 1000)
}

const stopTimingTracking = () => {
  if (slideTimeInterval) {
    clearInterval(slideTimeInterval)
    slideTimeInterval = null
  }
}

// Watch slide changes to record timing
watch(() => currentSlide.value, () => {
  recordSlideTiming()
  lastSlideChangeTime = Date.now()
  currentSlideTime.value = 0
})

// Delivery Tips
interface DeliveryTip {
  id: number
  icon: string
  text: string
  type: string
}
const deliveryTips = ref<DeliveryTip[]>([])
let tipIdCounter = 0

const addDeliveryTip = (type: string, icon: string, text: string) => {
  // Avoid duplicate tips
  const existing = deliveryTips.value.find(t => t.text === text)
  if (existing) return

  deliveryTips.value.unshift({
    id: ++tipIdCounter,
    icon,
    text,
    type
  })

  // Keep max 5 tips
  if (deliveryTips.value.length > 5) {
    deliveryTips.value.pop()
  }
  broadcastCoachUpdate()
}

const generateTimingTip = (duration: number, status: string) => {
  if (status === 'too-fast') {
    addDeliveryTip('warning', '⚡', `第${slideTimingHistory.value.length}页节奏偏快（${formatTime(duration)}），建议增加解释时间`)
  } else if (status === 'too-slow') {
    addDeliveryTip('info', '💡', `第${slideTimingHistory.value.length}页节奏偏慢，可适当精简内容`)
  }
}

// Generate general tips based on practice
watch(() => slideTimingHistory.value.length, (len) => {
  if (len === 3) {
    addDeliveryTip('success', '🎉', '已完成3页练习！继续保持当前节奏' )
  }
  if (len === props.slides.length && props.slides.length > 1) {
    addDeliveryTip('success', '🏆', '演示完成！总用时' + formatTime(elapsedSeconds.value))
  }
})

// Watch timer running state for timing tracking
watch(timerRunning, (running) => {
  if (running && practiceModeEnabled.value) {
    startTimingTracking()
  }
})

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
  setupBroadcastChannel()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
  stopAutoAdvance()
  stopTimer()
  stopAudienceSimulation()
  stopEyeContactSimulation()
  stopTimingTracking()
  bc?.close()
  if (presenterWindow && !presenterWindow.closed) {
    presenterWindow.close()
  }
})
</script>

<style scoped>
.presentation-overlay {
  position: fixed;
  inset: 0;
  background: #000;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* =====================
   WEBCAM OVERLAY
   ===================== */
.webcam-overlay {
  position: absolute;
  z-index: 20;
  width: var(--cam-width, 160px);
  pointer-events: none;
}

.webcam-overlay.webcam-top-left { top: 60px; left: 16px; }
.webcam-overlay.webcam-top-right { top: 60px; right: 16px; }
.webcam-overlay.webcam-bottom-left { bottom: 16px; left: 16px; }
.webcam-overlay.webcam-bottom-right { bottom: 16px; right: 16px; }

.webcam-video {
  width: 100%;
  height: auto;
  object-fit: cover;
  display: block;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.webcam-video.mirror {
  transform: scaleX(-1);
}

/* =====================
   RECORDING INDICATOR
   ===================== */
.recording-indicator {
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(239, 68, 68, 0.9);
  border-radius: 20px;
  color: white;
  font-size: 12px;
  font-weight: 600;
  z-index: 30;
}

.recording-dot {
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
  animation: recording-pulse 1s infinite;
}

@keyframes recording-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* =====================
   TOOLBAR
   ===================== */
.presentation-toolbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.7);
  z-index: 10;
  flex-wrap: wrap;
}

.slide-counter {
  color: #fff;
  font-size: 14px;
  margin-right: auto;
  min-width: 60px;
}

/* Timer */
.timer-display {
  display: flex;
  align-items: center;
  gap: 6px;
  position: relative;
}

.timer-elapsed,
.timer-remaining {
  color: #fff;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 10px;
  border-radius: 12px;
  font-family: monospace;
}

.timer-elapsed.overtime {
  color: #ff6b6b;
  background: rgba(255, 107, 107, 0.15);
}

.timer-remaining.warning {
  color: #ffd93d;
  background: rgba(255, 217, 61, 0.15);
}

.timer-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  padding: 5px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}

.timer-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.timer-setup-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(30, 30, 40, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 12px;
  min-width: 200px;
  z-index: 100;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.timer-setup-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.timer-setup-row:last-child {
  margin-bottom: 0;
}

.timer-setup-row label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  white-space: nowrap;
}

.timer-input-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.timer-input-group span {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}

.timer-input {
  width: 60px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
  text-align: center;
}

/* Transition selectors */
.transition-selector {
  display: flex;
  align-items: center;
  gap: 6px;
}

.transition-select {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.transition-select option {
  background: #333;
  color: #fff;
}

.duration-selector {
  display: flex;
  gap: 4px;
}

.duration-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.7);
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.duration-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.duration-btn.active {
  background: rgba(22, 93, 255, 0.8);
  border-color: #165DFF;
  color: #fff;
}

.auto-advance {
  display: flex;
  align-items: center;
}

.auto-advance-label {
  color: #4ade80;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  background: rgba(74, 222, 128, 0.15);
  padding: 4px 10px;
  border-radius: 12px;
}

.toolbar-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  padding: 7px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 15px;
  transition: background 0.2s;
}

.toolbar-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.toolbar-btn.active {
  background: rgba(22, 93, 255, 0.8);
  border: 1px solid #165DFF;
}

.ar-btn.active {
  background: rgba(0, 200, 83, 0.8);
  border: 1px solid #00C853;
}

.vr-btn.active {
  background: rgba(156, 39, 176, 0.8);
  border: 1px solid #9C27B0;
}

.laser-btn.active {
  background: rgba(255, 50, 50, 0.8);
  border: 1px solid #ff3232;
  box-shadow: 0 0 8px rgba(255, 50, 50, 0.5);
}

.notes-btn.active,
.qa-btn.active {
  background: rgba(22, 93, 255, 0.8);
  border: 1px solid #165DFF;
}

/* =====================
   LASER POINTER
   ===================== */
.presentation-overlay.laser-active {
  cursor: none;
}

.laser-dot {
  position: fixed;
  width: 16px;
  height: 16px;
  background: radial-gradient(circle, #ff0000 0%, #ff4444 40%, transparent 70%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 10000;
  box-shadow: 0 0 10px 4px rgba(255, 0, 0, 0.6), 0 0 20px 8px rgba(255, 0, 0, 0.3);
  animation: laserPulse 0.5s ease-in-out infinite alternate;
}

@keyframes laserPulse {
  from { transform: translate(-50%, -50%) scale(1); }
  to { transform: translate(-50%, -50%) scale(1.2); }
}

.laser-trail {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9998;
}

.laser-trail path {
  fill: none;
  stroke: var(--laser-trail-color, rgba(255, 0, 0, 0.4));
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* =====================
   SPOTLIGHT
   ===================== */
.spotlight-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9996;
  background: rgba(0, 0, 0, 0.6);
  transition: background 0.1s;
}

.spotlight-ring {
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  z-index: 9997;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6);
  border: 2px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: contrast(1.2) brightness(1.3);
  animation: spotlightPulse 2s ease-in-out infinite;
}

@keyframes spotlightPulse {
  0%, 100% { border-color: rgba(255, 255, 255, 0.3); }
  50% { border-color: rgba(255, 255, 255, 0.6); }
}

/* =====================
   PRESENTER BUTTON
   ===================== */
.presenter-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}

.presenter-btn.active {
  background: rgba(74, 222, 128, 0.3) !important;
  border: 1px solid rgba(74, 222, 128, 0.6) !important;
  box-shadow: 0 0 8px rgba(74, 222, 128, 0.4);
}

/* =====================
   SPOTLIGHT BUTTON
   ===================== */
.spotlight-btn.active {
  background: rgba(255, 217, 61, 0.3) !important;
  border: 1px solid rgba(255, 217, 61, 0.6) !important;
  box-shadow: 0 0 8px rgba(255, 217, 61, 0.4);
}

/* =====================
   LASER POINTER COLOR
   ===================== */
.laser-pointer-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.laser-icon {
  font-size: 16px;
  line-height: 1;
}

.laser-color-picker {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  padding: 0;
  background: none;
  overflow: hidden;
}

.laser-color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}

.laser-color-picker::-webkit-color-swatch {
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

/* =====================
   SLIDES
   ===================== */
.slides-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  perspective: 1200px;
}

/* Base slide styles */
.slide {
  position: absolute;
  width: 80%;
  max-width: 900px;
  aspect-ratio: 16/9;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  pointer-events: none;
  transform-style: preserve-3d;
  backface-visibility: hidden;
}

/* Slide content */
.slide-content {
  text-align: center;
  padding: 40px;
  color: #fff;
  max-width: 80%;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* SVG 幻灯片：填充整个 slide 区域 */
.slide-svg {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.slide-title {
  font-size: 42px;
  font-weight: 700;
  margin-bottom: 24px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.slide-text {
  font-size: 20px;
  opacity: 0.9;
  line-height: 1.6;
}

.slide-bullets {
  text-align: left;
  font-size: 18px;
  margin-top: 20px;
  padding-left: 20px;
}

.slide-bullets li {
  margin-bottom: 12px;
  line-height: 1.5;
}

/* TRANSITION: SLIDE */
.transition-slide.slide.active {
  opacity: 1;
  transform: translateX(0) scale(1);
  z-index: 5;
}
.transition-slide.slide.prev {
  opacity: 0;
  transform: translateX(-100px) scale(0.9);
}
.transition-slide.slide.next {
  opacity: 0;
  transform: translateX(100px) scale(0.9);
}

/* TRANSITION: FADE */
.transition-fade.slide.active {
  opacity: 1;
  transform: scale(1);
  z-index: 5;
}
.transition-fade.slide.prev,
.transition-fade.slide.next {
  opacity: 0;
  transform: scale(1);
}

/* TRANSITION: ZOOM */
.transition-zoom.slide.active {
  opacity: 1;
  transform: scale(1);
  z-index: 5;
}
.transition-zoom.slide.prev,
.transition-zoom.slide.next {
  opacity: 0;
  transform: scale(0.8);
}

/* TRANSITION: FLIP */
.transition-flip.slide.active {
  opacity: 1;
  transform: rotateY(0deg);
  z-index: 5;
}
.transition-flip.slide.prev {
  opacity: 0;
  transform: rotateY(-90deg);
}
.transition-flip.slide.next {
  opacity: 0;
  transform: rotateY(90deg);
}

/* =====================
   PRESENTER NOTES PANEL
   ===================== */
.presenter-notes-panel {
  position: absolute;
  bottom: 70px;
  left: 20px;
  right: 20px;
  max-width: 600px;
  background: rgba(20, 20, 30, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  overflow: hidden;
  z-index: 20;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.notes-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  font-weight: 500;
}

.notes-close-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
}

.notes-close-btn:hover {
  color: #fff;
}

.notes-panel-content {
  padding: 14px;
  max-height: 160px;
  overflow-y: auto;
}

.notes-text {
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
}

.notes-empty {
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
  text-align: center;
  padding: 20px;
}

.notes-panel-footer {
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.03);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.notes-slide-hint {
  color: rgba(255, 255, 255, 0.4);
  font-size: 11px;
}

/* Slide-up transition */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* =====================
   Q&A PANEL
   ===================== */
.qa-panel {
  position: absolute;
  top: 60px;
  right: 0;
  bottom: 70px;
  width: 320px;
  background: rgba(18, 18, 28, 0.97);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  z-index: 30;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.4);
}

.qa-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.qa-tabs {
  display: flex;
  gap: 4px;
}

.qa-tab {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.qa-tab:hover {
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.05);
}

.qa-tab.active {
  color: #fff;
  background: rgba(22, 93, 255, 0.6);
}

.qa-close-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  font-size: 14px;
  padding: 4px 8px;
}

/* Q&A Content */
.qa-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.qa-input-section {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.qa-input {
  flex: 1;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 13px;
}

.qa-input::placeholder {
  color: rgba(255, 255, 255, 0.35);
}

.qa-input:focus {
  outline: none;
  border-color: rgba(22, 93, 255, 0.6);
}

.qa-submit-btn {
  background: #165DFF;
  border: none;
  color: #fff;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
  transition: background 0.2s;
}

.qa-submit-btn:hover:not(:disabled) {
  background: #0d47e1;
}

.qa-submit-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.qa-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.qa-item {
  display: flex;
  gap: 10px;
  padding: 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  margin-bottom: 8px;
  transition: all 0.2s;
}

.qa-item.highlight-vote {
  background: rgba(22, 93, 255, 0.12);
  border: 1px solid rgba(22, 93, 255, 0.2);
}

.qa-item-vote {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 30px;
}

.vote-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  font-size: 12px;
  padding: 2px;
  transition: color 0.2s;
}

.vote-btn:hover {
  color: #4ade80;
}

.vote-count {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-weight: 600;
}

.qa-item-content {
  flex: 1;
  min-width: 0;
}

.qa-item-text {
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
}

.qa-item-meta {
  color: rgba(255, 255, 255, 0.35);
  font-size: 11px;
  margin-top: 4px;
}

.qa-empty {
  text-align: center;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.35);
  font-size: 13px;
}

.qa-empty-hint {
  font-size: 12px;
  margin-top: 6px;
}

/* Poll Content */
.poll-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.poll-create-section {
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.poll-question-input {
  margin-bottom: 10px;
}

.poll-options-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.poll-option-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.poll-remove-btn {
  background: rgba(255, 80, 80, 0.3);
  border: none;
  color: rgba(255, 255, 255, 0.7);
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.poll-add-option-btn {
  background: none;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.5);
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  width: 100%;
  transition: all 0.2s;
}

.poll-add-option-btn:hover {
  border-color: rgba(22, 93, 255, 0.5);
  color: rgba(255, 255, 255, 0.8);
}

.poll-display-section {
  padding: 12px;
  flex: 1;
  overflow-y: auto;
}

.poll-question-display {
  color: rgba(255, 255, 255, 0.95);
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 16px;
  line-height: 1.4;
}

.poll-options-display {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.poll-option-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 10px 12px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.2s;
}

.poll-option-item:hover:not(.show-results) {
  background: rgba(22, 93, 255, 0.15);
  border-color: rgba(22, 93, 255, 0.4);
}

.poll-option-item.voted {
  border-color: rgba(22, 93, 255, 0.5);
}

.poll-option-bar-bg {
  position: absolute;
  inset: 0;
  background: rgba(22, 93, 255, 0.1);
}

.poll-option-bar-fill {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  background: rgba(22, 93, 255, 0.3);
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.poll-option-label {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
}

.poll-option-percent {
  color: rgba(22, 93, 255, 1);
  font-weight: 600;
}

.poll-option-vote-hint {
  position: relative;
  color: rgba(255, 255, 255, 0.3);
  font-size: 11px;
  margin-top: 2px;
}

.poll-option-voted-mark {
  position: absolute;
  top: 8px;
  right: 10px;
  color: #4ade80;
  font-size: 14px;
  font-weight: bold;
}

.poll-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

/* Slide-right transition */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-right-enter-from,
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* QA item transition */
.qa-item-enter-active {
  transition: all 0.3s ease;
}
.qa-item-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

/* =====================
   NAVIGATION
   ===================== */
.presentation-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.7);
  flex-wrap: wrap;
}

.nav-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  padding: 10px 22px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.nav-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.nav-dots {
  display: flex;
  gap: 8px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.dot:hover {
  background: rgba(255, 255, 255, 0.5);
}

.dot.active {
  background: #fff;
  transform: scale(1.2);
}

/* Auto-play controls */
.auto-play-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 16px;
  padding-left: 16px;
  border-left: 1px solid rgba(255, 255, 255, 0.2);
}

.auto-play-label {
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.auto-play-label input {
  cursor: pointer;
}

.auto-delay-select {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.auto-delay-select option {
  background: #333;
  color: #fff;
}

/* =====================
   MOBILE RESPONSIVE
   ===================== */
@media (max-width: 768px) {
  .slide {
    width: 90%;
  }

  .slide-title {
    font-size: 28px;
  }

  .slide-text {
    font-size: 16px;
  }

  .nav-btn {
    padding: 8px 16px;
    font-size: 12px;
  }

  .presentation-toolbar {
    gap: 8px;
    padding: 8px 12px;
  }

  .auto-play-controls {
    margin-left: 0;
    padding-left: 0;
    border-left: none;
    width: 100%;
    justify-content: center;
  }

  .qa-panel {
    width: 100%;
    top: auto;
    bottom: 70px;
    left: 0;
    right: 0;
    border-left: none;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .presenter-notes-panel {
    left: 10px;
    right: 10px;
  }
}

/* Mobile: Full-screen presentation overlay */
@media (pointer: coarse), (max-width: 767px) {
  .presentation-swipe-hint {
    display: block;
    position: absolute;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
    background: rgba(0, 0, 0, 0.3);
    padding: 6px 14px;
    border-radius: 20px;
    z-index: 20;
    pointer-events: none;
    animation: fadeIn 0.5s ease 1s both;
  }
}

@media (max-width: 767px) {
  .presentation-overlay {
    flex-direction: column;
  }

  .presentation-toolbar {
    padding: 10px 12px;
    flex-wrap: wrap;
    gap: 6px;
  }

  .slide-counter {
    font-size: 14px;
  }

  .transition-selector .transition-select {
    font-size: 12px;
    padding: 4px 8px;
  }

  .duration-selector {
    gap: 4px;
  }

  .duration-btn {
    padding: 4px 10px;
    font-size: 12px;
  }

  .slides-container {
    flex: 1;
    min-height: 0;
  }

  .slide-content {
    padding: 16px;
  }

  .slide-title {
    font-size: 24px;
    margin-bottom: 12px;
  }

  .slide-text {
    font-size: 15px;
  }

  .presentation-nav {
    padding: 10px 12px;
    gap: 8px;
  }

  .nav-btn {
    padding: 8px 12px;
    font-size: 12px;
  }

  .nav-dots {
    gap: 4px;
  }

  .dot {
    width: 8px;
    height: 8px;
  }

  .auto-play-controls {
    flex-wrap: wrap;
    justify-content: center;
    padding: 0;
    border: none;
    margin: 0;
  }

  .timer-elapsed,
  .timer-remaining {
    font-size: 12px;
    padding: 3px 7px;
  }
}

/* Tablet presentation */
@media (min-width: 768px) and (max-width: 1024px) {
  .slides-container {
    padding: 20px;
  }

  .slide-content {
    padding: 24px;
  }

  .qa-panel {
    width: 280px;
  }
}

/* ==================== */
/* AI Coach Panel       */
/* ==================== */
.coach-panel {
  position: fixed;
  top: 60px;
  right: 16px;
  width: 340px;
  max-height: calc(100vh - 120px);
  background: rgba(15, 15, 30, 0.97);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  z-index: 10010;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.coach-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: rgba(22, 93, 255, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.coach-close-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 4px;
}

.coach-close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.coach-content {
  overflow-y: auto;
  flex: 1;
  padding: 8px 0;
}

.coach-section {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.coach-section:last-child {
  border-bottom: none;
}

.coach-section-title {
  font-size: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 10px;
}

/* Practice Mode */
.coach-toggle-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.coach-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
}

.coach-toggle input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #165DFF;
}

.simulated-audience {
  margin-top: 10px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 10px;
  padding: 10px;
}

.audience-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 6px;
}

.audience-reactions {
  min-height: 36px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.audience-reaction-emoji {
  font-size: 22px;
  animation: reaction-pop 0.3s ease-out;
}

@keyframes reaction-pop {
  0% { transform: scale(0) rotate(-20deg); opacity: 0; }
  60% { transform: scale(1.2) rotate(5deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}

.reaction-pop-enter-active {
  animation: reaction-pop 0.3s ease-out;
}

.reaction-pop-leave-active {
  animation: reaction-pop 0.3s ease-in reverse;
}

.audience-waiting {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
}

/* Timing Feedback */
.timing-feedback {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.timing-current {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.timing-label {
  color: rgba(255, 255, 255, 0.5);
}

.timing-value {
  color: #fff;
  font-variant-numeric: tabular-nums;
  font-family: 'SF Mono', Monaco, monospace;
}

.timing-indicator {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.timing-indicator.timing-fast {
  background: rgba(255, 107, 107, 0.2);
  color: #ff6b6b;
}

.timing-indicator.timing-slow {
  background: rgba(255, 217, 61, 0.2);
  color: #ffd93d;
}

.timing-indicator.timing-good {
  background: rgba(52, 211, 153, 0.2);
  color: #34d399;
}

.timing-history {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 120px;
  overflow-y: auto;
}

.timing-entry {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.03);
}

.timing-entry.too-fast { border-left: 2px solid #ff6b6b; }
.timing-entry.too-slow { border-left: 2px solid #ffd93d; }
.timing-entry.just-right { border-left: 2px solid #34d399; }

.timing-entry-slide {
  color: rgba(255, 255, 255, 0.5);
  min-width: 50px;
}

.timing-entry-time {
  color: rgba(255, 255, 255, 0.7);
  font-variant-numeric: tabular-nums;
  font-family: 'SF Mono', Monaco, monospace;
  min-width: 40px;
}

.timing-entry-status {
  color: rgba(255, 255, 255, 0.4);
}

/* Filler Word Detection */
.filler-input-wrapper {
  margin-bottom: 8px;
}

.filler-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 8px 10px;
  color: #fff;
  font-size: 12px;
  font-family: inherit;
  resize: none;
  outline: none;
  box-sizing: border-box;
  line-height: 1.5;
}

.filler-input::placeholder {
  color: rgba(255, 255, 255, 0.25);
  font-size: 11px;
}

.filler-input:focus {
  border-color: rgba(22, 93, 255, 0.5);
  background: rgba(22, 93, 255, 0.05);
}

.filler-alerts {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 6px;
}

.filler-alert-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  background: rgba(255, 217, 61, 0.1);
  border: 1px solid rgba(255, 217, 61, 0.2);
  border-radius: 6px;
  font-size: 11px;
}

.filler-alert-item.filler-high {
  background: rgba(255, 107, 107, 0.1);
  border-color: rgba(255, 107, 107, 0.3);
}

.filler-word {
  color: #ffd93d;
  font-weight: 600;
  font-style: italic;
}

.filler-high .filler-word {
  color: #ff6b6b;
}

.filler-count {
  color: rgba(255, 255, 255, 0.5);
  font-size: 10px;
  background: rgba(255, 255, 255, 0.08);
  padding: 1px 5px;
  border-radius: 8px;
}

.filler-advice {
  color: rgba(255, 255, 255, 0.4);
  margin-left: auto;
  font-size: 10px;
}

.filler-empty {
  font-size: 11px;
  color: rgba(52, 211, 153, 0.7);
  padding: 4px 0;
}

.filler-summary {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.3);
  text-align: right;
}

/* Voice Command Controls */
.voice-command-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.voice-lang-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.form-select-sm {
  flex: 1;
  padding: 5px 8px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  color: #fff;
  font-size: 12px;
  outline: none;
}

.form-select-sm:focus {
  border-color: rgba(22, 93, 255, 0.5);
}

.transcript-preview {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  padding: 6px 10px;
  min-height: 28px;
}

.command-confirmed {
  font-size: 12px;
  color: #34d399;
  background: rgba(52, 211, 153, 0.1);
  border-radius: 6px;
  padding: 6px 10px;
  border: 1px solid rgba(52, 211, 153, 0.2);
}

.voice-commands-help {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  padding: 8px 10px;
}

.help-title {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 4px;
}

.help-cmd {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  font-family: monospace;
}

/* Captions Controls */
.captions-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.captions-preview {
  min-height: 60px;
}

.captions-box {
  background: #1a1a1a;
  border-radius: 8px;
  padding: 8px 12px;
  min-height: 50px;
  font-family: monospace;
  font-size: 13px;
  color: #ccc;
}

.captions-box.visible {
  min-height: 70px;
}

.captions-hint {
  color: #666;
  font-size: 12px;
  text-align: center;
  padding: 8px;
}

.caption-item {
  padding: 3px 0;
  opacity: 0.7;
  font-size: 12px;
}

.caption-item.final {
  opacity: 1;
  color: #fff;
}

/* Read Controls */
.read-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.voice-select-row {
  display: flex;
  gap: 8px;
}

.read-btns {
  display: flex;
  gap: 8px;
}

.filler-alert-enter-active {
  animation: filler-pop 0.25s ease-out;
}

.filler-alert-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.filler-alert-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

@keyframes filler-pop {
  0% { transform: scale(0.9); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

/* Confidence Score */
.confidence-display {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.confidence-score-ring {
  position: relative;
  width: 100px;
  height: 100px;
  flex-shrink: 0;
}

.confidence-ring-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.confidence-ring-bg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.08);
  stroke-width: 8;
}

.confidence-ring-fill {
  fill: none;
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke-dasharray 0.6s ease;
}

.confidence-ring-fill.confidence-high { stroke: #34d399; }
.confidence-ring-fill.confidence-medium { stroke: #ffd93d; }
.confidence-ring-fill.confidence-low { stroke: #ff6b6b; }

.confidence-score-text {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transform: rotate(0deg);
}

.confidence-number {
  font-size: 24px;
  font-weight: 800;
  color: #fff;
  line-height: 1;
}

.confidence-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
}

.confidence-breakdown {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
}

.confidence-factor {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

.factor-name {
  color: rgba(255, 255, 255, 0.5);
  min-width: 60px;
}

.factor-bar-bg {
  flex: 1;
  height: 5px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  overflow: hidden;
}

.factor-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.factor-bar-fill.eye-contact { background: linear-gradient(90deg, #165DFF, #7229ff); }
.factor-bar-fill.pace { background: linear-gradient(90deg, #34d399, #00b8d9); }
.factor-bar-fill.fillers { background: linear-gradient(90deg, #ffd93d, #ff6b6b); }

.factor-value {
  color: rgba(255, 255, 255, 0.6);
  font-size: 10px;
  min-width: 28px;
  text-align: right;
}

/* Delivery Tips */
.delivery-tips {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.delivery-tip-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.4;
}

.delivery-tip-item.success {
  background: rgba(52, 211, 153, 0.1);
  border: 1px solid rgba(52, 211, 153, 0.2);
  color: #34d399;
}

.delivery-tip-item.warning {
  background: rgba(255, 217, 61, 0.1);
  border: 1px solid rgba(255, 217, 61, 0.2);
  color: #ffd93d;
}

.delivery-tip-item.info {
  background: rgba(22, 93, 255, 0.1);
  border: 1px solid rgba(22, 93, 255, 0.2);
  color: #165DFF;
}

.tip-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.tip-text {
  color: rgba(255, 255, 255, 0.8);
}

.tips-empty {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.25);
  text-align: center;
  padding: 12px 0;
}

/* Coach panel transition */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.slide-right-enter-from,
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* Responsive */
@media (max-width: 768px) {
  .coach-panel {
    width: calc(100vw - 32px);
    right: 16px;
    left: 16px;
    top: 60px;
    max-height: calc(100vh - 100px);
  }

  .confidence-display {
    flex-direction: column;
    align-items: center;
  }
}

/* ── Pinch-to-zoom indicator ── */
.pinch-zoom-indicator {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 10000;
  pointer-events: auto;
  backdrop-filter: blur(8px);
}

.pinch-reset-hint {
  font-size: 12px;
  font-weight: 400;
  opacity: 0.7;
  cursor: pointer;
  text-decoration: underline;
}

.pinch-reset-hint:hover {
  opacity: 1;
}

/* Pinch indicator mobile */
@media (max-width: 768px) {
  .pinch-zoom-indicator {
    top: 70px;
    font-size: 13px;
    padding: 6px 14px;
  }
}

/* ── Fade indicator transition ── */
.fade-indicator-enter-active,
.fade-indicator-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-indicator-enter-from,
.fade-indicator-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-8px);
}

/* ── Rehearsal Mode ── */
.rehearsal-active {
  background: rgba(255, 107, 107, 0.3) !important;
  color: #ff6b6b !important;
  animation: pulse-recording 1.5s infinite;
}

@keyframes pulse-recording {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.timing-badge {
  background: rgba(76, 175, 80, 0.25);
  color: #81c784;
  padding: 3px 8px;
  border-radius: 8px;
  font-size: 12px;
}

/* ── Rehearsal Results Panel ── */
.rehearsal-panel {
  position: absolute;
  top: 60px;
  right: 16px;
  width: 300px;
  background: rgba(15, 15, 20, 0.97);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  z-index: 20;
  max-height: 75vh;
  overflow-y: auto;
}

.rehearsal-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  position: sticky;
  top: 0;
  background: rgba(15, 15, 20, 0.98);
  border-radius: 12px 12px 0 0;
}

.rehearsal-content {
  padding: 12px 16px;
}

.rehearsal-summary {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.rehearsal-stat {
  flex: 1;
  text-align: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 8px 4px;
}

.rehearsal-stat .stat-num {
  display: block;
  font-size: 15px;
  font-weight: 700;
  color: #4fc3f7;
}

.rehearsal-stat .stat-label {
  font-size: 10px;
  color: #888;
}

.rehearsal-timing-list {
  max-height: 220px;
  overflow-y: auto;
  margin-bottom: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

.rehearsal-timing-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  font-size: 12px;
}

.rehearsal-timing-item:last-child {
  border-bottom: none;
}

.rt-slide-num {
  color: #666;
  min-width: 24px;
  font-size: 11px;
}

.rt-title {
  flex: 1;
  color: #bbb;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rt-duration {
  color: #4fc3f7;
  font-variant-numeric: tabular-nums;
  font-family: monospace;
  font-size: 12px;
}

.rehearsal-name-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  padding: 6px 10px;
  color: #fff;
  font-size: 12px;
  margin-bottom: 8px;
  box-sizing: border-box;
}

.rehearsal-name-input::placeholder {
  color: #555;
}

.rehearsal-btn-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

/* ── Import Modal ── */
.import-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.import-modal {
  background: #1a1a24;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  width: 380px;
  max-height: 65vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.import-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.import-modal-header button {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
}

.import-modal-content {
  padding: 14px 16px;
  overflow-y: auto;
  flex: 1;
}

.import-section h4 {
  font-size: 11px;
  color: #777;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.import-section + .import-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.saved-rehearsal-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 220px;
  overflow-y: auto;
}

.saved-rehearsal-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 6px;
}

.sr-info {
  flex: 1;
}

.sr-name {
  display: block;
  font-size: 13px;
  color: #fff;
  font-weight: 500;
}

.sr-meta {
  font-size: 11px;
  color: #666;
}

.sr-actions {
  display: flex;
  gap: 4px;
}

.btn-xs {
  padding: 3px 8px;
  font-size: 11px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  background: rgba(76, 175, 80, 0.2);
  color: #81c784;
}

.btn-xs.btn-danger {
  background: rgba(244, 67, 54, 0.2);
  color: #e57373;
}

.import-empty p {
  color: #666;
  font-size: 13px;
  text-align: center;
  padding: 12px 0;
}

.file-import-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #aaa;
  transition: background 0.2s;
}

.file-import-label:hover {
  background: rgba(255, 255, 255, 0.1);
}

.file-import-label input {
  display: none;
}
</style>
