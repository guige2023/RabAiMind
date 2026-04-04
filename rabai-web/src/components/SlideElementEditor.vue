<template>
  <div class="element-editor-overlay" @click.self="closeEditor">
    <div class="element-editor-panel">
      <div class="editor-header">
        <div class="header-left">
          <h3>🛠️ 页面元素微调</h3>
          <p class="editor-tip">点击画布中的元素进行编辑，拖拽调整位置 | 方向键移动 | Delete删除 | Ctrl+Z撤销</p>
        </div>
        <div class="header-toolbar">
          <button class="toolbar-btn" @click="undo" :disabled="!canUndo" title="撤销 (Ctrl+Z)">
            ↩️ 撤销
          </button>
          <button class="toolbar-btn" @click="redo" :disabled="!canRedo" title="重做 (Ctrl+Y)">
            ↪️ 重做
          </button>
        </div>
        <button class="btn-close" @click="closeEditor">✕</button>
      </div>

      <!-- ===== R16: 富文本格式工具栏 ===== -->
      <div v-if="selectedElement && selectedElement.type === 'text'" class="rich-toolbar">
        <!-- 格式按钮组 -->
        <div class="toolbar-group">
          <button
            class="format-btn"
            :class="{ active: isFormatActive('bold') }"
            @click="execFormat('bold')"
            title="加粗 (Ctrl+B)"
          ><b>B</b></button>
          <button
            class="format-btn"
            :class="{ active: isFormatActive('italic') }"
            @click="execFormat('italic')"
            title="斜体 (Ctrl+I)"
          ><i>I</i></button>
          <button
            class="format-btn"
            :class="{ active: isFormatActive('underline') }"
            @click="execFormat('underline')"
            title="下划线 (Ctrl+U)"
          ><u>U</u></button>
        </div>

        <!-- 字体系列 -->
        <div class="toolbar-group">
          <select class="font-family-select" v-model="richFontFamily" @change="applyRichFontFamily">
            <option value="宋体">宋体</option>
            <option value="黑体">黑体</option>
            <option value="楷体">楷体</option>
            <option value="微软雅黑">微软雅黑</option>
            <option value="等线">等线</option>
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
          </select>
        </div>

        <!-- 字号 -->
        <div class="toolbar-group">
          <select class="font-size-select" v-model="richFontSize" @change="applyRichFontSize">
            <option value="12">12pt</option>
            <option value="14">14pt</option>
            <option value="16">16pt</option>
            <option value="18">18pt</option>
            <option value="20">20pt</option>
            <option value="24">24pt</option>
            <option value="28">28pt</option>
            <option value="32">32pt</option>
            <option value="36">36pt</option>
            <option value="48">48pt</option>
            <option value="72">72pt</option>
          </select>
        </div>

        <!-- 文字颜色 -->
        <div class="toolbar-group">
          <div class="color-tool-group">
            <span class="toolbar-label">文字色</span>
            <input
              type="color"
              v-model="richTextColor"
              @input="applyRichTextColor"
              class="color-input-tool"
              title="文字颜色"
            />
          </div>
        </div>

        <!-- 背景颜色 -->
        <div class="toolbar-group">
          <div class="color-tool-group">
            <span class="toolbar-label">背景</span>
            <input
              type="color"
              v-model="richBgColor"
              @input="applyRichBgColor"
              class="color-input-tool"
              title="文字背景颜色"
            />
          </div>
        </div>

        <!-- 行高 -->
        <div class="toolbar-group">
          <select class="line-height-select" v-model="richLineHeight" @change="applyRichLineHeight">
            <option value="1">单倍行高</option>
            <option value="1.2">1.2倍</option>
            <option value="1.5">1.5倍</option>
            <option value="2">双倍行高</option>
          </select>
        </div>
      </div>

      <!-- ===== R32: AI 智能工具栏 ===== -->
      <div class="ai-toolbar">
        <div class="ai-toolbar-title">🤖 AI 智能工具</div>
        <div class="ai-toolbar-buttons">
          <!-- AI 改写 + 语气调整（仅文本元素） -->
          <div class="ai-rephrase-group" v-if="selectedElement?.type === 'text'">
            <select v-model="rephraseStyle" class="ai-tone-select" title="语气风格">
              <option value="natural">自然流畅</option>
              <option value="formal">正式专业</option>
              <option value="casual">轻松随意</option>
              <option value="creative">创意生动</option>
              <option value="concise">简洁精炼</option>
            </select>
            <button
              class="ai-btn ai-btn-rephrase"
              :class="{ disabled: aiLoading }"
              @click="rephraseText"
              :disabled="aiLoading"
              title="AI 改写"
            >
              ✨ 改写
            </button>
          </div>

          <!-- AI 翻译（仅文本元素） -->
          <div class="ai-translate-group" v-if="selectedElement?.type === 'text'">
            <select v-model="translateTarget" class="ai-translate-select">
              <option v-for="opt in translateOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
            <button
              class="ai-btn ai-btn-translate"
              :class="{ disabled: aiLoading }"
              @click="translateText"
              :disabled="aiLoading"
              title="AI 翻译"
            >
              🌐 翻译
            </button>
          </div>

          <!-- AI 语法检查（仅文本元素） -->
          <button
            v-if="selectedElement?.type === 'text'"
            class="ai-btn ai-btn-grammar"
            :class="{ disabled: aiLoading }"
            @click="grammarCheckText"
            :disabled="aiLoading"
            title="语法拼写检查"
          >
            ✅ 检查
          </button>

          <!-- R109: AI 智能脚注（仅文本元素） -->
          <button
            v-if="selectedElement?.type === 'text'"
            class="ai-btn ai-btn-footnote"
            :class="{ disabled: aiLoading }"
            @click="addSmartFootnotes"
            :disabled="aiLoading"
            title="AI 添加脚注引用"
          >
            📎 脚注
          </button>

          <div class="ai-toolbar-sep"></div>

          <!-- AI 扩展/压缩（仅文本元素） -->
          <div class="ai-expand-group" v-if="selectedElement?.type === 'text'">
            <span class="expand-label">📝</span>
            <button class="ai-btn ai-btn-expand" @click="setExpandRatio(0.5)" :disabled="aiLoading" title="压缩内容">➖</button>
            <input
              type="range"
              v-model.number="expandRatio"
              min="0.5"
              max="2.0"
              step="0.1"
              class="expand-slider"
              title="内容扩展/压缩"
            />
            <button class="ai-btn ai-btn-expand" @click="setExpandRatio(2.0)" :disabled="aiLoading" title="扩展内容">➕</button>
            <button
              class="ai-btn ai-btn-apply"
              :class="{ disabled: aiLoading }"
              @click="expandShortenText"
              :disabled="aiLoading"
              title="应用扩展/压缩"
            >
              {{ expandRatio > 1.0 ? '↗️ 扩展' : '↘️ 压缩' }}
            </button>
          </div>

          <!-- R109: AI 语气调整（仅文本元素） -->
          <div class="ai-tone-group" v-if="selectedElement?.type === 'text'">
            <select v-model="toneStyle" class="ai-tone-select" title="语气调整">
              <option value="formal">📋 正式</option>
              <option value="casual">💬 休闲</option>
              <option value="technical">🔧 技术</option>
              <option value="persuasive">🎯 有说服力</option>
              <option value="warm">💡 温暖</option>
            </select>
            <button
              class="ai-btn ai-btn-tone"
              :class="{ disabled: aiLoading }"
              @click="adjustTone"
              :disabled="aiLoading"
              title="AI 语气调整"
            >
              🎯 语气
            </button>
          </div>

          <!-- R109: AI 陈词滥调检测（仅文本元素） -->
          <button
            v-if="selectedElement?.type === 'text'"
            class="ai-btn ai-btn-cliche"
            :class="{ disabled: aiLoading }"
            @click="detectCliches"
            :disabled="aiLoading"
            title="AI 检测陈词滥调"
          >
            💎 检测
          </button>

          <!-- 智能布局建议 -->
          <button
            class="ai-btn ai-btn-layout"
            :class="{ disabled: aiLoading }"
            @click="requestLayoutSuggestion"
            :disabled="aiLoading"
            title="智能布局建议"
          >
            📐 布局建议
          </button>

          <!-- 一键美化 -->
          <button
            class="ai-btn ai-btn-enhance"
            :class="{ disabled: aiLoading }"
            @click="requestAutoEnhance"
            :disabled="aiLoading"
            title="一键美化设计"
          >
            🎨 美化
          </button>

          <!-- 内容质量评分 -->
          <button
            class="ai-btn ai-btn-score"
            :class="{ disabled: aiLoading }"
            @click="requestContentScore"
            :disabled="aiLoading"
            title="内容质量评分"
          >
            📊 评分
          </button>

          <!-- R133: AI 内容模板 -->
          <button
            class="ai-btn ai-btn-template"
            :class="{ disabled: aiLoading }"
            @click="openContentTemplateModal"
            :disabled="aiLoading"
            title="AI 内容模板"
          >
            📋 模板
          </button>
        </div>

        <!-- Loading 状态 -->
        <div v-if="aiLoading" class="ai-loading">
          <span class="ai-spinner">⏳</span> {{ aiLoadingText }}
        </div>
      </div>

      <!-- R32: 评分弹窗 -->
      <div v-if="showScoreModal" class="ai-modal-overlay" @click.self="showScoreModal = false">
        <div class="ai-modal">
          <div class="ai-modal-header">
            <h3>📊 内容质量评分</h3>
            <button class="ai-modal-close" @click="showScoreModal = false">✕</button>
          </div>
          <div v-if="contentScore" class="ai-modal-content">
            <div class="score-overall">
              <span class="score-label">综合评分</span>
              <span class="score-value">{{ contentScore.overall_score?.toFixed(1) || 'N/A' }}</span>
              <span class="score-max">/ 10</span>
            </div>
            <div class="score-bars">
              <div v-for="(val, key) in contentScore.scores" :key="key" class="score-bar-item">
                <span class="score-bar-label">{{ key }}</span>
                <div class="score-bar-track">
                  <div class="score-bar-fill" :style="{ width: ((val as number) * 10) + '%' }"></div>
                </div>
                <span class="score-bar-value">{{ val }}/10</span>
              </div>
            </div>
            <div v-if="contentScore.strengths?.length" class="score-section">
              <div class="score-section-title">✅ 优点</div>
              <div v-for="s in contentScore.strengths" :key="s" class="score-item">• {{ s }}</div>
            </div>
            <div v-if="contentScore.improvements?.length" class="score-section">
              <div class="score-section-title">💡 改进建议</div>
              <div v-for="imp in contentScore.improvements" :key="imp" class="score-item">• {{ imp }}</div>
            </div>
            <div v-if="contentScore.summary" class="score-summary">"{{ contentScore.summary }}"</div>
          </div>
        </div>
      </div>

      <!-- R32: 布局建议弹窗 -->
      <div v-if="showLayoutModal" class="ai-modal-overlay" @click.self="showLayoutModal = false">
        <div class="ai-modal">
          <div class="ai-modal-header">
            <h3>📐 智能布局建议</h3>
            <button class="ai-modal-close" @click="showLayoutModal = false">✕</button>
          </div>
          <div v-if="layoutSuggestion" class="ai-modal-content">
            <div class="layout-type">
              <span class="layout-type-icon">🎯</span>
              <span class="layout-type-name">{{ layoutSuggestion.layout_type }}</span>
            </div>
            <div class="layout-reason">{{ layoutSuggestion.reason }}</div>
            <div class="layout-actions">
              <button class="ai-modal-btn ai-modal-btn-primary" @click="applyLayoutSuggestion">
                ✅ 应用建议
              </button>
              <button class="ai-modal-btn" @click="showLayoutModal = false">取消</button>
            </div>
          </div>
        </div>
      </div>

      <!-- R32: 美化结果弹窗 -->
      <div v-if="showEnhanceModal" class="ai-modal-overlay" @click.self="showEnhanceModal = false">
        <div class="ai-modal">
          <div class="ai-modal-header">
            <h3>🎨 美化方案</h3>
            <button class="ai-modal-close" @click="showEnhanceModal = false">✕</button>
          </div>
          <div v-if="enhancementResult" class="ai-modal-content">
            <div class="enhance-colors">
              <span class="enhance-label">配色方案</span>
              <div class="enhance-swatches">
                <span
                  v-for="(c, i) in enhancementResult.improved_color_scheme"
                  :key="i"
                  class="enhance-swatch"
                  :style="{ background: c }"
                  :title="c"
                ></span>
              </div>
            </div>
            <div v-if="enhancementResult.suggested_font" class="enhance-item">
              <span class="enhance-label">字体</span>
              <span>{{ enhancementResult.suggested_font }}</span>
            </div>
            <div v-if="enhancementResult.suggested_spacing" class="enhance-item">
              <span class="enhance-label">间距</span>
              <span>{{ enhancementResult.suggested_spacing }}</span>
            </div>
            <div v-if="enhancementResult.design_tips?.length" class="score-section">
              <div class="score-section-title">💡 设计建议</div>
              <div v-for="tip in enhancementResult.design_tips" :key="tip" class="score-item">• {{ tip }}</div>
            </div>
            <div class="layout-actions">
              <button class="ai-modal-btn ai-modal-btn-primary" @click="applyEnhancement">
                ✅ 应用美化
              </button>
              <button class="ai-modal-btn" @click="showEnhanceModal = false">取消</button>
            </div>
          </div>
        </div>
      </div>

      <!-- R133: AI 内容模板弹窗 -->
      <div v-if="showTemplateModal" class="ai-modal-overlay" @click.self="showTemplateModal = false">
        <div class="ai-modal">
          <div class="ai-modal-header">
            <h3>📋 AI 内容模板</h3>
            <button class="ai-modal-close" @click="showTemplateModal = false">✕</button>
          </div>
          <div class="ai-modal-content">
            <div class="template-form">
              <div class="template-field">
                <label>模板类型</label>
                <select v-model="templateType" class="template-select">
                  <option value="title">📌 封面标题</option>
                  <option value="agenda">📑 目录议程</option>
                  <option value="bullet_points">💡 要点列表</option>
                  <option value="comparison">⚖️ 对比比较</option>
                  <option value="process">🔄 流程步骤</option>
                  <option value="data_chart">📊 数据图表</option>
                  <option value="quote">💬 名人名言</option>
                  <option value="summary">🎯 总结回顾</option>
                  <option value="team_intro">👥 团队介绍</option>
                  <option value="case_study">📂 案例分析</option>
                </select>
              </div>
              <div class="template-field">
                <label>主题/话题</label>
                <input v-model="templateTopic" type="text" class="template-input" placeholder="输入演讲主题..." />
              </div>
              <div class="template-field">
                <label>上下文（可选）</label>
                <input v-model="templateContext" type="text" class="template-input" placeholder="补充背景信息..." />
              </div>
              <div class="template-field" v-if="['agenda','bullet_points','comparison','process','team_intro'].includes(templateType)">
                <label>内容条目数量</label>
                <input v-model.number="templateCount" type="number" min="2" max="10" class="template-input" style="width:80px" />
              </div>
            </div>
            <div v-if="templateResult" class="template-result">
              <div class="template-result-title">生成结果</div>
              <pre class="template-result-content">{{ formatTemplateResult(templateResult) }}</pre>
            </div>
            <div class="layout-actions">
              <button
                class="ai-modal-btn ai-modal-btn-primary"
                @click="generateContentTemplate"
                :disabled="!templateTopic || aiLoading"
              >
                {{ aiLoading ? '生成中...' : '✨ 生成内容' }}
              </button>
              <button
                v-if="templateResult"
                class="ai-modal-btn ai-modal-btn-primary"
                @click="applyContentTemplate"
              >
                ✅ 应用到幻灯片
              </button>
              <button class="ai-modal-btn" @click="showTemplateModal = false">关闭</button>
            </div>
          </div>
        </div>
      </div>

      <div class="editor-content">
        <!-- 幻灯片缩略图列表 -->
        <div class="slides-list">
          <div
            v-for="(slide, index) in slides"
            :key="index"
            class="slide-thumb"
            :class="{ active: activeSlideIndex === index }"
            @click="selectSlide(index)"
          >
            <span class="thumb-num">{{ index + 1 }}</span>
            <div class="thumb-preview" :style="{ background: slide.background || '#fff' }">
              <div
                v-for="(el, elIndex) in slide.elements"
                :key="elIndex"
                class="thumb-element"
                :class="{ selected: activeSlideIndex === index && selectedElementIndex === elIndex }"
                :style="getElementStyle(el)"
                @click.stop="selectElement(index, elIndex)"
              >
                {{ el.type === 'text' ? 'T' : (el.type === 'shape' ? '■' : '🖼') }}
              </div>
            </div>
          </div>
        </div>

        <!-- 编辑画布 -->
        <div class="edit-canvas">
          <div
            class="canvas-slide"
            :style="currentSlideStyle"
            @click="deselectElement"
          >
            <div
              v-for="(el, index) in currentElements"
              :key="index"
              class="canvas-element"
              :class="{
                selected: selectedElementIndex === index,
                dragging: isDragging
              }"
              :style="getCanvasElementStyle(el, index)"
              @click.stop="selectElement(activeSlideIndex, index)"
              @mousedown="startDrag($event, index)"
            >
              <!-- 文本元素 -->
              <template v-if="el.type === 'text'">
                <div
                  class="element-content text-content"
                  :contenteditable="selectedElementIndex === index ? 'true' : 'false'"
                  :style="getTextContentStyle(el)"
                  @blur="updateElementContent(index, $event)"
                  @click.stop
                  @keydown="handleTextKeydown($event)"
                  ref="textRefs"
                >{{ el.content }}</div>
              </template>

              <!-- 形状元素 -->
              <template v-else-if="el.type === 'shape'">
                <div
                  class="element-content shape-content"
                  :style="{ backgroundColor: el.fill, borderRadius: el.radius || '0' }"
                ></div>
              </template>

              <!-- 图片元素 -->
              <template v-else-if="el.type === 'image'">
                <img
                  v-if="el.src"
                  :src="el.src"
                  class="element-content image-content"
                  :style="getImageStyle(el)"
                  alt=""
                />
                <div v-else class="element-content image-placeholder">
                  <span>🖼️</span>
                  <span class="upload-hint">点击上传图片</span>
                </div>
              </template>

              <!-- R51: 视频元素 -->
              <template v-else-if="el.type === 'video'">
                <div class="element-content video-content" v-if="el.videoUrl">
                  <iframe
                    v-if="el.videoType === 'youtube'"
                    :src="getYouTubeEmbedUrl(el.videoUrl)"
                    class="video-iframe"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                  ></iframe>
                  <iframe
                    v-else-if="el.videoType === 'vimeo'"
                    :src="getVimeoEmbedUrl(el.videoUrl)"
                    class="video-iframe"
                    frameborder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowfullscreen
                  ></iframe>
                  <video
                    v-else
                    :src="el.videoUrl"
                    class="video-native"
                    controls
                    :autoplay="el.autoPlay"
                    :loop="el.loop"
                    :muted="el.muted"
                  ></video>
                </div>
                <div v-else class="element-content video-placeholder">
                  <span>🎬</span>
                  <span class="upload-hint">输入视频链接</span>
                </div>
              </template>

              <!-- R51: 音频元素 -->
              <template v-else-if="el.type === 'audio'">
                <div class="element-content audio-content">
                  <div v-if="el.audioUrl" class="audio-player">
                    <span class="audio-icon">🎵</span>
                    <audio
                      :src="el.audioUrl"
                      controls
                      :autoplay="el.autoPlay"
                      :loop="el.loop"
                      :muted="el.muted"
                      class="audio-native"
                    ></audio>
                  </div>
                  <div v-else class="audio-placeholder">
                    <span>🎵</span>
                    <span class="upload-hint">上传音频文件</span>
                  </div>
                </div>
              </template>

              <!-- R51: GIF动图元素 -->
              <template v-else-if="el.type === 'gif'">
                <div class="element-content gif-content">
                  <img
                    v-if="el.gifUrl"
                    :src="el.gifUrl"
                    class="gif-image"
                    :style="getImageStyle(el)"
                    alt="animated gif"
                  />
                  <div v-else class="gif-placeholder">
                    <span>🎞️</span>
                    <span class="upload-hint">输入GIF链接</span>
                  </div>
                </div>
              </template>

              <!-- 选中标记 -->
              <div v-if="selectedElementIndex === index" class="resize-handles">
                <div class="handle handle-nw" @mousedown.stop="startResize($event, 'nw')"></div>
                <div class="handle handle-ne" @mousedown.stop="startResize($event, 'ne')"></div>
                <div class="handle handle-sw" @mousedown.stop="startResize($event, 'sw')"></div>
                <div class="handle handle-se" @mousedown.stop="startResize($event, 'se')"></div>
              </div>
            </div>
          </div>

          <!-- 对齐辅助线 -->
          <div v-if="showGuides" class="canvas-guides">
            <div class="guide guide-h" :style="{ top: guideY + 'px' }" v-if="guideY !== null"></div>
            <div class="guide guide-v" :style="{ left: guideX + 'px' }" v-if="guideX !== null"></div>
          </div>
        </div>

        <!-- 属性面板 -->
        <div class="properties-panel">
          <div class="panel-header">元素属性</div>

          <div v-if="selectedElement" class="panel-content">
            <!-- 元素类型 -->
            <div class="prop-group">
              <label class="prop-label">类型</label>
              <div class="prop-value">
                <span class="type-badge">{{ getElementTypeName(selectedElement.type) }}</span>
              </div>
            </div>

            <!-- 位置 -->
            <div class="prop-group">
              <label class="prop-label">位置</label>
              <div class="prop-row">
                <div class="prop-input">
                  <span>X</span>
                  <input
                    type="number"
                    :value="Math.round(selectedElement.x)"
                    @input="updateElementProp('x', Number(($event.target as HTMLInputElement).value))"
                  />
                </div>
                <div class="prop-input">
                  <span>Y</span>
                  <input
                    type="number"
                    :value="Math.round(selectedElement.y)"
                    @input="updateElementProp('y', Number(($event.target as HTMLInputElement).value))"
                  />
                </div>
              </div>
            </div>

            <!-- 尺寸 -->
            <div class="prop-group">
              <label class="prop-label">尺寸</label>
              <div class="prop-row">
                <div class="prop-input">
                  <span>宽</span>
                  <input
                    type="number"
                    :value="Math.round(selectedElement.width)"
                    @input="updateElementProp('width', Number(($event.target as HTMLInputElement).value))"
                  />
                </div>
                <div class="prop-input">
                  <span>高</span>
                  <input
                    type="number"
                    :value="Math.round(selectedElement.height)"
                    @input="updateElementProp('height', Number(($event.target as HTMLInputElement).value))"
                  />
                </div>
              </div>
            </div>

            <!-- 文本内容 -->
            <div v-if="selectedElement.type === 'text'" class="prop-group">
              <label class="prop-label">文本内容</label>
              <textarea
                class="prop-textarea"
                :value="selectedElement.content"
                @input="updateElementProp('content', ($event.target as HTMLTextAreaElement).value)"
                rows="4"
              ></textarea>
            </div>

            <!-- R16: 字体设置（完整版） -->
            <div v-if="selectedElement.type === 'text'" class="prop-group">
              <label class="prop-label">字体样式</label>
              <div class="prop-row">
                <select
                  class="prop-select"
                  :value="selectedElement.fontFamily || '宋体'"
                  @change="updateElementProp('fontFamily', ($event.target as HTMLSelectElement).value)"
                >
                  <option value="宋体">宋体</option>
                  <option value="黑体">黑体</option>
                  <option value="楷体">楷体</option>
                  <option value="微软雅黑">微软雅黑</option>
                  <option value="等线">等线</option>
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Verdana">Verdana</option>
                </select>
              </div>
            </div>

            <div v-if="selectedElement.type === 'text'" class="prop-group">
              <label class="prop-label">字号</label>
              <div class="prop-row">
                <select
                  class="prop-select"
                  :value="selectedElement.fontSize || 18"
                  @change="updateElementProp('fontSize', Number(($event.target as HTMLSelectElement).value))"
                >
                  <option :value="12">12pt</option>
                  <option :value="14">14pt</option>
                  <option :value="16">16pt</option>
                  <option :value="18">18pt</option>
                  <option :value="20">20pt</option>
                  <option :value="24">24pt</option>
                  <option :value="28">28pt</option>
                  <option :value="32">32pt</option>
                  <option :value="36">36pt</option>
                  <option :value="48">48pt</option>
                  <option :value="72">72pt</option>
                </select>
                <select
                  class="prop-select"
                  :value="selectedElement.fontWeight || 'normal'"
                  @change="updateElementProp('fontWeight', ($event.target as HTMLSelectElement).value)"
                >
                  <option value="normal">正常</option>
                  <option value="bold">粗体</option>
                </select>
              </div>
            </div>

            <!-- R16: 行高设置 -->
            <div v-if="selectedElement.type === 'text'" class="prop-group">
              <label class="prop-label">行高</label>
              <select
                class="prop-select"
                :value="selectedElement.lineHeight || '1.5'"
                @change="updateElementProp('lineHeight', ($event.target as HTMLSelectElement).value)"
              >
                <option value="1">单倍</option>
                <option value="1.2">1.2倍</option>
                <option value="1.5">1.5倍</option>
                <option value="2">双倍</option>
              </select>
            </div>

            <!-- R16: 文字样式快捷设置 -->
            <div v-if="selectedElement.type === 'text'" class="prop-group">
              <label class="prop-label">快捷样式</label>
              <div class="style-toggles">
                <button
                  class="style-toggle-btn"
                  :class="{ active: selectedElement.fontStyle === 'italic' }"
                  @click="toggleFontStyle('italic')"
                  title="斜体"
                ><i>I</i></button>
                <button
                  class="style-toggle-btn"
                  :class="{ active: selectedElement.textDecoration === 'underline' }"
                  @click="toggleTextDecoration('underline')"
                  title="下划线"
                ><u>U</u></button>
                <button
                  class="style-toggle-btn"
                  :class="{ active: selectedElement.fontWeight === 'bold' }"
                  @click="toggleFontWeight"
                  title="加粗"
                ><b>B</b></button>
              </div>
            </div>

            <!-- 颜色设置 -->
            <div v-if="selectedElement.type === 'text' || selectedElement.type === 'shape'" class="prop-group">
              <label class="prop-label">颜色</label>
              <div class="color-picker">
                <input
                  type="color"
                  :value="selectedElement.color || '#000000'"
                  @input="updateElementProp('color', ($event.target as HTMLInputElement).value)"
                  class="color-input"
                />
                <span class="color-value">{{ selectedElement.color || '#000000' }}</span>
              </div>
            </div>

            <!-- R16: 文字背景色 -->
            <div v-if="selectedElement.type === 'text'" class="prop-group">
              <label class="prop-label">文字背景</label>
              <div class="color-picker">
                <input
                  type="color"
                  :value="selectedElement.textBgColor || '#ffffff'"
                  @input="updateElementProp('textBgColor', ($event.target as HTMLInputElement).value)"
                  class="color-input"
                />
                <span class="color-value">{{ selectedElement.textBgColor || '#ffffff' }}</span>
              </div>
            </div>

            <!-- 形状填充色 -->
            <div v-if="selectedElement.type === 'shape'" class="prop-group">
              <label class="prop-label">填充颜色</label>
              <div class="color-picker">
                <input
                  type="color"
                  :value="selectedElement.fill || '#ffffff'"
                  @input="updateElementProp('fill', ($event.target as HTMLInputElement).value)"
                  class="color-input"
                />
                <span class="color-value">{{ selectedElement.fill || '#ffffff' }}</span>
              </div>
            </div>

            <!-- R17: 图片上传 -->
            <div v-if="selectedElement.type === 'image'" class="prop-group">
              <label class="prop-label">图片上传</label>
              <div class="image-upload-area">
                <input
                  type="file"
                  accept="image/*"
                  ref="imageFileInput"
                  @change="handleImageUpload($event)"
                  class="file-input"
                  id="image-upload"
                />
                <label for="image-upload" class="file-label">
                  📷 {{ selectedElement.src ? '更换图片' : '上传图片' }}
                </label>
              </div>
            </div>

            <!-- R17: 图片位置 -->
            <div v-if="selectedElement.type === 'image' && selectedElement.src" class="prop-group">
              <label class="prop-label">对齐方式</label>
              <div class="align-buttons">
                <button @click="setImageAlign('left')" :class="{ active: selectedElement.align === 'left' }" title="居左">⬅</button>
                <button @click="setImageAlign('center')" :class="{ active: selectedElement.align === 'center' || !selectedElement.align }" title="居中">⬌</button>
                <button @click="setImageAlign('right')" :class="{ active: selectedElement.align === 'right' }" title="居右">➡</button>
              </div>
            </div>

            <!-- R17: 图片对象填充 -->
            <div v-if="selectedElement.type === 'image' && selectedElement.src" class="prop-group">
              <label class="prop-label">填充方式</label>
              <select
                class="prop-select"
                :value="selectedElement.objectFit || 'cover'"
                @change="updateElementProp('objectFit', ($event.target as HTMLSelectElement).value)"
              >
                <option value="cover">适应填充</option>
                <option value="contain">完整显示</option>
                <option value="fill">拉伸填充</option>
                <option value="none">原始大小</option>
              </select>
            </div>

            <!-- R51: 视频属性 -->
            <div v-if="selectedElement.type === 'video'" class="prop-group">
              <label class="prop-label">视频来源</label>
              <select
                class="prop-select"
                :value="selectedElement.videoType || 'mp4'"
                @change="updateVideoType(($event.target as HTMLSelectElement).value)"
              >
                <option value="mp4">本地视频 (MP4)</option>
                <option value="youtube">YouTube</option>
                <option value="vimeo">Vimeo</option>
              </select>
            </div>

            <div v-if="selectedElement.type === 'video'" class="prop-group">
              <label class="prop-label">视频链接 / 地址</label>
              <input
                type="text"
                class="prop-input-full"
                :value="selectedElement.videoUrl || ''"
                @input="updateElementProp('videoUrl', ($event.target as HTMLInputElement).value)"
                :placeholder="selectedElement.videoType === 'youtube' ? 'https://youtube.com/watch?v=...' : (selectedElement.videoType === 'vimeo' ? 'https://vimeo.com/...' : 'https://...mp4')"
              />
              <input
                v-if="selectedElement.videoType === 'mp4'"
                type="file"
                accept="video/mp4,video/webm,video/ogg"
                class="file-input"
                :ref="el => videoFileInput = el as HTMLInputElement | null"
                @change="handleVideoUpload($event)"
                id="video-upload"
              />
              <label v-if="selectedElement.videoType === 'mp4'" for="video-upload" class="file-label" style="margin-top:4px">
                📹 {{ selectedElement.videoUrl ? '更换视频' : '上传视频文件' }}
              </label>
            </div>

            <div v-if="selectedElement.type === 'video'" class="prop-group">
              <label class="prop-label">播放控制</label>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" :checked="selectedElement.autoPlay" @change="updateElementProp('autoPlay', ($event.target as HTMLInputElement).checked)" />
                  自动播放
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" :checked="selectedElement.loop" @change="updateElementProp('loop', ($event.target as HTMLInputElement).checked)" />
                  循环播放
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" :checked="selectedElement.muted" @change="updateElementProp('muted', ($event.target as HTMLInputElement).checked)" />
                  静音
                </label>
              </div>
            </div>

            <!-- R51: 音频属性 -->
            <div v-if="selectedElement.type === 'audio'" class="prop-group">
              <label class="prop-label">音频文件</label>
              <input
                type="file"
                accept="audio/mpeg,audio/wav,audio/ogg,audio/mp3,audio/*"
                class="file-input"
                :ref="el => audioFileInput = el as HTMLInputElement | null"
                @change="handleAudioUpload($event)"
                id="audio-upload"
              />
              <label for="audio-upload" class="file-label">
                🎵 {{ selectedElement.audioUrl ? '更换音频' : '上传音频文件' }}
              </label>
              <div v-if="selectedElement.audioUrl" class="audio-preview-mini">
                <audio :src="selectedElement.audioUrl" controls class="audio-native-mini"></audio>
              </div>
            </div>

            <div v-if="selectedElement.type === 'audio'" class="prop-group">
              <label class="prop-label">音频控制</label>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" :checked="selectedElement.autoPlay" @change="updateElementProp('autoPlay', ($event.target as HTMLInputElement).checked)" />
                  自动播放
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" :checked="selectedElement.loop" @change="updateElementProp('loop', ($event.target as HTMLInputElement).checked)" />
                  循环播放
                </label>
              </div>
            </div>

            <!-- R51: GIF动图属性 -->
            <div v-if="selectedElement.type === 'gif'" class="prop-group">
              <label class="prop-label">GIF链接 / 地址</label>
              <input
                type="text"
                class="prop-input-full"
                :value="selectedElement.gifUrl || ''"
                @input="updateElementProp('gifUrl', ($event.target as HTMLInputElement).value)"
                placeholder="https://...gif 或上传GIF文件"
              />
              <input
                type="file"
                accept="image/gif,image/*"
                class="file-input"
                :ref="el => gifFileInput = el as HTMLInputElement | null"
                @change="handleGifUpload($event)"
                id="gif-upload"
              />
              <label for="gif-upload" class="file-label" style="margin-top:4px">
                🎞️ {{ selectedElement.gifUrl ? '更换GIF' : '上传GIF文件' }}
              </label>
            </div>

            <div v-if="selectedElement.type === 'gif' && selectedElement.gifUrl" class="prop-group">
              <label class="prop-label">填充方式</label>
              <select
                class="prop-select"
                :value="selectedElement.objectFit || 'cover'"
                @change="updateElementProp('objectFit', ($event.target as HTMLSelectElement).value)"
              >
                <option value="cover">适应填充</option>
                <option value="contain">完整显示</option>
                <option value="fill">拉伸填充</option>
                <option value="none">原始大小</option>
              </select>
            </div>

            <!-- 对齐 -->
            <div class="prop-group">
              <label class="prop-label">对齐</label>
              <div class="align-buttons">
                <button @click="setAlignment('left')" title="左对齐">⬅</button>
                <button @click="setAlignment('center')" title="居中">⬌</button>
                <button @click="setAlignment('right')" title="右对齐">➡</button>
              </div>
            </div>

            <!-- R20: 层级控制 -->
            <div class="prop-group">
              <label class="prop-label">层级</label>
              <div class="z-index-controls">
                <button @click="bringForward" title="上移一层">⬆ 上移</button>
                <button @click="sendBackward" title="下移一层">⬇ 下移</button>
              </div>
            </div>

            <!-- R130: 动画控制 -->
            <div class="prop-group">
              <label class="prop-label">✨ 动画效果</label>
              <div class="anim-toggle-row">
                <button
                  class="toggle-btn"
                  :class="{ active: selectedElement?.animation?.enabled }"
                  @click="toggleAnimation"
                >
                  {{ selectedElement?.animation?.enabled ? '已启用' : '未启用' }}
                </button>
                <button v-if="selectedElement?.animation?.enabled" class="btn btn-sm" @click="showAnimationPanel = !showAnimationPanel">
                  {{ showAnimationPanel ? '收起' : '配置' }}
                </button>
              </div>
            </div>

            <!-- R130: 动画配置面板 -->
            <div v-if="showAnimationPanel && selectedElement?.animation?.enabled" class="animation-panel">
              <!-- 动画预设库 -->
              <div class="anim-preset-section">
                <label class="prop-label" style="font-size:11px;color:#aaa;">预设库</label>
                <div class="anim-preset-grid">
                  <button
                    v-for="preset in ANIMATION_PRESETS"
                    :key="preset.id"
                    class="anim-preset-btn"
                    :class="{ active: selectedAnimationPresetId === preset.id }"
                    @click="applyAnimationPreset(preset.id)"
                    :title="preset.description"
                  >
                    <span class="preset-icon">{{ getPresetIcon(preset.animation.type) }}</span>
                    <span class="preset-name">{{ preset.nameZh }}</span>
                  </button>
                </div>
              </div>

              <!-- 动画时长 -->
              <div class="prop-group">
                <label class="prop-label">时长: {{ animationDuration.toFixed(1) }}s</label>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  v-model.number="animationDuration"
                  @change="updateAnimationFromControls()"
                  class="prop-range"
                />
              </div>

              <!-- 动画延迟 -->
              <div class="prop-group">
                <label class="prop-label">延迟: {{ animationDelay.toFixed(1) }}s</label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  v-model.number="animationDelay"
                  @change="updateAnimationFromControls()"
                  class="prop-range"
                />
              </div>

              <!-- 缓动曲线 -->
              <div class="prop-group">
                <label class="prop-label">缓动曲线</label>
                <select v-model="animationEasing" @change="updateAnimationFromControls()" class="prop-select">
                  <option value="linear">线性 (linear)</option>
                  <option value="ease">普通 (ease)</option>
                  <option value="ease-in">缓入 (ease-in)</option>
                  <option value="ease-out">缓出 (ease-out)</option>
                  <option value="ease-in-out">缓入缓出 (ease-in-out)</option>
                  <option value="smooth">平滑 (smooth)</option>
                  <option value="snappy">快速 (snappy)</option>
                  <option value="bounce">弹跳 (bounce)</option>
                  <option value="overshoot">过冲 (overshoot)</option>
                  <option value="spring">弹簧 (spring)</option>
                  <option value="gentle">轻柔 (gentle)</option>
                  <option value="sharp">锐利 (sharp)</option>
                  <option value="dramatic">戏剧 (dramatic)</option>
                </select>
              </div>

              <!-- 3D透视 -->
              <div class="prop-group">
                <label class="prop-label">3D透视: {{ animationPerspective }}px</label>
                <input
                  type="range"
                  min="200"
                  max="3000"
                  step="100"
                  v-model.number="animationPerspective"
                  @change="updateAnimationFromControls()"
                  class="prop-range"
                />
              </div>

              <!-- 文字动画模式 (仅文本元素) -->
              <div v-if="selectedElement?.type === 'text'" class="prop-group">
                <label class="prop-label">文字动画</label>
                <div class="anim-text-mode">
                  <button
                    v-for="mode in ['letter', 'word', 'line'] as const"
                    :key="mode"
                    class="anim-mode-btn"
                    :class="{ active: animationTextMode === mode }"
                    @click="animationTextMode = mode; updateAnimationFromControls()"
                  >
                    {{ mode === 'letter' ? '逐字' : mode === 'word' ? '逐词' : '逐行' }}
                  </button>
                </div>
                <div v-if="animationTextMode !== 'line'">
                  <label class="prop-label" style="font-size:11px;">间隔: {{ animationTextStagger }}ms</label>
                  <input
                    type="range"
                    min="20"
                    max="500"
                    step="10"
                    v-model.number="animationTextStagger"
                    @change="updateAnimationFromControls()"
                    class="prop-range"
                  />
                </div>
              </div>

              <button class="btn btn-sm btn-outline" @click="disableAnimation()" style="margin-top:4px;">
                🗑 移除动画
              </button>
            </div>

            <!-- 删除元素 -->
            <div class="prop-group">
              <button class="btn-delete-element" @click="deleteElement">
                🗑️ 删除元素
              </button>
            </div>
          </div>

          <div v-else class="panel-empty">
            <p>选择画布中的元素进行编辑</p>
          </div>

          <!-- R121: Smart Layout Engine -->
          <div class="panel-header" style="margin-top: 8px;">🧠 智能布局</div>
          <div class="smart-layout-section">
            <!-- Auto-balance -->
            <button class="btn btn-sm smart-layout-btn" @click="handleAutoBalance" title="自动平衡分布">
              ⚖️ 自动平衡
            </button>
            <!-- Content reflow -->
            <button class="btn btn-sm smart-layout-btn" @click="handleContentReflow" title="文字环绕重排">
              🔄 内容重排
            </button>
            <!-- Apply smart grid -->
            <button class="btn btn-sm smart-layout-btn" @click="handleApplySmartGrid" title="智能网格对齐">
              📐 网格对齐
            </button>
          </div>

          <!-- R121: Smart Grid Controls -->
          <div class="panel-header" style="margin-top: 8px;">🔲 智能网格</div>
          <div class="smart-grid-section">
            <div class="grid-toggle-row">
              <label class="prop-label">启用智能网格</label>
              <button
                class="toggle-btn"
                :class="{ active: smartGridEnabled }"
                @click="smartGridEnabled = !smartGridEnabled"
              >
                {{ smartGridEnabled ? 'ON' : 'OFF' }}
              </button>
            </div>
            <div class="grid-presets-row" v-if="smartGridEnabled">
              <select
                class="grid-select"
                v-model="smartGridSize"
                @change="handleApplySmartGrid"
              >
                <option v-for="preset in GRID_PRESETS" :key="preset.id" :value="preset.size">
                  {{ preset.icon }} {{ preset.name }}
                </option>
              </select>
            </div>
          </div>

          <!-- R121: Aspect Ratio Selector -->
          <div class="panel-header" style="margin-top: 8px;">📐 响应式比例</div>
          <div class="aspect-ratio-section">
            <div class="aspect-ratio-grid">
              <div
                v-for="ratio in ASPECT_RATIOS"
                :key="ratio.id"
                class="aspect-ratio-item"
                :class="{ active: activeAspectRatio === ratio.id }"
                @click="handleAspectRatioChange(ratio.id)"
                :title="ratio.name"
              >
                <span class="aspect-icon">{{ ratio.icon }}</span>
                <span class="aspect-name">{{ ratio.id }}</span>
              </div>
            </div>
          </div>

          <!-- R20/R21: 布局可视化选择 -->
          <div class="panel-header" style="margin-top: 8px;">📐 布局预设</div>
          <div class="layout-grid">
            <div
              v-for="layout in layoutPresets"
              :key="layout.id"
              class="layout-thumb"
              :class="{ active: activeLayout === layout.id }"
              @click="applyLayoutPreset(layout)"
              :title="layout.name"
            >
              <div class="layout-preview-icon">{{ layout.icon }}</div>
              <span class="layout-name">{{ layout.name }}</span>
            </div>
          </div>

          <!-- R21: 排版系统 -->
          <div class="panel-header" style="margin-top: 8px;">🎨 排版主题</div>
          <div class="theme-section">
            <div class="theme-group">
              <label class="prop-label">字体主题</label>
              <div class="theme-options">
                <div
                  v-for="theme in fontThemes"
                  :key="theme.id"
                  class="theme-item"
                  :class="{ active: activeFontTheme === theme.id }"
                  @click="applyFontTheme(theme)"
                >
                  <span class="theme-icon">{{ theme.icon }}</span>
                  <span class="theme-name">{{ theme.name }}</span>
                </div>
              </div>
            </div>

            <div class="theme-group">
              <label class="prop-label">背景色</label>
              <div class="bg-color-picker">
                <input
                  type="color"
                  :value="slideBackground"
                  @input="updateSlideBackground(($event.target as HTMLInputElement).value)"
                  class="color-input"
                />
                <select class="bg-preset-select" @change="applyBgPreset(($event.target as HTMLSelectElement).value)">
                  <option value="">自定义</option>
                  <option value="#ffffff">纯白</option>
                  <option value="#f5f5f5">浅灰</option>
                  <option value="#1a1a2e">深蓝黑</option>
                  <option value="linear-gradient(135deg, #667eea 0%, #764ba2 100%)">渐变紫</option>
                  <option value="linear-gradient(135deg, #11998e 0%, #38ef7d 100%)">渐变绿</option>
                  <option value="linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)">渐变粉</option>
                </select>
              </div>
            </div>

            <div class="theme-group">
              <label class="prop-label">配色方案</label>
              <div class="color-scheme-grid">
                <div
                  v-for="(scheme, idx) in colorSchemes"
                  :key="idx"
                  class="color-scheme-item"
                  :class="{ active: activeColorScheme === idx }"
                  @click="applyColorScheme(idx)"
                  :title="scheme.name"
                >
                  <div class="scheme-swatches">
                    <span
                      v-for="c in scheme.colors"
                      :key="c"
                      class="scheme-swatch"
                      :style="{ background: c }"
                    ></span>
                  </div>
                </div>
              </div>
            </div>

            <div class="theme-group">
              <label class="prop-label">间距</label>
              <div class="spacing-options">
                <button
                  v-for="sp in spacingOptions"
                  :key="sp.value"
                  class="spacing-btn"
                  :class="{ active: activeSpacing === sp.value }"
                  @click="applySpacing(sp.value)"
                >{{ sp.label }}</button>
              </div>
            </div>
          </div>

          <!-- 添加元素 -->
          <div class="panel-add">
            <div class="panel-header">添加元素</div>
            <div class="add-buttons">
              <button @click="addElement('text')" title="添加文本">📝 文本</button>
              <button @click="addElement('shape')" title="添加形状">■ 形状</button>
              <button @click="addElement('image')" title="添加图片">🖼️ 图片</button>
              <button @click="addElement('video')" title="添加视频">🎬 视频</button>
              <button @click="addElement('audio')" title="添加音频">🎵 音频</button>
              <button @click="addElement('gif')" title="添加动图">🎞️ 动图</button>
            </div>
          </div>
        </div>
      </div>

      <div class="editor-footer">
        <button class="btn btn-outline" @click="resetChanges">重置</button>
        <button class="btn btn-primary" @click="applyChanges">应用更改</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import api from '../api/client'
import { useSmartLayout, LAYOUT_PRESETS, GRID_PRESETS, ASPECT_RATIOS } from '../composables/useSmartLayout'
import { ANIMATION_PRESETS, BEZIER_CURVES, easingToCubic, type AnimationType, type EasingType, type AnimationPreset } from '../composables/useAnimation'

// R121: Smart Layout Engine
const {
  smartGridEnabled,
  smartGridSize,
  smartGridCols,
  smartGridRows,
  activeSmartLayout,
  activeAspectRatio,
  autoBalanceElements,
  reflowTextContent,
  applySmartLayoutPreset,
  snapElementToSmartGrid,
  adaptToAspectRatio,
  scaleElements,
} = useSmartLayout()

interface SlideElementAnimation {
  enabled: boolean
  presetId: string
  type: AnimationType
  duration: number    // seconds
  delay: number       // seconds
  easing: EasingType
  textMode?: 'letter' | 'word' | 'line'
  textStagger?: number
  perspective?: number
  customCurve?: [number, number, number, number]
}

interface SlideElement {
  id: string
  type: 'text' | 'shape' | 'image' | 'video' | 'audio' | 'gif'
  x: number
  y: number
  width: number
  height: number
  content?: string
  color?: string
  fill?: string
  radius?: string
  fontSize?: number
  fontWeight?: string
  fontFamily?: string
  fontStyle?: string
  textDecoration?: string
  textAlign?: string
  textBgColor?: string
  lineHeight?: string
  objectFit?: string
  align?: string
  src?: string
  zIndex?: number
  // R51: video
  videoUrl?: string
  videoType?: 'youtube' | 'vimeo' | 'mp4'
  // R51: audio
  audioUrl?: string
  // R51: gif
  gifUrl?: string
  autoPlay?: boolean
  loop?: boolean
  muted?: boolean
  // R130: Animation
  animation?: SlideElementAnimation
}

interface Slide {
  background?: string
  elements: SlideElement[]
}

// R16: 富文本状态
const richFontFamily = ref('宋体')
const richFontSize = ref('18')
const richTextColor = ref('#000000')
const richBgColor = ref('#ffffff')
const richLineHeight = ref('1.5')
const textRefs = ref<HTMLElement[]>([])

// R20: 辅助线状态
const showGuides = ref(true)
const guideX = ref<number | null>(null)
const guideY = ref<number | null>(null)

// R20: 布局预设
const activeLayout = ref('default')
// R121: Expanded layout presets from smart layout engine
const layoutPresets = LAYOUT_PRESETS

// R21: 字体主题
const activeFontTheme = ref('default')
const fontThemes = [
  { id: 'default', name: '默认', fontFamily: '宋体' },
  { id: 'professional', name: '商务', fontFamily: '微软雅黑' },
  { id: 'tech', name: '科技', fontFamily: 'Arial' },
  { id: 'simple', name: '简约', fontFamily: 'Georgia' },
  { id: 'chinese', name: '国风', fontFamily: '楷体' },
]

// R21: 配色方案
const activeColorScheme = ref(0)
const colorSchemes = [
  { name: '商务蓝', colors: ['#165DFF', '#FFFFFF', '#F5F5F5', '#0e42d2'] },
  { name: '科技紫', colors: ['#667EEA', '#764BA2', '#F5F5F5', '#5a71d6'] },
  { name: '清新绿', colors: ['#34C759', '#FFFFFF', '#F0F9F0', '#2cad4a'] },
  { name: '活力橙', colors: ['#FF6B35', '#FFFFFF', '#FFF5F0', '#e08600'] },
  { name: '经典红', colors: ['#E53935', '#FFFFFF', '#FFEBEE', '#c62828'] },
  { name: '深空灰', colors: ['#1F2937', '#FFFFFF', '#F3F4F6', '#111827'] },
]

// R21: 间距选项
const activeSpacing = ref('standard')

// R130: 动画状态
const showAnimationPanel = ref(false)
const selectedAnimationPresetId = ref<string>('')
const animationDuration = ref(0.5)
const animationDelay = ref(0)
const animationEasing = ref<EasingType>('smooth')
const animationTextMode = ref<'letter' | 'word' | 'line'>('word')
const animationTextStagger = ref(150)
const animationPerspective = ref(1200)

// Apply animation preset to selected element
const applyAnimationPreset = (presetId: string) => {
  if (!selectedElement.value) return
  const preset = ANIMATION_PRESETS.find(p => p.id === presetId)
  if (!preset) return
  selectedAnimationPresetId.value = presetId
  animationDuration.value = preset.animation.duration
  animationDelay.value = preset.animation.delay
  animationEasing.value = preset.animation.easing
  animationPerspective.value = preset.animation.perspective || 1200
  if (preset.animation.textMode) {
    animationTextMode.value = preset.animation.textMode as 'letter' | 'word' | 'line'
  }
  if (preset.animation.textStagger) {
    animationTextStagger.value = preset.animation.textStagger
  }
  const anim = selectedElement.value.animation || { enabled: false }
  selectedElement.value.animation = {
    enabled: true,
    presetId,
    type: preset.animation.type,
    duration: preset.animation.duration,
    delay: preset.animation.delay,
    easing: preset.animation.easing,
    textMode: preset.animation.textMode as 'letter' | 'word' | 'line' | undefined,
    textStagger: preset.animation.textStagger,
    perspective: preset.animation.perspective,
  }
  updateElement()
}

const disableAnimation = () => {
  if (!selectedElement.value) return
  selectedAnimationPresetId.value = ''
  if (selectedElement.value.animation) {
    selectedElement.value.animation.enabled = false
  }
  updateElement()
}

const toggleAnimation = () => {
  if (!selectedElement.value) return
  if (selectedElement.value.animation?.enabled) {
    disableAnimation()
  } else {
    showAnimationPanel.value = !showAnimationPanel.value
  }
}

const updateAnimationFromControls = () => {
  if (!selectedElement.value || !selectedAnimationPresetId.value) return
  const anim = selectedElement.value.animation || { enabled: false }
  selectedElement.value.animation = {
    ...anim,
    enabled: true,
    presetId: selectedAnimationPresetId.value,
    duration: animationDuration.value,
    delay: animationDelay.value,
    easing: animationEasing.value,
    textMode: animationTextMode.value,
    textStagger: animationTextStagger.value,
    perspective: animationPerspective.value,
  }
  updateElement()
}
const spacingOptions = [
  { value: 'compact', label: '紧凑' },
  { value: 'standard', label: '标准' },
  { value: 'loose', label: '宽松' },
]

// R21: 幻灯片背景色
const slideBackground = ref('#ffffff')

// R32: AI 增强功能状态
const aiLoading = ref(false)
const aiLoadingText = ref('')
const contentScore = ref<any>(null)
const showScoreModal = ref(false)
const layoutSuggestion = ref<any>(null)
const showLayoutModal = ref(false)
const enhancementResult = ref<any>(null)
const showEnhanceModal = ref(false)

// R133: Content Template
const showTemplateModal = ref(false)
const templateType = ref('bullet_points')
const templateTopic = ref('')
const templateContext = ref('')
const templateCount = ref(3)
const templateResult = ref<any>(null)
const translateTarget = ref('en')
const translateOptions = [
  // East Asia
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  // Southeast Asia
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'th', label: 'ภาษาไทย' },
  { value: 'id', label: 'Bahasa Indonesia' },
  { value: 'ms', label: 'Bahasa Melayu' },
  { value: 'tl', label: 'Filipino' },
  { value: 'my', label: 'Myanmar' },
  { value: 'km', label: 'Khmer' },
  { value: 'lo', label: 'Lao' },
  // South Asia
  { value: 'hi', label: 'हिन्दी' },
  { value: 'bn', label: 'বাংলা' },
  { value: 'ur', label: 'اردو' },
  { value: 'pa', label: 'ਪੰਜਾਬੀ' },
  { value: 'ne', label: 'नेपाली' },
  { value: 'si', label: 'සිංහල' },
  { value: 'ta', label: 'தமிழ்' },
  { value: 'te', label: 'తెలుగు' },
  { value: 'mr', label: 'मराठी' },
  { value: 'gu', label: 'ગુજરાતી' },
  { value: 'ml', label: 'മലയാളം' },
  { value: 'kn', label: 'ಕನ್ನಡ' },
  // Central & West Asia
  { value: 'tr', label: 'Türkçe' },
  { value: 'fa', label: 'فارسی' },
  { value: 'az', label: 'Azərbaycan' },
  { value: 'uz', label: 'Oʻzbek' },
  { value: 'kk', label: 'Қазақ' },
  { value: 'ky', label: 'Кыргыз' },
  { value: 'tg', label: 'Тоҷикӣ' },
  { value: 'tk', label: 'Türkmen' },
  // Europe
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
  { value: 'pt', label: 'Português' },
  { value: 'it', label: 'Italiano' },
  { value: 'ru', label: 'Русский' },
  { value: 'uk', label: 'Українська' },
  { value: 'pl', label: 'Polski' },
  { value: 'nl', label: 'Nederlands' },
  { value: 'el', label: 'Ελληνικά' },
  { value: 'cs', label: 'Čeština' },
  { value: 'hu', label: 'Magyar' },
  { value: 'ro', label: 'Română' },
  { value: 'sv', label: 'Svenska' },
  { value: 'da', label: 'Dansk' },
  { value: 'fi', label: 'Suomi' },
  { value: 'no', label: 'Norsk' },
  { value: 'sk', label: 'Slovenčina' },
  { value: 'bg', label: 'Български' },
  { value: 'hr', label: 'Hrvatski' },
  { value: 'sr', label: 'Српски' },
  { value: 'sl', label: 'Slovenščina' },
  { value: 'et', label: 'Eesti' },
  { value: 'lv', label: 'Latviešu' },
  { value: 'lt', label: 'Lietuvių' },
  // Middle East & Africa
  { value: 'ar', label: 'العربية' },
  { value: 'he', label: 'עברית' },
  { value: 'sw', label: 'Kiswahili' },
  { value: 'ha', label: 'Hausa' },
  { value: 'yo', label: 'Yorùbá' },
  { value: 'zu', label: 'isiZulu' },
  { value: 'am', label: 'አማርኛ' },
  // East Asia 2
  { value: 'mn', label: 'Монгол' },
]

// R32: AI 改写 + R72: 语气风格
const rephraseStyle = ref('natural')

// R109: AI 语气调整
const toneStyle = ref('formal')

const rephraseText = async () => {
  if (selectedElementIndex.value === null) return
  const el = slides.value[activeSlideIndex.value].elements[selectedElementIndex.value]
  if (!el.content) return
  aiLoading.value = true
  aiLoadingText.value = '改写中...'
  try {
    const res = await api.ai.rephrase(el.content, rephraseStyle.value)
    if (res.data.success) {
      saveHistory()
      el.content = res.data.rephrased
    }
  } catch (e: any) {
    console.error('改写失败', e)
    alert('改写失败: ' + (e?.message || '未知错误'))
  } finally {
    aiLoading.value = false
    aiLoadingText.value = ''
  }
}

// R72: AI 内容扩展/压缩
const expandRatio = ref(1.5)

const setExpandRatio = (val: number) => {
  expandRatio.value = val
}

const expandShortenText = async () => {
  if (selectedElementIndex.value === null) return
  const el = slides.value[activeSlideIndex.value].elements[selectedElementIndex.value]
  if (!el.content) return
  aiLoading.value = true
  aiLoadingText.value = expandRatio.value > 1.0 ? '扩展中...' : '压缩中...'
  try {
    const res = await api.ai.expandShorten(el.content, expandRatio.value)
    if (res.data.success) {
      saveHistory()
      el.content = res.data.result
    }
  } catch (e: any) {
    console.error('扩展/压缩失败', e)
    alert('扩展/压缩失败: ' + (e?.message || '未知错误'))
  } finally {
    aiLoading.value = false
    aiLoadingText.value = ''
  }
}

// R72: AI 语法拼写检查
const grammarCheckText = async () => {
  if (selectedElementIndex.value === null) return
  const el = slides.value[activeSlideIndex.value].elements[selectedElementIndex.value]
  if (!el.content) return
  aiLoading.value = true
  aiLoadingText.value = '检查中...'
  try {
    const res = await api.ai.grammarCheck(el.content)
    if (res.data.success) {
      const check = res.data.check
      if (check.has_errors && check.errors.length > 0) {
        const errorList = check.errors.map((e: any) => `• ${e.original} → ${e.correction} (${e.reason})`).join('\n')
        const confirmed = confirm(`发现 ${check.errors.length} 处问题：\n${errorList}\n\n是否应用修正？`)
        if (confirmed) {
          saveHistory()
          el.content = check.corrected
        }
      } else {
        alert('✅ 未发现语法或拼写错误')
      }
    }
  } catch (e: any) {
    console.error('语法检查失败', e)
    alert('语法检查失败: ' + (e?.message || '未知错误'))
  } finally {
    aiLoading.value = false
    aiLoadingText.value = ''
  }
}

// R109: AI 智能脚注
const addSmartFootnotes = async () => {
  if (selectedElementIndex.value === null) return
  const el = slides.value[activeSlideIndex.value].elements[selectedElementIndex.value]
  if (!el.content) return
  aiLoading.value = true
  aiLoadingText.value = '添加脚注...'
  try {
    const res = await api.ai.smartFootnotes(el.content)
    if (res.data.success) {
      const data = res.data.footnotes
      if (data.footnotes && data.footnotes.length > 0) {
        const footnotesList = data.footnotes.map((fn: any, i: number) =>
          `${fn.in_text_mark || '[*]'} ${fn.source} (${fn.source_type}): ${fn.description}`
        ).join('\n')
        const msg = `找到 ${data.footnotes.length} 条相关引用：\n${footnotesList}\n\n是否将脚注添加到文本末尾？`
        const confirmed = confirm(msg)
        if (confirmed) {
          saveHistory()
          const footnoteText = '\n\n—— 参考文献 ——\n' + data.footnotes.map((fn: any, i: number) =>
            `${i + 1}. ${fn.source} (${fn.source_type}): ${fn.description}`
          ).join('\n')
          el.content = el.content + footnoteText
        }
      } else {
        alert('📎 未找到相关引用来源')
      }
    }
  } catch (e: any) {
    console.error('添加脚注失败', e)
    alert('添加脚注失败: ' + (e?.message || '未知错误'))
  } finally {
    aiLoading.value = false
    aiLoadingText.value = ''
  }
}

// R109: AI 语气调整
const adjustTone = async () => {
  if (selectedElementIndex.value === null) return
  const el = slides.value[activeSlideIndex.value].elements[selectedElementIndex.value]
  if (!el.content) return
  aiLoading.value = true
  aiLoadingText.value = '调整语气...'
  try {
    const res = await api.ai.toneAdjust(el.content, toneStyle.value)
    if (res.data.success) {
      const adjusted = res.data.adjusted
      const toneNames: Record<string, string> = {
        formal: '正式', casual: '休闲', technical: '技术', persuasive: '有说服力', warm: '温暖'
      }
      const toneName = toneNames[adjusted.tone] || adjusted.tone
      const msg = `【语气调整为 ${toneName}】\n\n${adjusted.adjusted}\n\n调整说明: ${adjusted.changes_summary}\n\n是否应用？`
      const confirmed = confirm(msg)
      if (confirmed) {
        saveHistory()
        el.content = adjusted.adjusted
      }
    }
  } catch (e: any) {
    console.error('语气调整失败', e)
    alert('语气调整失败: ' + (e?.message || '未知错误'))
  } finally {
    aiLoading.value = false
    aiLoadingText.value = ''
  }
}

// R109: AI 陈词滥调检测
const detectCliches = async () => {
  if (selectedElementIndex.value === null) return
  const el = slides.value[activeSlideIndex.value].elements[selectedElementIndex.value]
  if (!el.content) return
  aiLoading.value = true
  aiLoadingText.value = '检测中...'
  try {
    const res = await api.ai.clicheDetect(el.content)
    if (res.data.success) {
      const detection = res.data.detection
      if (detection.has_cliches && detection.detected.length > 0) {
        const clicheList = detection.detected.map((c: any) =>
          `• "${c.phrase}" → ${c.alternatives.map((a: any) => `"${a.text}" (${a.style})`).join(', ')}`
        ).join('\n')
        const msg = `发现 ${detection.detected.length} 处陈词滥调：\n${clicheList}\n\n是否自动替换为第一推荐？`
        const confirmed = confirm(msg)
        if (confirmed) {
          saveHistory()
          el.content = detection.cleaned_text
        }
      } else {
        alert('✅ 未检测到明显的陈词滥调，表达较新颖！')
      }
    }
  } catch (e: any) {
    console.error('陈词滥调检测失败', e)
    alert('陈词滥调检测失败: ' + (e?.message || '未知错误'))
  } finally {
    aiLoading.value = false
    aiLoadingText.value = ''
  }
}

// R32: AI 翻译
const translateText = async () => {
  if (selectedElementIndex.value === null) return
  const el = slides.value[activeSlideIndex.value].elements[selectedElementIndex.value]
  if (!el.content) return
  aiLoading.value = true
  aiLoadingText.value = '翻译中...'
  try {
    const res = await api.ai.translate(el.content, translateTarget.value)
    if (res.data.success) {
      saveHistory()
      el.content = res.data.translated
    }
  } catch (e: any) {
    console.error('翻译失败', e)
    alert('翻译失败: ' + (e?.message || '未知错误'))
  } finally {
    aiLoading.value = false
    aiLoadingText.value = ''
  }
}

// R32: 智能布局建议
const requestLayoutSuggestion = async () => {
  const elements = slides.value[activeSlideIndex.value].elements
  const content = elements.map((e: any) => e.content || '').join(' ')
  aiLoading.value = true
  aiLoadingText.value = '分析布局...'
  try {
    const res = await api.ai.layoutSuggestion({
      slideIndex: activeSlideIndex.value,
      elements,
      slideContent: content
    })
    if (res.data.success) {
      layoutSuggestion.value = res.data.suggestion
      showLayoutModal.value = true
    }
  } catch (e: any) {
    console.error('布局建议失败', e)
    alert('布局建议失败: ' + (e?.message || '未知错误'))
  } finally {
    aiLoading.value = false
    aiLoadingText.value = ''
  }
}

// R32: 应用布局建议
const applyLayoutSuggestion = () => {
  if (!layoutSuggestion.value) return
  const suggestions = layoutSuggestion.value.suggested_alignments || []
  saveHistory()
  suggestions.forEach((sug: any) => {
    const idx = sug.element_index
    if (idx >= 0 && idx < slides.value[activeSlideIndex.value].elements.length) {
      const el = slides.value[activeSlideIndex.value].elements[idx]
      el.x = sug.x
      el.y = sug.y
      el.width = sug.width
      el.height = sug.height
    }
  })
  showLayoutModal.value = false
  layoutSuggestion.value = null
}

// R32: 一键美化
const requestAutoEnhance = async () => {
  const elements = slides.value[activeSlideIndex.value].elements
  aiLoading.value = true
  aiLoadingText.value = '美化中...'
  try {
    const res = await api.ai.autoEnhance({
      slideIndex: activeSlideIndex.value,
      elements,
      colorScheme: '#165DFF'
    })
    if (res.data.success) {
      enhancementResult.value = res.data.enhancement
      showEnhanceModal.value = true
    }
  } catch (e: any) {
    console.error('美化失败', e)
    alert('美化失败: ' + (e?.message || '未知错误'))
  } finally {
    aiLoading.value = false
    aiLoadingText.value = ''
  }
}

// R32: 应用美化结果
const applyEnhancement = () => {
  if (!enhancementResult.value) return
  const enh = enhancementResult.value
  saveHistory()
  const scheme = enh.improved_color_scheme || []
  slides.value[activeSlideIndex.value].elements.forEach((el: any, i: number) => {
    if (el.type === 'text') {
      el.color = scheme[3] || scheme[0] || el.color
      if (scheme[2]) el.textBgColor = scheme[2]
    } else if (el.type === 'shape') {
      el.fill = scheme[0] || el.fill
    }
  })
  if (enh.suggested_font) {
    slides.value[activeSlideIndex.value].elements.forEach((el: any) => {
      if (el.type === 'text') el.fontFamily = enh.suggested_font
    })
  }
  showEnhanceModal.value = false
  enhancementResult.value = null
}

// R32: 内容质量评分
const requestContentScore = async () => {
  const elements = slides.value[activeSlideIndex.value].elements
  const content = elements.map((e: any) => e.content || '').join(' ')
  aiLoading.value = true
  aiLoadingText.value = '评分中...'
  try {
    const res = await api.ai.contentScore({ elements, slideContent: content })
    if (res.data.success) {
      contentScore.value = res.data.score
      showScoreModal.value = true
    }
  } catch (e: any) {
    console.error('评分失败', e)
    alert('评分失败: ' + (e?.message || '未知错误'))
  } finally {
    aiLoading.value = false
    aiLoadingText.value = ''
  }
}

// R133: Content Template Modal
const openContentTemplateModal = () => {
  templateResult.value = null
  showTemplateModal.value = true
}

const generateContentTemplate = async () => {
  if (!templateTopic.value) return
  aiLoading.value = true
  aiLoadingText.value = '生成内容模板...'
  try {
    const res = await api.ai.generateContentTemplate({
      template_type: templateType.value,
      topic: templateTopic.value,
      context: templateContext.value,
      count: templateCount.value,
    })
    if (res.data.success) {
      templateResult.value = res.data.content
    }
  } catch (e: any) {
    console.error('内容模板生成失败', e)
    alert('内容模板生成失败: ' + (e?.message || '未知错误'))
  } finally {
    aiLoading.value = false
    aiLoadingText.value = ''
  }
}

const formatTemplateResult = (result: any): string => {
  if (!result) return ''
  // Format different template types for display
  const type = templateType.value
  if (type === 'title') {
    return `主标题: ${result.main_title || ''}\n副标题: ${result.subtitle || ''}\nTagline: ${result.tagline || ''}`
  } else if (type === 'agenda' && result.items) {
    return result.items.map((item: any, i: number) =>
      `${item.index || i + 1}. ${item.title}${item.description ? ' - ' + item.description : ''}`
    ).join('\n')
  } else if (type === 'bullet_points' && result.points) {
    return result.points.map((p: any) => `${p.icon || '•'} ${p.text}`).join('\n')
  } else if (type === 'comparison' && result.comparisons) {
    return result.comparisons.map((c: any) =>
      `${c.item}:\n  A: ${c.option_a}\n  B: ${c.option_b}`
    ).join('\n\n')
  } else if (type === 'process' && result.steps) {
    return result.steps.map((s: any) => `Step ${s.step}: ${s.title}\n  ${s.description}`).join('\n\n')
  } else if (type === 'data_chart' && result.metrics) {
    return result.metrics.map((m: any) => `${m.value} - ${m.label}: ${m.description}`).join('\n')
  } else if (type === 'quote') {
    return `"${result.quote}"\n— ${result.author}${result.context ? ' (' + result.context + ')' : ''}`
  } else if (type === 'summary') {
    const points = (result.summary_points || []).map((p: any) => '• ' + p.point).join('\n')
    return `标题: ${result.title || ''}\n\n${points}\n\n行动号召: ${result.takeaway || ''}`
  } else if (type === 'team_intro' && result.members) {
    return result.members.map((m: any) => `${m.name} (${m.role}): ${m.description}`).join('\n')
  } else if (type === 'case_study') {
    return `案例: ${result.case_title || ''}\n\n背景: ${result.background || ''}\n\n挑战: ${result.challenge || ''}\n\n方案: ${result.solution || ''}\n\n成果: ${result.result || ''}\n\n洞察: ${result.insight || ''}`
  }
  return JSON.stringify(result, null, 2)
}

const applyContentTemplate = () => {
  if (!templateResult.value) return
  const result = templateResult.value
  let content = ''

  const type = templateType.value
  if (type === 'title') {
    content = `${result.main_title || ''}\n${result.subtitle || ''}`
    if (result.tagline) content += `\n${result.tagline}`
  } else if (type === 'agenda' && result.items) {
    content = result.items.map((item: any, i: number) =>
      `${item.index || i + 1}. ${item.title}${item.description ? '\n   ' + item.description : ''}`
    ).join('\n')
  } else if (type === 'bullet_points' && result.points) {
    content = result.points.map((p: any) => `${p.icon || '•'} ${p.text}`).join('\n')
  } else if (type === 'comparison' && result.comparisons) {
    content = result.comparisons.map((c: any) =>
      `${c.item}:\n  A: ${c.option_a}\n  B: ${c.option_b}`
    ).join('\n\n')
  } else if (type === 'process' && result.steps) {
    content = result.steps.map((s: any) => `Step ${s.step}: ${s.title}\n  ${s.description}`).join('\n\n')
  } else if (type === 'data_chart' && result.metrics) {
    content = result.metrics.map((m: any) => `${m.value} ${m.label}: ${m.description}`).join('\n')
  } else if (type === 'quote') {
    content = `"${result.quote}"\n— ${result.author}`
  } else if (type === 'summary') {
    content = (result.summary_points || []).map((p: any) => '• ' + p.point).join('\n')
    if (result.takeaway) content += '\n\n' + result.takeaway
  } else if (type === 'team_intro' && result.members) {
    content = result.members.map((m: any) => `${m.name} (${m.role}): ${m.description}`).join('\n')
  } else if (type === 'case_study') {
    content = `${result.case_title || ''}\n\n背景: ${result.background || ''}\n挑战: ${result.challenge || ''}\n方案: ${result.solution || ''}\n成果: ${result.result || ''}\n洞察: ${result.insight || ''}`
  }

  if (selectedElementIndex.value !== null) {
    const el = slides.value[activeSlideIndex.value].elements[selectedElementIndex.value]
    if (el.type === 'text') {
      saveHistory()
      el.content = content
    } else {
      alert('请先选择一个文本元素')
    }
  } else {
    // Create new text element
    saveHistory()
    const slide = slides.value[activeSlideIndex.value]
    const newEl = {
      type: 'text',
      content: content,
      x: 50,
      y: 100,
      width: 600,
      height: 300,
      fontSize: 18,
      fontFamily: '微软雅黑',
      color: '#222222',
      bold: false,
      italic: false,
      align: 'left',
    }
    slide.elements.push(newEl)
    selectedElementIndex.value = slide.elements.length - 1
  }

  showTemplateModal.value = false
  templateResult.value = null
}

const emit = defineEmits(['close', 'apply'])

const props = defineProps<{
  slideCount: number
}>()

const slides = ref<Slide[]>([])
const activeSlideIndex = ref(0)
const selectedElementIndex = ref<number | null>(null)
const isDragging = ref(false)
const isResizing = ref(false)
const dragStart = ref({ x: 0, y: 0, elementX: 0, elementY: 0 })
const resizeHandle = ref('')
const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0, elX: 0, elY: 0 })
const imageFileInput = ref<HTMLInputElement | null>(null)

// 撤销/重做历史记录
const history = ref<Slide[][]>([])
const historyIndex = ref(-1)
const maxHistory = 50

const saveHistory = () => {
  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1)
  }
  history.value.push(JSON.parse(JSON.stringify(slides.value)))
  if (history.value.length > maxHistory) {
    history.value.shift()
  } else {
    historyIndex.value++
  }
}

const canUndo = computed(() => historyIndex.value > 0)
const canRedo = computed(() => historyIndex.value < history.value.length - 1)

const undo = () => {
  if (canUndo.value) {
    historyIndex.value--
    slides.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]))
    selectedElementIndex.value = null
  }
}

const redo = () => {
  if (canRedo.value) {
    historyIndex.value++
    slides.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]))
    selectedElementIndex.value = null
  }
}

// R16: 执行富文本格式
const execFormat = (command: string) => {
  document.execCommand(command, false)
  // 更新选中元素的样式
  if (selectedElementIndex.value !== null) {
    const el = slides.value[activeSlideIndex.value].elements[selectedElementIndex.value]
    if (command === 'bold') {
      el.fontWeight = el.fontWeight === 'bold' ? 'normal' : 'bold'
    } else if (command === 'italic') {
      el.fontStyle = el.fontStyle === 'italic' ? 'normal' : 'italic'
    } else if (command === 'underline') {
      el.textDecoration = el.textDecoration === 'underline' ? 'none' : 'underline'
    }
  }
}

const isFormatActive = (command: string) => {
  if (selectedElementIndex.value === null) return false
  const el = slides.value[activeSlideIndex.value].elements[selectedElementIndex.value]
  if (command === 'bold') return el.fontWeight === 'bold'
  if (command === 'italic') return el.fontStyle === 'italic'
  if (command === 'underline') return el.textDecoration === 'underline'
  return false
}

const applyRichFontFamily = () => {
  if (selectedElementIndex.value === null) return
  saveHistory()
  slides.value[activeSlideIndex.value].elements[selectedElementIndex.value].fontFamily = richFontFamily.value
}

const applyRichFontSize = () => {
  if (selectedElementIndex.value === null) return
  saveHistory()
  slides.value[activeSlideIndex.value].elements[selectedElementIndex.value].fontSize = Number(richFontSize.value)
}

const applyRichTextColor = () => {
  if (selectedElementIndex.value === null) return
  saveHistory()
  slides.value[activeSlideIndex.value].elements[selectedElementIndex.value].color = richTextColor.value
}

const applyRichBgColor = () => {
  if (selectedElementIndex.value === null) return
  saveHistory()
  slides.value[activeSlideIndex.value].elements[selectedElementIndex.value].textBgColor = richBgColor.value
}

const applyRichLineHeight = () => {
  if (selectedElementIndex.value === null) return
  saveHistory()
  slides.value[activeSlideIndex.value].elements[selectedElementIndex.value].lineHeight = richLineHeight.value
}

// R16: 切换字体样式
const toggleFontStyle = (style: string) => {
  if (selectedElementIndex.value === null) return
  saveHistory()
  const el = slides.value[activeSlideIndex.value].elements[selectedElementIndex.value]
  el.fontStyle = el.fontStyle === 'italic' ? 'normal' : 'italic'
}

const toggleTextDecoration = (decoration: string) => {
  if (selectedElementIndex.value === null) return
  saveHistory()
  const el = slides.value[activeSlideIndex.value].elements[selectedElementIndex.value]
  el.textDecoration = el.textDecoration === 'underline' ? 'none' : 'underline'
}

const toggleFontWeight = () => {
  if (selectedElementIndex.value === null) return
  saveHistory()
  const el = slides.value[activeSlideIndex.value].elements[selectedElementIndex.value]
  el.fontWeight = el.fontWeight === 'bold' ? 'normal' : 'bold'
}

// R17: 图片上传处理
const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file || selectedElementIndex.value === null) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const result = e.target?.result as string
    saveHistory()
    slides.value[activeSlideIndex.value].elements[selectedElementIndex.value!].src = result
    // 自动调整元素尺寸以适应图片
    const img = new Image()
    img.onload = () => {
      const el = slides.value[activeSlideIndex.value].elements[selectedElementIndex.value!]
      // 按比例缩放图片
      const maxW = 400, maxH = 300
      const ratio = Math.min(maxW / img.width, maxH / img.height, 1)
      el.width = Math.round(img.width * ratio)
      el.height = Math.round(img.height * ratio)
    }
    img.src = result
  }
  reader.readAsDataURL(file)
}

const setImageAlign = (align: string) => {
  if (selectedElementIndex.value === null) return
  saveHistory()
  slides.value[activeSlideIndex.value].elements[selectedElementIndex.value].align = align
}

const getImageStyle = (el: SlideElement) => ({
  objectFit: el.objectFit || 'cover',
  textAlign: el.align || 'center',
})

// R51: 视频URL解析
const getYouTubeEmbedUrl = (url: string): string => {
  if (!url) return ''
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=0&rel=0`
  }
  return url
}

const getVimeoEmbedUrl = (url: string): string => {
  if (!url) return ''
  const match = url.match(/vimeo\.com\/(\d+)/)
  if (match) return `https://player.vimeo.com/video/${match[1]}?autoplay=0&title=0&byline=0&portrait=0`
  return url
}

// R51: 视频类型更新
const updateVideoType = (type: string) => {
  if (selectedElementIndex.value === null) return
  saveHistory()
  slides.value[activeSlideIndex.value].elements[selectedElementIndex.value].videoType = type as 'youtube' | 'vimeo' | 'mp4'
  // 清空旧URL，因为切换类型后需要重新输入
  slides.value[activeSlideIndex.value].elements[selectedElementIndex.value].videoUrl = ''
}

// R51: 视频文件上传
const videoFileInput = ref<HTMLInputElement | null>(null)
const handleVideoUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file || selectedElementIndex.value === null) return
  const reader = new FileReader()
  reader.onload = (e) => {
    const result = e.target?.result as string
    saveHistory()
    slides.value[activeSlideIndex.value].elements[selectedElementIndex.value!].videoUrl = result
    slides.value[activeSlideIndex.value].elements[selectedElementIndex.value!].videoType = 'mp4'
  }
  reader.readAsDataURL(file)
}

// R51: 音频文件上传
const audioFileInput = ref<HTMLInputElement | null>(null)
const handleAudioUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file || selectedElementIndex.value === null) return
  const reader = new FileReader()
  reader.onload = (e) => {
    const result = e.target?.result as string
    saveHistory()
    slides.value[activeSlideIndex.value].elements[selectedElementIndex.value!].audioUrl = result
  }
  reader.readAsDataURL(file)
}

// R51: GIF文件上传
const gifFileInput = ref<HTMLInputElement | null>(null)
const handleGifUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file || selectedElementIndex.value === null) return
  const reader = new FileReader()
  reader.onload = (e) => {
    const result = e.target?.result as string
    saveHistory()
    slides.value[activeSlideIndex.value].elements[selectedElementIndex.value!].gifUrl = result
  }
  reader.readAsDataURL(file)
}

// R20: 层级控制
const bringForward = () => {
  if (selectedElementIndex.value === null) return
  saveHistory()
  const elements = slides.value[activeSlideIndex.value].elements
  const idx = selectedElementIndex.value
  if (idx < elements.length - 1) {
    const temp = elements[idx].zIndex || idx
    elements[idx].zIndex = (elements[idx + 1].zIndex || idx + 1)
    elements[idx + 1].zIndex = temp
  }
}

const sendBackward = () => {
  if (selectedElementIndex.value === null) return
  saveHistory()
  const elements = slides.value[activeSlideIndex.value].elements
  const idx = selectedElementIndex.value
  if (idx > 0) {
    const temp = elements[idx].zIndex || idx
    elements[idx].zIndex = (elements[idx - 1].zIndex || idx - 1)
    elements[idx - 1].zIndex = temp
  }
}

// R20: 布局预设应用
// R121: Smart layout preset application using smart layout engine
const applyLayoutPreset = (layout: { id: string }) => {
  saveHistory()
  activeLayout.value = layout.id
  activeSmartLayout.value = layout.id
  const elements = slides.value[activeSlideIndex.value].elements
  if (!elements || elements.length === 0) return
  applySmartLayoutPreset(elements, layout.id)
}

// R121: Auto-balance elements evenly
const handleAutoBalance = () => {
  saveHistory()
  const elements = slides.value[activeSlideIndex.value].elements
  if (!elements || elements.length === 0) return
  autoBalanceElements(elements)
}

// R121: Reflow text content when elements change
const handleContentReflow = () => {
  saveHistory()
  const elements = slides.value[activeSlideIndex.value].elements
  if (!elements || elements.length === 0) return
  // Get the changed element (or use first non-text as reference)
  const changedEl = elements.find(el => el.type !== 'text') || elements[0]
  reflowTextContent(elements, changedEl)
}

// R121: Apply smart grid snapping to all elements
const handleApplySmartGrid = () => {
  saveHistory()
  const elements = slides.value[activeSlideIndex.value].elements
  if (!elements || elements.length === 0) return
  elements.forEach(el => {
    snapElementToSmartGrid(el, elements, smartGridSize.value)
  })
}

// R121: Adapt to new aspect ratio
const handleAspectRatioChange = (newRatio: string) => {
  saveHistory()
  const elements = slides.value[activeSlideIndex.value].elements
  if (!elements || elements.length === 0) return
  const oldRatio = activeAspectRatio.value
  adaptToAspectRatio(elements, oldRatio, newRatio)
}

// R21: 字体主题应用
const applyFontTheme = (theme: { id: string; fontFamily: string }) => {
  activeFontTheme.value = theme.id
  slides.value[activeSlideIndex.value].elements.forEach(el => {
    if (el.type === 'text') {
      el.fontFamily = theme.fontFamily
    }
  })
}

// R21: 背景色更新
const updateSlideBackground = (color: string) => {
  slideBackground.value = color
  slides.value[activeSlideIndex.value].background = color
}

const applyBgPreset = (value: string) => {
  if (!value) return
  slideBackground.value = value
  slides.value[activeSlideIndex.value].background = value
}

// R21: 配色方案应用
const applyColorScheme = (idx: number) => {
  activeColorScheme.value = idx
  const scheme = colorSchemes[idx]
  slides.value[activeSlideIndex.value].elements.forEach(el => {
    if (el.type === 'text') {
      el.color = scheme.colors[3] || scheme.colors[0]
    } else if (el.type === 'shape') {
      el.fill = scheme.colors[0]
    }
  })
}

// R21: 间距应用
const applySpacing = (spacing: string) => {
  activeSpacing.value = spacing
  const scale = spacing === 'compact' ? 0.8 : spacing === 'loose' ? 1.2 : 1
  slides.value[activeSlideIndex.value].elements.forEach(el => {
    el.y = Math.round(el.y * scale)
  })
}

// 初始化幻灯片数据
const initSlides = () => {
  slides.value = Array.from({ length: props.slideCount }, (_, i) => ({
    background: i % 2 === 0 ? '#ffffff' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    elements: i === 0
      ? [
          { id: '1', type: 'text', x: 100, y: 80, width: 600, height: 60, content: 'PPT标题', fontSize: 40, fontWeight: 'bold', color: '#333333', fontFamily: '宋体', lineHeight: '1.5', textBgColor: 'transparent', zIndex: 1 },
          { id: '2', type: 'text', x: 100, y: 160, width: 600, height: 40, content: '副标题', fontSize: 24, color: '#666666', fontFamily: '宋体', lineHeight: '1.5', textBgColor: 'transparent', zIndex: 1 }
        ]
      : [
          { id: '1', type: 'text', x: 60, y: 40, width: 540, height: 50, content: '第' + (i + 1) + '页标题', fontSize: 28, fontWeight: 'bold', color: '#333333', fontFamily: '宋体', lineHeight: '1.5', textBgColor: 'transparent', zIndex: 1 },
          { id: '2', type: 'text', x: 60, y: 100, width: 540, height: 200, content: '• 要点1\n• 要点2\n• 要点3\n• 要点4', fontSize: 18, color: '#555555', fontFamily: '宋体', lineHeight: '1.5', textBgColor: 'transparent', zIndex: 1 },
          { id: '3', type: 'shape', x: 60, y: 320, width: 100, height: 8, fill: '#165DFF', radius: '4px', color: '#165DFF', zIndex: 1 }
        ]
  }))
}

const currentSlideStyle = computed(() => {
  const bg = slides.value[activeSlideIndex.value]?.background || '#ffffff'
  return { background: bg }
})

const currentElements = computed(() =>
  slides.value[activeSlideIndex.value]?.elements || []
)

const selectedElement = computed(() => {
  if (selectedElementIndex.value === null) return null
  return currentElements.value[selectedElementIndex.value]
})

// 监听选中元素变化，同步富文本工具栏状态
watch(selectedElement, (el) => {
  if (el && el.type === 'text') {
    richFontFamily.value = el.fontFamily || '宋体'
    richFontSize.value = String(el.fontSize || 18)
    richTextColor.value = el.color || '#000000'
    richBgColor.value = el.textBgColor || '#ffffff'
    richLineHeight.value = el.lineHeight || '1.5'
  }
}, { immediate: true })

// 监听活动幻灯片变化，同步背景色
watch(activeSlideIndex, (idx) => {
  slideBackground.value = slides.value[idx]?.background || '#ffffff'
}, { immediate: true })

const selectSlide = (index: number) => {
  activeSlideIndex.value = index
  selectedElementIndex.value = null
  slideBackground.value = slides.value[index]?.background || '#ffffff'
}

const selectElement = (slideIndex: number, elementIndex: number) => {
  activeSlideIndex.value = slideIndex
  selectedElementIndex.value = elementIndex
  const el = slides.value[slideIndex].elements[elementIndex]
  if (el.type === 'text') {
    richFontFamily.value = el.fontFamily || '宋体'
    richFontSize.value = String(el.fontSize || 18)
    richTextColor.value = el.color || '#000000'
    richBgColor.value = el.textBgColor || '#ffffff'
    richLineHeight.value = el.lineHeight || '1.5'
  }
}

const deselectElement = () => {
  selectedElementIndex.value = null
}

const getElementTypeName = (type: string) => {
  const map: Record<string, string> = {
    text: '文本',
    shape: '形状',
    image: '图片',
    video: '视频',
    audio: '音频',
    gif: '动图'
  }
  return map[type] || type
}

const getPresetIcon = (type: AnimationType): string => {
  const map: Record<AnimationType, string> = {
    'fade': '💠',
    'slide-up': '⬆️',
    'slide-down': '⬇️',
    'slide-left': '⬅️',
    'slide-right': '➡️',
    'scale-in': '🔍',
    'scale-out': '🔎',
    'rotate-in': '🔄',
    'bounce-in': '🏀',
    'zoom-in': '🎯',
    'zoom-out': '📤',
    'flip-x': '↔️',
    'flip-y': '↕️',
    'wipe': '🚿',
    'blur-in': '🌫️',
    'typewriter': '⌨️',
    'letter-by-letter': '🔤',
    'word-by-word': '📝',
  }
  return map[type] || '✨'
}

const getElementStyle = (el: SlideElement) => ({
  left: (el.x / 800 * 100) + '%',
  top: (el.y / 450 * 100) + '%',
  width: (el.width / 800 * 100) + '%',
  height: (el.height / 450 * 100) + '%',
  fontSize: el.fontSize ? Math.max(8, el.fontSize / 3) + 'px' : '12px'
})

const getCanvasElementStyle = (el: SlideElement, index: number) => {
  const isSelected = selectedElementIndex.value === index
  return {
    left: el.x + 'px',
    top: el.y + 'px',
    width: el.width + 'px',
    height: el.height + 'px',
    fontSize: (el.fontSize || 18) + 'px',
    fontWeight: el.fontWeight || 'normal',
    fontStyle: el.fontStyle || 'normal',
    textDecoration: el.textDecoration || 'none',
    fontFamily: el.fontFamily || '宋体',
    color: el.color || '#000',
    backgroundColor: el.fill || 'transparent',
    borderRadius: el.radius || '0',
    border: isSelected ? '2px solid #165DFF' : 'none',
    zIndex: el.zIndex || index + 1,
    lineHeight: el.lineHeight || '1.5',
    textAlign: el.textAlign || 'left',
  }
}

const getTextContentStyle = (el: SlideElement) => ({
  fontSize: (el.fontSize || 18) + 'px',
  fontWeight: el.fontWeight || 'normal',
  fontStyle: el.fontStyle || 'normal',
  textDecoration: el.textDecoration || 'none',
  fontFamily: el.fontFamily || '宋体',
  color: el.color || '#000',
  backgroundColor: el.textBgColor || 'transparent',
  lineHeight: el.lineHeight || '1.5',
  textAlign: el.textAlign || 'left',
})

const updateElementContent = (index: number, event: Event) => {
  const target = event.target as HTMLElement
  slides.value[activeSlideIndex.value].elements[index].content = target.innerText
}

const updateElementProp = (prop: string, value: any) => {
  if (selectedElementIndex.value === null) return
  saveHistory()
  ;(slides.value[activeSlideIndex.value].elements[selectedElementIndex.value] as any)[prop] = value
}

const setAlignment = (align: string) => {
  if (selectedElementIndex.value === null) return
  saveHistory()
  slides.value[activeSlideIndex.value].elements[selectedElementIndex.value].textAlign = align
}

const deleteElement = () => {
  if (selectedElementIndex.value === null) return
  saveHistory()
  slides.value[activeSlideIndex.value].elements.splice(selectedElementIndex.value, 1)
  selectedElementIndex.value = null
}

const addElement = (type: 'text' | 'shape' | 'image' | 'video' | 'audio' | 'gif') => {
  saveHistory()
  const newElement: SlideElement = {
    id: Date.now().toString(),
    type,
    x: 100,
    y: 100,
    width: type === 'text' ? 400 : (type === 'video' ? 320 : (type === 'gif' ? 200 : 150)),
    height: type === 'text' ? 50 : (type === 'video' ? 180 : (type === 'audio' ? 60 : 150)),
    content: type === 'text' ? '新文本' : undefined,
    color: '#000000',
    fill: type === 'shape' ? '#165DFF' : undefined,
    fontSize: 18,
    fontFamily: '宋体',
    lineHeight: '1.5',
    textBgColor: 'transparent',
    zIndex: slides.value[activeSlideIndex.value].elements.length + 1,
    autoPlay: false,
    loop: false,
    muted: true,
  }
  slides.value[activeSlideIndex.value].elements.push(newElement)
  selectedElementIndex.value = slides.value[activeSlideIndex.value].elements.length - 1
}

// 拖拽
const startDrag = (event: MouseEvent, index: number) => {
  if (selectedElementIndex.value !== index) return
  isDragging.value = true
  const el = slides.value[activeSlideIndex.value].elements[index]
  dragStart.value = {
    x: event.clientX,
    y: event.clientY,
    elementX: el.x,
    elementY: el.y
  }
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

const onDrag = (event: MouseEvent) => {
  if (!isDragging.value || selectedElementIndex.value === null) return
  const dx = event.clientX - dragStart.value.x
  const dy = event.clientY - dragStart.value.y
  const el = slides.value[activeSlideIndex.value].elements[selectedElementIndex.value]

  // R20: 网格吸附辅助
  const gridSize = 10
  let newX = Math.max(0, Math.min(800 - el.width, dragStart.value.elementX + dx))
  let newY = Math.max(0, Math.min(450 - el.height, dragStart.value.elementY + dy))

  // 吸附到网格
  if (showGuides.value) {
    newX = Math.round(newX / gridSize) * gridSize
    newY = Math.round(newY / gridSize) * gridSize

    // 中心对齐辅助线
    const centerX = 400
    const centerY = 225
    if (Math.abs(newX + el.width / 2 - centerX) < 8) {
      newX = centerX - el.width / 2
      guideX.value = centerX
    } else {
      guideX.value = null
    }
    if (Math.abs(newY + el.height / 2 - centerY) < 8) {
      newY = centerY - el.height / 2
      guideY.value = centerY
    } else {
      guideY.value = null
    }
  }

  el.x = newX
  el.y = newY
}

const stopDrag = () => {
  isDragging.value = false
  guideX.value = null
  guideY.value = null
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

// 调整大小
const startResize = (event: MouseEvent, handle: string) => {
  if (selectedElementIndex.value === null) return
  isResizing.value = true
  resizeHandle.value = handle
  const el = slides.value[activeSlideIndex.value].elements[selectedElementIndex.value]
  resizeStart.value = {
    x: event.clientX,
    y: event.clientY,
    width: el.width,
    height: el.height,
    elX: el.x,
    elY: el.y
  }
  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
}

const onResize = (event: MouseEvent) => {
  if (!isResizing.value || selectedElementIndex.value === null) return
  const dx = event.clientX - resizeStart.value.x
  const dy = event.clientY - resizeStart.value.y
  const el = slides.value[activeSlideIndex.value].elements[selectedElementIndex.value]
  const handle = resizeHandle.value

  if (handle.includes('e')) el.width = Math.max(50, resizeStart.value.width + dx)
  if (handle.includes('w')) {
    el.width = Math.max(50, resizeStart.value.width - dx)
    el.x = resizeStart.value.elX + dx
  }
  if (handle.includes('s')) el.height = Math.max(30, resizeStart.value.height + dy)
  if (handle.includes('n')) {
    el.height = Math.max(30, resizeStart.value.height - dy)
    el.y = resizeStart.value.elY + dy
  }
}

const stopResize = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
}

const resetChanges = () => {
  initSlides()
  selectedElementIndex.value = null
}

const applyChanges = () => {
  localStorage.setItem('ppt_edited_elements', JSON.stringify(slides.value))
  emit('apply', slides.value)
  closeEditor()
}

const closeEditor = () => {
  emit('close')
}

// R16: 富文本内键盘快捷键
const handleTextKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
    if (e.key === 'b') { e.preventDefault(); execFormat('bold') }
    if (e.key === 'i') { e.preventDefault(); execFormat('italic') }
    if (e.key === 'u') { e.preventDefault(); execFormat('underline') }
  }
}

// 键盘快捷键
const handleKeydown = (e: KeyboardEvent) => {
  if ((e.target as HTMLElement).tagName === 'INPUT' ||
      (e.target as HTMLElement).tagName === 'TEXTAREA' ||
      (e.target as HTMLElement).isContentEditable) {
    // R16: 富文本快捷键在其他输入场景下仍生效
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
      if (e.key === 'b') { e.preventDefault(); execFormat('bold') }
      if (e.key === 'i') { e.preventDefault(); execFormat('italic') }
      if (e.key === 'u') { e.preventDefault(); execFormat('underline') }
    }
    return
  }

  // 方向键移动元素
  if (selectedElementIndex.value !== null) {
    const step = e.shiftKey ? 10 : 1
    const el = slides.value[activeSlideIndex.value].elements[selectedElementIndex.value]

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        saveHistory()
        el.x = Math.max(0, el.x - step)
        break
      case 'ArrowRight':
        e.preventDefault()
        saveHistory()
        el.x = Math.min(800 - el.width, el.x + step)
        break
      case 'ArrowUp':
        e.preventDefault()
        saveHistory()
        el.y = Math.max(0, el.y - step)
        break
      case 'ArrowDown':
        e.preventDefault()
        saveHistory()
        el.y = Math.min(450 - el.height, el.y + step)
        break
      case 'Delete':
      case 'Backspace':
        e.preventDefault()
        deleteElement()
        break
    }
  }

  // Ctrl/Cmd + Z 撤销
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    undo()
  }

  // Ctrl/Cmd + Shift + Z 或 Ctrl/Cmd + Y 重做
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
    e.preventDefault()
    redo()
  }

  // Escape 取消选择
  if (e.key === 'Escape') {
    selectedElementIndex.value = null
  }
}

onMounted(() => {
  const saved = localStorage.getItem('ppt_edited_elements')
  if (saved) {
    try {
      slides.value = JSON.parse(saved)
    } catch {
      initSlides()
    }
  } else {
    initSlides()
  }

  saveHistory()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.element-editor-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.element-editor-panel {
  width: 95%;
  max-width: 1400px;
  height: 90vh;
  background: white;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ===== R16: 富文本格式工具栏 ===== */
.rich-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e5e5e5;
  flex-wrap: wrap;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 6px;
  border-right: 1px solid #e0e0e0;
}

.toolbar-group:last-child {
  border-right: none;
}

.format-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.format-btn:hover {
  background: #e6f0ff;
  border-color: #165DFF;
}

.format-btn.active {
  background: #165DFF;
  color: white;
  border-color: #165DFF;
}

.font-family-select,
.font-size-select,
.line-height-select {
  padding: 4px 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 13px;
  background: white;
  cursor: pointer;
  max-width: 120px;
}

.font-family-select {
  max-width: 110px;
}

.color-tool-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.toolbar-label {
  font-size: 11px;
  color: #666;
  white-space: nowrap;
}

.color-input-tool {
  width: 28px;
  height: 24px;
  padding: 0;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
}

.editor-header {
  padding: 16px 24px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
}

.header-left {
  flex: 1;
}

.header-left h3 {
  margin: 0;
  font-size: 20px;
}

.editor-tip {
  margin: 4px 0 0;
  font-size: 13px;
  color: #666;
}

.header-toolbar {
  display: flex;
  gap: 8px;
}

.toolbar-btn {
  padding: 8px 16px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-btn:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #165DFF;
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-close {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
}

.btn-close:hover {
  background: #e5e5e5;
}

.editor-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 幻灯片列表 */
.slides-list {
  width: 120px;
  padding: 16px;
  background: #f5f5f5;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.slide-thumb {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.slide-thumb:hover {
  border-color: #ccc;
}

.slide-thumb.active {
  border-color: #165DFF;
}

.thumb-num {
  display: block;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  padding: 4px;
  background: #e5e5e5;
}

.thumb-preview {
  height: 60px;
  position: relative;
  overflow: hidden;
}

.thumb-element {
  position: absolute;
  background: rgba(22, 93, 255, 0.3);
  border: 1px solid #165DFF;
  font-size: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumb-element.selected {
  background: rgba(22, 93, 255, 0.6);
}

/* 编辑画布 */
.edit-canvas {
  flex: 1;
  background: #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
}

.canvas-slide {
  width: 800px;
  height: 450px;
  background: white;
  position: relative;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.canvas-element {
  position: absolute;
  cursor: move;
  user-select: none;
}

.canvas-element.selected {
  outline: none;
}

.element-content {
  width: 100%;
  height: 100%;
}

.text-content {
  padding: 8px;
  white-space: pre-wrap;
  word-break: break-word;
  overflow: hidden;
}

.shape-content {
  width: 100%;
  height: 100%;
}

.image-content {
  object-fit: cover;
  width: 100%;
  height: 100%;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  font-size: 24px;
  width: 100%;
  height: 100%;
  cursor: pointer;
  gap: 8px;
}

.upload-hint {
  font-size: 12px;
  color: #999;
}

/* R51: 视频元素 */
.video-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

.video-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #1a1a2e;
  font-size: 28px;
  width: 100%;
  height: 100%;
  cursor: pointer;
  gap: 8px;
  color: #60a5fa;
}

.video-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.video-native {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* R51: 音频元素 */
.audio-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.audio-player {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.audio-icon {
  font-size: 24px;
}

.audio-native {
  width: 100%;
  height: 36px;
}

.audio-native-mini {
  width: 100%;
  height: 32px;
  margin-top: 4px;
}

.audio-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  font-size: 24px;
  width: 100%;
  height: 100%;
  cursor: pointer;
  gap: 8px;
}

.audio-preview-mini {
  margin-top: 8px;
}

/* R51: GIF动图元素 */
.gif-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.gif-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gif-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  font-size: 24px;
  width: 100%;
  height: 100%;
  cursor: pointer;
  gap: 8px;
}

/* R51: 新增表单控件 */
.prop-input-full {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 13px;
  margin-top: 4px;
  box-sizing: border-box;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  cursor: pointer;
  color: #333;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* 对齐辅助线 */
.canvas-guides {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 999;
}

.guide {
  position: absolute;
  background: rgba(22, 93, 255, 0.6);
}

.guide-h {
  left: 0;
  right: 0;
  height: 1px;
}

.guide-v {
  top: 0;
  bottom: 0;
  width: 1px;
}

/* 调整手柄 */
.resize-handles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background: #165DFF;
  border: 2px solid white;
  border-radius: 2px;
  pointer-events: auto;
}

.handle-nw { top: -5px; left: -5px; cursor: nw-resize; }
.handle-ne { top: -5px; right: -5px; cursor: ne-resize; }
.handle-sw { bottom: -5px; left: -5px; cursor: sw-resize; }
.handle-se { bottom: -5px; right: -5px; cursor: se-resize; }

/* 属性面板 */
.properties-panel {
  width: 300px;
  background: #f9fafb;
  border-left: 1px solid #e5e5e5;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.panel-header {
  padding: 12px 16px;
  font-weight: 600;
  font-size: 14px;
  border-bottom: 1px solid #e5e5e5;
}

.panel-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.panel-empty {
  padding: 40px 16px;
  text-align: center;
  color: #999;
}

.prop-group {
  margin-bottom: 16px;
}

.prop-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
}

.prop-value {
  font-size: 14px;
}

.prop-row {
  display: flex;
  gap: 8px;
}

.prop-input {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
}

.prop-input span {
  font-size: 12px;
  color: #999;
}

.prop-input input {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 13px;
  width: 60px;
}

.prop-textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 13px;
  resize: vertical;
  font-family: inherit;
}

.prop-select {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 13px;
  background: white;
}

.type-badge {
  display: inline-block;
  padding: 4px 8px;
  background: #EEF2FF;
  color: #4F46E5;
  border-radius: 4px;
  font-size: 12px;
}

.color-picker {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-input {
  width: 40px;
  height: 32px;
  padding: 0;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  cursor: pointer;
}

.color-value {
  font-size: 13px;
  color: #666;
  font-family: monospace;
}

.align-buttons {
  display: flex;
  gap: 4px;
}

.align-buttons button {
  flex: 1;
  padding: 8px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  cursor: pointer;
}

.align-buttons button:hover {
  background: #f5f5f5;
}

.align-buttons button.active {
  background: #165DFF;
  color: white;
  border-color: #165DFF;
}

/* R16: 样式切换按钮 */
.style-toggles {
  display: flex;
  gap: 4px;
}

.style-toggle-btn {
  width: 36px;
  height: 32px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.style-toggle-btn:hover {
  background: #e6f0ff;
  border-color: #165DFF;
}

.style-toggle-btn.active {
  background: #165DFF;
  color: white;
  border-color: #165DFF;
}

/* R17: 图片上传 */
.image-upload-area {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.file-input {
  display: none;
}

.file-label {
  display: inline-block;
  padding: 8px 16px;
  background: #EEF2FF;
  color: #165DFF;
  border: 1px dashed #165DFF;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
}

.file-label:hover {
  background: #165DFF;
  color: white;
  border-style: solid;
}

/* R20: 层级控制 */
.z-index-controls {
  display: flex;
  gap: 6px;
}

.z-index-controls button {
  flex: 1;
  padding: 6px 8px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.z-index-controls button:hover {
  background: #f0f9ff;
  border-color: #165DFF;
}

/* R20: 布局网格 */
.layout-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding: 8px 16px;
}

.layout-thumb {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  border: 2px solid #e5e5e5;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.layout-thumb:hover {
  border-color: #165DFF;
  background: #f0f9ff;
}

.layout-thumb.active {
  border-color: #165DFF;
  background: #e6f0ff;
}

.layout-preview-icon {
  font-size: 20px;
  margin-bottom: 2px;
}

.layout-name {
  font-size: 10px;
  color: #666;
  text-align: center;
}

/* R21: 排版系统 */
.theme-section {
  padding: 0 16px 8px;
}

.theme-group {
  margin-bottom: 14px;
}

.theme-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.theme-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 4px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.theme-item:hover {
  border-color: #165DFF;
  background: #f0f9ff;
}

.theme-item.active {
  border-color: #165DFF;
  background: #e6f0ff;
}

.theme-icon {
  font-size: 16px;
  margin-bottom: 2px;
}

.theme-name {
  font-size: 10px;
  color: #666;
}

.bg-color-picker {
  display: flex;
  gap: 6px;
  align-items: center;
}

.bg-preset-select {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 12px;
  background: white;
}

.color-scheme-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.color-scheme-item {
  border: 2px solid #e5e5e5;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
}

.color-scheme-item:hover {
  border-color: #165DFF;
  transform: scale(1.02);
}

.color-scheme-item.active {
  border-color: #165DFF;
  box-shadow: 0 0 0 2px rgba(22, 93, 255, 0.3);
}

.scheme-swatches {
  display: flex;
  height: 28px;
}

.scheme-swatch {
  flex: 1;
}

.spacing-options {
  display: flex;
  gap: 4px;
}

.spacing-btn {
  flex: 1;
  padding: 6px 4px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  background: white;
  transition: all 0.15s;
}

.spacing-btn:hover {
  border-color: #165DFF;
  background: #f0f9ff;
}

.spacing-btn.active {
  background: #165DFF;
  color: white;
  border-color: #165DFF;
}

/* R130: Animation Panel */
.anim-toggle-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.animation-panel {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
  padding: 10px;
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.anim-preset-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.anim-preset-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.anim-preset-btn {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  padding: 6px 4px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  transition: all 0.2s;
  color: rgba(255,255,255,0.7);
  font-size: 10px;
}

.anim-preset-btn:hover {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.2);
}

.anim-preset-btn.active {
  background: rgba(22, 93, 255, 0.2);
  border-color: #165DFF;
  color: #fff;
}

.preset-icon {
  font-size: 16px;
  line-height: 1;
}

.preset-name {
  font-size: 10px;
  text-align: center;
  line-height: 1.2;
}

.anim-text-mode {
  display: flex;
  gap: 4px;
  margin-bottom: 6px;
}

.anim-mode-btn {
  flex: 1;
  padding: 5px 4px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 4px;
  color: rgba(255,255,255,0.6);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.anim-mode-btn:hover {
  background: rgba(255,255,255,0.1);
}

.anim-mode-btn.active {
  background: rgba(22, 93, 255, 0.3);
  border-color: #165DFF;
  color: #fff;
}

.btn-delete-element {
  width: 100%;
  padding: 10px;
  background: #FEE2E2;
  color: #DC2626;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.btn-delete-element:hover {
  background: #FECACA;
}

/* 添加元素 */
.panel-add {
  border-top: 1px solid #e5e5e5;
  padding: 12px 0;
}

.add-buttons {
  display: flex;
  gap: 8px;
  padding: 0 16px;
}

.add-buttons button {
  flex: 1;
  padding: 8px 4px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}

.add-buttons button:hover {
  background: #f5f5f5;
  border-color: #165DFF;
}

/* 页脚 */
.editor-footer {
  padding: 16px 24px;
  border-top: 1px solid #e5e5e5;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn {
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.btn-outline {
  background: white;
  border: 1px solid #ddd;
}

.btn-outline:hover {
  background: #f5f5f5;
}

.btn-primary {
  background: #165DFF;
  color: white;
  border: none;
}

.btn-primary:hover {
  background: #0e42d2;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .element-editor-panel {
    width: 100%;
    height: 100%;
    border-radius: 0;
  }

  .rich-toolbar {
    gap: 4px;
    padding: 6px 8px;
    overflow-x: auto;
  }

  .toolbar-group {
    padding: 0 4px;
  }

  .editor-header {
    padding: 12px 16px;
    flex-wrap: wrap;
    gap: 8px;
  }

  .header-left h3 {
    font-size: 16px;
  }

  .editor-tip {
    font-size: 11px;
  }

  .header-toolbar {
    order: 3;
    width: 100%;
    justify-content: center;
  }

  .toolbar-btn {
    padding: 6px 12px;
    font-size: 12px;
  }

  .editor-content {
    flex-direction: column;
  }

  .slides-list {
    width: 100%;
    flex-direction: row;
    overflow-x: auto;
    padding: 8px;
    gap: 8px;
  }

  .slide-thumb {
    min-width: 60px;
  }

  .thumb-preview {
    height: 40px;
  }

  .edit-canvas {
    padding: 10px;
    min-height: 200px;
  }

  .canvas-slide {
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
  }

  .properties-panel {
    width: 100%;
    max-height: 200px;
  }

  .panel-content {
    padding: 8px;
  }

  .prop-group {
    margin-bottom: 8px;
  }

  .prop-label {
    font-size: 11px;
  }

  .prop-input input {
    padding: 4px 6px;
    font-size: 12px;
    width: 50px;
  }

  .prop-select {
    padding: 4px;
    font-size: 12px;
  }

  .color-input {
    width: 30px;
    height: 26px;
  }

  .editor-footer {
    padding: 12px 16px;
  }

  .btn {
    padding: 10px 16px;
    font-size: 13px;
  }
}

/* ===== R32: AI 智能工具栏 ===== */
.ai-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-bottom: 1px solid rgba(255,255,255,0.2);
  flex-wrap: wrap;
}

.ai-toolbar-title {
  font-size: 13px;
  font-weight: 600;
  color: white;
  white-space: nowrap;
}

.ai-toolbar-buttons {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.ai-toolbar-sep {
  width: 1px;
  height: 24px;
  background: rgba(255,255,255,0.3);
  margin: 0 4px;
}

.ai-btn {
  padding: 6px 12px;
  border: 1px solid rgba(255,255,255,0.4);
  border-radius: 6px;
  background: rgba(255,255,255,0.15);
  color: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.ai-btn:hover:not(.disabled):not(:disabled) {
  background: rgba(255,255,255,0.3);
  border-color: rgba(255,255,255,0.7);
  transform: translateY(-1px);
}

.ai-btn.disabled,
.ai-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.ai-btn-rephrase:hover:not(.disabled) {
  background: rgba(255,255,255,0.25);
  box-shadow: 0 0 8px rgba(255,255,255,0.3);
}

.ai-translate-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ai-translate-select {
  padding: 5px 8px;
  border: 1px solid rgba(255,255,255,0.4);
  border-radius: 4px;
  background: rgba(255,255,255,0.15);
  color: white;
  font-size: 12px;
  cursor: pointer;
}

.ai-translate-select option {
  background: #333;
  color: white;
}

/* R72: AI 语气调整选择器 */
.ai-rephrase-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ai-tone-select {
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 6px;
  color: #fff;
  font-size: 12px;
  padding: 4px 8px;
  cursor: pointer;
  min-width: 80px;
}

.ai-tone-select:focus {
  outline: none;
  border-color: #165DFF;
}

.ai-tone-select option {
  background: #333;
  color: white;
}

/* R72: AI 扩展/压缩滑动条 */
.ai-expand-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* R109: AI 语气调整组 */
.ai-tone-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.expand-label {
  font-size: 12px;
}

.expand-slider {
  width: 80px;
  height: 4px;
  -webkit-appearance: none;
  background: #444;
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.expand-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  background: #165DFF;
  border-radius: 50%;
  cursor: pointer;
}

.ai-btn-apply {
  font-size: 11px;
  padding: 4px 8px;
}

.ai-btn-expand {
  font-size: 11px;
  padding: 4px 6px;
  min-width: 24px;
}

/* R72: AI 语法检查按钮 */
.ai-btn-grammar {
  background: linear-gradient(135deg, #34d399, #059669);
  color: white;
}

.ai-btn-grammar:hover:not(.disabled) {
  background: linear-gradient(135deg, #10b981, #047857);
}

/* R109: AI 智能脚注按钮 */
.ai-btn-footnote {
  background: linear-gradient(135deg, #a78bfa, #7c3aed);
  color: white;
}

.ai-btn-footnote:hover:not(.disabled) {
  background: linear-gradient(135deg, #8b5cf6, #6d28d9);
}

/* R109: AI 语气调整按钮 */
.ai-btn-tone {
  background: linear-gradient(135deg, #fbbf24, #d97706);
  color: white;
}

.ai-btn-tone:hover:not(.disabled) {
  background: linear-gradient(135deg, #f59e0b, #b45309);
}

/* R109: AI 陈词滥调检测按钮 */
.ai-btn-cliche {
  background: linear-gradient(135deg, #f472b6, #db2777);
  color: white;
}

.ai-btn-cliche:hover:not(.disabled) {
  background: linear-gradient(135deg, #ec4899, #be185d);
}

.ai-loading {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: rgba(255,255,255,0.9);
  margin-left: auto;
}

.ai-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ===== R32: AI 弹窗 ===== */
.ai-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.6);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 420px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
}

.ai-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e5e5;
  background: #f9fafb;
}

.ai-modal-header h3 {
  margin: 0;
  font-size: 16px;
}

.ai-modal-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  color: #666;
}

.ai-modal-close:hover {
  background: #e5e5e5;
}

.ai-modal-content {
  padding: 20px;
  overflow-y: auto;
  max-height: 60vh;
}

.ai-modal-btn {
  padding: 8px 20px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  background: white;
  font-size: 13px;
  cursor: pointer;
  margin-right: 8px;
}

.ai-modal-btn:hover {
  background: #f5f5f5;
}

.ai-modal-btn-primary {
  background: #165DFF;
  color: white;
  border-color: #165DFF;
}

.ai-modal-btn-primary:hover {
  background: #0e42d2;
}

.layout-actions {
  margin-top: 16px;
  display: flex;
  gap: 8px;
}

/* R32: 评分样式 */
.score-overall {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 16px;
}

.score-label {
  font-size: 14px;
  color: #666;
}

.score-value {
  font-size: 48px;
  font-weight: 700;
  color: #165DFF;
  line-height: 1;
}

.score-max {
  font-size: 18px;
  color: #999;
}

.score-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.score-bar-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-bar-label {
  font-size: 12px;
  color: #666;
  width: 90px;
  text-transform: capitalize;
}

.score-bar-track {
  flex: 1;
  height: 8px;
  background: #e5e5e5;
  border-radius: 4px;
  overflow: hidden;
}

.score-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #165DFF, #764ba2);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.score-bar-value {
  font-size: 12px;
  color: #333;
  width: 32px;
  text-align: right;
}

.score-section {
  margin-bottom: 12px;
}

.score-section-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}

.score-item {
  font-size: 13px;
  color: #555;
  padding: 2px 0;
}

.score-summary {
  font-size: 14px;
  color: #333;
  font-style: italic;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 6px;
  margin-top: 8px;
}

/* R32: 布局建议样式 */
.layout-type {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.layout-type-icon {
  font-size: 28px;
}

.layout-type-name {
  font-size: 20px;
  font-weight: 600;
  color: #165DFF;
}

.layout-reason {
  font-size: 14px;
  color: #555;
  line-height: 1.6;
  margin-bottom: 16px;
}

/* R32: 美化结果样式 */
.enhance-colors {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.enhance-label {
  font-size: 13px;
  color: #666;
  white-space: nowrap;
}

.enhance-swatches {
  display: flex;
  gap: 6px;
}

.enhance-swatch {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid #e5e5e5;
  cursor: pointer;
  transition: transform 0.2s;
}

.enhance-swatch:hover {
  transform: scale(1.1);
}

.enhance-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 14px;
}

/* 移动端 AI 工具栏 */
@media (max-width: 768px) {
  .ai-toolbar {
    padding: 6px 8px;
    gap: 6px;
  }

  .ai-toolbar-title {
    font-size: 11px;
  }

  .ai-btn {
    padding: 5px 8px;
    font-size: 11px;
  }

  .ai-translate-select {
    padding: 4px 6px;
    font-size: 11px;
  }

  .ai-modal {
    max-width: 95%;
  }

  .ai-tone-select {
    min-width: 60px;
    font-size: 11px;
  }

  .expand-slider {
    width: 60px;
  }
}

/* R121: Smart Layout Engine Styles */
.smart-layout-section {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.smart-layout-btn {
  padding: 6px 10px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  white-space: nowrap;
}

.smart-layout-btn:hover {
  background: #f0f5ff;
  border-color: #165DFF;
  color: #165DFF;
}

.smart-grid-section {
  margin-bottom: 12px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 8px;
}

.grid-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.toggle-btn {
  padding: 4px 12px;
  border-radius: 12px;
  border: 1px solid #ddd;
  background: #fff;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  color: #999;
}

.toggle-btn.active {
  background: #165DFF;
  border-color: #165DFF;
  color: #fff;
}

.grid-presets-row {
  margin-top: 8px;
}

.grid-select {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 12px;
  background: #fff;
}

.aspect-ratio-section {
  margin-bottom: 12px;
}

.aspect-ratio-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.aspect-ratio-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
}

.aspect-ratio-item:hover {
  border-color: #165DFF;
  background: #f0f5ff;
}

.aspect-ratio-item.active {
  border-color: #165DFF;
  background: #e8f0ff;
  box-shadow: 0 0 0 2px rgba(22, 93, 255, 0.1);
}

.aspect-icon {
  font-size: 18px;
  margin-bottom: 2px;
}

.aspect-name {
  font-size: 11px;
  color: #555;
  font-weight: 500;
}

.aspect-ratio-item.active .aspect-name {
  color: #165DFF;
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .smart-layout-section {
    flex-direction: column;
  }

  .smart-layout-btn {
    width: 100%;
  }

  .aspect-ratio-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* R133: Content Template Modal */
.template-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.template-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.template-field label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}
.template-select,
.template-input {
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}
.template-select:focus,
.template-input:focus {
  border-color: #165DFF;
}
.template-result {
  margin-top: 12px;
  padding: 12px;
  background: #f8f9ff;
  border-radius: 8px;
  border: 1px solid #e8eaff;
}
.template-result-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}
.template-result-content {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #444;
  white-space: pre-wrap;
  max-height: 280px;
  overflow-y: auto;
  line-height: 1.6;
  margin: 0;
}

</style>
