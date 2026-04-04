<template>
  <div v-if="visible" class="coach-overlay" @click.self="$emit('close')">
    <div class="coach-panel">
      <!-- Header -->
      <div class="coach-header">
        <div class="coach-title">
          <span class="coach-icon">🎯</span>
          <h3>AI 演讲教练</h3>
          <span class="coach-badge" v-if="overallScore">评分: {{ overallScore }}/10</span>
        </div>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <!-- Tab Navigation -->
      <div class="coach-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['tab-btn', { active: activeTab === tab.id }]"
          @click="switchTab(tab.id)"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
        </button>
      </div>

      <!-- Tab Content -->
      <div class="coach-content">
        <!-- Loading State -->
        <div v-if="isLoading" class="coach-loading">
          <div class="loading-spinner"></div>
          <p>{{ loadingMessage }}</p>
        </div>

        <!-- Coach Tab: Analyze -->
        <div v-else-if="activeTab === 'analyze'" class="tab-panel">
          <div v-if="!analysisResult" class="coach-start">
            <p class="coach-desc">AI 将分析你的幻灯片，从结构、内容、设计、参与度等维度给出评分和建议</p>
            <button class="btn btn-primary btn-lg" @click="runAnalysis" :disabled="isLoading">
              🔍 开始分析
            </button>
          </div>
          <div v-else class="analysis-result">
            <!-- Overall Scores -->
            <div class="score-cards">
              <div class="score-card">
                <div class="score-circle" :style="{ '--score': analysisResult.overall_score * 10 }">
                  <span class="score-num">{{ analysisResult.overall_score }}</span>
                </div>
                <span class="score-label">综合评分</span>
              </div>
              <div class="score-card small">
                <span class="score-small-num">{{ analysisResult.structure_score || 0 }}</span>
                <span class="score-label">结构</span>
              </div>
              <div class="score-card small">
                <span class="score-small-num">{{ analysisResult.content_score || 0 }}</span>
                <span class="score-label">内容</span>
              </div>
              <div class="score-card small">
                <span class="score-small-num">{{ analysisResult.design_score || 0 }}</span>
                <span class="score-label">设计</span>
              </div>
              <div class="score-card small">
                <span class="score-small-num">{{ analysisResult.engagement_score || 0 }}</span>
                <span class="score-label">参与度</span>
              </div>
            </div>

            <!-- Overall Feedback -->
            <div v-if="analysisResult.overall_feedback" class="feedback-block">
              <h4>📋 整体反馈</h4>
              <p>{{ analysisResult.overall_feedback }}</p>
            </div>

            <!-- Top Improvements -->
            <div v-if="analysisResult.top_3_improvements?.length" class="improvements-block">
              <h4>🚀 重点改进建议</h4>
              <ul>
                <li v-for="(item, idx) in analysisResult.top_3_improvements" :key="idx">
                  {{ item }}
                </li>
              </ul>
            </div>

            <!-- Per-slide Feedback -->
            <div v-if="analysisResult.slide_feedback?.length" class="slide-feedback-list">
              <h4>📑 每页详细反馈</h4>
              <div
                v-for="fb in analysisResult.slide_feedback"
                :key="fb.slide_num"
                class="slide-feedback-item"
              >
                <div class="sf-header">
                  <span class="sf-slide-num">第 {{ fb.slide_num }} 页</span>
                  <button class="btn btn-sm" @click="viewSlide(fb.slide_num)">查看</button>
                </div>
                <div class="sf-body">
                  <div v-if="fb.strengths?.length" class="sf-section strengths">
                    <span class="sf-tag positive">✅ 优点</span>
                    <ul>
                      <li v-for="s in fb.strengths" :key="s">{{ s }}</li>
                    </ul>
                  </div>
                  <div v-if="fb.weaknesses?.length" class="sf-section weaknesses">
                    <span class="sf-tag negative">⚠️ 缺点</span>
                    <ul>
                      <li v-for="w in fb.weaknesses" :key="w">{{ w }}</li>
                    </ul>
                  </div>
                  <div v-if="fb.suggestions?.length" class="sf-section suggestions">
                    <span class="sf-tag suggestion">💡 建议</span>
                    <ul>
                      <li v-for="s in fb.suggestions" :key="s">{{ s }}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <button class="btn btn-outline" @click="runAnalysis" :disabled="isLoading">
              🔄 重新分析
            </button>
          </div>
        </div>

        <!-- Practice Tab -->
        <div v-else-if="activeTab === 'practice'" class="tab-panel">
          <div v-if="!practiceResult" class="coach-start">
            <p class="coach-desc">AI 将根据你的演讲内容生成模拟观众问答，帮你练习演讲和准备回答</p>
            <div class="practice-options">
              <div class="option-row">
                <label>练习难度：</label>
                <div class="difficulty-btns">
                  <button
                    v-for="d in ['easy', 'moderate', 'hard', 'mixed']"
                    :key="d"
                    :class="['diff-btn', { active: selectedDifficulty === d }]"
                    @click="selectedDifficulty = d"
                  >
                    {{ difficultyLabels[d] }}
                  </button>
                </div>
              </div>
              <div class="option-row">
                <label>问题数量：</label>
                <select v-model="questionCount" class="form-select">
                  <option :value="5">5 题（5分钟）</option>
                  <option :value="8">8 题（10分钟）</option>
                  <option :value="10">10 题（15分钟）</option>
                  <option :value="15">15 题（20分钟）</option>
                </select>
              </div>
            </div>
            <button class="btn btn-primary btn-lg" @click="runPractice" :disabled="isLoading">
              🎤 开始练习
            </button>
          </div>
          <div v-else class="practice-result">
            <div class="practice-header">
              <h4>🎤 练习问答</h4>
              <span class="practice-meta">
                {{ practiceResult.total_questions || practiceResult.qa_list?.length || 0 }} 题
                · 约 {{ practiceResult.estimated_minutes || 10 }} 分钟
              </span>
            </div>

            <!-- Q&A List -->
            <div class="qa-list">
              <div
                v-for="(qa, idx) in practiceResult.qa_list"
                :key="idx"
                class="qa-item"
                :class="{ revealed: revealedQuestions.has(idx) }"
              >
                <div class="qa-question" @click="toggleQuestion(idx)">
                  <span class="qa-num">{{ idx + 1 }}.</span>
                  <span class="qa-text">{{ qa.question }}</span>
                  <span class="qa-meta">
                    <span :class="['cat-tag', qa.category]">{{ categoryLabels[qa.category] || qa.category }}</span>
                    <span :class="['diff-tag', qa.difficulty]">{{ difficultyLabels[qa.difficulty] || qa.difficulty }}</span>
                    <span class="qa-ref" v-if="qa.slide_ref">📍 第{{ qa.slide_ref }}页</span>
                  </span>
                </div>
                <div v-if="revealedQuestions.has(idx)" class="qa-answer">
                  <div v-if="qa.suggested_answer" class="answer-main">
                    <strong>建议回答：</strong>{{ qa.suggested_answer }}
                  </div>
                  <div v-if="qa.tips" class="answer-tips">
                    <strong>💡 技巧：</strong>{{ qa.tips }}
                  </div>
                </div>
                <div v-else class="qa-hint" @click="toggleQuestion(idx)">
                  点击查看回答提示
                </div>
              </div>
            </div>

            <div class="practice-actions">
              <button class="btn btn-outline" @click="resetPractice">🔄 重新生成</button>
              <button class="btn btn-primary" @click="startPracticeMode">
                🎯 模拟练习模式
              </button>
            </div>
          </div>
        </div>

        <!-- Timing Tab -->
        <div v-else-if="activeTab === 'timing'" class="tab-panel">
          <div v-if="!timingResult" class="coach-start">
            <p class="coach-desc">根据你的内容长度和总演讲时间，AI 将给出每页的推荐时间分配和节奏建议</p>
            <div class="timing-options">
              <div class="option-row">
                <label>总演讲时间：</label>
                <select v-model.number="totalMinutes" class="form-select">
                  <option :value="5">5 分钟</option>
                  <option :value="10">10 分钟</option>
                  <option :value="15">15 分钟</option>
                  <option :value="20">20 分钟</option>
                  <option :value="30">30 分钟</option>
                  <option :value="45">45 分钟</option>
                  <option :value="60">60 分钟</option>
                </select>
              </div>
            </div>
            <button class="btn btn-primary btn-lg" @click="runTiming" :disabled="isLoading">
              ⏱️ 计算节奏
            </button>
          </div>
          <div v-else class="timing-result">
            <div class="timing-summary">
              <div class="timing-stat">
                <span class="stat-num">{{ timingResult.total_slides }}</span>
                <span class="stat-label">总页数</span>
              </div>
              <div class="timing-stat">
                <span class="stat-num">{{ timingResult.total_minutes }}</span>
                <span class="stat-label">总时间(分钟)</span>
              </div>
              <div class="timing-stat">
                <span class="stat-num">{{ Math.round(timingResult.total_minutes * 60 / timingResult.total_slides) || 0 }}</span>
                <span class="stat-label">平均秒/页</span>
              </div>
            </div>

            <div class="pace-feedback" v-if="timingResult.pace_feedback">
              <span class="pace-icon">{{ getPaceIcon(timingResult.pace_feedback) }}</span>
              {{ timingResult.pace_feedback }}
            </div>

            <!-- Breakdown -->
            <div class="timing-breakdown" v-if="timingResult.breakdown">
              <h4>⏱️ 时间分配</h4>
              <div class="breakdown-bars">
                <div class="breakdown-item">
                  <span class="breakdown-label">开场介绍</span>
                  <div class="breakdown-bar">
                    <div
                      class="breakdown-fill intro"
                      :style="{ width: (timingResult.breakdown.introduction / timingResult.total_minutes * 100) + '%' }"
                    ></div>
                  </div>
                  <span class="breakdown-time">{{ timingResult.breakdown.introduction.toFixed(1) }}分钟</span>
                </div>
                <div class="breakdown-item">
                  <span class="breakdown-label">内容讲解</span>
                  <div class="breakdown-bar">
                    <div
                      class="breakdown-fill content"
                      :style="{ width: (timingResult.breakdown.content / timingResult.total_minutes * 100) + '%' }"
                    ></div>
                  </div>
                  <span class="breakdown-time">{{ timingResult.breakdown.content.toFixed(1) }}分钟</span>
                </div>
                <div class="breakdown-item">
                  <span class="breakdown-label">结尾总结</span>
                  <div class="breakdown-bar">
                    <div
                      class="breakdown-fill conclusion"
                      :style="{ width: (timingResult.breakdown.conclusion / timingResult.total_minutes * 100) + '%' }"
                    ></div>
                  </div>
                  <span class="breakdown-time">{{ timingResult.breakdown.conclusion.toFixed(1) }}分钟</span>
                </div>
              </div>
            </div>

            <!-- Per-slide timing -->
            <div class="per-slide-timing">
              <h4>📄 每页建议时间</h4>
              <div class="timing-list">
                <div
                  v-for="slide in timingResult.per_slide_seconds"
                  :key="slide.slide_num"
                  class="timing-item"
                  @click="viewSlide(slide.slide_num)"
                >
                  <span class="timing-slide-num">第{{ slide.slide_num }}页</span>
                  <span class="timing-slide-title">{{ slide.title || '(无标题)' }}</span>
                  <div class="timing-bar-container">
                    <div
                      class="timing-bar-fill"
                      :style="{
                        width: Math.min(100, (slide.suggested_seconds / 180) * 100) + '%',
                        background: getTimingColor(slide.suggested_seconds)
                      }"
                    ></div>
                  </div>
                  <span class="timing-seconds">{{ slide.suggested_seconds }}秒</span>
                </div>
              </div>
            </div>

            <!-- Pause Points -->
            <div class="pause-points" v-if="timingResult.pause_points?.length">
              <h4>⏸️ 推荐暂停点</h4>
              <p class="pause-desc">在这些页面之间适合停顿，让观众消化内容</p>
              <div class="pause-tags">
                <span
                  v-for="point in timingResult.pause_points"
                  :key="point"
                  class="pause-tag"
                >
                  第 {{ point }} 页后
                </span>
              </div>
            </div>

            <!-- Tips -->
            <div class="timing-tips" v-if="timingResult.tips?.length">
              <h4>💡 节奏建议</h4>
              <ul>
                <li v-for="(tip, idx) in timingResult.tips" :key="idx">{{ tip }}</li>
              </ul>
            </div>

            <div class="timing-apply-row">
              <button class="btn btn-primary" @click="emit('applyTiming', timingResult)">
                ⏱ 应用此节奏自动播放
              </button>
              <button class="btn btn-outline" @click="runTiming" :disabled="isLoading">
                🔄 重新计算
              </button>
            </div>
          </div>
        </div>

        <!-- Delivery Tips Tab -->
        <div v-else-if="activeTab === 'delivery'" class="tab-panel">
          <div v-if="!deliveryResult" class="coach-start">
            <p class="coach-desc">AI 将分析每页内容，给出强调要点、语音技巧、肢体语言建议，以及每页的过渡语</p>
            <button class="btn btn-primary btn-lg" @click="runDelivery" :disabled="isLoading">
              🎙️ 生成演讲技巧
            </button>
          </div>
          <div v-else class="delivery-result">
            <!-- General Tips -->
            <div class="general-tips" v-if="deliveryResult.general_tips?.length">
              <h4>🎯 通用演讲技巧</h4>
              <ul>
                <li v-for="(tip, idx) in deliveryResult.general_tips" :key="idx">{{ tip }}</li>
              </ul>
            </div>

            <!-- Per-slide Tips -->
            <div class="delivery-tips-list">
              <h4>📄 每页演讲技巧</h4>
              <div
                v-for="tip in deliveryResult.tips"
                :key="tip.slide_num"
                class="delivery-tip-item"
              >
                <div class="dt-header" @click="viewSlide(tip.slide_num)">
                  <span class="dt-slide-num">第 {{ tip.slide_num }} 页</span>
                  <span class="dt-key-message">{{ tip.key_message || '(无核心信息)' }}</span>
                </div>
                <div class="dt-body">
                  <div v-if="tip.emphasis_points?.length" class="dt-section">
                    <span class="dt-tag">🔑 强调</span>
                    <div class="emphasis-points">
                      <span
                        v-for="ep in tip.emphasis_points"
                        :key="ep"
                        class="emphasis-chip"
                      >{{ ep }}</span>
                    </div>
                  </div>
                  <div v-if="tip.voice_tips" class="dt-section">
                    <span class="dt-tag">🎵 语音</span>
                    <span>{{ tip.voice_tips }}</span>
                  </div>
                  <div v-if="tip.body_language" class="dt-section">
                    <span class="dt-tag">🧍 肢体</span>
                    <span>{{ tip.body_language }}</span>
                  </div>
                  <div v-if="tip.transition_phrase" class="dt-section transition">
                    <span class="dt-tag">➡️ 过渡</span>
                    <span class="transition-text">"{{ tip.transition_phrase }}"</span>
                  </div>
                </div>
              </div>
            </div>

            <button class="btn btn-outline" @click="runDelivery" :disabled="isLoading">
              🔄 重新生成
            </button>
          </div>
        </div>

        <!-- Audience Prediction Tab -->
        <div v-else-if="activeTab === 'audience'" class="tab-panel">
          <div v-if="!audienceResult" class="coach-start">
            <p class="coach-desc">AI 将预测观众可能提出的问题，帮助你提前准备回答，增加演讲信心</p>
            <div class="audience-options">
              <div class="option-row">
                <label>观众画像：</label>
                <select v-model="audienceProfile" class="form-select">
                  <option value="">一般商务人士</option>
                  <option value="技术高管">技术高管 / CTO</option>
                  <option value="投资者">投资者 / 股东</option>
                  <option value="大学生">大学生 / 学术</option>
                  <option value="客户">潜在客户</option>
                  <option value="团队成员">团队成员 / 同事</option>
                  <option value="媒体">媒体 / 记者</option>
                </select>
              </div>
            </div>
            <button class="btn btn-primary btn-lg" @click="runAudience" :disabled="isLoading">
              👥 预测观众问题
            </button>
          </div>
          <div v-else class="audience-result">
            <!-- Audience Profile -->
            <div class="audience-header">
              <span class="audience-badge">
                👥 目标观众: {{ audienceResult.audience_profile || '一般商务人士' }}
              </span>
            </div>

            <!-- Must Prepare -->
            <div class="must-prepare" v-if="audienceResult.must_prepare?.length">
              <h4>🔥 必须准备的问题</h4>
              <div class="must-prepare-list">
                <div
                  v-for="(q, idx) in audienceResult.must_prepare"
                  :key="idx"
                  class="must-prepare-item"
                >
                  {{ idx + 1 }}. {{ q }}
                </div>
              </div>
            </div>

            <!-- Hardest Question -->
            <div class="hardest-question" v-if="audienceResult.hardest_question">
              <h4>💪 最难回答的问题</h4>
              <div class="hardest-item">
                <div class="hq-question">❓ {{ audienceResult.hardest_question.question }}</div>
                <div class="hq-why" v-if="audienceResult.hardest_question.why_hard">
                  <strong>为什么难：</strong>{{ audienceResult.hardest_question.why_hard }}
                </div>
                <div class="hq-strategy" v-if="audienceResult.hardest_question.strategy">
                  <strong>应对策略：</strong>{{ audienceResult.hardest_question.strategy }}
                </div>
              </div>
            </div>

            <!-- All Questions -->
            <div class="audience-questions-list">
              <h4>📋 预测的问题（共 {{ audienceResult.questions?.length || 0 }} 个）</h4>
              <div
                v-for="(q, idx) in audienceResult.questions"
                :key="idx"
                class="audience-question-item"
                :class="{ revealed: revealedAudQuestions.has(idx) }"
              >
                <div class="aq-question" @click="toggleAudQuestion(idx)">
                  <span class="aq-num">{{ idx + 1 }}.</span>
                  <span class="aq-text">{{ q.question }}</span>
                  <div class="aq-meta">
                    <span :class="['cat-tag', q.category]">{{ categoryLabels[q.category] || q.category }}</span>
                    <span :class="['diff-tag', q.difficulty]">{{ difficultyLabels[q.difficulty] || q.difficulty }}</span>
                    <span class="aq-ref" v-if="q.slide_ref">📍 第{{ q.slide_ref }}页</span>
                  </div>
                </div>
                <div v-if="revealedAudQuestions.has(idx)" class="aq-answer">
                  <div v-if="q.why_likely" class="aq-why">
                    <strong>为什么问：</strong>{{ q.why_likely }}
                  </div>
                  <div v-if="q.suggested_answer" class="aq-answer-text">
                    <strong>建议回答：</strong>{{ q.suggested_answer }}
                  </div>
                  <div v-if="q.preparation_tip" class="aq-tip">
                    <strong>💡 准备建议：</strong>{{ q.preparation_tip }}
                  </div>
                </div>
                <div v-else class="aq-hint" @click="toggleAudQuestion(idx)">
                  点击查看回答提示
                </div>
              </div>
            </div>

            <button class="btn btn-outline" @click="resetAudience" :disabled="isLoading">
              🔄 重新预测
            </button>
          </div>
        </div>

        <!-- R127: Speaking Pace Tab -->
        <div v-else-if="activeTab === 'pace'" class="tab-panel">
          <div v-if="!paceResult" class="coach-start">
            <p class="coach-desc">AI 将分析你的演讲语速，给出 WPM 评分和改进建议，帮助你找到最佳节奏</p>
            <div class="timing-options">
              <div class="option-row">
                <label>总演讲时间：</label>
                <select v-model.number="paceMinutes" class="form-select">
                  <option :value="5">5 分钟</option>
                  <option :value="10">10 分钟</option>
                  <option :value="15">15 分钟</option>
                  <option :value="20">20 分钟</option>
                  <option :value="30">30 分钟</option>
                </select>
              </div>
            </div>
            <button class="btn btn-primary btn-lg" @click="runPace" :disabled="isLoading">
              🎯 分析语速
            </button>
          </div>
          <div v-else class="pace-result">
            <div class="pace-header">
              <div class="pace-wpm-display">
                <span class="pace-wpm-num">{{ paceResult.wpm }}</span>
                <span class="pace-wpm-label">WPM</span>
              </div>
              <div class="pace-category">
                <span class="pace-icon">{{ paceResult.pace_icon }}</span>
                <span class="pace-cat-text">{{ paceResult.pace_category }}</span>
              </div>
            </div>
            <div class="pace-feedback" v-if="paceResult.pace_feedback">
              <p>{{ paceResult.pace_feedback }}</p>
            </div>
            <div class="pace-stats">
              <div class="pace-stat">
                <span class="stat-num">{{ paceResult.total_words }}</span>
                <span class="stat-label">总字数</span>
              </div>
              <div class="pace-stat">
                <span class="stat-num">{{ paceResult.total_minutes }}</span>
                <span class="stat-label">总时间(分钟)</span>
              </div>
              <div class="pace-stat">
                <span class="stat-num">{{ paceResult.suggested_pauses }}</span>
                <span class="stat-label">建议停顿</span>
              </div>
            </div>
            <div class="pace-wpm-bar">
              <div class="wpm-bar-track">
                <div class="wpm-bar-fill slow" :style="{ width: Math.min(33, (paceResult.wpm / 200) * 100) + '%' }"></div>
                <div class="wpm-bar-fill optimal" :style="{ width: Math.min(33, Math.max(0, (paceResult.wpm - 80) / 70) * 100) + '%' }"></div>
                <div class="wpm-bar-fill fast" :style="{ width: Math.min(34, Math.max(0, (paceResult.wpm - 150) / 80) * 100) + '%' }"></div>
              </div>
              <div class="wpm-bar-labels">
                <span>慢 (&lt;80)</span>
                <span class="optimal-label">适中 (80-150)</span>
                <span>快 (&gt;150)</span>
              </div>
            </div>
            <div class="pace-tips" v-if="paceResult.tips && paceResult.tips.length">
              <h4>💡 改善建议</h4>
              <ul>
                <li v-for="(tip, idx) in paceResult.tips" :key="idx">{{ tip }}</li>
              </ul>
            </div>
            <div class="per-slide-pace" v-if="paceResult.per_slide_pace && paceResult.per_slide_pace.length">
              <h4>📄 每页语速建议</h4>
              <div class="pace-list">
                <div v-for="slide in paceResult.per_slide_pace" :key="slide.slide_num" class="pace-item" @click="viewSlide(slide.slide_num)">
                  <span class="pace-slide-num">第{{ slide.slide_num }}页</span>
                  <span class="pace-slide-title">{{ slide.title || '(无标题)' }}</span>
                  <span class="pace-slide-words">{{ slide.estimated_words }}字</span>
                  <span class="pace-slide-sec">{{ slide.suggested_seconds }}秒</span>
                </div>
              </div>
            </div>
            <button class="btn btn-outline" @click="paceResult = null" :disabled="isLoading">
              🔄 重新分析
            </button>
          </div>
        </div>

        <!-- R127: Content Score Tab -->
        <div v-else-if="activeTab === 'content'" class="tab-panel">
          <div v-if="!contentResult" class="coach-start">
            <p class="coach-desc">AI 将从清晰度、简洁度、影响力三个维度评估内容质量，给出针对性改进建议</p>
            <button class="btn btn-primary btn-lg" @click="runContent" :disabled="isLoading">
              📝 开始内容评分
            </button>
          </div>
          <div v-else class="content-result">
            <div class="score-cards">
              <div class="score-card small">
                <span class="score-small-num">{{ contentResult.clarity_score || 0 }}</span>
                <span class="score-label">清晰度</span>
              </div>
              <div class="score-card small">
                <span class="score-small-num">{{ contentResult.conciseness_score || 0 }}</span>
                <span class="score-label">简洁度</span>
              </div>
              <div class="score-card small">
                <span class="score-small-num">{{ contentResult.impact_score || 0 }}</span>
                <span class="score-label">影响力</span>
              </div>
              <div class="score-card small highlight">
                <span class="score-small-num">{{ contentResult.overall_content_score || 0 }}</span>
                <span class="score-label">综合评分</span>
              </div>
            </div>
            <div class="content-analyses">
              <div class="analysis-item" v-if="contentResult.clarity_analysis">
                <h4>🔍 清晰度分析</h4>
                <p>{{ contentResult.clarity_analysis }}</p>
              </div>
              <div class="analysis-item" v-if="contentResult.conciseness_analysis">
                <h4>✂️ 简洁度分析</h4>
                <p>{{ contentResult.conciseness_analysis }}</p>
              </div>
              <div class="analysis-item" v-if="contentResult.impact_analysis">
                <h4>⚡ 影响力分析</h4>
                <p>{{ contentResult.impact_analysis }}</p>
              </div>
            </div>
            <div class="improvements-block" v-if="contentResult.top_content_improvements && contentResult.top_content_improvements.length">
              <h4>🚀 内容改进建议</h4>
              <ul>
                <li v-for="(imp, idx) in contentResult.top_content_improvements" :key="idx">{{ imp }}</li>
              </ul>
            </div>
            <div class="per-slide-content" v-if="contentResult.per_slide_scores && contentResult.per_slide_scores.length">
              <h4>📄 每页内容评分</h4>
              <div class="content-slide-list">
                <div v-for="slide in contentResult.per_slide_scores" :key="slide.slide_num" class="content-slide-item" @click="viewSlide(slide.slide_num)">
                  <span class="cs-slide-num">第{{ slide.slide_num }}页</span>
                  <div class="cs-scores">
                    <span class="cs-score" title="清晰度">{{ slide.clarity }}</span>
                    <span class="cs-score" title="简洁度">{{ slide.conciseness }}</span>
                    <span class="cs-score" title="影响力">{{ slide.impact }}</span>
                  </div>
                  <span class="cs-verdict">{{ slide.verdict }}</span>
                </div>
              </div>
            </div>
            <button class="btn btn-outline" @click="runContent" :disabled="isLoading">
              🔄 重新分析
            </button>
          </div>
        </div>

        <!-- R127: Visual Design Tab -->
        <div v-else-if="activeTab === 'design'" class="tab-panel">
          <div v-if="!designResult" class="coach-start">
            <p class="coach-desc">AI 将从布局、配色、字体、留白等维度评价幻灯片的视觉设计质量</p>
            <button class="btn btn-primary btn-lg" @click="runDesign" :disabled="isLoading">
              🎨 分析视觉设计
            </button>
          </div>
          <div v-else class="design-result">
            <div class="design-scores">
              <div class="ds-item">
                <span class="ds-score">{{ designResult.layout_score || 0 }}</span>
                <span class="ds-label">布局</span>
              </div>
              <div class="ds-item">
                <span class="ds-score">{{ designResult.color_score || 0 }}</span>
                <span class="ds-label">配色</span>
              </div>
              <div class="ds-item">
                <span class="ds-score">{{ designResult.typography_score || 0 }}</span>
                <span class="ds-label">字体</span>
              </div>
              <div class="ds-item">
                <span class="ds-score">{{ designResult.whitespace_score || 0 }}</span>
                <span class="ds-label">留白</span>
              </div>
              <div class="ds-item">
                <span class="ds-score">{{ designResult.consistency_score || 0 }}</span>
                <span class="ds-label">一致</span>
              </div>
              <div class="ds-item highlight">
                <span class="ds-score">{{ designResult.overall_design_score || 0 }}</span>
                <span class="ds-label">综合</span>
              </div>
            </div>
            <div class="design-analyses">
              <p v-if="designResult.layout_analysis"><strong>布局：</strong>{{ designResult.layout_analysis }}</p>
              <p v-if="designResult.color_analysis"><strong>配色：</strong>{{ designResult.color_analysis }}</p>
              <p v-if="designResult.typography_analysis"><strong>字体：</strong>{{ designResult.typography_analysis }}</p>
            </div>
            <div class="design-strengths" v-if="designResult.design_strengths && designResult.design_strengths.length">
              <h4>✨ 设计优点</h4>
              <ul>
                <li v-for="(s, idx) in designResult.design_strengths" :key="idx">{{ s }}</li>
              </ul>
            </div>
            <div class="improvements-block" v-if="designResult.top_3_design_improvements && designResult.top_3_design_improvements.length">
              <h4>🚀 视觉改进建议</h4>
              <ul>
                <li v-for="(imp, idx) in designResult.top_3_design_improvements" :key="idx">{{ imp }}</li>
              </ul>
            </div>
            <div class="per-slide-design" v-if="designResult.per_slide_feedback && designResult.per_slide_feedback.length">
              <h4>📄 每页设计反馈</h4>
              <div v-for="slide in designResult.per_slide_feedback" :key="slide.slide_num" class="design-slide-item">
                <div class="dsi-header" @click="viewSlide(slide.slide_num)">
                  <span class="dsi-num">第{{ slide.slide_num }}页</span>
                  <span class="dsi-scores">布局{{ slide.layout_score }} 配色{{ slide.color_score }} 字体{{ slide.typography_score }}</span>
                </div>
                <div class="dsi-issues" v-if="slide.issues && slide.issues.length">
                  <span class="dsi-tag">问题：</span>{{ slide.issues.join(', ') }}
                </div>
              </div>
            </div>
            <button class="btn btn-outline" @click="runDesign" :disabled="isLoading">
              🔄 重新分析
            </button>
          </div>
        </div>

        <!-- R127: Engagement Prediction Tab -->
        <div v-else-if="activeTab === 'engagement'" class="tab-panel">
          <div v-if="!engagementResult" class="coach-start">
            <p class="coach-desc">AI 将预测观众在各阶段的注意力变化和情感反应，帮你提前做好应对准备</p>
            <div class="audience-options">
              <div class="option-row">
                <label>观众画像：</label>
                <select v-model="engagementProfile" class="form-select">
                  <option value="">一般商务人士</option>
                  <option value="技术高管">技术高管 / CTO</option>
                  <option value="投资者">投资者 / 股东</option>
                  <option value="大学生">大学生 / 学术</option>
                  <option value="客户">潜在客户</option>
                </select>
              </div>
            </div>
            <button class="btn btn-primary btn-lg" @click="runEngagement" :disabled="isLoading">
              🔥 预测参与度
            </button>
          </div>
          <div v-else class="engagement-result">
            <div class="engagement-header">
              <div class="eng-score">
                <span class="eng-score-num">{{ engagementResult.predicted_attention_score || 0 }}</span>
                <span class="eng-score-label">注意力评分</span>
              </div>
              <div class="eng-score">
                <span class="eng-score-num">{{ engagementResult.predicted_engagement_score || 0 }}</span>
                <span class="eng-score-label">参与度评分</span>
              </div>
            </div>
            <div class="engagement-prediction" v-if="engagementResult.overall_prediction">
              <p>{{ engagementResult.overall_prediction }}</p>
            </div>
            <div class="emotion-curve" v-if="engagementResult.predicted_emotion_curve && engagementResult.predicted_emotion_curve.length">
              <h4>📈 情感变化曲线</h4>
              <div v-for="(phase, idx) in engagementResult.predicted_emotion_curve" :key="idx" class="emotion-phase">
                <span class="ep-range">{{ phase.slide_range }}</span>
                <span class="ep-phase">{{ phase.phase }}</span>
                <span class="ep-emotion">{{ phase.predicted_emotion }}</span>
              </div>
            </div>
            <div class="engagement-moments">
              <div class="eng-moment best" v-if="engagementResult.most_engaging_moment">
                <h4>🔥 最吸引观众的时刻</h4>
                <p>第{{ engagementResult.most_engaging_moment.slide_num }}页：{{ engagementResult.most_engaging_moment.reason }}</p>
              </div>
              <div class="eng-moment worst" v-if="engagementResult.least_engaging_moment">
                <h4>💤 观众最易走神的时刻</h4>
                <p>第{{ engagementResult.least_engaging_moment.slide_num }}页：{{ engagementResult.least_engaging_moment.reason }}</p>
              </div>
            </div>
            <div class="emotional-peaks" v-if="engagementResult.emotional_peaks && engagementResult.emotional_peaks.length">
              <h4>⚡ 情感高峰</h4>
              <div v-for="(peak, idx) in engagementResult.emotional_peaks" :key="idx" class="peak-item">
                第{{ peak.slide_num }}页 - {{ peak.emotion }}：{{ peak.trigger }}
              </div>
            </div>
            <div class="fatigue-risks" v-if="engagementResult.fatigue_risks && engagementResult.fatigue_risks.length">
              <h4>⚠️ 疲劳风险</h4>
              <div v-for="(risk, idx) in engagementResult.fatigue_risks" :key="idx" class="risk-item">
                {{ risk.slide_range }}：{{ risk.reason }}
              </div>
            </div>
            <div class="engagement-tips" v-if="engagementResult.engagement_tips && engagementResult.engagement_tips.length">
              <h4>💡 提升参与度建议</h4>
              <ul>
                <li v-for="(tip, idx) in engagementResult.engagement_tips" :key="idx">{{ tip }}</li>
              </ul>
            </div>
            <button class="btn btn-outline" @click="runEngagement" :disabled="isLoading">
              🔄 重新预测
            </button>
          </div>
        </div>

        <!-- R127: Personalized Coaching Tab -->
        <div v-else-if="activeTab === 'personalized'" class="tab-panel">
          <div v-if="!personalizedResult" class="coach-start">
            <p class="coach-desc">基于你过去的演讲记录，AI 将提供个性化的改进建议和 coaching 重点</p>
            <button class="btn btn-primary btn-lg" @click="runPersonalized" :disabled="isLoading">
              ⭐ 开始个性化教练
            </button>
          </div>
          <div v-else class="personalized-result">
            <div class="personalized-header">
              <span class="ph-badge">⭐ 个性化教练</span>
              <span class="ph-sessions" v-if="personalizedResult.total_past_sessions > 0">
                基于 {{ personalizedResult.total_past_sessions }} 次历史演讲
              </span>
              <span class="ph-sessions" v-else>
                暂无历史记录，这是你的第一次
              </span>
            </div>
            <div class="improvement-trends" v-if="personalizedResult.improvement_trends && personalizedResult.improvement_trends.length">
              <div v-for="(trend, idx) in personalizedResult.improvement_trends" :key="idx" class="trend-item">
                {{ trend }}
              </div>
            </div>
            <div class="coaching-focus" v-if="personalizedResult.coaching_focus">
              <h4>🎯 本次教练重点</h4>
              <p>{{ personalizedResult.coaching_focus }}</p>
            </div>
            <div class="personalized-tips" v-if="personalizedResult.personalized_tips && personalizedResult.personalized_tips.length">
              <h4>💡 个性化建议</h4>
              <div v-for="(tip, idx) in personalizedResult.personalized_tips" :key="idx" class="personalized-tip-item">
                <span class="pt-category">{{ tip.category }}</span>
                <span class="pt-tip">{{ tip.tip }}</span>
                <span class="pt-reason">{{ tip.reason }}</span>
              </div>
            </div>
            <div class="improvement-priority" v-if="personalizedResult.improvement_priority && personalizedResult.improvement_priority.length">
              <h4>🚀 优先改进项</h4>
              <ol>
                <li v-for="(item, idx) in personalizedResult.improvement_priority" :key="idx">{{ item }}</li>
              </ol>
            </div>
            <div class="confidence-boost" v-if="personalizedResult.confidence_boost">
              <div class="confidence-item">💪 {{ personalizedResult.confidence_boost }}</div>
            </div>
            <div class="common-past-issues" v-if="personalizedResult.common_past_issues && personalizedResult.common_past_issues.length && personalizedResult.total_past_sessions > 0">
              <h4>📋 历史常见问题</h4>
              <div class="past-issues-list">
                <span v-for="(issue, idx) in personalizedResult.common_past_issues" :key="idx" class="past-issue-tag">{{ issue }}</span>
              </div>
            </div>
            <div class="historical-summary" v-if="personalizedResult.historical_summary">
              <p>{{ personalizedResult.historical_summary }}</p>
            </div>
            <button class="btn btn-outline" @click="runPersonalized" :disabled="isLoading">
              🔄 重新生成
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { api } from '../api/client'

const props = defineProps<{
  visible: boolean
  taskId: string
  slides: Array<{
    title: string
    content: string
    layout?: string
    presenterNotes?: string
  }>
}>()

const emit = defineEmits(['close', 'viewSlide', 'applyTiming'])

// Tabs
const tabs = [
  { id: 'analyze', label: '分析反馈', icon: '🔍' },
  { id: 'practice', label: '练习模式', icon: '🎤' },
  { id: 'timing', label: '时间节奏', icon: '⏱️' },
  { id: 'delivery', label: '演讲技巧', icon: '🎙️' },
  { id: 'audience', label: '观众预测', icon: '👥' },
  { id: 'pace', label: '语速教练', icon: '🎯' },
  { id: 'content', label: '内容评分', icon: '📝' },
  { id: 'design', label: '视觉设计', icon: '🎨' },
  { id: 'engagement', label: '参与度预测', icon: '🔥' },
  { id: 'personalized', label: '个性化', icon: '⭐' },
]

const activeTab = ref('analyze')
const isLoading = ref(false)
const loadingMessage = ref('分析中...')

// Analysis
const analysisResult = ref<any>(null)
const overallScore = computed(() => analysisResult.value?.overall_score)

// Practice
const practiceResult = ref<any>(null)
const selectedDifficulty = ref('mixed')
const questionCount = ref(10)
const revealedQuestions = ref(new Set<number>())

// Timing
const timingResult = ref<any>(null)
const totalMinutes = ref(15)

// Delivery
const deliveryResult = ref<any>(null)

// Audience
const audienceResult = ref<any>(null)
const audienceProfile = ref('')
const revealedAudQuestions = ref(new Set<number>())

// R127: Speaking Pace (Delivery Coach)
const paceResult = ref<any>(null)
const paceMinutes = ref(15)

// R127: Content Dimensions (Content Score)
const contentResult = ref<any>(null)

// R127: Visual Design Feedback
const designResult = ref<any>(null)

// R127: Audience Engagement Prediction
const engagementResult = ref<any>(null)
const engagementProfile = ref('')

// R127: Personalized Coaching
const personalizedResult = ref<any>(null)

// Labels
const difficultyLabels: Record<string, string> = {
  easy: '简单',
  moderate: '中等',
  hard: '困难',
  mixed: '混合'
}

const categoryLabels: Record<string, string> = {
  clarification: '澄清',
  challenge: '质疑',
  suggestion: '建议',
  deep_dive: '深入',
  technical: '技术',
  commercial: '商务'
}

// Methods
function switchTab(tabId: string) {
  activeTab.value = tabId
}

async function runAnalysis() {
  isLoading.value = true
  loadingMessage.value = 'AI 正在分析幻灯片...'
  analysisResult.value = null
  try {
    const res = await api.post('/ppt/coach/analyze', {
      task_id: props.taskId,
      slides: props.slides
    })
    if (res.data.success) {
      analysisResult.value = res.data.analysis
    } else {
      alert(res.data.error || '分析失败')
    }
  } catch (e: any) {
    alert('分析失败: ' + (e.message || '请重试'))
  } finally {
    isLoading.value = false
  }
}

async function runPractice() {
  isLoading.value = true
  loadingMessage.value = 'AI 正在生成练习问答...'
  practiceResult.value = null
  revealedQuestions.value.clear()
  try {
    const res = await api.post('/ppt/coach/practice', {
      task_id: props.taskId,
      slides: props.slides,
      difficulty: selectedDifficulty.value,
      count: questionCount.value
    })
    if (res.data.success) {
      practiceResult.value = res.data
    } else {
      alert(res.data.error || '生成失败')
    }
  } catch (e: any) {
    alert('生成失败: ' + (e.message || '请重试'))
  } finally {
    isLoading.value = false
  }
}

function resetPractice() {
  practiceResult.value = null
  revealedQuestions.value.clear()
}

async function runTiming() {
  isLoading.value = true
  loadingMessage.value = '计算时间分配...'
  timingResult.value = null
  try {
    const res = await api.post('/ppt/coach/timing', {
      task_id: props.taskId,
      slides: props.slides,
      total_minutes: totalMinutes.value
    })
    if (res.data.success) {
      timingResult.value = res.data
    } else {
      alert(res.data.error || '计算失败')
    }
  } catch (e: any) {
    alert('计算失败: ' + (e.message || '请重试'))
  } finally {
    isLoading.value = false
  }
}

async function runDelivery() {
  isLoading.value = true
  loadingMessage.value = 'AI 正在生成演讲技巧...'
  deliveryResult.value = null
  try {
    const res = await api.post('/ppt/coach/delivery', {
      task_id: props.taskId,
      slides: props.slides
    })
    if (res.data.success) {
      deliveryResult.value = res.data
    } else {
      alert(res.data.error || '生成失败')
    }
  } catch (e: any) {
    alert('生成失败: ' + (e.message || '请重试'))
  } finally {
    isLoading.value = false
  }
}

async function runAudience() {
  isLoading.value = true
  loadingMessage.value = 'AI 正在预测观众问题...'
  audienceResult.value = null
  revealedAudQuestions.value.clear()
  try {
    const res = await api.post('/ppt/coach/audience', {
      task_id: props.taskId,
      slides: props.slides,
      audience_profile: audienceProfile.value
    })
    if (res.data.success) {
      audienceResult.value = res.data
    } else {
      alert(res.data.error || '预测失败')
    }
  } catch (e: any) {
    alert('预测失败: ' + (e.message || '请重试'))
  } finally {
    isLoading.value = false
  }
}

function resetAudience() {
  audienceResult.value = null
  revealedAudQuestions.value.clear()
}

function toggleQuestion(idx: number) {
  if (revealedQuestions.value.has(idx)) {
    revealedQuestions.value.delete(idx)
  } else {
    revealedQuestions.value.add(idx)
  }
}

function toggleAudQuestion(idx: number) {
  if (revealedAudQuestions.value.has(idx)) {
    revealedAudQuestions.value.delete(idx)
  } else {
    revealedAudQuestions.value.add(idx)
  }
}

function viewSlide(slideNum: number) {
  emit('viewSlide', slideNum)
}

function startPracticeMode() {
  // Switch to practice tab with first question revealed
  if (practiceResult.value?.qa_list?.length) {
    revealedQuestions.value.add(0)
  }
}

// Helpers
function getPaceIcon(feedback: string): string {
  if (feedback.includes('快')) return '🏃'
  if (feedback.includes('慢')) return '🐢'
  return '✅'
}

function getTimingColor(seconds: number): string {
  if (seconds < 30) return '#34C759'
  if (seconds < 60) return '#007AFF'
  if (seconds < 90) return '#FF9500'
  return '#FF3B30'
}


// R127: Speaking Pace - Delivery Coach
async function runPace() {
  isLoading.value = true
  loadingMessage.value = 'AI 正在分析语速...'
  paceResult.value = null
  try {
    const res = await api.post('/ppt/coach/speaking-pace', {
      task_id: props.taskId,
      slides: props.slides,
      total_minutes: paceMinutes.value
    })
    if (res.data.success) {
      paceResult.value = res.data
    } else {
      alert(res.data.error || '分析失败')
    }
  } catch (e: any) {
    alert('分析失败: ' + (e.message || '请重试'))
  } finally {
    isLoading.value = false
  }
}

// R127: Content Dimensions - Content Score
async function runContent() {
  isLoading.value = true
  loadingMessage.value = 'AI 正在分析内容质量...'
  contentResult.value = null
  try {
    const res = await api.post('/ppt/coach/content-dimensions', {
      task_id: props.taskId,
      slides: props.slides
    })
    if (res.data.success) {
      contentResult.value = res.data
    } else {
      alert(res.data.error || '分析失败')
    }
  } catch (e: any) {
    alert('分析失败: ' + (e.message || '请重试'))
  } finally {
    isLoading.value = false
  }
}

// R127: Visual Design Feedback
async function runDesign() {
  isLoading.value = true
  loadingMessage.value = 'AI 正在分析视觉设计...'
  designResult.value = null
  try {
    const res = await api.post('/ppt/coach/visual-design', {
      task_id: props.taskId,
      slides: props.slides
    })
    if (res.data.success) {
      designResult.value = res.data
    } else {
      alert(res.data.error || '分析失败')
    }
  } catch (e: any) {
    alert('分析失败: ' + (e.message || '请重试'))
  } finally {
    isLoading.value = false
  }
}

// R127: Audience Engagement Prediction
async function runEngagement() {
  isLoading.value = true
  loadingMessage.value = 'AI 正在预测观众参与度...'
  engagementResult.value = null
  try {
    const res = await api.post('/ppt/coach/engagement', {
      task_id: props.taskId,
      slides: props.slides,
      audience_profile: engagementProfile.value
    })
    if (res.data.success) {
      engagementResult.value = res.data
    } else {
      alert(res.data.error || '预测失败')
    }
  } catch (e: any) {
    alert('预测失败: ' + (e.message || '请重试'))
  } finally {
    isLoading.value = false
  }
}

// R127: Personalized Coaching
async function runPersonalized() {
  isLoading.value = true
  loadingMessage.value = 'AI 正在生成个性化建议...'
  personalizedResult.value = null
  try {
    const res = await api.post('/ppt/coach/personalized', {
      task_id: props.taskId,
      slides: props.slides,
      user_id: 'default'
    })
    if (res.data.success) {
      personalizedResult.value = res.data
    } else {
      alert(res.data.error || '生成失败')
    }
  } catch (e: any) {
    alert('生成失败: ' + (e.message || '请重试'))
  } finally {
    isLoading.value = false
  }
}

// Reset when panel opens with new task
watch(() => props.visible, (visible) => {
  if (visible) {
    // Keep existing results when reopening same panel
  }
})
</script>

<style scoped>
.coach-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.coach-panel {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 720px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.coach-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e5e5;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.coach-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.coach-title h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.coach-icon {
  font-size: 24px;
}

.coach-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.coach-tabs {
  display: flex;
  border-bottom: 1px solid #e5e5e5;
  background: #f9f9f9;
  overflow-x: auto;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #333;
  background: #f0f0f0;
}

.tab-btn.active {
  color: #667eea;
  border-bottom-color: #667eea;
  background: white;
}

.tab-icon {
  font-size: 16px;
}

.coach-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.coach-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e5e5;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.coach-start {
  text-align: center;
  padding: 20px;
}

.coach-desc {
  color: #666;
  margin-bottom: 24px;
  line-height: 1.6;
  font-size: 14px;
}

.coach-start .btn-lg {
  padding: 12px 32px;
  font-size: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
}

.coach-start .btn-lg:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Score Cards */
.score-cards {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.score-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.score-card.small {
  background: #f5f5f5;
  padding: 12px 16px;
  border-radius: 12px;
}

.score-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: conic-gradient(
    #667eea calc(var(--score) * 1%),
    #e5e5e5 calc(var(--score) * 1%)
  );
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.score-circle::before {
  content: '';
  position: absolute;
  width: 64px;
  height: 64px;
  background: white;
  border-radius: 50%;
}

.score-num {
  position: relative;
  font-size: 28px;
  font-weight: 700;
  color: #667eea;
}

.score-small-num {
  font-size: 24px;
  font-weight: 700;
  color: #667eea;
}

.score-label {
  font-size: 11px;
  color: #888;
}

/* Feedback Blocks */
.feedback-block,
.improvements-block,
.general-tips,
.timing-tips {
  background: #f9f9f9;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.feedback-block h4,
.improvements-block h4,
.general-tips h4,
.timing-tips h4 {
  margin: 0 0 10px;
  font-size: 14px;
  color: #333;
}

.improvements-block ul,
.general-tips ul,
.timing-tips ul {
  margin: 0;
  padding-left: 20px;
}

.improvements-block li,
.general-tips li,
.timing-tips li {
  color: #555;
  font-size: 13px;
  margin-bottom: 6px;
  line-height: 1.5;
}

/* Slide Feedback List */
.slide-feedback-list h4 {
  font-size: 14px;
  margin-bottom: 12px;
}

.slide-feedback-item {
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  margin-bottom: 12px;
  overflow: hidden;
}

.sf-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #f5f5f5;
  cursor: pointer;
}

.sf-slide-num {
  font-weight: 600;
  font-size: 13px;
}

.sf-body {
  padding: 12px 14px;
}

.sf-section {
  margin-bottom: 10px;
}

.sf-section:last-child {
  margin-bottom: 0;
}

.sf-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 6px;
}

.sf-tag.positive { background: #dcfce7; color: #166534; }
.sf-tag.negative { background: #fef2f2; color: #991b1b; }
.sf-tag.suggestion { background: #eff6ff; color: #1e40af; }

.sf-section ul {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  color: #555;
}

.sf-section li {
  margin-bottom: 4px;
}

/* Practice Options */
.practice-options,
.timing-options,
.audience-options {
  background: #f9f9f9;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.option-row:last-child {
  margin-bottom: 0;
}

.option-row label {
  font-size: 13px;
  color: #666;
  white-space: nowrap;
}

.difficulty-btns {
  display: flex;
  gap: 6px;
}

.diff-btn {
  padding: 6px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.diff-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.form-select {
  padding: 8px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-size: 13px;
  background: white;
  cursor: pointer;
}

/* Q&A List */
.qa-list,
.audience-questions-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.qa-item,
.audience-question-item {
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.2s;
}

.qa-question,
.aq-question {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px;
  cursor: pointer;
  background: white;
  transition: background 0.2s;
}

.qa-question:hover,
.aq-question:hover {
  background: #f9f9f9;
}

.qa-num,
.aq-num {
  font-weight: 700;
  color: #667eea;
  font-size: 14px;
  min-width: 24px;
}

.qa-text,
.aq-text {
  flex: 1;
  font-size: 14px;
  line-height: 1.5;
  color: #333;
}

.qa-meta,
.aq-meta {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-shrink: 0;
}

.cat-tag,
.diff-tag {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

.cat-tag.clarification { background: #dbeafe; color: #1e40af; }
.cat-tag.challenge { background: #fef3c7; color: #92400e; }
.cat-tag.suggestion { background: #dcfce7; color: #166534; }
.cat-tag.deep_dive { background: #f3e8ff; color: #7e22ce; }
.cat-tag.technical { background: #e0e7ff; color: #3730a3; }
.cat-tag.commercial { background: #fce7f3; color: #9d174d; }

.diff-tag.easy { background: #dcfce7; color: #166534; }
.diff-tag.moderate { background: #fef9c3; color: #854d0e; }
.diff-tag.hard { background: #fee2e2; color: #991b1b; }

.aq-ref,
.qa-ref {
  font-size: 10px;
  color: #888;
}

.qa-answer,
.aq-answer {
  padding: 12px 14px;
  background: #f0f9ff;
  border-top: 1px solid #e5e5e5;
}

.answer-main,
.answer-tips,
.aq-why,
.aq-answer-text,
.aq-tip {
  font-size: 13px;
  color: #444;
  margin-bottom: 8px;
  line-height: 1.5;
}

.answer-main:last-child,
.answer-tips:last-child,
.aq-why:last-child,
.aq-answer-text:last-child,
.aq-tip:last-child {
  margin-bottom: 0;
}

.qa-hint,
.aq-hint {
  padding: 10px 14px;
  background: #f5f5f5;
  border-top: 1px solid #e5e5e5;
  font-size: 12px;
  color: #888;
  cursor: pointer;
  text-align: center;
}

.qa-hint:hover,
.aq-hint:hover {
  background: #eee;
}

/* Practice Header */
.practice-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.practice-header h4 {
  margin: 0;
  font-size: 15px;
}

.practice-meta {
  font-size: 12px;
  color: #888;
}

.practice-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

/* Timing Results */
.timing-summary {
  display: flex;
  justify-content: space-around;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 12px;
  margin-bottom: 16px;
}

.timing-stat {
  text-align: center;
}

.stat-num {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #667eea;
}

.stat-label {
  font-size: 11px;
  color: #888;
}

.pace-feedback {
  background: linear-gradient(135deg, #667eea22, #764ba222);
  padding: 14px;
  border-radius: 10px;
  text-align: center;
  font-size: 14px;
  color: #333;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.pace-icon {
  font-size: 20px;
}

.timing-breakdown h4,
.per-slide-timing h4,
.pause-points h4 {
  font-size: 13px;
  margin-bottom: 10px;
  color: #333;
}

.breakdown-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.breakdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.breakdown-label {
  font-size: 12px;
  color: #666;
  width: 70px;
  flex-shrink: 0;
}

.breakdown-bar {
  flex: 1;
  height: 12px;
  background: #e5e5e5;
  border-radius: 6px;
  overflow: hidden;
}

.breakdown-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.5s ease;
}

.breakdown-fill.intro { background: #34C759; }
.breakdown-fill.content { background: #007AFF; }
.breakdown-fill.conclusion { background: #FF9500; }

.breakdown-time {
  font-size: 11px;
  color: #888;
  width: 50px;
  text-align: right;
}

.timing-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.timing-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.timing-item:hover {
  background: #f9f9f9;
}

.timing-slide-num {
  font-size: 12px;
  font-weight: 600;
  color: #667eea;
  width: 55px;
  flex-shrink: 0;
}

.timing-slide-title {
  font-size: 12px;
  color: #666;
  width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
}

.timing-bar-container {
  flex: 1;
  height: 8px;
  background: #e5e5e5;
  border-radius: 4px;
  overflow: hidden;
}

.timing-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.timing-seconds {
  font-size: 12px;
  font-weight: 600;
  color: #333;
  width: 45px;
  text-align: right;
}

.pause-points {
  margin-bottom: 20px;
}

.pause-desc {
  font-size: 12px;
  color: #888;
  margin-bottom: 10px;
}

.pause-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pause-tag {
  padding: 4px 12px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
}

/* Delivery Tips */
.delivery-tips-list h4 {
  font-size: 14px;
  margin-bottom: 12px;
}

.delivery-tip-item {
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  margin-bottom: 12px;
  overflow: hidden;
}

.dt-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: #f5f5f5;
  cursor: pointer;
}

.dt-header:hover {
  background: #eee;
}

.dt-slide-num {
  font-size: 12px;
  font-weight: 700;
  color: #667eea;
}

.dt-key-message {
  font-size: 13px;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dt-body {
  padding: 12px 14px;
}

.dt-section {
  margin-bottom: 10px;
  font-size: 13px;
  color: #555;
  line-height: 1.5;
}

.dt-section:last-child {
  margin-bottom: 0;
}

.dt-section.transition {
  background: #f0f9ff;
  padding: 8px 12px;
  border-radius: 6px;
}

.dt-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  margin-right: 6px;
  background: #667eea22;
  color: #667eea;
}

.emphasis-points {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.emphasis-chip {
  padding: 3px 10px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 12px;
  font-size: 12px;
}

.transition-text {
  font-style: italic;
  color: #007AFF;
}

/* Audience */
.audience-header {
  margin-bottom: 16px;
}

.audience-badge {
  display: inline-block;
  padding: 6px 14px;
  background: linear-gradient(135deg, #667eea22, #764ba222);
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.must-prepare,
.hardest-question {
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 16px;
}

.must-prepare h4,
.hardest-question h4 {
  font-size: 13px;
  margin-bottom: 10px;
  color: #333;
}

.must-prepare-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.must-prepare-item {
  font-size: 13px;
  color: #555;
  padding: 6px 0;
  border-bottom: 1px solid #fed7aa;
}

.must-prepare-item:last-child {
  border-bottom: none;
}

.hardest-item {
  font-size: 13px;
  color: #555;
}

.hq-question {
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.hq-why,
.hq-strategy {
  margin-bottom: 6px;
  line-height: 1.5;
}

/* Buttons */
.btn {
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  border: none;
}

.btn-outline {
  background: white;
  border: 1px solid #e5e5e5;
  color: #666;
}

.btn-outline:hover {
  background: #f5f5f5;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5a6fd6;
}

.btn-sm {
  padding: 4px 10px;
  font-size: 11px;
  background: #667eea22;
  color: #667eea;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.timing-apply-row {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

/* R127: Speaking Pace */
.pace-result { padding: 0; }
.pace-header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.pace-wpm-display { display: flex; align-items: baseline; gap: 4px; }
.pace-wpm-num { font-size: 48px; font-weight: 700; color: #667eea; }
.pace-wpm-label { font-size: 18px; color: #667eea88; }
.pace-category { display: flex; align-items: center; gap: 6px; }
.pace-icon { font-size: 24px; }
.pace-cat-text { font-size: 16px; color: #667eea; font-weight: 600; }
.pace-feedback { background: #f0f0ff; border-radius: 8px; padding: 12px; margin-bottom: 16px; }
.pace-feedback p { margin: 0; color: #333; font-size: 14px; }
.pace-stats { display: flex; gap: 16px; margin-bottom: 16px; }
.pace-stat { flex: 1; background: #f8f8f8; border-radius: 8px; padding: 12px; text-align: center; }
.stat-num { display: block; font-size: 24px; font-weight: 700; color: #333; }
.stat-label { font-size: 12px; color: #888; }
.pace-wpm-bar { margin-bottom: 16px; }
.wpm-bar-track { height: 8px; background: #eee; border-radius: 4px; display: flex; overflow: hidden; margin-bottom: 4px; }
.wpm-bar-fill.slow { background: #34C759; height: 100%; }
.wpm-bar-fill.optimal { background: #007AFF; height: 100%; }
.wpm-bar-fill.fast { background: #FF3B30; height: 100%; }
.wpm-bar-labels { display: flex; justify-content: space-between; font-size: 11px; color: #888; }
.wpm-bar-labels .optimal-label { color: #007AFF; font-weight: 600; }
.pace-tips { background: #fff; border-radius: 8px; padding: 12px; margin-bottom: 16px; }
.pace-tips h4 { margin: 0 0 8px; font-size: 14px; color: #333; }
.pace-tips ul { margin: 0; padding-left: 20px; }
.pace-tips li { font-size: 13px; color: #555; margin-bottom: 4px; }
.per-slide-pace { background: #fff; border-radius: 8px; padding: 12px; margin-bottom: 16px; }
.per-slide-pace h4 { margin: 0 0 8px; font-size: 14px; color: #333; }
.pace-list { display: flex; flex-direction: column; gap: 6px; }
.pace-item { display: flex; align-items: center; gap: 8px; padding: 8px; background: #f8f8f8; border-radius: 6px; cursor: pointer; transition: background 0.2s; }
.pace-item:hover { background: #e8e8ff; }
.pace-slide-num { font-size: 12px; color: #667eea; font-weight: 600; min-width: 50px; }
.pace-slide-title { flex: 1; font-size: 13px; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pace-slide-words { font-size: 12px; color: #888; }
.pace-slide-sec { font-size: 12px; color: #667eea; }

/* R127: Content Score */
.content-result { padding: 0; }
.score-cards { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
.score-card.small { flex: 1; min-width: 70px; background: #f8f8f8; border-radius: 8px; padding: 12px 8px; text-align: center; }
.score-card.small.highlight { background: #667eea22; border: 1px solid #667eea44; }
.score-small-num { display: block; font-size: 28px; font-weight: 700; color: #667eea; }
.score-label { font-size: 11px; color: #888; }
.content-analyses { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.analysis-item { background: #f8f8f8; border-radius: 8px; padding: 10px; }
.analysis-item h4 { margin: 0 0 4px; font-size: 13px; color: #333; }
.analysis-item p { margin: 0; font-size: 13px; color: #555; }
.per-slide-content { background: #fff; border-radius: 8px; padding: 12px; margin-bottom: 16px; }
.per-slide-content h4 { margin: 0 0 8px; font-size: 14px; color: #333; }
.content-slide-list { display: flex; flex-direction: column; gap: 6px; }
.content-slide-item { display: flex; align-items: center; gap: 8px; padding: 8px; background: #f8f8f8; border-radius: 6px; cursor: pointer; }
.content-slide-item:hover { background: #e8e8ff; }
.cs-slide-num { font-size: 12px; color: #667eea; font-weight: 600; min-width: 50px; }
.cs-scores { display: flex; gap: 6px; }
.cs-score { font-size: 12px; padding: 2px 6px; background: #667eea22; color: #667eea; border-radius: 4px; }
.cs-verdict { flex: 1; font-size: 12px; color: #666; text-align: right; }

/* R127: Visual Design */
.design-result { padding: 0; }
.design-scores { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; justify-content: center; }
.ds-item { min-width: 60px; background: #f8f8f8; border-radius: 8px; padding: 10px 6px; text-align: center; }
.ds-item.highlight { background: #667eea22; border: 1px solid #667eea44; }
.ds-score { display: block; font-size: 24px; font-weight: 700; color: #667eea; }
.ds-label { font-size: 11px; color: #888; }
.design-analyses { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.design-analyses p { margin: 0; font-size: 13px; color: #555; background: #f8f8f8; padding: 8px; border-radius: 6px; }
.design-strengths { background: #f0fff0; border-radius: 8px; padding: 10px; margin-bottom: 16px; }
.design-strengths h4 { margin: 0 0 6px; font-size: 13px; color: #2a9d2a; }
.design-strengths ul { margin: 0; padding-left: 18px; }
.design-strengths li { font-size: 13px; color: #555; margin-bottom: 3px; }
.per-slide-design { background: #fff; border-radius: 8px; padding: 12px; margin-bottom: 16px; }
.per-slide-design h4 { margin: 0 0 8px; font-size: 14px; color: #333; }
.design-slide-item { background: #f8f8f8; border-radius: 6px; padding: 8px; margin-bottom: 6px; }
.dsi-header { display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
.dsi-header:hover { color: #667eea; }
.dsi-num { font-size: 13px; font-weight: 600; color: #333; }
.dsi-scores { font-size: 11px; color: #667eea; }
.dsi-issues { margin-top: 4px; font-size: 12px; color: #888; }
.dsi-tag { color: #ff6b6b; }

/* R127: Engagement Prediction */
.engagement-result { padding: 0; }
.engagement-header { display: flex; gap: 16px; margin-bottom: 16px; }
.eng-score { flex: 1; background: #fff8f0; border-radius: 8px; padding: 12px; text-align: center; }
.eng-score-num { display: block; font-size: 36px; font-weight: 700; color: #ff9500; }
.eng-score-label { font-size: 12px; color: #888; }
.engagement-prediction { background: #f8f8f8; border-radius: 8px; padding: 12px; margin-bottom: 16px; }
.engagement-prediction p { margin: 0; font-size: 13px; color: #555; }
.emotion-curve { background: #fff; border-radius: 8px; padding: 12px; margin-bottom: 16px; }
.emotion-curve h4 { margin: 0 0 8px; font-size: 14px; color: #333; }
.emotion-phase { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid #f0f0f0; }
.emotion-phase:last-child { border-bottom: none; }
.ep-range { font-size: 12px; color: #667eea; font-weight: 600; min-width: 40px; }
.ep-phase { font-size: 12px; color: #333; min-width: 60px; }
.ep-emotion { flex: 1; font-size: 12px; color: #555; }
.engagement-moments { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.eng-moment { background: #f8f8f8; border-radius: 8px; padding: 10px; }
.eng-moment.best { border-left: 3px solid #ff6b6b; }
.eng-moment.worst { border-left: 3px solid #888; }
.eng-moment h4 { margin: 0 0 4px; font-size: 13px; }
.eng-moment p { margin: 0; font-size: 12px; color: #555; }
.emotional-peaks { background: #fff8f0; border-radius: 8px; padding: 10px; margin-bottom: 16px; }
.emotional-peaks h4 { margin: 0 0 6px; font-size: 13px; color: #ff9500; }
.peak-item { font-size: 12px; color: #555; padding: 3px 0; }
.fatigue-risks { background: #fff0f0; border-radius: 8px; padding: 10px; margin-bottom: 16px; }
.fatigue-risks h4 { margin: 0 0 6px; font-size: 13px; color: #ff3b30; }
.risk-item { font-size: 12px; color: #555; padding: 3px 0; }
.engagement-tips { background: #f0f8ff; border-radius: 8px; padding: 10px; margin-bottom: 16px; }
.engagement-tips h4 { margin: 0 0 6px; font-size: 13px; color: #007aff; }
.engagement-tips ul { margin: 0; padding-left: 18px; }
.engagement-tips li { font-size: 12px; color: #555; margin-bottom: 3px; }

/* R127: Personalized Coaching */
.personalized-result { padding: 0; }
.personalized-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.ph-badge { background: #667eea22; color: #667eea; padding: 4px 10px; border-radius: 12px; font-size: 13px; font-weight: 600; }
.ph-sessions { font-size: 12px; color: #888; }
.improvement-trends { background: #f0fff0; border-radius: 8px; padding: 10px; margin-bottom: 16px; }
.trend-item { font-size: 13px; color: #2a9d2a; padding: 3px 0; }
.coaching-focus { background: #667eea22; border-radius: 8px; padding: 12px; margin-bottom: 16px; }
.coaching-focus h4 { margin: 0 0 6px; font-size: 14px; color: #667eea; }
.coaching-focus p { margin: 0; font-size: 13px; color: #333; }
.personalized-tips { background: #fff; border-radius: 8px; padding: 12px; margin-bottom: 16px; }
.personalized-tips h4 { margin: 0 0 8px; font-size: 14px; color: #333; }
.personalized-tip-item { display: flex; flex-direction: column; gap: 2px; padding: 8px; background: #f8f8f8; border-radius: 6px; margin-bottom: 6px; }
.pt-category { font-size: 11px; color: #667eea; font-weight: 600; text-transform: uppercase; }
.pt-tip { font-size: 13px; color: #333; }
.pt-reason { font-size: 12px; color: #888; }
.improvement-priority { background: #fff8f0; border-radius: 8px; padding: 10px; margin-bottom: 16px; }
.improvement-priority h4 { margin: 0 0 6px; font-size: 13px; color: #ff9500; }
.improvement-priority ol { margin: 0; padding-left: 20px; }
.improvement-priority li { font-size: 13px; color: #555; margin-bottom: 4px; }
.confidence-boost { background: #f0fff0; border-radius: 8px; padding: 10px; margin-bottom: 16px; text-align: center; }
.confidence-item { font-size: 14px; color: #2a9d2a; font-weight: 600; }
.common-past-issues { background: #fff0f0; border-radius: 8px; padding: 10px; margin-bottom: 16px; }
.common-past-issues h4 { margin: 0 0 6px; font-size: 13px; color: #ff3b30; }
.past-issues-list { display: flex; flex-wrap: wrap; gap: 6px; }
.past-issue-tag { background: #ff3b3022; color: #ff3b30; padding: 3px 8px; border-radius: 10px; font-size: 12px; }
.historical-summary { background: #f8f8f8; border-radius: 8px; padding: 10px; font-size: 13px; color: #555; }
.historical-summary p { margin: 0; }

</style>
