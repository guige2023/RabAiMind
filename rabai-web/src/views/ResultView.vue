<template>
  <div class="result">
    <div class="container">
      <div class="result-card">
        <!-- 成功状态 -->
        <div v-if="status === 'completed'" class="result-success">
          <div class="success-icon">🎉</div>
          <h2 class="result-title">PPT 生成成功!</h2>
          <p class="result-desc">你的演示文稿已准备就绪</p>

          <!-- 文件信息 -->
          <div class="file-info">
            <div class="info-item">
              <span class="info-label">幻灯片</span>
              <span class="info-value">{{ slideCount }} 页</span>
            </div>
            <div class="info-item">
              <span class="info-label">文件大小</span>
              <span class="info-value">{{ fileSize }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">格式</span>
              <span class="info-value">PPTX</span>
            </div>
          </div>

          <!-- PPT预览 -->
          <div class="ppt-preview-section" ref="slidesContainerRef">
            <!-- Swipe hint (mobile only) -->
            <div class="swipe-hint" v-if="isMobile && previewSlides.length > 1">
              <span>👆 左右滑动查看更多</span>
            </div>
            <h3 class="preview-title">PPT 预览</h3>
            <div class="preview-loading" v-if="!previewLoaded">
              <div class="loading-spinner"></div>
              <p>加载预览中...</p>
            </div>
            <div v-else-if="previewLoadFailed" class="preview-load-failed">
              <p>预览加载失败</p>
              <button class="btn btn-sm" @click="loadPreview">🔄 重试</button>
            </div>
            <!-- R149: Lazy loading preview grid with IntersectionObserver -->
            <div class="preview-grid" v-else ref="previewGridRef">
              <template v-if="previewSlides.length > 0">
                <div
                  v-for="(slide, index) in previewSlides.slice(0, 6)"
                  :key="slide.slideNum"
                  class="preview-slide"
                  :ref="el => setupPreviewLazy(el as HTMLElement, slide.slideNum)"
                  :class="{ 'slide-visible': visiblePreviewSlides.has(slide.slideNum), 'slide-loading': visiblePreviewSlides.has(slide.slideNum) && !loadedPreviews.has(slide.slideNum) }"
                >
                  <div class="slide-number-badge">{{ slide.slideNum }}</div>
                  <!-- R149: Lazy loaded image - only loads when in viewport -->
                  <img
                    v-if="visiblePreviewSlides.has(slide.slideNum)"
                    :src="getCachedPreviewUrl(slide)"
                    :alt="`第 ${slide.slideNum} 页`"
                    class="preview-image"
                    :class="{ 'image-loaded': loadedPreviews.has(slide.slideNum) }"
                    @load="onPreviewLoaded(slide.slideNum)"
                    @error="onPreviewError($event, slide.slideNum)"
                  />
                  <!-- Placeholder while not in viewport or loading -->
                  <div v-else class="preview-image-placeholder">
                    <div class="preview-skeleton"></div>
                  </div>
                  <!-- Loading spinner overlay -->
                  <div v-if="visiblePreviewSlides.has(slide.slideNum) && !loadedPreviews.has(slide.slideNum) && !previewErrors.has(slide.slideNum)" class="preview-loading-overlay">
                    <div class="loading-spinner small"></div>
                  </div>
                  <!-- BUG修复: 图片加载失败时显示占位符 -->
                  <div v-if="previewErrors.has(slide.slideNum)" class="preview-error">
                    <span>加载失败</span>
                  </div>
                  <div class="slide-actions">
                    <button
                      class="btn btn-sm btn-regenerate"
                      @click="regenerateSingleSlide(index)"
                      :disabled="regeneratingSlideIndex === index"
                      :aria-label="`重生成第${slide.slideNum}页`"
                    >
                      {{ regeneratingSlideIndex === index ? '重生成中...' : '🔄 重生成' }}
                    </button>
                  </div>
                </div>
              </template>
              <div v-else class="preview-empty">
                <p>暂无预览数据</p>
              </div>
              <div v-if="slideCount > 6" class="preview-more">
                +{{ slideCount - 6 }} 页
              </div>
              <!-- R149: Performance metrics badge -->
              <div class="preview-perf-badge" v-if="perfMetrics.renderTime > 0">
                ⚡ {{ perfMetrics.renderTime.toFixed(1) }}ms
              </div>
            </div>
            <p class="preview-tip">点击"下载PPT"查看完整内容</p>
          </div>

          <!-- 操作按钮 -->
          <div class="result-actions">
            <button class="btn btn-primary btn-lg" @click="handleDownload">
              <span>⬇️</span> 下载 PPT
            </button>
            <button class="btn btn-lg btn-outline-edit" @click="toggleEditMode">
              <span>📝</span> {{ isEditMode ? '完成编辑' : '编辑内容' }}
            </button>
            <button class="btn btn-lg btn-presentation" @click="showPresentation = true">
              <span>🎬</span> 演示模式
            </button>
            <!-- 更多操作下拉菜单 -->
            <div class="more-actions-dropdown">
              <button class="btn btn-lg" @click="showMoreMenu = !showMoreMenu">
                <span>⋯</span> 更多
              </button>
              <div v-if="showMoreMenu" class="more-menu">
                <button @click="toggleFavorite">
                  <span>{{ isFavorite ? '⭐' : '☆' }}</span> {{ isFavorite ? '已收藏' : '收藏' }}
                </button>
                <button @click="showExportMenu = !showMoreMenu; showMoreMenu = false">
                  <span>📄</span> 导出其他格式
                </button>
                <button @click="showShareMenu = !showMoreMenu; showMoreMenu = false">
                  <span>📤</span> 分享
                </button>
                <button @click="showSaveTemplateModal = true; showMoreMenu = false">
                  <span>📁</span> 存为模板
                </button>
                <button @click="handleShareToTeam">
                  <span>👥</span> 分享到团队模板
                </button>
                <button @click="showVersionPanel = true; showMoreMenu = false; loadVersionHistory()">
                  <span>📜</span> 版本历史
                </button>
                <button @click="openRecordingPanel(); showMoreMenu = false">
                  <span>🎬</span> 录制成视频
                </button>
                <!-- AR/VR 模式 -->
                <div class="menu-separator">— AR/VR 沉浸模式 —</div>
                <button @click="arvrMode = 'vr'; showARVR = true; showMoreMenu = false">
                  <span>🕶</span> VR 沉浸演示
                </button>
                <button @click="arvrMode = 'panorama'; showARVR = true; showMoreMenu = false">
                  <span>🌐</span> 360° 全景模式
                </button>
                <button @click="arvrMode = 'ar'; showARVR = true; showMoreMenu = false">
                  <span>📷</span> AR 叠加演示
                </button>
                <button @click="arvrMode = 'hologram'; showARVR = true; showMoreMenu = false">
                  <span>🔮</span> 全息投影模式
                </button>
                <button @click="arvrMode = 'auditorium'; showARVR = true; showMoreMenu = false">
                  <span>🏛</span> 虚拟礼堂模式
                </button>
                <button @click="showEmbedCode = true; showMoreMenu = false">
                  <span>🔗</span> 嵌入代码
                </button>
                <button @click="handleNew">
                  <span>✨</span> 创建新的
                </button>
                <button @click="startReadAloud(); showMoreMenu = false">
                  <span>🔊</span> 朗读当前页
                </button>
                <button @click="openVoicePanel(); showMoreMenu = false">
                  <span>🎙️</span> 语音设置 / 配音
                </button>
                <button @click="openSecurityPanel()">
                  <span>🔒</span> 安全设置
                </button>
                <button @click="showBackupPanel = true; showMoreMenu = false; loadBackups?.()">
                  <span>💾</span> 备份管理
                </button>
                <button @click="showScheduleModal = true; showMoreMenu = false">
                  <span>📅</span> 定时发布
                </button>
              </div>
            </div>
          </div>

          <!-- 浮动工具栏 -->
          <div class="function-toolbar" role="toolbar" aria-label="演示文稿工具栏">
            <!-- R142: 字号调整 (A- / A+) -->
            <div class="font-size-controls" role="group" aria-label="字体大小调整">
              <button
                class="toolbar-btn font-size-btn"
                @click="adjustFontSize(-1)"
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
                @click="adjustFontSize(1)"
                :disabled="currentSlideFontSize >= 32"
                title="放大字体 (A+)"
                aria-label="放大字体，当前字号"
                :aria-valuenow="currentSlideFontSize"
                aria-valuemin="12"
                aria-valuemax="32"
              >A+</button>
            </div>
            <button class="toolbar-btn ai-toolbar-btn" @click="showSmartDesignPanel = true" title="智能设计" :class="{ active: showSmartDesignPanel }" aria-label="智能设计面板" :aria-pressed="showSmartDesignPanel">
              ✨
            </button>
            <button class="toolbar-btn ai-toolbar-btn" @click="showSmartContentSuggestions = true" title="智能内容建议" :class="{ active: showSmartContentSuggestions }" aria-label="智能内容建议面板" :aria-pressed="showSmartContentSuggestions">
              💡
            </button>
            <button class="toolbar-btn" @click="showLayoutPanel = true" title="快速调优" aria-label="快速调优面板" :aria-pressed="showLayoutPanel">
              🎨
            </button>
            <button class="toolbar-btn" @click="showChartEditor = true" title="图表编辑" aria-label="图表编辑器" :aria-pressed="showChartEditor">
              📊
            </button>
            <button class="toolbar-btn" @click="showElementEditor = true" title="元素微调" aria-label="元素微调面板" :aria-pressed="showElementEditor">
              🛠️
            </button>
            <button class="toolbar-btn" @click="showTransitionPanel = true" title="幻灯片过渡" aria-label="幻灯片过渡面板" :aria-pressed="showTransitionPanel">
              🔀
            </button>
            <button class="toolbar-btn" @click="openMasterEditor()" title="母版编辑" aria-label="母版编辑器">
              🎚️
            </button>
            <button class="toolbar-btn" @click="openAnimationComposer(currentEditingSlide - 1)" title="动画设置" aria-label="动画设置面板" :aria-pressed="false">
              🎬
            </button>
            <button class="toolbar-btn" @click="replayCurrentSlideAnimation()" title="重播当前页动画" aria-label="重播当前页动画">
              🔄
            </button>
            <button class="toolbar-btn" @click="showBatchThemeModal = true" title="批量主题" aria-label="批量主题面板" :aria-pressed="showBatchThemeModal">
              🌈
            </button>
            <button class="toolbar-btn" @click="showTeamWorkspace = !showTeamWorkspace" title="团队协作" :class="{ active: showTeamWorkspace }" aria-label="团队协作面板" :aria-pressed="showTeamWorkspace">
              👥
            </button>
            <button class="toolbar-btn" @click="showActivityFeed = !showActivityFeed" title="团队动态" :class="{ active: showActivityFeed }" aria-label="团队动态面板" :aria-pressed="showActivityFeed">
              📋
            </button>
            <button class="toolbar-btn" @click="showCommentsPanel = !showCommentsPanel" title="评论/建议" :class="{ active: showCommentsPanel }" aria-label="评论建议面板" :aria-pressed="showCommentsPanel">
              💬
            </button>
            <button class="toolbar-btn ai-toolbar-btn" @click="showAdvancedAIPanel = true" title="AI高级功能" :class="{ active: showAdvancedAIPanel }" aria-label="AI高级功能面板" :aria-pressed="showAdvancedAIPanel">
              🤖
            </button>
            <button class="toolbar-btn ai-toolbar-btn" @click="openPresentationCoach" title="AI演讲教练" :class="{ active: showPresentationCoach }" aria-label="AI演讲教练面板" :aria-pressed="showPresentationCoach">
              🎯
            </button>
            <button class="toolbar-btn" @click="showAccessibilityPanel = true" title="无障碍与通用设计" :class="{ active: showAccessibilityPanel }" aria-label="无障碍与通用设计面板" :aria-pressed="showAccessibilityPanel">
              ♿
            </button>
            <button class="toolbar-btn ai-toolbar-btn" @click="showLocalizeModal = true" title="翻译演示文稿" :class="{ active: showLocalizeModal }" aria-label="翻译演示文稿面板" :aria-pressed="showLocalizeModal">
              🌐
            </button>
          </div>

          <!-- 存为模板弹窗 -->
          <div v-if="showSaveTemplateModal" class="modal-mask" @click.self="showSaveTemplateModal = false">
            <div class="save-template-modal">
              <div class="modal-title">📁 存为私人模板</div>

              <div class="form-item">
                <text class="form-label">模板名称</text>
                <input v-model="newTemplate.name" class="form-input" placeholder="给模板起个名字" />
              </div>

              <div class="form-item">
                <text class="form-label">模板描述</text>
                <textarea v-model="newTemplate.description" class="form-textarea" placeholder="模板用途/场景" />
              </div>

              <div class="form-item">
                <text class="form-label">适用场景</text>
                <select v-model="newTemplate.sceneIndex" class="form-select">
                  <option v-for="(s, i) in scenes" :key="s.id" :value="i">{{ s.name }}</option>
                </select>
              </div>

              <div class="form-item">
                <text class="form-label">风格</text>
                <select v-model="newTemplate.styleIndex" class="form-select">
                  <option v-for="(s, i) in styles" :key="s.id" :value="i">{{ s.name }}</option>
                </select>
              </div>

              <div class="form-item">
                <text class="form-label">可见性</text>
                <div class="radio-group">
                  <label class="radio-item">
                    <input type="radio" v-model="newTemplate.visibility" value="private" /> 私人（仅自己可见）
                  </label>
                  <label class="radio-item">
                    <input type="radio" v-model="newTemplate.visibility" value="public" /> 公开（其他用户可用）
                  </label>
                  <label class="radio-item">
                    <input type="radio" v-model="newTemplate.visibility" value="team" /> 👥 团队（组织内共享）
                  </label>
                </div>
              </div>

              <!-- 自定义主题色 -->
              <div class="form-item theme-colors-item">
                <text class="form-label">应用主题色</text>
                <div class="theme-color-pickers">
                  <div class="theme-color-field">
                    <label>主色</label>
                    <div class="theme-color-input">
                      <input type="color" v-model="newTemplate.themePrimary" />
                      <input type="text" v-model="newTemplate.themePrimary" maxlength="7" />
                    </div>
                  </div>
                  <div class="theme-color-field">
                    <label>辅色</label>
                    <div class="theme-color-input">
                      <input type="color" v-model="newTemplate.themeSecondary" />
                      <input type="text" v-model="newTemplate.themeSecondary" maxlength="7" />
                    </div>
                  </div>
                  <div class="theme-color-field">
                    <label>强调色</label>
                    <div class="theme-color-input">
                      <input type="color" v-model="newTemplate.themeAccent" />
                      <input type="text" v-model="newTemplate.themeAccent" maxlength="7" />
                    </div>
                  </div>
                </div>
                <div class="theme-preview-strip">
                  <div class="strip-primary" :style="{ background: newTemplate.themePrimary }"></div>
                  <div class="strip-secondary" :style="{ background: newTemplate.themeSecondary }"></div>
                  <div class="strip-accent" :style="{ background: newTemplate.themeAccent }"></div>
                </div>
              </div>

              <div class="modal-actions">
                <button class="btn btn-outline" @click="showSaveTemplateModal = false">取消</button>
                <button class="btn btn-primary" @click="saveAsTemplate">保存</button>
              </div>
            </div>
          </div>

          <!-- 翻译/本地化弹窗 -->
          <div v-if="showLocalizeModal" class="modal-mask" @click.self="showLocalizeModal = false">
            <div class="localize-modal">
              <div class="modal-title">🌐 翻译演示文稿</div>
              <div class="modal-desc">将演示文稿翻译为其他语言</div>

              <div class="form-item">
                <text class="form-label">检测到的语言</text>
                <div class="detected-lang-display">
                  <span>{{ detectedSourceLocale || '未检测' }}</span>
                  <button class="btn btn-sm btn-outline" @click="handleDetectLanguage" :disabled="isLocalizing">
                    {{ isLocalizing ? '检测中...' : '🔍 重新检测' }}
                  </button>
                </div>
              </div>

              <div class="form-item">
                <text class="form-label">目标语言</text>
                <select v-model="targetLocale" class="form-select">
                  <option v-for="locale in availableTargetLocales" :key="locale.code" :value="locale.code">
                    {{ locale.nativeName }} {{ locale.code !== currentLocale ? '' : '(当前)' }}
                  </option>
                </select>
              </div>

              <div class="form-item">
                <label class="checkbox-item">
                  <input type="checkbox" v-model="applyRTL" />
                  <span>应用 RTL 布局（适用于阿拉伯语/希伯来语）</span>
                </label>
              </div>

              <div class="modal-actions">
                <button class="btn btn-outline" @click="showLocalizeModal = false">取消</button>
                <button class="btn btn-primary" @click="handleLocalize" :disabled="isLocalizing">
                  {{ isLocalizing ? '翻译中...' : '🌐 开始翻译' }}
                </button>
              </div>
            </div>
          </div>

          <!-- 批量主题弹窗 -->
          <div v-if="showBatchThemeModal" class="modal-mask" @click.self="showBatchThemeModal = false">
            <div class="batch-theme-modal">
              <div class="modal-title">🌈 批量应用主题</div>
              <p class="modal-desc">选择主题颜色，将应用到当前PPT的所有幻灯片</p>
              <div class="form-item">
                <label class="form-label">主题预设</label>
                <div class="theme-presets">
                  <button v-for="preset in colorSchemes" :key="preset.name" class="preset-btn" @click="applyPresetTheme(preset)">
                    <div class="preset-colors">
                      <span v-for="c in preset.colors" :key="c" class="preset-dot" :style="{ background: c }"></span>
                    </div>
                    <span>{{ preset.name }}</span>
                  </button>
                </div>
              </div>
              <div class="form-item">
                <label class="form-label">主色</label>
                <div class="color-input-row">
                  <input type="color" v-model="batchThemePrimary" class="color-picker" />
                  <input type="text" v-model="batchThemePrimary" maxlength="7" class="form-input color-text" />
                </div>
              </div>
              <div class="form-item">
                <label class="form-label">副色</label>
                <div class="color-input-row">
                  <input type="color" v-model="batchThemeSecondary" class="color-picker" />
                  <input type="text" v-model="batchThemeSecondary" maxlength="7" class="form-input color-text" />
                </div>
              </div>
              <div class="form-item">
                <label class="form-label">强调色</label>
                <div class="color-input-row">
                  <input type="color" v-model="batchThemeAccent" class="color-picker" />
                  <input type="text" v-model="batchThemeAccent" maxlength="7" class="form-input color-text" />
                </div>
              </div>
              <div class="theme-preview-strip">
                <div class="strip-primary" :style="{ background: batchThemePrimary }"></div>
                <div class="strip-secondary" :style="{ background: batchThemeSecondary }"></div>
                <div class="strip-accent" :style="{ background: batchThemeAccent }"></div>
              </div>
              <div class="modal-actions">
                <button class="btn btn-outline" @click="showBatchThemeModal = false">取消</button>
                <button class="btn btn-primary" @click="handleBatchApplyTheme">应用主题</button>
              </div>
            </div>
          </div>

          <!-- 批量导出弹窗 -->
          <div v-if="showBatchExportModal" class="modal-mask" @click.self="showBatchExportModal = false">
            <div class="batch-export-modal">
              <div class="modal-title">📦 批量导出PPT</div>
              <p class="modal-desc">选择要导出的历史PPT（当前PPT已默认选中）</p>
              <div class="batch-export-list">
                <div
                  v-for="item in batchExportList"
                  :key="item.taskId"
                  class="batch-export-item"
                  :class="{ selected: batchExportSelected.has(item.taskId), current: item.taskId === taskId }"
                  @click="toggleBatchExportItem(item.taskId)"
                >
                  <input type="checkbox" :checked="batchExportSelected.has(item.taskId)" />
                  <div class="batch-export-info">
                    <div class="batch-export-title">{{ item.title || '未命名PPT' }}</div>
                    <div class="batch-export-meta">{{ item.slideCount }}页 · {{ item.style }}</div>
                  </div>
                  <span v-if="item.taskId === taskId" class="batch-current-tag">当前</span>
                </div>
              </div>
              <div class="batch-export-summary">
                已选择 {{ batchExportSelected.size }} 个PPT
              </div>
              <div class="modal-actions">
                <button class="btn btn-outline" @click="showBatchExportModal = false">取消</button>
                <button class="btn btn-primary" @click="doBatchExport" :disabled="batchExportSelected.size === 0">
                  导出 ({{ batchExportSelected.size }})
                </button>
              </div>
            </div>
          </div>

          <!-- R142: 内容编辑面板 - 完整无障碍支持 -->
          <div
            v-if="isEditMode"
            class="content-edit-panel"
            :class="{ 'drag-over': isDragOver }"
            role="application"
            aria-label="幻灯片内容编辑器"
            aria-describedby="edit-mode-description"
            @dragover.prevent="handleDragOver"
            @dragleave="handleDragLeave"
            @drop.prevent="handleDrop"
            @mousemove="handleEditorMouseMove"
            @keydown="handleEditModeKeydown"
            tabindex="0"
          >
            <!-- R142: 屏幕阅读器说明 -->
            <div id="edit-mode-description" class="sr-only" aria-live="polite">
              编辑模式已开启。使用 Tab 键在字段间导航，方向键在幻灯片间移动。
              按 Escape 键退出编辑模式。
              Ctrl+S 或 Cmd+S 保存并重新生成。
            </div>
            <!-- 拖拽提示层 -->
            <div v-if="isDragOver" class="drag-overlay">
              <div class="drag-hint">
                <span class="drag-icon">📥</span>
                <p>释放文件以导入为新页面</p>
                <p class="drag-tip">支持图片、文本文件</p>
              </div>
            </div>
            <!-- R142: 编辑头部 - 无障碍标题和键盘快捷键提示 -->
            <div class="edit-header">
              <h3 id="edit-panel-title">编辑幻灯片内容</h3>
              <p class="edit-tip" id="edit-mode-description-2">
                点击下方标题或内容进行编辑，修改后可重新生成
                <span class="clip-tip">| 按 ⌘V / Ctrl+V 粘贴 · 拖拽文件导入 · Esc 退出 · Ctrl+S 保存</span>
              </p>
            </div>
            <!-- R142: 编辑幻灯片列表 - 无障碍列表 -->
            <div class="edit-slides" role="list" aria-label="幻灯片编辑列表" :aria-label="`共 ${editableSlides.length} 页幻灯片，当前第 ${focusedSlideIndex + 1} 页`">
              <div
                v-for="(slide, index) in editableSlides"
                :key="index"
                class="edit-slide-card"
                role="listitem"
                :aria-current="focusedSlideIndex === index ? 'true' : undefined"
                :aria-label="`第 ${index + 1} 页，共 ${editableSlides.length} 页`"
                :data-slide-index="index"
                @focus="focusedSlideIndex = index"
              >
                <div class="edit-slide-header">
                  <span class="slide-num" :aria-label="`第 ${index + 1} 页`">第 {{ index + 1 }} 页</span>
                  <label :for="`layout-select-${index}`" class="sr-only">选择布局</label>
                  <select
                    :id="`layout-select-${index}`"
                    v-model="slide.layout"
                    class="layout-select"
                    :aria-label="`第 ${index + 1} 页布局`"
                  >
                    <option value="title">标题页</option>
                    <option value="content">内容页</option>
                    <option value="two_column">双栏</option>
                    <option value="left_image_right_text">左图右文</option>
                    <option value="left_text_right_image">左文右图</option>
                    <option value="card">卡片</option>
                    <option value="center_radiation">居中</option>
                  </select>
                  <!-- R142: 操作按钮 - 完整无障碍支持 -->
                  <div class="slide-action-btns" role="group" :aria-label="`第 ${index + 1} 页操作`">
                    <button
                      class="slide-action-btn"
                      @click="moveSlideUp(index)"
                      :disabled="index === 0"
                      :title="`上移至第 ${index} 页`"
                      :aria-label="`上移，当前第 ${index + 1} 页${index === 0 ? '，已禁用' : ''}`"
                      :aria-disabled="index === 0"
                    >⬆️</button>
                    <button
                      class="slide-action-btn"
                      @click="moveSlideDown(index)"
                      :disabled="index === editableSlides.length - 1"
                      :title="`下移至第 ${index + 2} 页`"
                      :aria-label="`下移，当前第 ${index + 1} 页${index === editableSlides.length - 1 ? '，已禁用' : ''}`"
                      :aria-disabled="index === editableSlides.length - 1"
                    >⬇️</button>
                    <button
                      class="slide-action-btn"
                      @click="deleteSlide(index)"
                      :disabled="editableSlides.length <= 1"
                      :title="`删除第 ${index + 1} 页`"
                      :aria-label="`删除第 ${index + 1} 页${editableSlides.length <= 1 ? '，已禁用' : ''}`"
                      :aria-disabled="editableSlides.length <= 1"
                    >🗑️</button>
                  </div>
                </div>
                <!-- R142: 标题字段 - 完整无障碍支持 -->
                <div class="edit-field-row">
                  <label :for="`slide-title-${index}`" class="sr-only">第 {{ index + 1 }} 页标题</label>
                  <input
                    :id="`slide-title-${index}`"
                    v-model="slide.title"
                    type="text"
                    class="edit-slide-title"
                    :placeholder="`第 ${index + 1} 页标题`"
                    :aria-label="`第 ${index + 1} 页标题`"
                    :data-slide-index="index"
                    data-field="title"
                    @keydown="handleSlideFieldKeydown($event, index, 'title')"
                  />
                  <!-- Mobile voice dictation button for title -->
                  <button
                    v-if="isMobile && isDictationSupported"
                    class="dictation-btn"
                    :class="{ active: dictationActive && dictatingSlideIndex === index && dictatingField === 'title' }"
                    @click="startDictationForField(index, 'title')"
                    :title="dictationActive && dictatingSlideIndex === index ? '停止录音' : '语音输入标题'"
                    type="button"
                    :aria-label="dictationActive && dictatingSlideIndex === index ? '停止语音输入' : '语音输入标题'"
                    :aria-pressed="dictationActive && dictatingSlideIndex === index && dictatingField === 'title'"
                  >
                    {{ dictationActive && dictatingSlideIndex === index && dictatingField === 'title' ? '⏹️' : '🎤' }}
                  </button>
                </div>
                <!-- Dictation interim feedback -->
                <div v-if="isMobile && dictationActive && dictatingSlideIndex === index && dictatingField === 'title'" class="dictation-feedback" aria-live="polite">
                  {{ dictationInterim || '正在聆听...' }}
                </div>
                <!-- R142: 内容字段 - 完整无障碍支持 -->
                <div class="edit-field-row">
                  <label :for="`slide-content-${index}`" class="sr-only">第 {{ index + 1 }} 页内容</label>
                  <textarea
                    :id="`slide-content-${index}`"
                    v-model="slide.content"
                    class="edit-slide-content"
                    :placeholder="`第 ${index + 1} 页内容，每行一个要点`"
                    :aria-label="`第 ${index + 1} 页内容`"
                    rows="4"
                    :data-slide-index="index"
                    data-field="content"
                    @keydown="handleSlideFieldKeydown($event, index, 'content')"
                  ></textarea>
                  <!-- Mobile voice dictation button for content -->
                  <button
                    v-if="isMobile && isDictationSupported"
                    class="dictation-btn"
                    :class="{ active: dictationActive && dictatingSlideIndex === index && dictatingField === 'content' }"
                    @click="startDictationForField(index, 'content')"
                    :title="dictationActive && dictatingSlideIndex === index ? '停止录音' : '语音输入内容'"
                    type="button"
                    :aria-label="dictationActive && dictatingSlideIndex === index ? '停止语音输入' : '语音输入内容'"
                    :aria-pressed="dictationActive && dictatingSlideIndex === index && dictatingField === 'content'"
                  >
                    {{ dictationActive && dictatingSlideIndex === index && dictatingField === 'content' ? '⏹️' : '🎤' }}
                  </button>
                </div>
                <!-- Dictation interim feedback for content -->
                <div v-if="isMobile && dictationActive && dictatingSlideIndex === index && dictatingField === 'content'" class="dictation-feedback" aria-live="polite">
                  {{ dictationInterim || '正在聆听...' }}
                </div>
                <!-- R152: 高级备注编辑器 - 标签页切换 -->
                <div class="notes-editor-panel">
                  <!-- 标签页切换 -->
                  <div class="notes-tabs" role="tablist">
                    <button
                      class="notes-tab"
                      :class="{ active: notesTab === 'notes' }"
                      @click="notesTab = 'notes'"
                      role="tab"
                      :aria-selected="notesTab === 'notes'"
                    >📝 备注</button>
                    <button
                      class="notes-tab"
                      :class="{ active: notesTab === 'sticky' }"
                      @click="notesTab = 'sticky'"
                      role="tab"
                      :aria-selected="notesTab === 'sticky'"
                    >📌 便签 <span v-if="slide.stickyNotes?.length" class="sticky-badge">{{ slide.stickyNotes.length }}</span></button>
                  </div>

                  <!-- 备注编辑器 -->
                  <div v-if="notesTab === 'notes'" class="notes-content">
                    <!-- 备注模板选择器 -->
                    <div class="notes-template-row" v-if="notesTemplates.length > 0">
                      <select
                        class="notes-template-select"
                        @change="(e: Event) => { const tpl = notesTemplates.find(t => t.id === (e.target as HTMLSelectElement).value); if (tpl) applyNotesTemplate(tpl, index) }"
                        :aria-label="'选择备注模板'"
                      >
                        <option value="">— 应用备注模板 —</option>
                        <option v-for="tpl in notesTemplates" :key="tpl.id" :value="tpl.id">{{ tpl.name }}</option>
                      </select>
                    </div>
                    <!-- 富文本备注 -->
                    <textarea
                      :id="`slide-notes-${index}`"
                      v-model="slide.richNotes"
                      class="edit-slide-notes"
                      :placeholder="`第 ${index + 1} 页备注（支持富文本格式）`"
                      :aria-label="`第 ${index + 1} 页备注`"
                      rows="3"
                      :data-slide-index="index"
                      data-field="notes"
                      @blur="saveRichNotes(index)"
                      @keydown="handleSlideFieldKeydown($event, index, 'notes')"
                    ></textarea>
                    <!-- 演讲者私有备注 -->
                    <textarea
                      v-model="slide.speakerNotes"
                      class="edit-slide-notes speaker-notes"
                      :placeholder="'🔒 演讲者私有备注（仅演示者可见）'"
                      rows="2"
                      @blur="saveRichNotes(index)"
                      :aria-label="'演讲者私有备注'"
                    ></textarea>
                    <!-- Mobile voice dictation button for notes -->
                    <button
                      v-if="isMobile && isDictationSupported"
                      class="dictation-btn"
                      :class="{ active: dictationActive && dictatingSlideIndex === index && dictatingField === 'notes' }"
                      @click="startDictationForField(index, 'notes')"
                      :title="dictatingActive && dictatingSlideIndex === index ? '停止录音' : '语音输入备注'"
                      type="button"
                      :aria-label="dictatingActive && dictatingSlideIndex === index ? '停止语音输入' : '语音输入备注'"
                      :aria-pressed="dictatingActive && dictatingSlideIndex === index && dictatingField === 'notes'"
                    >
                      {{ dictatingActive && dictatingSlideIndex === index && dictatingField === 'notes' ? '⏹️' : '🎤' }}
                    </button>
                  </div>

                  <!-- 便签面板 -->
                  <div v-if="notesTab === 'sticky'" class="sticky-content">
                    <!-- 添加便签表单 -->
                    <div class="sticky-add-form">
                      <div class="sticky-color-picker">
                        <span
                          v-for="color in ['#FFE066','#FF9F43','#EE5A5A','#54A0FF','#5F27CD','#1DD1A1']"
                          :key="color"
                          class="sticky-color-dot"
                          :style="{ background: color }"
                          :class="{ active: currentStickyNote.color === color }"
                          @click="currentStickyNote.color = color"
                          :title="'选择便签颜色'"
                        ></span>
                      </div>
                      <input
                        v-model="currentStickyNote.content"
                        class="sticky-input"
                        :placeholder="'添加团队便签...'"
                        @keydown.enter.prevent="addStickyNote(index)"
                      />
                      <button class="btn btn-sm btn-primary" @click="addStickyNote(index)">添加</button>
                    </div>
                    <!-- 便签列表 -->
                    <div class="sticky-list">
                      <div
                        v-for="note in (slide.stickyNotes || [])"
                        :key="note.id"
                        class="sticky-note-item"
                        :style="{ background: note.color || '#FFE066' }"
                      >
                        <div class="sticky-note-content">{{ note.content }}</div>
                        <div class="sticky-note-meta">
                          <span class="sticky-author">{{ note.author }}</span>
                          <button class="sticky-delete-btn" @click="deleteStickyNote(index, note.id)" title="删除便签">×</button>
                        </div>
                      </div>
                      <div v-if="!slide.stickyNotes?.length" class="sticky-empty">暂无便签，点击上方添加</div>
                    </div>
                  </div>
                </div>
                <!-- R142: 单页预览按钮 - 无障碍 -->
                <button
                  class="btn btn-sm btn-preview"
                  @click="previewSlide(index)"
                  :aria-label="`预览第 ${index + 1} 页`"
                >
                  👁️ 预览此页
                </button>
                <!-- R142: 图片操作按钮 - 无障碍 -->
                <div class="slide-image-controls" role="group" :aria-label="`第 ${index + 1} 页图片操作`">
                  <button
                    class="btn btn-sm btn-image-upload"
                    @click="triggerImageUpload(index)"
                    :aria-label="`为第 ${index + 1} 页上传图片`"
                  >
                    📷 上传图片
                  </button>
                  <button
                    class="btn btn-sm btn-image-regenerate"
                    @click="regenerateSlideImage(index)"
                    :aria-label="`AI为第 ${index + 1} 页生成图片`"
                  >
                    🎨 AI生成
                  </button>
                  <button
                    class="btn btn-sm btn-image-remove"
                    @click="removeSlideImage(index)"
                    v-if="slide.imageUrl"
                    :aria-label="`移除第 ${index + 1} 页图片`"
                  >
                    🗑️ 移除图片
                  </button>
                  <input
                    type="file"
                    :ref="el => imageUploadRefs[index] = el"
                    accept="image/*"
                    style="display: none"
                    @change="handleImageUpload(index, $event)"
                    :aria-label="`第 ${index + 1} 页图片上传`"
                  />
                  <!-- 当前图片预览 -->
                  <div v-if="slide.imageUrl" class="slide-image-preview">
                    <img :src="slide.imageUrl" :alt="`第 ${index + 1} 页当前图片`" />
                  </div>
                </div>
              </div>
            </div>
            <div class="edit-actions">
              <button class="btn btn-outline" @click="addEditSlide">
                + 添加页面
              </button>
              <button class="btn btn-outline btn-clip" @click="showClipboardHistory = true" title="剪贴板历史">
                📋 历史
              </button>
              <button class="btn btn-outline btn-clip" @click="importFromScreenshot" :disabled="isProcessingOCR" :title="'OCR识别截图文字'">
                {{ isProcessingOCR ? '🔍 识别中...' : '📸 导入截图' }}
              </button>
              <button class="btn btn-primary" @click="regenerateWithEdits" :disabled="isRegenerating">
                {{ isRegenerating ? '重新生成中...' : '💾 重新生成PPT' }}
              </button>
            </div>
          </div>

          <!-- 剪贴板历史面板 -->
          <div v-if="showClipboardHistory" class="clipboard-history-overlay" @click.self="showClipboardHistory = false">
            <div class="clipboard-history-panel">
              <div class="clip-panel-header">
                <h3>📋 剪贴板历史</h3>
                <div class="clip-panel-actions">
                  <button class="btn btn-sm btn-outline" @click="clearClipboardHistory" :disabled="clipboardHistory.length === 0">
                    🗑️ 清空
                  </button>
                  <button class="btn btn-sm" @click="showClipboardHistory = false">✕</button>
                </div>
              </div>
              <div v-if="clipboardHistory.length === 0" class="clip-empty">
                <p>暂无剪贴板记录</p>
                <p class="clip-empty-tip">在编辑模式下按 ⌘V / Ctrl+V 复制内容将自动记录</p>
              </div>
              <div v-else class="clip-list">
                <div
                  v-for="item in clipboardHistory"
                  :key="item.id"
                  class="clip-item"
                  @click="applyHistoryItem(item)"
                >
                  <div class="clip-item-type">
                    <span v-if="item.type === 'image'">🖼️ 图片</span>
                    <span v-else>📝 文本</span>
                  </div>
                  <div v-if="item.type === 'image'" class="clip-item-preview">
                    <img :src="item.content" alt="剪贴板图片" />
                  </div>
                  <div v-else class="clip-item-text">{{ item.preview }}</div>
                  <div class="clip-item-time">{{ formatClipboardTime(item.timestamp) }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 粘贴预览弹窗 -->
          <div v-if="showPastePreview && pendingPasteContent" class="paste-preview-overlay" @click.self="showPastePreview = false; pendingPasteContent = null">
            <div class="paste-preview-panel">
              <div class="paste-panel-header">
                <h3>{{ pendingPasteContent.type === 'image' ? '🖼️ 粘贴图片' : '📋 粘贴为新页面' }}</h3>
                <button class="btn btn-sm" @click="showPastePreview = false; pendingPasteContent = null">✕</button>
              </div>
              <div class="paste-panel-body">
                <div v-if="pendingPasteContent.type === 'image'" class="paste-image-preview">
                  <img :src="pendingPasteContent.content" alt="待粘贴图片" />
                </div>
                <div v-else class="paste-text-preview">
                  <div class="paste-preview-title">预览</div>
                  <div class="paste-text-content">{{ smartParseText(pendingPasteContent.content).title }}</div>
                  <div class="paste-text-bullets" v-if="smartParseText(pendingPasteContent.content).content.length">
                    <div v-for="(line, i) in smartParseText(pendingPasteContent.content).content" :key="i">
                      • {{ line }}
                    </div>
                  </div>
                  <div class="paste-layout-hint">
                    推荐布局: <span>{{ smartParseText(pendingPasteContent.content).layout }}</span>
                  </div>
                </div>
              </div>
              <div class="paste-panel-footer">
                <button class="btn btn-outline" @click="showPastePreview = false; pendingPasteContent = null">取消</button>
                <button class="btn btn-primary" @click="confirmPasteAsNewSlide">
                  ✓ 确认为新页面
                </button>
              </div>
            </div>
          </div>

          <!-- 导出菜单 -->
          <div v-if="showExportMenu" class="export-menu">
            <!-- 导出格式选择 -->
            <div class="export-format-section">
              <div class="export-section-title">选择导出格式</div>
              <div class="format-grid">
                <label
                  v-for="format in exportFormats"
                  :key="format.id"
                  class="format-option"
                  :class="{ active: selectedFormat === format.id }"
                >
                  <input
                    type="radio"
                    :value="format.id"
                    v-model="selectedFormat"
                    class="format-radio"
                  />
                  <span class="format-icon">{{ format.icon }}</span>
                  <span class="format-name">{{ format.name }}</span>
                  <span class="format-desc">{{ format.desc }}</span>
                </label>
              </div>
            </div>

            <!-- 主题切换 -->
            <div class="export-theme-toggle">
              <span class="export-section-title">主题风格</span>
              <div class="theme-buttons">
                <button
                  class="theme-btn"
                  :class="{ active: exportTheme === 'light' }"
                  @click="exportTheme = 'light'"
                >
                  ☀️ 亮色
                </button>
                <button
                  class="theme-btn"
                  :class="{ active: exportTheme === 'dark' }"
                  @click="exportTheme = 'dark'"
                >
                  🌙 暗色
                </button>
              </div>
            </div>

            <!-- 导出质量选择 -->
            <div v-if="exportFormats.find(f => f.id === selectedFormat)?.quality" class="export-quality-section">
              <div class="export-section-title">导出质量</div>
              <div class="quality-options">
                <label
                  v-for="quality in qualityOptions"
                  :key="quality.id"
                  class="quality-option"
                  :class="{ active: selectedQuality === quality.id }"
                >
                  <input
                    type="radio"
                    :value="quality.id"
                    v-model="selectedQuality"
                    class="quality-radio"
                  />
                  <span class="quality-name">{{ quality.name }}</span>
                  <span class="quality-desc">{{ quality.desc }}</span>
                  <span class="quality-size">{{ quality.size }}</span>
                </label>
              </div>
              <p class="quality-note">（当前版本基于同一源文件，quality 仅影响文件名后缀）</p>
            </div>

            <!-- PDF打印增强选项 -->
            <div v-if="selectedFormat === 'pdf'" class="pdf-options-section">
              <div class="export-section-title">📄 PDF打印选项</div>
              
              <!-- PDF布局模式 -->
              <div class="pdf-mode-group">
                <div class="pdf-mode-label">布局模式</div>
                <div class="pdf-mode-buttons">
                  <button class="pdf-mode-btn" :class="{ active: pdfOptions.mode === 'slides' }" @click="pdfOptions.mode = 'slides'">幻灯片</button>
                  <button class="pdf-mode-btn" :class="{ active: pdfOptions.mode === 'notes' }" @click="pdfOptions.mode = 'notes'">备注页</button>
                  <button class="pdf-mode-btn" :class="{ active: pdfOptions.mode === 'handout' }" @click="pdfOptions.mode = 'handout'">讲义</button>
                </div>
              </div>

              <!-- 讲义布局 (仅在handout模式下显示) -->
              <div v-if="pdfOptions.mode === 'handout'" class="pdf-handout-group">
                <div class="pdf-mode-label">每页幻灯片数</div>
                <div class="pdf-mode-buttons">
                  <button class="pdf-mode-btn" :class="{ active: pdfOptions.handoutLayout === '1' }" @click="pdfOptions.handoutLayout = '1'">1张</button>
                  <button class="pdf-mode-btn" :class="{ active: pdfOptions.handoutLayout === '2' }" @click="pdfOptions.handoutLayout = '2'">2张</button>
                  <button class="pdf-mode-btn" :class="{ active: pdfOptions.handoutLayout === '3' }" @click="pdfOptions.handoutLayout = '3'">3张</button>
                  <button class="pdf-mode-btn" :class="{ active: pdfOptions.handoutLayout === '6' }" @click="pdfOptions.handoutLayout = '6'">6张</button>
                </div>
              </div>

              <!-- 页面尺寸 -->
              <div class="pdf-size-group">
                <div class="pdf-mode-label">页面尺寸</div>
                <div class="pdf-mode-buttons">
                  <button class="pdf-mode-btn" :class="{ active: pdfOptions.pageSize === 'A4' }" @click="pdfOptions.pageSize = 'A4'">A4</button>
                  <button class="pdf-mode-btn" :class="{ active: pdfOptions.pageSize === 'Letter' }" @click="pdfOptions.pageSize = 'Letter'">Letter</button>
                  <button class="pdf-mode-btn" :class="{ active: pdfOptions.pageSize === '16:9' }" @click="pdfOptions.pageSize = '16:9'">16:9</button>
                  <button class="pdf-mode-btn" :class="{ active: pdfOptions.pageSize === '4:3' }" @click="pdfOptions.pageSize = '4:3'">4:3</button>
                </div>
              </div>

              <!-- 方向 -->
              <div class="pdf-orientation-group">
                <div class="pdf-mode-label">方向</div>
                <div class="pdf-mode-buttons">
                  <button class="pdf-mode-btn" :class="{ active: pdfOptions.orientation === 'landscape' }" @click="pdfOptions.orientation = 'landscape'">横向</button>
                  <button class="pdf-mode-btn" :class="{ active: pdfOptions.orientation === 'portrait' }" @click="pdfOptions.orientation = 'portrait'">纵向</button>
                </div>
              </div>

              <!-- 水印设置 -->
              <div class="pdf-watermark-group">
                <label class="pdf-toggle-row">
                  <span class="pdf-toggle-label">🔒 启用水印</span>
                  <switch :checked="pdfOptions.watermarkEnabled" @change="pdfOptions.watermarkEnabled = $event.detail.value" class="pdf-switch" />
                </label>
                <div v-if="pdfOptions.watermarkEnabled" class="pdf-watermark-options">
                  <input v-model="pdfOptions.watermarkText" placeholder="水印文字" class="pdf-input" />
                  <div class="pdf-slider-row">
                    <span class="pdf-slider-label">透明度</span>
                    <input type="range" v-model="pdfOptions.watermarkOpacity" min="0.05" max="0.5" step="0.05" class="pdf-slider" />
                    <span class="pdf-slider-value">{{ Math.round(pdfOptions.watermarkOpacity * 100) }}%</span>
                  </div>
                </div>
              </div>

              <!-- 页眉页脚 -->
              <div class="pdf-header-footer-group">
                <label class="pdf-toggle-row">
                  <span class="pdf-toggle-label">📌 启用页眉页脚</span>
                  <switch :checked="pdfOptions.headerFooterEnabled" @change="pdfOptions.headerFooterEnabled = $event.detail.value" class="pdf-switch" />
                </label>
                <div v-if="pdfOptions.headerFooterEnabled" class="pdf-hf-options">
                  <input v-model="pdfOptions.headerText" placeholder="页眉文字(可选)" class="pdf-input" />
                  <input v-model="pdfOptions.footerText" placeholder="页脚文字(可选)" class="pdf-input" />
                  <div class="pdf-page-format-row">
                    <span class="pdf-slider-label">页码格式</span>
                    <select v-model="pdfOptions.pageNumberFormat" class="pdf-select">
                      <option value="Page {current} of {total}">Page 1 of 10</option>
                      <option value="{current}/{total}">1/10</option>
                      <option value="第 {current} 页">第 1 页</option>
                      <option value="{current}">1</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- 自定义比例 -->
            <div class="aspect-ratio-section">
              <div class="export-section-title">📐 自定义比例</div>
              <div class="aspect-ratio-buttons">
                <button
                  class="aspect-btn"
                  :class="{ active: selectedAspectRatio === '16:9' }"
                  @click="selectedAspectRatio = '16:9'"
                >
                  <span class="aspect-label">16:9</span>
                  <span class="aspect-desc">宽屏</span>
                </button>
                <button
                  class="aspect-btn"
                  :class="{ active: selectedAspectRatio === '4:3' }"
                  @click="selectedAspectRatio = '4:3'"
                >
                  <span class="aspect-label">4:3</span>
                  <span class="aspect-desc">标准</span>
                </button>
                <button
                  class="aspect-btn"
                  :class="{ active: selectedAspectRatio === '1:1' }"
                  @click="selectedAspectRatio = '1:1'"
                >
                  <span class="aspect-label">1:1</span>
                  <span class="aspect-desc">方形</span>
                </button>
                <button
                  class="aspect-btn"
                  :class="{ active: selectedAspectRatio === '9:16' }"
                  @click="selectedAspectRatio = '9:16'"
                >
                  <span class="aspect-label">9:16</span>
                  <span class="aspect-desc">竖版</span>
                </button>
              </div>
              <p class="aspect-note">* 比例调整将在下次导出时应用</p>
            </div>

            <!-- 图表配置 -->
            <div class="chart-config-section">
              <div class="export-section-title">图表配置</div>
              <div class="chart-toggles">
                <label class="chart-toggle-item">
                  <span class="chart-toggle-label">包含数据图表</span>
                  <switch
                    :checked="chartConfig.include_charts"
                    @change="chartConfig.include_charts = $event.detail.value"
                    class="chart-switch"
                  />
                </label>
                <label class="chart-toggle-item" :class="{ disabled: !chartConfig.include_charts }">
                  <span class="chart-toggle-label">🥧 饼图</span>
                  <switch
                    :checked="chartConfig.include_pie_chart"
                    @change="chartConfig.include_pie_chart = $event.detail.value"
                    class="chart-switch"
                    :disabled="!chartConfig.include_charts"
                  />
                </label>
                <label class="chart-toggle-item" :class="{ disabled: !chartConfig.include_charts }">
                  <span class="chart-toggle-label">📊 柱状图</span>
                  <switch
                    :checked="chartConfig.include_bar_chart"
                    @change="chartConfig.include_bar_chart = $event.detail.value"
                    class="chart-switch"
                    :disabled="!chartConfig.include_charts"
                  />
                </label>
                <label class="chart-toggle-item" :class="{ disabled: !chartConfig.include_charts }">
                  <span class="chart-toggle-label">📈 折线图</span>
                  <switch
                    :checked="chartConfig.include_line_chart"
                    @change="chartConfig.include_line_chart = $event.detail.value"
                    class="chart-switch"
                    :disabled="!chartConfig.include_charts"
                  />
                </label>
              </div>
            </div>

            <!-- 导出进度指示器 -->
            <div v-if="isExporting" class="export-progress-section">
              <div class="export-progress-bar">
                <div class="export-progress-fill" :style="{ width: exportProgress + '%' }"></div>
              </div>
              <div class="export-progress-text">
                <span>{{ exportStatusText }}</span>
                <span>{{ exportProgress }}%</span>
              </div>
            </div>

            <!-- 导出按钮 -->
            <button
              class="export-confirm-btn"
              @click="handleExport"
              :disabled="isExporting"
            >
              <span v-if="isExporting">导出中...</span>
              <span v-else>📥 导出 {{ exportFormats.find(f => f.id === selectedFormat)?.name }}</span>
            </button>

            <!-- PNG序列ZIP导出按钮 -->
            <button
              v-if="selectedFormat === 'png'"
              class="export-confirm-btn export-png-zip-btn"
              @click="handleExportPngZip"
              :disabled="isExporting"
            >
              📦 导出PNG序列(ZIP)
            </button>

            <!-- 其他选项 -->
            <div class="export-others">
              <button class="export-option" @click="handleBatchExport">
                <span class="export-icon">📦</span>
                <span>批量导出</span>
              </button>
              <button class="export-option" @click="handlePrint">
                <span class="export-icon">🖨️</span>
                <span>打印</span>
              </button>
            </div>

            <!-- 导出历史记录 -->
            <div class="export-history-section">
              <div class="export-section-title">导出历史</div>
              <div v-if="exportHistory.length === 0" class="export-history-empty">
                暂无导出记录
              </div>
              <div v-else class="export-history-list">
                <div
                  v-for="item in exportHistory.slice(0, 10)"
                  :key="item.id"
                  class="export-history-item"
                  @click="downloadExportHistoryItem(item)"
                >
                  <div class="export-history-info">
                    <span class="export-history-format">{{ item.format }}</span>
                    <span class="export-history-quality">{{ item.quality }}</span>
                    <span class="export-history-slides">{{ item.slideCount }}页</span>
                  </div>
                  <div class="export-history-meta">
                    <span class="export-history-time">{{ formatExportTime(item.timestamp) }}</span>
                    <span class="export-history-size">{{ item.fileSize }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button class="btn btn-lg btn-element-edit" @click="showElementEditor = true">
            <span>🛠️</span> 元素微调
          </button>

          <!-- 分享菜单 -->
          <div v-if="showShareMenu" class="share-menu">
            <!-- 二维码展示 -->
            <div v-if="showQRCode" class="qrcode-section">
              <div class="qrcode-header">
                <h4>扫描二维码分享</h4>
                <button class="qrcode-close" @click="showQRCode = false">✕</button>
              </div>
              <img
                :src="generateQRCodeUrl(shareUrl)"
                alt="二维码"
                class="qrcode-image"
              />
              <p class="qrcode-tip">扫码打开链接</p>
              <button class="btn btn-outline" @click="handleShare('copy')">
                复制链接
              </button>
            </div>
            <!-- 分享选项 -->
            <template v-else>
              <button
                v-for="opt in shareOptions"
                :key="opt.id"
                class="share-option"
                :class="{ disabled: opt.supported === false && opt.id === 'native' }"
                @click="handleShare(opt.id)"
              >
                <span class="share-icon">{{ opt.icon }}</span>
                <span>{{ opt.name }}</span>
              </button>
            </template>
          </div>
        </div>

        <!-- 安全设置面板 -->
        <div v-if="showSecurityPanel" class="security-panel-overlay" @click="showSecurityPanel = false">
          <div class="security-panel" @click.stop>
            <div class="security-panel-header">
              <h3>🔒 安全设置</h3>
              <button class="btn btn-sm" @click="showSecurityPanel = false">✕</button>
            </div>
            <div v-if="securityLoading" class="security-loading">
              <div class="loading-spinner"></div>
              <p>加载中...</p>
            </div>
            <div v-else class="security-panel-content">
              <!-- Password Protection -->
              <div class="security-section">
                <div class="security-section-title">🔑 密码保护</div>
                <div class="security-status-row">
                  <span class="security-status-label">状态</span>
                  <span :class="['security-badge', securityConfig?.has_password ? 'badge-active' : 'badge-inactive']">
                    {{ securityConfig?.has_password ? '已启用' : '未启用' }}
                  </span>
                </div>
                <div v-if="securityConfig?.has_password" class="security-info-row">
                  <span class="security-info-label">设置时间</span>
                  <span class="security-info-value">{{ securityConfig?.password_set_at ? new Date(securityConfig.password_set_at).toLocaleString('zh-CN') : '-' }}</span>
                </div>
                <div class="security-password-group">
                  <input
                    v-model="securityPassword"
                    type="password"
                    placeholder="设置新密码（4位以上）"
                    class="security-input"
                  />
                  <button class="btn btn-sm btn-primary" @click="saveSecurityPassword" :disabled="!securityPassword || securityPassword.length < 4">
                    {{ securityConfig?.has_password ? '更新密码' : '设置密码' }}
                  </button>
                </div>
                <div v-if="securityConfig?.has_password">
                  <button class="btn btn-sm btn-danger" @click="removeSecurityPassword">移除密码保护</button>
                </div>
              </div>

              <!-- Biometric Authentication -->
              <div class="security-section">
                <div class="security-section-title">👆 生物认证</div>
                <div class="security-status-row">
                  <span class="security-status-label">状态</span>
                  <span :class="['security-badge', securityBiometricRequired ? 'badge-active' : 'badge-inactive']">
                    {{ securityBiometricRequired ? '已启用' : '未启用' }}
                  </span>
                </div>
                <p class="security-desc">启用后，下载时需要使用 Touch ID / Face ID 进行身份验证</p>
                <div class="security-toggle-row">
                  <span>启用生物认证</span>
                  <input
                    type="checkbox"
                    :checked="securityBiometricRequired"
                    @change="securityBiometricRequired = ($event.target as HTMLInputElement).checked; saveSecurityBiometric()"
                    class="security-checkbox"
                  />
                </div>
              </div>

              <!-- IP Allowlisting -->
              <div class="security-section">
                <div class="security-section-title">🌐 IP白名单</div>
                <div class="security-status-row">
                  <span class="security-status-label">状态</span>
                  <span :class="['security-badge', securityConfig?.has_ip_restriction ? 'badge-active' : 'badge-inactive']">
                    {{ securityConfig?.has_ip_restriction ? '已启用' : '未启用' }}
                  </span>
                </div>
                <p class="security-desc">设置允许访问的IP地址范围，留空表示不限制</p>
                <div class="security-ip-group">
                  <textarea
                    v-model="securityAllowedIPsInput"
                    placeholder="输入IP地址，多个用逗号分隔，如：192.168.1.1, 10.0.0.0/8"
                    class="security-textarea"
                    rows="2"
                  ></textarea>
                  <button class="btn btn-sm btn-primary" @click="saveSecurityIPs">保存IP白名单</button>
                </div>
                <div v-if="securityAllowedIPs.length > 0" class="security-ip-list">
                  <span v-for="ip in securityAllowedIPs" :key="ip" class="security-ip-badge">{{ ip }}</span>
                </div>
              </div>

              <!-- Auto-Watermark -->
              <div class="security-section">
                <div class="security-section-title">💧 自动水印</div>
                <div class="security-status-row">
                  <span class="security-status-label">状态</span>
                  <span :class="['security-badge', securityAutoWatermark.enabled ? 'badge-active' : 'badge-inactive']">
                    {{ securityAutoWatermark.enabled ? '已启用' : '未启用' }}
                  </span>
                </div>
                <p class="security-desc">导出时自动在每页添加水印，保护您的内容安全</p>
                <div class="security-toggle-row">
                  <span>启用自动水印</span>
                  <input
                    type="checkbox"
                    v-model="securityAutoWatermark.enabled"
                    class="security-checkbox"
                  />
                </div>
                <div v-if="securityAutoWatermark.enabled" class="security-watermark-options">
                  <input v-model="securityAutoWatermark.text" placeholder="水印文字" class="security-input" />
                  <div class="security-slider-row">
                    <span>透明度</span>
                    <input type="range" v-model="securityAutoWatermark.opacity" min="0.05" max="0.5" step="0.05" class="security-slider" />
                    <span>{{ Math.round(securityAutoWatermark.opacity * 100) }}%</span>
                  </div>
                  <div class="security-slider-row">
                    <span>角度</span>
                    <input type="range" v-model="securityAutoWatermark.angle" min="-90" max="90" step="5" class="security-slider" />
                    <span>{{ securityAutoWatermark.angle }}°</span>
                  </div>
                  <div class="security-slider-row">
                    <span>字号</span>
                    <input type="range" v-model="securityAutoWatermark.font_size" min="12" max="120" step="4" class="security-slider" />
                    <span>{{ securityAutoWatermark.font_size }}px</span>
                  </div>
                  <input v-model="securityAutoWatermark.color" type="color" class="security-color" />
                  <button class="btn btn-sm btn-primary" @click="saveSecurityWatermark">保存水印设置</button>
                </div>
              </div>

              <!-- Access Log -->
              <div class="security-section">
                <div class="security-section-title">📋 访问日志</div>
                <div v-if="securityAccessLog.length === 0" class="security-empty-log">
                  暂无访问记录
                </div>
                <div v-else class="security-log-list">
                  <div v-for="log in securityAccessLog.slice(0, 20)" :key="log.timestamp" class="security-log-item">
                    <span class="log-action">{{ log.action }}</span>
                    <span class="log-time">{{ new Date(log.timestamp).toLocaleString('zh-CN') }}</span>
                    <span class="log-ip">{{ log.details?.client_ip || '-' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 安全下载验证弹窗 -->
        <div v-if="showSecurityDownloadModal" class="security-download-modal-overlay" @click.self="showSecurityDownloadModal = false">
          <div class="security-download-modal">
            <div class="security-modal-header">
              <h3>🔐 验证身份</h3>
              <button class="btn btn-sm" @click="showSecurityDownloadModal = false">✕</button>
            </div>
            <div class="security-modal-body">
              <div v-if="securityConfig?.has_password" class="security-modal-field">
                <label>请输入密码</label>
                <input
                  v-model="securityDownloadPassword"
                  type="password"
                  placeholder="输入密码"
                  class="security-input"
                  @keyup.enter="handleSecurityDownload"
                />
              </div>
              <div v-if="securityConfig?.biometric_required" class="security-modal-field">
                <p class="security-modal-tip">请使用 Touch ID / Face ID 验证身份</p>
                <button class="btn btn-primary" @click="triggerBiometric().then(() => doDownload('biometric_verified'))">
                  👆 使用生物认证
                </button>
              </div>
              <div v-if="securityConfig?.has_ip_restriction" class="security-modal-field">
                <p class="security-modal-tip security-error">您的IP地址不在允许范围内，无法下载</p>
              </div>
            </div>
            <div class="security-modal-footer">
              <button class="btn btn-outline" @click="showSecurityDownloadModal = false">取消</button>
              <button v-if="securityConfig?.has_password" class="btn btn-primary" @click="handleSecurityDownload">确认下载</button>
            </div>
          </div>
        </div>

        <!-- 失败状态 -->
        <div v-else-if="status === 'failed'" class="result-failed">
          <div class="failed-icon">😔</div>
          <h2 class="result-title">生成失败</h2>
          <p class="result-error">{{ errorMessage }}</p>
          <div class="error-suggestions">
            <p class="suggestion-title">可能的原因：</p>
            <ul class="suggestion-list">
              <li>网络不稳定，请检查网络连接</li>
              <li>服务器繁忙，请稍后重试</li>
              <li>内容包含敏感词，请修改后重试</li>
            </ul>
          </div>

          <div class="result-actions">
            <button class="btn btn-primary btn-lg" @click="handleRetry">
              <span>🔄</span> 重试
            </button>
            <button class="btn btn-secondary btn-lg" @click="handleNew">
              <span>✨</span> 重新输入
            </button>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-else class="result-loading">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    </div>

    <!-- 演示模式 -->
    <PresentationMode
      v-model:active="showPresentation"
      :slides="presentationSlides"
      :transition-settings="transitionSettings"
      :replay-animation-signal="replayAnimationSignal"
      :webcam-config="currentWebcamConfig"
      :recording-mode="isRecordingMode"
      :coach-timing-data="coachTimingData"
      @add-chapter="handleAddChapter"
      @annotate-notes="handleAnnotateNotes"
    />

    <!-- AR/VR Presentation Modes -->
    <ARVRMode
      v-model:active="showARVR"
      :slides="presentationSlides"
    />

    <!-- 版本历史侧边面板 -->
    <div v-if="showVersionPanel" class="version-panel-overlay" @click="showVersionPanel = false">
      <div class="version-panel" @click.stop>
        <view class="panel-header">
          <text class="panel-title">📜 版本历史</text>
          <view class="panel-actions">
            <button class="btn btn-sm btn-snapshot" @click="createSnapshot">💾 快照</button>
            <button class="btn btn-sm btn-recover" @click="checkRecoveryState">🔄 恢复</button>
            <button class="btn btn-sm btn-abtest" @click="showABTestPanel = !showABTestPanel; showActionLog = false; showDiffView = false; loadABTests()">🔬 A/B测试</button>
            <button class="btn btn-sm btn-suggest" @click="loadSuggestions()">💡 建议</button>
            <button class="btn btn-sm btn-close-panel" @click="showVersionPanel = false">✕</button>
          </view>
        </view>
        
        <!-- 标签页切换: 版本历史 / 操作日志 -->
        <view class="panel-tabs">
          <view :class="['tab-btn', !showActionLog ? 'active' : '']" @click="showActionLog = false; loadVersionHistory()">
            <text>📜 版本</text>
          </view>
          <view :class="['tab-btn', showActionLog ? 'active' : '']" @click="showActionLog = true; loadActionLog(); loadUndoStack(); loadCheckpoints(); loadCollaborativeLocks()">
            <text>📝 操作日志</text>
          </view>
        </view>
        
        <!-- A/B测试面板 -->
        <view v-if="showABTestPanel" class="ab-test-panel">
          <view class="ab-test-header">
            <text class="section-title">🔬 A/B测试</text>
            <text class="ab-test-tip">为重要页面创建变体，对比效果后选择最优版本</text>
          </view>

          <!-- 当前页面A/B测试入口 -->
          <view class="ab-create-section" v-if="!showABResult">
            <text class="ab-create-label">当前页面: 第 {{ currentSlideIndex + 1 }} 页</text>
            <button class="btn btn-primary btn-create-ab" @click="createABTest(currentSlideIndex)">
              🌟 为此页创建A/B测试
            </button>
          </view>

          <!-- 测试列表 -->
          <view class="ab-test-list" v-if="!showABResult">
            <text class="list-title" v-if="abTestList.length > 0">已有测试 ({{ abTestList.length }})</text>
            <view v-for="test in abTestList" :key="test.test_id" class="ab-test-item">
              <view class="ab-test-info">
                <text class="ab-test-name">第 {{ test.slide_index + 1 }} 页测试</text>
                <view class="ab-test-meta">
                  <span :class="['status-badge', test.status]">{{ test.status === 'running' ? '运行中' : '已完成' }}</span>
                  <text class="meta-text">{{ test.variant_count }}个变体</text>
                  <text class="meta-text">{{ test.total_views }}次展示</text>
                </view>
              </view>
              <button class="btn btn-mini btn-view-result" @click="loadABTestResult(test.test_id)">查看结果</button>
            </view>
            <view v-if="abTestList.length === 0" class="empty-tip">暂无A/B测试记录</view>
          </view>

          <!-- 测试结果对比 -->
          <view v-if="showABResult && currentABTest" class="ab-result-section">
            <view class="ab-result-header">
              <text class="section-title">📊 第 {{ currentABTest.slide_index + 1 }}页 A/B测试结果</text>
              <button class="btn btn-mini" @click="showABResult = false">返回列表</button>
            </view>
            <view class="variant-cards">
              <view v-for="(variant, idx) in currentABTest.variants" :key="variant.variant_id" class="variant-card">
                <view class="variant-header">
                  <text class="variant-label">变体 {{ idx + 1 }}</text>
                  <span v-if="variant.is_winner" class="winner-badge">🏆 领先</span>
                </view>
                <view class="variant-strategy">
                  {{ variant.slide_data?._variant_strategy === 'simplified' ? '📝 简化内容' : '🎨 增强视觉' }}
                </view>
                <view class="variant-stats">
                  <view class="stat-row">
                    <text class="stat-label">展示次数</text>
                    <text class="stat-value">{{ currentABTest.performance?.[idx]?.views || 0 }}</text>
                  </view>
                  <view class="stat-row">
                    <text class="stat-label">点击次数</text>
                    <text class="stat-value">{{ currentABTest.performance?.[idx]?.clicks || 0 }}</text>
                  </view>
                  <view class="stat-row">
                    <text class="stat-label">平均停留</text>
                    <text class="stat-value">{{ currentABTest.performance?.[idx]?.avg_time_seconds || 0 }}s</text>
                  </view>
                  <view class="stat-row">
                    <text class="stat-label">点击率</text>
                    <text class="stat-value highlight">{{ currentABTest.performance?.[idx]?.engagement_rate || 0 }}%</text>
                  </view>
                </view>
                <view class="variant-preview">
                  <text class="preview-title">{{ variant.slide_data?.title || '(无标题)' }}</text>
                  <text class="preview-content">{{ (variant.slide_data?.content || '').substring(0, 80) }}...</text>
                </view>
                <button class="btn btn-primary btn-apply-winner" @click="applyABWinner(currentABTest.test_id, variant.variant_id)">
                  选用此版本
                </button>
              </view>
            </view>
          </view>
        </view>

        <!-- 改进建议面板 -->
        <view v-if="showSuggestPanel" class="suggest-panel">
          <view class="suggest-header">
            <text class="section-title">💡 改进建议</text>
            <button class="btn btn-mini" @click="showSuggestPanel = false">✕</button>
          </view>
          <view v-if="suggestLoading" class="loading-state">
            <text>分析中...</text>
          </view>
          <view v-else class="suggest-list">
            <view v-for="(s, idx) in suggestList" :key="idx" :class="['suggest-item', 'priority-' + s.priority]">
              <view class="suggest-icon">{{ s.type === 'title' ? '📝' : s.type === 'content_density' ? '📄' : s.type === 'visual' ? '📊' : s.type === 'layout' ? '🎨' : s.type === 'ab_test' ? '🔬' : '💡' }}</view>
              <view class="suggest-content">
                <text class="suggest-title">{{ s.title }}</text>
                <text class="suggest-desc">{{ s.description }}</text>
                <text class="suggest-action">{{ s.action }}</text>
                <text v-if="s.slide" class="suggest-slide">适用: 第{{ s.slide }}页</text>
              </view>
              <span :class="['priority-badge', s.priority]">{{ s.priority === 'high' ? '高' : s.priority === 'medium' ? '中' : '低' }}</span>
            </view>
            <view v-if="suggestList.length === 0" class="empty-tip">暂无可用建议</view>
          </view>
        </view>

        <!-- 版本历史列表 -->
        <view v-if="!showActionLog && !showABTestPanel && !showSuggestPanel" class="version-list">
          <!-- 版本标签筛选 -->
          <view class="version-tags-filter" v-if="versionTagList.length > 0">
            <text class="tags-filter-label">🏷️ 标签筛选:</text>
            <view class="tags-filter-items">
              <text :class="['tag-filter-item', selectedTagFilter === '' ? 'active' : '']" @click="selectedTagFilter = ''">全部</text>
              <text v-for="tag in versionTagList" :key="tag"
                    :class="['tag-filter-item', selectedTagFilter === tag ? 'active' : '']"
                    @click="selectedTagFilter = selectedTagFilter === tag ? '' : tag">
                {{ tag }}
              </text>
            </view>
          </view>
          <view v-for="v in filteredVersionList" 
                :key="v.version_id"
                :class="['version-item', v.version_id === currentVersionId ? 'current' : '']">
            <view class="version-info" @click="loadVersion(v.version_id)">
              <text class="version-name">{{ v.name }}</text>
              <text class="version-time">{{ formatTime(v.created_at) }}</text>
              <text class="version-slides">{{ v.slide_count }} 页</text>
              <!-- 版本标签 -->
              <view class="version-tags" v-if="v.tags && v.tags.length > 0">
                <text v-for="tag in v.tags" :key="tag" class="version-tag-badge">{{ tag }}</text>
              </view>
              <!-- 自动版本标记 -->
              <text v-if="v.auto_created" class="auto-version-badge">⚡自动</text>
            </view>
            <view class="version-actions">
              <button class="btn btn-mini" @click="compareVersion(v.version_id)">对比</button>
              <button class="btn btn-mini btn-tag" @click="openTagDialog(v.version_id)">🏷️ 标签</button>
              <button class="btn btn-mini btn-branch" @click="branchFromVersion(v.version_id)">📌 分支</button>
              <button class="btn btn-mini btn-merge" @click="mergeFromVersion(v.version_id)">🔀 合并</button>
              <button class="btn btn-mini btn-rollback" @click="rollbackToVersion(v.version_id)">回滚</button>
            </view>
          </view>
          <view v-if="filteredVersionList.length === 0" class="empty-tip">暂无版本记录</view>
        </view>
        
        <!-- 操作日志列表 -->
        <view v-if="showActionLog" class="action-log-container">
          <!-- 高级撤销/重做工具栏 -->
          <view class="undo-toolbar">
            <view class="undo-info">
              <text class="undo-count">撤销栈: {{ undoStack.length }} | 重做栈: {{ redoStack.length }}</text>
              <text class="checkpoint-info" v-if="lastCheckpointTime">
                📌 上次检查点: {{ formatTime(new Date(lastCheckpointTime).toISOString()) }}
              </text>
            </view>
            <view class="undo-actions">
              <button class="btn btn-sm btn-undo" @click="undoLastAction" v-if="undoStack.length > 0">
                ↩️ 撤销 ({{ undoStack.length }})
              </button>
              <button class="btn btn-sm btn-redo" @click="redoLastAction" v-if="redoStack.length > 0">
                ↪️ 重做 ({{ redoStack.length }})
              </button>
              <button class="btn btn-sm btn-timeline" @click="toggleTimeline" :class="{'active': showTimeline}">
                📊 时间线
              </button>
              <button class="btn btn-sm btn-branch" @click="toggleBranchUndo" :class="{'active': showBranchUndo}">
                🌳 分支撤销
              </button>
              <button class="btn btn-sm btn-checkpoint" @click="createCheckpointManual">
                💾 创建检查点
              </button>
            </view>
          </view>
          
          <!-- 可视化撤销时间线 -->
          <view v-if="showTimeline" class="timeline-container">
            <view class="timeline-header">
              <text class="timeline-title">📊 操作时间线（可选择撤销任意操作）</text>
              <text class="timeline-count">{{ actionTimeline.length }} 个操作</text>
            </view>
            <scroll-view class="timeline-scroll" scroll-y>
              <view class="timeline-list">
                <view v-for="(item, idx) in actionTimeline" 
                      :key="item.action_id || idx"
                      :class="['timeline-item', 
                               item.action_type === 'undo' ? 'timeline-undo' : '',
                               item.action_type === 'redo' ? 'timeline-redo' : '',
                               item.action_type === 'checkpoint' ? 'timeline-checkpoint' : '',
                               item.action_type === 'branch_undo' ? 'timeline-branch' : '']">
                  <view class="timeline-dot"></view>
                  <view class="timeline-line" v-if="idx < actionTimeline.length - 1"></view>
                  <view class="timeline-content" @click="undoByActionId(item.action_id)">
                    <view class="timeline-icon">{{ getActionIcon(item.action_type) }}</view>
                    <view class="timeline-info">
                      <text class="timeline-desc">{{ item.description }}</text>
                      <text class="timeline-time">{{ formatTime(item.timestamp) }}</text>
                    </view>
                    <view class="timeline-action" v-if="item.action_id && item.action_type !== 'undo' && item.action_type !== 'redo'">
                      <button class="btn btn-mini btn-branch-undo">撤销此步</button>
                    </view>
                  </view>
                </view>
                <view v-if="actionTimeline.length === 0" class="empty-tip">暂无时间线记录</view>
              </view>
            </scroll-view>
          </view>
          
          <!-- 检查点列表 -->
          <view v-if="checkpoints.length > 0" class="checkpoint-list">
            <view class="checkpoint-header">
              <text class="checkpoint-title">💾 检查点历史</text>
            </view>
            <view v-for="cp in checkpoints" :key="cp.checkpoint_id" class="checkpoint-item">
              <view class="checkpoint-info" @click="restoreFromCheckpoint(cp.checkpoint_id, cp.name)">
                <text class="checkpoint-name">{{ cp.name }}</text>
                <text class="checkpoint-time">{{ formatTime(cp.created_at) }}</text>
                <text class="checkpoint-type">{{ cp.type === 'auto' ? '自动' : '手动' }}</text>
              </view>
              <button class="btn btn-mini" @click="restoreFromCheckpoint(cp.checkpoint_id, cp.name)">恢复</button>
            </view>
          </view>
          
          <!-- 协作锁状态 -->
          <view v-if="Object.keys(collaborativeLocks).length > 0" class="collab-locks">
            <text class="collab-title">👥 当前协作状态</text>
            <view v-for="(lock, key) in collaborativeLocks" :key="key" class="collab-lock-item">
              <text>🔒 {{ key === 'outline' ? '大纲' : `第${lock.slide_index}页` }} - {{ lock.user_id }}</text>
            </view>
          </view>
          
          <!-- 传统操作日志列表 -->
          <view v-if="!showTimeline" class="action-log-list">
            <view v-for="(log, idx) in actionLog" 
                  :key="idx"
                  :class="['action-item', log.action_type === 'undo' ? 'undo-entry' : '']">
              <view class="action-icon">{{ getActionIcon(log.action_type) }}</view>
              <view class="action-content">
                <text class="action-desc">{{ log.description }}</text>
                <text class="action-time">{{ formatTime(log.timestamp) }}</text>
              </view>
            </view>
            <view v-if="actionLog.length === 0" class="empty-tip">暂无操作记录</view>
          </view>
        </view>
        
        <!-- 版本对比视图 (侧边对比) -->
        <view v-if="showDiffView" class="diff-view">
          <view class="diff-header">
            <text class="diff-title">🔍 {{ diffData.version_a }} vs {{ diffData.version_b }}</text>
            <view class="diff-header-actions">
              <text class="diff-count">{{ diffData.total_changes }} 处变更</text>
              <button class="btn btn-sm" @click="showDiffView = false">✕</button>
            </view>
          </view>
          <view class="diff-slides">
            <view v-for="d in diffData.diff" :key="d.slide_index" class="diff-item">
              <view class="diff-slide-title">第 {{ d.slide_index }} 页 <span v-if="d.change_types && d.change_types.length > 0" class="change-type-tags"><span v-for="ct in d.change_types" :key="ct" class="change-type-tag">{{ ct }}</span></span></view>
              <view class="diff-content side-by-side">
                <view class="diff-side diff-side-left" v-if="d.before">
                  <view class="side-header">
                    <span class="side-badge before-badge">{{ diffData.version_a }}</span>
                    <text class="side-label">变更前</text>
                  </view>
                  <!-- R136: Visual diff - SVG thumbnail -->
                  <div class="visual-diff-thumbnail">
                    <img
                      :src="`/api/v1/ppt/versions/${taskId}/${diffData.version_a_id}/slide/${d.slide_index}/svg`"
                      :alt="`第${d.slide_index}页 - ${diffData.version_a}`"
                      class="diff-slide-img"
                      @error="(e) => (e.target as HTMLImageElement).style.display = 'none'"
                    />
                  </div>
                  <view class="slide-preview-box">
                    <text class="preview-label-title">{{ d.before.title || '(无标题)' }}</text>
                    <text class="preview-label-layout">布局: {{ d.before.layout || 'default' }}</text>
                    <div class="preview-text">{{ (d.before.content || '').substring(0, 100) }}</div>
                  </view>
                </view>
                <view class="diff-side diff-side-right" v-if="d.after">
                  <view class="side-header">
                    <span class="side-badge after-badge">{{ diffData.version_b }}</span>
                    <text class="side-label">变更后</text>
                  </view>
                  <!-- R136: Visual diff - SVG thumbnail -->
                  <div class="visual-diff-thumbnail">
                    <img
                      :src="`/api/v1/ppt/versions/${taskId}/${diffData.version_b_id}/slide/${d.slide_index}/svg`"
                      :alt="`第${d.slide_index}页 - ${diffData.version_b}`"
                      class="diff-slide-img"
                      @error="(e) => (e.target as HTMLImageElement).style.display = 'none'"
                    />
                  </div>
                  <view class="slide-preview-box">
                    <text class="preview-label-title">{{ d.after.title || '(无标题)' }}</text>
                    <text class="preview-label-layout">布局: {{ d.after.layout || 'default' }}</text>
                    <div class="preview-text">{{ (d.after.content || '').substring(0, 100) }}</div>
                  </view>
                </view>
              </view>
            </view>
          </view>
          <view class="diff-footer">
            <button class="btn btn-sm btn-secondary" @click="showDiffView = false">关闭对比</button>
          </view>
        </view>

        <!-- 自动保存设置 -->
        <view class="auto-save-section">
          <view class="auto-save-header" @click="showAutoSaveSettings = !showAutoSaveSettings">
            <text class="auto-save-title">⚙️ 自动保存设置</text>
            <text class="auto-save-toggle">{{ showAutoSaveSettings ? '▲' : '▼' }}</text>
          </view>
          <view v-if="showAutoSaveSettings" class="auto-save-content">
            <view class="auto-save-row">
              <text class="auto-save-label">自动保存</text>
              <label class="switch">
                <input type="checkbox" v-model="autoSaveEnabled" @change="saveAutoSaveSettings" />
                <span class="slider"></span>
              </label>
            </view>
            <view class="auto-save-row" v-if="autoSaveEnabled">
              <text class="auto-save-label">保存间隔</text>
              <select v-model="autoSaveInterval" @change="saveAutoSaveSettings" class="auto-save-select">
                <option value="10000">10秒</option>
                <option value="30000">30秒</option>
                <option value="60000">1分钟</option>
                <option value="120000">2分钟</option>
                <option value="300000">5分钟</option>
              </select>
            </view>
            <view class="auto-save-row" v-if="autoSaveEnabled && lastAutoSaveTime">
              <text class="auto-save-label">上次保存</text>
              <text class="auto-save-time">{{ formatTime(lastAutoSaveTime) }}</text>
            </view>
            <button class="btn btn-sm btn-save-now" @click="triggerAutoSave" v-if="autoSaveEnabled">
              💾 立即保存
            </button>
          </view>
        </view>
      </div>
    </div>

    <!-- 崩溃恢复模态框 -->
    <div v-if="showRecoveryModal" class="recovery-modal-overlay" @click="dismissRecovery">
      <div class="recovery-modal" @click.stop>
        <div class="recovery-icon">🛟</div>
        <h3 class="recovery-title">检测到未保存的编辑</h3>
        <p class="recovery-desc" v-if="recoveryInfo">
          上次编辑时间: {{ formatTime(recoveryInfo.savedAt) }}
        </p>
        <p class="recovery-desc" v-else>是否要恢复未保存的编辑？</p>
        <div class="recovery-actions">
          <button class="btn btn-primary" @click="recoverFromCrash">✅ 恢复编辑</button>
          <button class="btn" @click="dismissRecovery">❌ 放弃</button>
        </div>
      </div>
    </div>

    <!-- 元素微调编辑器 -->
    <SlideElementEditor
      v-if="showElementEditor"
      :slide-count="slideCount"
      @close="showElementEditor = false"
      @apply="handleElementApply"
    />

    <!-- 图表编辑器 -->
    <ChartEditor
      v-if="showChartEditor"
      :task-id="taskId"
      @close="showChartEditor = false"
      @chart-generated="handleChartGenerated"
      @insert-into-slide="handleInsertChartIntoSlide"
    />

    <!-- 快速调优侧边栏 -->
    <div v-if="showLayoutPanel" class="layout-panel-overlay" @click="showLayoutPanel = false">
      <div class="layout-panel" @click.stop>
        <div class="panel-header">
          <h3>🎨 快速调优</h3>
          <button class="panel-close" @click="showLayoutPanel = false">✕</button>
        </div>
        
        <div class="panel-content">
          <!-- 布局选择 -->
          <div class="panel-section">
            <h4 class="section-title">布局</h4>
            <div class="layout-options">
              <div 
                v-for="layout in layoutOptions" 
                :key="layout.value"
                class="layout-item"
                :class="{ active: selectedLayout === layout.value }"
                @click="applyLayout(layout.value)"
              >
                <span class="layout-icon">{{ layout.icon }}</span>
                <span class="layout-name">{{ layout.name }}</span>
              </div>
            </div>
          </div>

          <!-- 配色选择 -->
          <div class="panel-section">
            <h4 class="section-title">配色</h4>
            <div class="color-options">
              <div 
                v-for="(scheme, index) in colorSchemes" 
                :key="index"
                class="color-item"
                :class="{ active: selectedColorScheme === index }"
                @click="applyColorScheme(index)"
              >
                <div class="color-swatches">
                  <span 
                    v-for="color in scheme.colors" 
                    :key="color"
                    class="color-swatch"
                    :style="{ background: color }"
                  ></span>
                </div>
                <span class="color-name">{{ scheme.name }}</span>
              </div>
            </div>
          </div>

          <!-- 风格选择 -->
          <div class="panel-section">
            <h4 class="section-title">风格</h4>
            <div class="style-options">
              <div 
                v-for="style in styleOptions" 
                :key="style.value"
                class="style-item"
                :class="{ active: selectedStyle === style.value }"
                @click="applyStyle(style.value)"
              >
                <span class="style-icon">{{ style.icon }}</span>
                <span class="style-name">{{ style.name }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="panel-footer">
          <button class="btn btn-outline" @click="showLayoutPanel = false">关闭</button>
          <button class="btn btn-primary" @click="applyTuning">应用并重新生成</button>
        </div>
      </div>
    </div>

    <!-- 幻灯片过渡设置面板 -->
    <div v-if="showTransitionPanel" class="transition-panel-overlay" @click="showTransitionPanel = false">
      <div class="transition-panel" @click.stop>
        <div class="panel-header">
          <h3>🔀 幻灯片过渡</h3>
          <button class="panel-close" @click="showTransitionPanel = false">✕</button>
        </div>
        <div class="panel-content">
          <!-- 过渡效果 -->
          <div class="panel-section">
            <h4 class="section-title">过渡效果</h4>
            <div class="transition-options transition-options-grid">
              <div
                v-for="t in transitionTypes"
                :key="t.value"
                class="transition-item"
                :class="{ active: transitionSettings.type === t.value }"
                @click="transitionSettings.type = t.value"
              >
                <span class="transition-icon">{{ t.icon }}</span>
                <span class="transition-name">{{ t.name }}</span>
              </div>
            </div>
          </div>

          <!-- 过渡速度 - 预设 -->
          <div class="panel-section">
            <h4 class="section-title">过渡速度</h4>
            <div class="duration-options">
              <button
                v-for="d in durationOptions"
                :key="d.value"
                class="duration-item"
                :class="{ active: transitionSettings.duration === d.value && !transitionSettings.useCustomDuration }"
                @click="transitionSettings.duration = d.value; transitionSettings.useCustomDuration = false"
              >
                {{ d.label }}
              </button>
            </div>
          </div>

          <!-- 自定义过渡时长 -->
          <div class="panel-section">
            <h4 class="section-title">
              自定义时长
              <label class="toggle-switch-small">
                <input type="checkbox" v-model="transitionSettings.useCustomDuration" />
                <span class="toggle-slider-small"></span>
              </label>
            </h4>
            <div v-if="transitionSettings.useCustomDuration" class="custom-duration-slider">
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.1"
                v-model.number="transitionSettings.customDuration"
                class="duration-range"
              />
              <span class="duration-value">{{ transitionSettings.customDuration.toFixed(1) }}s</span>
            </div>
          </div>

          <!-- 过渡音效 -->
          <div class="panel-section">
            <h4 class="section-title">过渡音效</h4>
            <div class="sound-effects-options">
              <div
                v-for="s in soundEffects"
                :key="s.value"
                class="sound-effect-item"
                :class="{ active: transitionSettings.soundEffect === s.value }"
                @click="transitionSettings.soundEffect = s.value"
              >
                <span class="sound-icon">{{ s.icon }}</span>
                <span class="sound-name">{{ s.name }}</span>
              </div>
            </div>
          </div>

          <!-- 变形过渡 (Morph) -->
          <div class="panel-section" v-if="transitionSettings.type === 'morph'">
            <h4 class="section-title">变形过渡说明</h4>
            <div class="morph-info">
              <p class="morph-desc">检测相邻幻灯片相似度，相似度&gt;40%时启用变形效果</p>
              <div class="morph-badge">
                <span class="morph-icon">✦</span>
                <span>智能变形</span>
              </div>
            </div>
          </div>

          <!-- 随机过渡 (Random) -->
          <div class="panel-section" v-if="transitionSettings.type === 'random'">
            <h4 class="section-title">随机过渡说明</h4>
            <div class="random-info">
              <p class="random-desc">每次切换幻灯片时随机选择过渡效果（滑动/淡入/缩放/翻转）</p>
              <div class="random-badge">
                <span class="random-icon">⚡</span>
                <span>动态随机</span>
              </div>
            </div>
          </div>

          <!-- 应用于全部 -->
          <div class="panel-section">
            <h4 class="section-title">应用到</h4>
            <div class="apply-options">
              <label class="apply-label">
                <input type="radio" v-model="transitionApplyScope" value="current" />
                当前页
              </label>
              <label class="apply-label">
                <input type="radio" v-model="transitionApplyScope" value="all" />
                全部页面
              </label>
            </div>
          </div>

          <!-- 自动播放 -->
          <div class="panel-section">
            <h4 class="section-title">自动播放</h4>
            <div class="auto-advance-option">
              <label class="toggle-label">
                <input type="checkbox" v-model="transitionSettings.autoAdvance" />
                启用自动播放
              </label>
              <select
                v-if="transitionSettings.autoAdvance"
                v-model.number="transitionSettings.autoDelay"
                class="auto-delay-select"
              >
                <option :value="3000">每 3 秒</option>
                <option :value="5000">每 5 秒</option>
                <option :value="8000">每 8 秒</option>
                <option :value="10000">每 10 秒</option>
                <option :value="15000">每 15 秒</option>
              </select>
            </div>
          </div>

          <!-- Live Preview - 预览效果 -->
          <div class="panel-section">
            <h4 class="section-title">
              效果预览
              <button class="preview-btn" @click="startTransitionPreview" :disabled="previewTransitionActive">
                {{ previewTransitionActive ? '播放中...' : '▶ 预览' }}
              </button>
            </h4>
            <div class="live-preview-container" :class="{ 'previewing': previewTransitionActive }">
              <div class="preview-slide-a" :class="['preview-' + transitionSettings.type + '-active']">
                <div class="preview-box" :class="['preview-box-' + transitionSettings.type]">
                  <span class="preview-text">页 N</span>
                </div>
              </div>
              <div class="preview-transition-indicator">
                <span class="transition-label-text">{{ getTransitionLabel(transitionSettings.type) }}</span>
                <span class="transition-speed-badge" :class="'speed-' + transitionSettings.duration">
                  {{ transitionSettings.useCustomDuration ? transitionSettings.customDuration.toFixed(1) + 's' : (transitionSettings.duration === 'fast' ? '快' : transitionSettings.duration === 'slow' ? '慢' : '中') }}
                </span>
                <span v-if="transitionSettings.soundEffect !== 'none'" class="sound-effect-badge">
                  {{ getSoundEffectLabel(transitionSettings.soundEffect) }}
                </span>
              </div>
              <div class="preview-slide-b" :class="['preview-' + transitionSettings.type + '-exit']">
                <div class="preview-box" :class="['preview-box-b-' + transitionSettings.type]">
                  <span class="preview-text">页 N+1</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="panel-footer">
          <button class="btn btn-outline" @click="showTransitionPanel = false">关闭</button>
          <button class="btn btn-primary" @click="applyTransitionToSlides">应用</button>
        </div>
      </div>
    </div>

    <!-- 母版编辑面板 -->
    <div v-if="showMasterEditor" class="transition-panel-overlay" @click="showMasterEditor = false">
      <div class="transition-panel" @click.stop>
        <div class="panel-header">
          <h3>🎚️ 母版编辑</h3>
          <button class="panel-close" @click="showMasterEditor = false">✕</button>
        </div>
        <div class="panel-content">
          <!-- 母版选择 -->
          <div class="panel-section">
            <h4 class="section-title">选择母版</h4>
            <div class="transition-options">
              <div
                v-for="m in masterSlides"
                :key="m.id"
                class="transition-item"
                :class="{ active: selectedMasterId === m.id }"
                @click="selectedMasterId = m.id; Object.assign(editingMaster, m)"
              >
                <span class="transition-icon" :style="{ background: m.background, color: m.primaryColor }">A</span>
                <span class="transition-name">{{ m.name }}</span>
              </div>
            </div>
          </div>

          <!-- 母版属性编辑 -->
          <div class="panel-section">
            <h4 class="section-title">母版属性</h4>
            <div class="form-grid">
              <div class="form-item">
                <label class="form-label">母版名称</label>
                <input v-model="editingMaster.name" class="form-input" placeholder="母版名称" />
              </div>
              <div class="form-item">
                <label class="form-label">背景色</label>
                <div class="color-input-row">
                  <input type="color" v-model="editingMaster.background" class="color-picker" />
                  <input type="text" v-model="editingMaster.background" class="form-input color-text" />
                </div>
              </div>
              <div class="form-item">
                <label class="form-label">主色</label>
                <div class="color-input-row">
                  <input type="color" v-model="editingMaster.primaryColor" class="color-picker" />
                  <input type="text" v-model="editingMaster.primaryColor" class="form-input color-text" />
                </div>
              </div>
              <div class="form-item">
                <label class="form-label">强调色</label>
                <div class="color-input-row">
                  <input type="color" v-model="editingMaster.accentColor" class="color-picker" />
                  <input type="text" v-model="editingMaster.accentColor" class="form-input color-text" />
                </div>
              </div>
              <div class="form-item">
                <label class="form-label">次要色</label>
                <div class="color-input-row">
                  <input type="color" v-model="editingMaster.secondaryColor" class="color-picker" />
                  <input type="text" v-model="editingMaster.secondaryColor" class="form-input color-text" />
                </div>
              </div>
              <div class="form-item">
                <label class="form-label">字体</label>
                <select v-model="editingMaster.fontFamily" class="form-select">
                  <option value="Microsoft YaHei">微软雅黑</option>
                  <option value="SimSun">宋体</option>
                  <option value="KaiTi">楷体</option>
                  <option value="Arial">Arial</option>
                  <option value="Georgia">Georgia</option>
                </select>
              </div>
              <div class="form-item">
                <label class="form-label">标题字号</label>
                <input type="number" v-model.number="editingMaster.fontSizeTitle" class="form-input" min="20" max="72" />
              </div>
              <div class="form-item">
                <label class="form-label">正文字号</label>
                <input type="number" v-model.number="editingMaster.fontSizeBody" class="form-input" min="12" max="36" />
              </div>
              <div class="form-item">
                <label class="form-label">默认过渡</label>
                <select v-model="editingMaster.defaultTransition" class="form-select">
                  <option value="slide">滑动</option>
                  <option value="fade">淡入淡出</option>
                  <option value="zoom">缩放</option>
                  <option value="flip">翻转</option>
                </select>
              </div>
              <div class="form-item">
                <label class="form-label">过渡速度</label>
                <select v-model="editingMaster.defaultTransitionDuration" class="form-select">
                  <option value="fast">快 (0.3s)</option>
                  <option value="normal">中 (0.5s)</option>
                  <option value="slow">慢 (0.8s)</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 预览 -->
          <div class="panel-section">
            <h4 class="section-title">预览效果</h4>
            <div class="master-preview-box" :style="{
              background: editingMaster.background,
              fontFamily: editingMaster.fontFamily,
              color: editingMaster.primaryColor
            }">
              <div class="master-preview-title" :style="{ fontSize: (editingMaster.fontSizeTitle || 32) + 'px' }">
                标题文字
              </div>
              <div class="master-preview-body" :style="{ fontSize: (editingMaster.fontSizeBody || 18) + 'px', color: editingMaster.secondaryColor }">
                正文内容示例
              </div>
            </div>
          </div>

          <!-- 应用范围 -->
          <div class="panel-section">
            <h4 class="section-title">应用到</h4>
            <div class="apply-options">
              <button class="btn btn-sm btn-outline" @click="applyMasterToAllSlides(selectedMasterId)">
                全部页面
              </button>
              <span class="apply-tip">将母版应用到所有幻灯片</span>
            </div>
          </div>
        </div>
        <div class="panel-footer">
          <button class="btn btn-outline" @click="showMasterEditor = false">关闭</button>
          <button class="btn btn-primary" @click="saveMaster">保存母版</button>
        </div>
      </div>
    </div>

    <!-- 动画编辑器面板 -->
    <div v-if="showAnimationComposer" class="transition-panel-overlay" @click="showAnimationComposer = false">
      <div class="transition-panel" @click.stop>
        <div class="panel-header">
          <h3>🎬 动画编辑器 — 第 {{ currentAnimatingSlide + 1 }} 页</h3>
          <button class="panel-close" @click="showAnimationComposer = false">✕</button>
        </div>
        <div class="panel-content">
          <!-- 预设动画 -->
          <div class="panel-section">
            <h4 class="section-title">预设动画</h4>
            <div class="transition-options">
              <div
                v-for="anim in animationPresets"
                :key="anim.id"
                class="transition-item"
                :class="{ active: editingAnimation.type === anim.type }"
                @click="Object.assign(editingAnimation, anim)"
              >
                <span class="transition-icon">✦</span>
                <span class="transition-name">{{ anim.name }}</span>
              </div>
            </div>
          </div>

          <!-- 自定义参数 -->
          <div class="panel-section">
            <h4 class="section-title">自定义参数</h4>
            <div class="form-grid">
              <div class="form-item">
                <label class="form-label">动画名称</label>
                <input v-model="editingAnimation.name" class="form-input" placeholder="自定义动画" />
              </div>
              <div class="form-item">
                <label class="form-label">动画类型</label>
                <select v-model="editingAnimation.type" class="form-select">
                  <option value="fade">淡入</option>
                  <option value="slide">滑动</option>
                  <option value="zoom">缩放</option>
                  <option value="bounce">弹跳</option>
                  <option value="flip">翻转</option>
                  <option value="rotate">旋转</option>
                </select>
              </div>
              <div class="form-item">
                <label class="form-label">持续时间 (ms)</label>
                <input type="number" v-model.number="editingAnimation.duration" class="form-input" min="100" max="3000" step="50" />
              </div>
              <div class="form-item">
                <label class="form-label">延迟 (ms)</label>
                <input type="number" v-model.number="editingAnimation.delay" class="form-input" min="0" max="2000" step="100" />
              </div>
              <div class="form-item">
                <label class="form-label">缓动函数</label>
                <select v-model="editingAnimation.easing" class="form-select">
                  <option value="linear">linear</option>
                  <option value="ease">ease</option>
                  <option value="ease-in">ease-in</option>
                  <option value="ease-out">ease-out</option>
                  <option value="ease-in-out">ease-in-out</option>
                </select>
              </div>
              <div class="form-item" v-if="['slide'].includes(editingAnimation.type as string)">
                <label class="form-label">滑动方向</label>
                <select v-model="editingAnimation.direction" class="form-select">
                  <option value="up">向上</option>
                  <option value="down">向下</option>
                  <option value="left">向左</option>
                  <option value="right">向右</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 动画预览 -->
          <div class="panel-section">
            <h4 class="section-title">动画预览</h4>
            <div class="animation-preview-stage" :class="'anim-type-' + editingAnimation.type">
              <div
                class="animation-preview-box"
                :style="{
                  animationDuration: (editingAnimation.duration || 600) + 'ms',
                  animationDelay: (editingAnimation.delay || 0) + 'ms',
                  animationTimingFunction: editingAnimation.easing || 'ease',
                  animationFillMode: 'both',
                  animationName: 'preview-' + editingAnimation.type
                }"
              >
                Aa
              </div>
              <p class="preview-desc">{{ editingAnimation.name || '自定义动画' }} · {{ editingAnimation.duration }}ms · {{ editingAnimation.easing }}</p>
            </div>
          </div>
        </div>
        <div class="panel-footer">
          <button class="btn btn-outline" @click="showAnimationComposer = false">关闭</button>
          <button class="btn btn-primary" @click="applyAnimationToSlide">应用到当前页</button>
        </div>
      </div>
    </div>

    <!-- 团队工作空间面板 -->
    <div v-if="showTeamWorkspace" class="workspace-panel-overlay" @click="showTeamWorkspace = false">
      <div class="workspace-panel" @click.stop>
        <TeamWorkspacePanel :ppt-id="taskId" />
      </div>
    </div>

    <!-- 备份管理面板 R125 -->
    <BackupPanel
      v-if="showBackupPanel"
      :task-id="taskId"
      @close="showBackupPanel = false"
      @restored="onBackupRestored"
    />

    <!-- 团队活动动态面板 -->
    <div v-if="showActivityFeed" class="activity-panel-overlay" @click="showActivityFeed = false">
      <div class="activity-panel" @click.stop>
        <ActivityFeedPanel :ppt-id="taskId" :task-id="taskId" />
      </div>
    </div>

    <!-- 幻灯片评论/建议面板 -->
    <div v-if="showCommentsPanel" class="comments-panel-overlay" @click="showCommentsPanel = false">
      <div class="comments-panel" @click.stop>
        <SlideCommentsPanel
          :ppt-id="taskId"
          :task-id="taskId"
          :slide-num="currentVisibleSlide + 1"
          :presence-list="collaborationEnabled && _collaborationInstance ? _collaborationInstance.presenceList.value : []"
          :collaboration="collaborationEnabled && _collaborationInstance ? {
            addComment: _collaborationInstance.addComment,
            replyComment: _collaborationInstance.replyComment,
            resolveComment: _collaborationInstance.resolveComment,
          } : null"
        />
      </div>
    </div>

    <!-- AI高级功能面板 -->
    <AdvancedAIPanel
      :show="showAdvancedAIPanel"
      :task-id="taskId"
      @close="showAdvancedAIPanel = false"
    />

    <!-- 智能设计面板 (R90) -->
    <SmartDesignPanel
      :show="showSmartDesignPanel"
      :slides="editableSlides"
      :current-slide-index="currentEditingSlide - 1"
      :task-id="taskId"
      :preview-slides="previewSlides"
      @close="showSmartDesignPanel = false"
      @apply="handleSmartDesignApply"
      @toggle-guides="handleToggleGuides"
      @spacing-change="handleSpacingChange"
    />

    <!-- R118: 智能内容建议面板 -->
    <SmartContentSuggestions
      :show="showSmartContentSuggestions"
      :slides="editableSlides"
      :current-slide-index="currentEditingSlide - 1"
      :task-id="taskId"
      :topic="outline?.topic || ''"
      :style="outline?.style || 'professional'"
      :scene="outline?.scene || 'business'"
      :page-count="editableSlides.length"
      @close="showSmartContentSuggestions = false"
      @apply-addition="handleApplyAddition"
    />

    <!-- 无障碍与通用设计面板 -->
    <AccessibilityPanel
      :visible="showAccessibilityPanel"
      :slides="editableSlides"
      :theme-color="activeMasterColors.themeColor"
      :body-bg-color="activeMasterColors.bgColor"
      @close="showAccessibilityPanel = false"
    />

    <!-- AI演讲教练面板 -->
    <PresentationCoach
      :visible="showPresentationCoach"
      :task-id="taskId"
      :slides="editableSlides"
      @close="showPresentationCoach = false"
      @view-slide="handleCoachViewSlide"
      @apply-timing="handleCoachApplyTiming"
    />

    <!-- 自定义分享链接弹窗 -->
    <ShareLinkModal
      :show="showShareLinkModal"
      :task-id="taskId"
      :initial-title="shareLinkTitle"
      :initial-description="shareLinkDescription"
      :initial-thumbnail="shareLinkThumbnail"
      @close="showShareLinkModal = false"
      @saved="onShareLinkSaved"
    />

    <!-- 定时发布与自动化 -->
    <ScheduleModal
      :show="showScheduleModal"
      :task-id="taskId"
      :task-name="taskName"
      @close="showScheduleModal = false"
      @created="onScheduleCreated"
    />

    <!-- 分享数据面板 -->
    <div v-if="showSharingAnalytics" class="sharing-analytics-overlay" @click="showSharingAnalytics = false">
      <div class="sharing-analytics-panel" @click.stop>
        <SharingAnalytics :task-id="taskId" />
      </div>
    </div>

    <!-- 物理分享面板 (QR/NFC/Beacon) -->
    <SharePanel
      :show="showSharePanel"
      :task-id="taskId"
      :ppt-id="taskId"
      :share-url="shareUrl"
      :title="shareTitle"
      @close="showSharePanel = false"
    />

    <!-- 访问请求弹窗 -->
    <AccessRequestModal
      :show="showAccessRequest"
      @close="showAccessRequest = false"
    />

    <!-- 文件夹管理面板 -->
    <div v-if="showFolderPanel" class="folder-panel-overlay" @click="showFolderPanel = false">
      <div class="folder-panel" @click.stop>
        <PresentationFolders />
      </div>
    </div>

    <!-- Embed Widget 代码生成 -->
    <EmbedWidget
      :show="showEmbedCode"
      :task-id="taskId"
      :slide-count="slides.length || taskResult?.slides?.length || 1"
      @close="showEmbedCode = false"
    />

    <!-- Voice Panel -->
    <VoicePanel
      v-if="showVoicePanel"
      :settings="voiceSettings"
      :custom-commands="voiceCustomCommands"
      :is-listening="isVoiceListening"
      :is-speaking="isVoiceSpeaking"
      :captions="voiceCaptions"
      :captions-visible="voiceCaptionsVisible"
      :current-transcript="voiceCurrentTranscript"
      :last-recognized-command="voiceLastCommand"
      :command-error="voiceCommandError"
      :slide-title="currentSlideTitle"
      :slide-content="currentSlideContent"
      @close="showVoicePanel = false"
      @update-settings="updateVoiceSettings"
      @toggle-listening="toggleVoiceListening"
      @read-current-slide="startReadAloud"
      @stop-speaking="stopVoiceSpeaking"
      @toggle-captions="toggleVoiceCaptions"
      @batch-generate="batchGenerateVoiceover"
      @add-command="addVoiceCommand"
      @remove-command="removeVoiceCommand"
      @translate="handleTranslate"
      @speak-translation="handleSpeakTranslation"
    />

    <!-- Real-time Collaboration Overlay (R98) -->
    <CollaborationOverlay
      v-if="showCollaborationOverlay && _collaborationInstance"
      :show="showCollaborationOverlay"
      :cursors="_collaborationInstance.cursors"
      :presence-list="_collaborationInstance.presenceList.value"
      :current-user="currentUser"
      :connected="_collaborationInstance.connected.value"
      :my-color="_collaborationInstance.myColor.value"
      :following-user-id="_collaborationInstance.followingUserId.value"
      :follow-viewport="_collaborationInstance.followViewport.value"
      :current-slide-num="currentVisibleSlide + 1"
      @start-follow="(uid) => _collaborationInstance?.startFollowMode(uid)"
      @stop-follow="() => _collaborationInstance?.stopFollowMode()"
    />

    <!-- Recording Panel -->
    <RecordingPanel
      :show="showRecordingPanel"
      :task-id="taskId"
      :slides="editableSlides"
      @close="handleRecordingPanelClose"
      @start-record="handleStartRecord"
      @stop-record="handleStopRecord"
      @add-chapter="handleRecordingAddChapter"
      @webcam-config="handleWebcamConfig"
      @stream-config="handleStreamConfig"
      @export-recording="handleExportRecording"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from '../api/client'
import PresentationMode from '../components/PresentationMode.vue'
import ARVRMode from '../components/ARVRMode.vue'
import SlideElementEditor from '../components/SlideElementEditor.vue'
import ChartEditor from '../components/ChartEditor.vue'
import TeamWorkspacePanel from '../components/TeamWorkspacePanel.vue'
import ActivityFeedPanel from '../components/ActivityFeedPanel.vue'
import SlideCommentsPanel from '../components/SlideCommentsPanel.vue'
import CollaborationOverlay from '../components/CollaborationOverlay.vue'
import AdvancedAIPanel from '../components/AdvancedAIPanel.vue'
import SmartDesignPanel from '../components/SmartDesignPanel.vue'
import SmartContentSuggestions from '../components/SmartContentSuggestions.vue'
import AccessibilityPanel from '../components/AccessibilityPanel.vue'
import PresentationCoach from '../components/PresentationCoach.vue'
import ReactionButtons from '../components/ReactionButtons.vue'
import ShareLinkModal from '../components/ShareLinkModal.vue'
import SharingAnalytics from '../components/SharingAnalytics.vue'
import SharePanel from '../components/SharePanel.vue'
import AccessRequestModal from '../components/AccessRequestModal.vue'
import PresentationFolders from '../components/PresentationFolders.vue'
import EmbedWidget from '../components/EmbedWidget.vue'
import VoicePanel from '../components/VoicePanel.vue'
import RecordingPanel from '../components/RecordingPanel.vue'
import BackupPanel from '../components/BackupPanel.vue'
import LocalFileManager from '../components/LocalFileManager.vue'
import ScheduleModal from '../components/ScheduleModal.vue'
import { useVoiceCommands } from '../composables/useVoiceCommands'
import { useVoiceDictation } from '../composables/useVoiceDictation'
import { useSwipeGesture } from '../composables/useSwipeGesture'
import { getDeviceMode } from '../composables/useDeviceMode'
import { useInteractionFeedback } from '../composables/useInteractionFeedback'
import { useKeyboardShortcuts } from '../composables/useKeyboardShortcuts'
import { useImageCompressor } from '../composables/useImageCompressor'
import { usePerformanceMode } from '../composables/usePerformanceMode'
import { useEngagement } from '../composables/useEngagement'
import { useBrand } from '../composables/useBrand'
import { useClipboardAndContent } from '../composables/useClipboardAndContent'
import { useCollaboration } from '../composables/useCollaboration'
import { usePushNotification } from '../composables/usePushNotification'
import { usePresentationAnalytics, startViewSession, endViewSession, trackScrollDepth, setupScrollTracking } from '../composables/usePresentationAnalytics'
import { initNetworkQuality, getNetworkQuality } from '../composables/useNetworkQuality'
import { useI18n, LOCALES, detectLanguage, RTL_LOCALES } from '../composables/useI18n'
import { useSlideRenderCache } from '../composables/useSlideRenderCache'
import { usePerformanceProfiler } from '../composables/usePerformanceProfiler'

const router = useRouter()
const route = useRoute()

// Device mode detection
const deviceMode = getDeviceMode()
const isMobile = deviceMode.isMobile

// Voice dictation for mobile slide editing
const {
  isListening: isDictating,
  interimTranscript: dictationInterim,
  error: dictationError,
  isSupported: isDictationSupported,
  start: startDictation,
  stop: stopDictation
} = useVoiceDictation({ language: 'zh-CN', continuous: false })

// Toast notifications
const { showSuccess, showError, showWarning, showInfo } = useInteractionFeedback()

// Image compression
const { compressImage } = useImageCompressor()
const { isPerformanceMode: isPerfMode } = usePerformanceMode()
// Slide render cache for performance optimization
const { getCached, setCached, hasCached, invalidate: invalidateSlideCache, cacheStats } = useSlideRenderCache()
// Performance profiler for render time metrics
const { metrics: perfMetrics, start: startProfiler, getSummary: getPerfSummary } = usePerformanceProfiler()

// Brand (R104 white-label)
const { displayBrandName } = useBrand()
// Push notifications
const { notifyGenerationComplete, notifyGenerationFailed, prepareForGeneration } = usePushNotification()

// Clipboard & Content Integration
const {
  clipboardHistory,
  isDragOver,
  pendingPasteContent,
  showClipboardHistory,
  showPastePreview,
  isProcessingOCR,
  loadHistory: loadClipboardHistory,
  clearHistory: clearClipboardHistory,
  readClipboardText,
  readClipboardImage,
  addToHistory: addToClipboardHistory,
  createClipboardItem,
  processDroppedFiles,
  performOCR,
  smartParseText,
} = useClipboardAndContent()

// Load clipboard history on mount
loadClipboardHistory()

// Global paste event handler
async function handleGlobalPaste(e: ClipboardEvent) {
  if (!isEditMode.value) return
  // Don't intercept if focus is in an input/textarea
  const target = e.target as HTMLElement
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return

  e.preventDefault()

  // Try image first, then text
  const imageData = await readClipboardImage()
  if (imageData) {
    const item = createClipboardItem('image', imageData)
    addToClipboardHistory(item)
    showImagePastePreview(item)
    return
  }

  const text = await readClipboardText()
  if (text && text.trim()) {
    const item = createClipboardItem('text', text.trim())
    addToClipboardHistory(item)
    showTextPastePreview(item)
  }
}

// Show paste preview for image
function showImagePastePreview(item: any) {
  pendingPasteContent.value = item
  showPastePreview.value = true
}

// Show paste preview for text
function showTextPastePreview(item: any) {
  pendingPasteContent.value = item
  showPastePreview.value = true
}

// Confirm paste - add as new slide
async function confirmPasteAsNewSlide() {
  if (!pendingPasteContent.value) return

  const item = pendingPasteContent.value
  if (item.type === 'image') {
    // Upload image and add as image slide
    try {
      const formData = new FormData()
      const blob = await fetch(item.content).then(r => r.blob())
      formData.append('file', blob, 'pasted_image.png')

      const res = await fetch(`/api/v1/ppt/image/${taskId.value}/${editableSlides.value.length + 1}/upload`, {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.success) {
        editableSlides.value.push({
          title: '粘贴的图片',
          content: '',
          layout: 'left_image_right_text',
          imageUrl: data.image_url,
        })
        showSuccess('图片已粘贴', '新页面已添加')
      } else {
        showError('图片上传失败', data.detail || '请重试')
      }
    } catch (e) {
      showError('图片处理失败', '请重试')
    }
  } else {
    // Parse text and add as new slide
    const parsed = smartParseText(item.content)
    editableSlides.value.push({
      title: parsed.title,
      content: parsed.content.join('\n'),
      layout: parsed.layout,
    })
    showSuccess('文本已粘贴', `新页面「${parsed.title}」已添加`)
  }

  showPastePreview.value = false
  pendingPasteContent.value = null
}

// Import from screenshot (OCR)
async function importFromScreenshot() {
  // Read screenshot from clipboard
  const imageData = await readClipboardImage()
  if (!imageData) {
    showError('未检测到截图', '请先截图，然后点击「导入截图」按钮')
    return
  }

  isProcessingOCR.value = true
  try {
    const text = await performOCR(imageData)
    if (!text || !text.trim()) {
      showWarning('OCR未提取到文字', '截图内容可能不包含可识别的文字')
      return
    }
    const item = createClipboardItem('text', text.trim())
    addToClipboardHistory(item)
    showTextPastePreview(item)
  } catch (e) {
    showError('OCR识别失败', '请尝试手动粘贴文本内容')
  } finally {
    isProcessingOCR.value = false
  }
}

// Apply clipboard history item as new slide
async function applyHistoryItem(item: any) {
  showClipboardHistory.value = false
  if (item.type === 'image') {
    const tmpItem = { ...item, content: item.content }
    showImagePastePreview(tmpItem)
  } else {
    showTextPastePreview(item)
  }
}

// Drag & drop handlers for the edit panel
function handleDragOver(e: DragEvent) {
  if (!isEditMode.value) return
  e.preventDefault()
  isDragOver.value = true
}

function handleDragLeave(e: DragEvent) {
  isDragOver.value = false
}

async function handleDrop(e: DragEvent) {
  if (!isEditMode.value) return
  e.preventDefault()
  isDragOver.value = false

  const files = e.dataTransfer?.files
  if (!files || files.length === 0) return

  const { text, images } = await processDroppedFiles(files)

  // Handle images
  for (const img of images) {
    try {
      const formData = new FormData()
      const blob = await fetch(img.dataURL).then(r => r.blob())
      formData.append('file', blob, img.name)

      const res = await fetch(`/api/v1/ppt/image/${taskId.value}/${editableSlides.value.length + 1}/upload`, {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.success) {
        const historyItem = createClipboardItem('image', data.image_url, img.name)
        addToClipboardHistory(historyItem)
        editableSlides.value.push({
          title: img.name.replace(/\.[^.]+$/, ''),
          content: '',
          layout: 'left_image_right_text',
          imageUrl: data.image_url,
        })
      }
    } catch (err) {
      console.error('拖拽图片上传失败:', err)
    }
  }

  // Handle text files
  for (const txt of text) {
    const parsed = smartParseText(txt)
    editableSlides.value.push({
      title: parsed.title,
      content: parsed.content.join('\n'),
      layout: parsed.layout,
    })
  }

  if (images.length > 0 || text.length > 0) {
    showSuccess('文件已导入', `${images.length}张图片、${text.length}个文本已添加为新页面`)
  }
}

// Swipe navigation for preview slides
const currentVisibleSlide = ref(0)
const slidesContainerRef = ref<HTMLElement | null>(null)

const swipeNextSlide = () => {
  if (currentVisibleSlide.value < previewSlides.value.length - 1) {
    currentVisibleSlide.value++
  }
}

const swipePrevSlide = () => {
  if (currentVisibleSlide.value > 0) {
    currentVisibleSlide.value--
  }
}

useSwipeGesture({
  element: slidesContainerRef,
  onSwipeLeft: swipeNextSlide,
  onSwipeRight: swipePrevSlide,
  threshold: 60
})

const taskId = ref((route.query.taskId as string) || '')
const status = ref('loading')
const slideCount = ref(0)
const fileSize = ref('0 KB')
const errorMessage = ref('')
const showExportMenu = ref(false)
const showChartConfig = ref(false)
const previewLoaded = ref(false)
const previewSlides = ref<Array<{url: string; slideNum: number}>>([])
// BUG修复: 跟踪预览图片加载错误 - 使用ref包装Set保证响应式
const previewErrors = ref(new Set<number>())
// R149: Lazy loading state for preview images (viewport-based)
const visiblePreviewSlides = ref(new Set<number>())
const loadedPreviews = ref(new Set<number>())
const previewGridRef = ref<HTMLElement | null>(null)
let previewObserver: IntersectionObserver | null = null
// 预览加载失败状态（区分"暂无数据"和"加载失败"）
const previewLoadFailed = ref(false)
const isFavorite = ref(false)
const exportTheme = ref<'light' | 'dark'>('light')
const showPresentation = ref(false)
const showARVR = ref(false)
const arvrMode = ref<'vr' | 'panorama' | 'ar' | 'hologram' | 'auditorium'>('vr')

// Presentation analytics tracking
let _scrollCleanup: (() => void) | null = null

watch(showPresentation, async (isActive) => {
  if (isActive && taskId.value) {
    const sessionId = await startViewSession(taskId.value)
    if (sessionId) {
      // Setup scroll tracking on the presentation overlay
      const cleanup = setupScrollTracking(document.documentElement)
      _scrollCleanup = cleanup
    }
  } else {
    if (_scrollCleanup) {
      _scrollCleanup()
      _scrollCleanup = null
    }
    await endViewSession()
  }
})

// R142: 内容编辑模式 + 无障碍状态
const isEditMode = ref(false)
const isRegenerating = ref(false)
const focusedSlideIndex = ref(0) // R142: 当前焦点幻灯片索引（键盘导航用）
const currentSlideFontSize = ref(15) // R142: 当前字体大小（A-/A+调节用）

// 元素微调模式
const showElementEditor = ref(false)

// 快速调优侧边栏
const showLayoutPanel = ref(false)

// 图表编辑器
const showChartEditor = ref(false)

// 幻灯片过渡设置
const showTransitionPanel = ref(false)
const transitionApplyScope = ref<'current' | 'all'>('all')

// Voice dictation state for mobile editing
const dictatingSlideIndex = ref<number | null>(null)
const dictatingField = ref<'title' | 'content' | 'notes' | null>(null)
const dictationActive = ref(false)

// ===== R152: Advanced Slide Notes & Annotations =====
const notesTab = ref<'notes' | 'sticky'>('notes')  // 当前打开的便签标签页
const richNotesActive = ref(false)  // 富文本编辑器是否激活
const currentRichNotesContent = ref('')  // 当前富文本内容
const notesTemplates = ref<any[]>([])  // 备注模板列表
const stickyNotesExpanded = ref<boolean>(false)  // 便签面板是否展开
const currentStickyNote = ref({ content: '', color: '#FFE066', author: '我' })  // 当前编辑的便签

// 加载备注模板
const loadNotesTemplates = async () => {
  try {
    const res = await api.ppt.getNotesTemplates()
    if (res.data && res.data.success) {
      notesTemplates.value = res.data.templates || []
    }
  } catch (e) {
    console.warn('加载备注模板失败:', e)
  }
}

// 应用备注模板
const applyNotesTemplate = (template: any, slideIndex: number) => {
  if (editableSlides.value[slideIndex]) {
    editableSlides.value[slideIndex].richNotes = template.content
    editableSlides.value[slideIndex].notes = template.content.replace(/<[^>]*>/g, '') // 纯文本版本
  }
}

// 添加便签
const addStickyNote = async (slideIndex: number) => {
  if (!taskId.value || !currentStickyNote.value.content.trim()) return
  try {
    const res = await api.ppt.addStickyNote(taskId.value, {
      slide_index: slideIndex,
      content: currentStickyNote.value.content,
      author: currentStickyNote.value.author || '我',
      color: currentStickyNote.value.color,
    })
    if (res.data && res.data.success) {
      if (!editableSlides.value[slideIndex].stickyNotes) {
        editableSlides.value[slideIndex].stickyNotes = []
      }
      editableSlides.value[slideIndex].stickyNotes.push(res.data.note)
      currentStickyNote.value.content = ''
    }
  } catch (e) {
    console.warn('添加便签失败:', e)
  }
}

// 删除便签
const deleteStickyNote = async (slideIndex: number, noteId: string) => {
  if (!taskId.value) return
  try {
    await api.ppt.deleteStickyNote(taskId.value, noteId)
    if (editableSlides.value[slideIndex].stickyNotes) {
      editableSlides.value[slideIndex].stickyNotes = editableSlides.value[slideIndex].stickyNotes!.filter(n => n.id !== noteId)
    }
  } catch (e) {
    console.warn('删除便签失败:', e)
  }
}

// 保存富文本备注到后端
const saveRichNotes = async (slideIndex: number) => {
  if (!taskId.value) return
  const slide = editableSlides.value[slideIndex]
  if (!slide) return
  try {
    await api.ppt.updateSlideNotes(taskId.value, {
      slide_index: slideIndex,
      notes: slide.notes || '',
      rich_notes: slide.richNotes || '',
      speaker_notes: slide.speakerNotes || '',
    })
  } catch (e) {
    console.warn('保存备注失败:', e)
  }
}

// 保存便签数据到后端
const saveStickyNotes = async (slideIndex: number) => {
  if (!taskId.value) return
  const slide = editableSlides.value[slideIndex]
  if (!slide) return
  try {
    await api.ppt.updateSlideStickyNotes(taskId.value, {
      slide_index: slideIndex,
      sticky_notes: slide.stickyNotes || [],
    })
  } catch (e) {
    console.warn('保存便签失败:', e)
  }
}

// ===== Presentation Security (R122) =====
const showSecurityPanel = ref(false)
const securityConfig = ref<{
  task_id: string
  has_password: boolean
  password_set_at: string | null
  biometric_required: boolean
  biometric_set_at: string | null
  allowed_ips: string[]
  has_ip_restriction: boolean
  ip_allowlist_set_at: string | null
  auto_watermark: {
    enabled: boolean
    text: string
    opacity: number
    angle: number
    font_size: number
    color: string
  }
  created_at: string | null
} | null>(null)
const securityLoading = ref(false)
const securityPassword = ref('')
const securityBiometricRequired = ref(false)
const securityAllowedIPs = ref<string[]>([])
const securityAllowedIPsInput = ref('')
const securityAutoWatermark = ref({
  enabled: false,
  text: '',
  opacity: 0.15,
  angle: -45,
  font_size: 48,
  color: '#888888'
})
const securityAccessLog = ref<any[]>([])
const securityDownloadPassword = ref('')
const showSecurityDownloadModal = ref(false)

const loadSecurityConfig = async () => {
  if (!taskId.value) return
  securityLoading.value = true
  try {
    const res = await api.security.getConfig(taskId.value) as any
    securityConfig.value = res.data
    securityBiometricRequired.value = res.data.biometric_required
    securityAllowedIPs.value = res.data.allowed_ips || []
    securityAutoWatermark.value = res.data.auto_watermark || {
      enabled: false, text: '', opacity: 0.15, angle: -45, font_size: 48, color: '#888888'
    }
  } catch (e) {
    console.error('Failed to load security config:', e)
  } finally {
    securityLoading.value = false
  }
}

const saveSecurityPassword = async () => {
  if (!taskId.value || !securityPassword.value) return
  try {
    await api.security.setPassword(taskId.value, securityPassword.value)
    securityPassword.value = ''
    await loadSecurityConfig()
    showSuccess('密码已设置', '演示文稿下载时需要密码验证')
  } catch (e: any) {
    showError('设置失败', e?.message || '密码设置失败')
  }
}

const removeSecurityPassword = async () => {
  if (!taskId.value) return
  try {
    await api.security.removePassword(taskId.value)
    await loadSecurityConfig()
    showSuccess('密码已移除', '演示文稿下载不再需要密码')
  } catch (e: any) {
    showError('移除失败', e?.message || '密码移除失败')
  }
}

const saveSecurityBiometric = async () => {
  if (!taskId.value) return
  try {
    await api.security.setBiometric(taskId.value, securityBiometricRequired.value)
    await loadSecurityConfig()
    showSuccess(
      securityBiometricRequired.value ? '生物认证已启用' : '生物认证已关闭',
      securityBiometricRequired.value ? '下载前需要生物认证' : '下载不再需要生物认证'
    )
  } catch (e: any) {
    showError('设置失败', e?.message || '生物认证设置失败')
  }
}

const saveSecurityIPs = async () => {
  if (!taskId.value) return
  const ips = securityAllowedIPsInput.value
    .split(/[,;\n]/)
    .map(ip => ip.trim())
    .filter(ip => ip.length > 0)
  try {
    await api.security.setIPAllowlist(taskId.value, ips)
    securityAllowedIPs.value = ips
    securityAllowedIPsInput.value = ips.join(', ')
    await loadSecurityConfig()
    showSuccess('IP白名单已保存', ips.length > 0 ? `允许 ${ips.length} 个IP地址` : 'IP限制已清除')
  } catch (e: any) {
    showError('设置失败', e?.message || 'IP白名单设置失败')
  }
}

const saveSecurityWatermark = async () => {
  if (!taskId.value) return
  try {
    await api.security.setWatermark(taskId.value, {
      enabled: securityAutoWatermark.value.enabled,
      text: securityAutoWatermark.value.text,
      opacity: securityAutoWatermark.value.opacity,
      angle: securityAutoWatermark.value.angle,
      font_size: securityAutoWatermark.value.font_size,
      color: securityAutoWatermark.value.color,
    })
    await loadSecurityConfig()
    showSuccess('水印设置已保存', securityAutoWatermark.value.enabled ? '导出时将自动添加水印' : '自动水印已关闭')
  } catch (e: any) {
    showError('设置失败', e?.message || '水印设置失败')
  }
}

const loadSecurityAccessLog = async () => {
  if (!taskId.value) return
  try {
    const res = await api.security.getAccessLog(taskId.value) as any
    securityAccessLog.value = res.data.logs || []
  } catch (e: any) {
    console.error('Failed to load access log:', e)
  }
}

const triggerBiometric = async (): Promise<string> => {
  // Use WebAuthn API for biometric verification
  if ('credentials' in navigator) {
    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: { name: 'RabAiMind' },
          user: { id: new TextEncoder().encode(taskId.value), name: taskId.value },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        }
      } as any)
      return btoa(JSON.stringify(credential))
    } catch (e) {
      console.warn('WebAuthn not available, using fallback')
    }
  }
  return 'biometric_fallback_token'
}

const openSecurityPanel = () => {
  showSecurityPanel.value = true
  loadSecurityConfig()
  loadSecurityAccessLog()
  showMoreMenu.value = false
}

// ===== Master Slide System =====
interface MasterSlide {
  id: string
  name: string
  background: string
  fontFamily: string
  primaryColor: string
  accentColor: string
  secondaryColor: string
  fontSizeTitle: number
  fontSizeBody: number
  logoUrl?: string
  defaultTransition: 'slide' | 'fade' | 'zoom' | 'flip'
  defaultTransitionDuration: 'fast' | 'normal' | 'slow'
}

const masterSlides = ref<MasterSlide[]>([
  {
    id: 'master-default',
    name: '默认风格',
    background: '#ffffff',
    fontFamily: 'Microsoft YaHei',
    primaryColor: '#2563eb',
    accentColor: '#3b82f6',
    secondaryColor: '#64748b',
    fontSizeTitle: 32,
    fontSizeBody: 18,
    defaultTransition: 'slide',
    defaultTransitionDuration: 'normal'
  },
  {
    id: 'master-dark',
    name: '深色主题',
    background: '#1e293b',
    fontFamily: 'Microsoft YaHei',
    primaryColor: '#60a5fa',
    accentColor: '#93c5fd',
    secondaryColor: '#94a3b8',
    fontSizeTitle: 34,
    fontSizeBody: 18,
    defaultTransition: 'fade',
    defaultTransitionDuration: 'slow'
  },
  {
    id: 'master-minimal',
    name: '简约商务',
    background: '#f8fafc',
    fontFamily: 'Microsoft YaHei',
    primaryColor: '#0f172a',
    accentColor: '#334155',
    secondaryColor: '#94a3b8',
    fontSizeTitle: 30,
    fontSizeBody: 16,
    defaultTransition: 'slide',
    defaultTransitionDuration: 'fast'
  },
  {
    id: 'master-creative',
    name: '创意彩色',
    background: '#fef9c3',
    fontFamily: 'Microsoft YaHei',
    primaryColor: '#d97706',
    accentColor: '#f59e0b',
    secondaryColor: '#92400e',
    fontSizeTitle: 36,
    fontSizeBody: 20,
    defaultTransition: 'zoom',
    defaultTransitionDuration: 'normal'
  }
])

const showMasterEditor = ref(false)
const selectedMasterId = ref('master-default')
const editingMaster = reactive<Partial<MasterSlide>>({})

const getSelectedMaster = () => masterSlides.value.find(m => m.id === selectedMasterId.value)

// 版本标签筛选
const filteredVersionList = computed(() => {
  if (!selectedTagFilter.value) {
    return versionList.value
  }
  return versionList.value.filter(v => v.tags && v.tags.includes(selectedTagFilter.value))
})

const activeMasterColors = computed(() => {
  const master = getSelectedMaster()
  return {
    themeColor: master?.primaryColor || '#2563eb',
    bgColor: master?.background || '#ffffff'
  }
})

const openMasterEditor = (masterId?: string) => {
  const id = masterId || selectedMasterId.value
  selectedMasterId.value = id
  const master = getSelectedMaster()
  if (master) {
    Object.assign(editingMaster, { ...master })
  }
  showMasterEditor.value = true
}

// AI演讲教练
const openPresentationCoach = () => {
  // 确保有slides数据
  if (editableSlides.value.length === 0) {
    showWarning('请先进入编辑模式加载幻灯片', '演讲教练需要幻灯片内容')
    return
  }
  showPresentationCoach.value = true
}

const handleCoachViewSlide = (slideNum: number) => {
  // 从教练面板跳转到指定页
  if (!isEditMode.value) {
    toggleEditMode()
  }
  currentEditingSlide.value = slideNum
  showPresentationCoach.value = false
}

const coachTimingData = ref<any>(null)

const handleCoachApplyTiming = (timingResult: any) => {
  coachTimingData.value = timingResult
  showPresentationCoach.value = false
  showPresentation.value = true
  showSuccess('⏱', '已应用AI节奏建议，自动播放已开启')
}

const applyMasterToSlide = (slideIndex: number, masterId: string) => {
  if (editableSlides.value[slideIndex]) {
    editableSlides.value[slideIndex].masterId = masterId
    showSuccess('母版已应用', `第${slideIndex + 1}页已应用母版样式`)
  }
}

const applyMasterToAllSlides = (masterId: string) => {
  const master = masterSlides.value.find(m => m.id === masterId)
  if (!master) return
  editableSlides.value.forEach((slide, i) => {
    editableSlides.value[i].masterId = masterId
  })
  // Apply master transition to global settings
  transitionSettings.type = master.defaultTransition
  transitionSettings.duration = master.defaultTransitionDuration
  showSuccess('母版已应用', `全部${editableSlides.value.length}页已应用「${master.name}」母版`)
}

const saveMaster = () => {
  const idx = masterSlides.value.findIndex(m => m.id === selectedMasterId.value)
  if (idx >= 0) {
    Object.assign(masterSlides.value[idx], editingMaster as MasterSlide)
    showSuccess('母版已保存', `「${masterSlides.value[idx].name}」更新已保存`)
  }
  showMasterEditor.value = false
}

// ===== Custom Animation System =====
interface SlideAnimation {
  id: string
  name: string
  type: 'fade' | 'slide' | 'zoom' | 'bounce' | 'flip' | 'rotate' | 'custom'
  duration: number  // ms
  delay: number     // ms
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out'
  direction?: 'left' | 'right' | 'up' | 'down'
  keyframeCSS?: string  // custom CSS keyframes
}

const animationPresets: SlideAnimation[] = [
  { id: 'anim-fade', name: '淡入', type: 'fade', duration: 600, delay: 0, easing: 'ease' },
  { id: 'anim-slide-up', name: '上滑进入', type: 'slide', duration: 500, delay: 0, easing: 'ease-out', direction: 'up' },
  { id: 'anim-slide-left', name: '左滑进入', type: 'slide', duration: 500, delay: 0, easing: 'ease-out', direction: 'left' },
  { id: 'anim-zoom', name: '缩放进入', type: 'zoom', duration: 400, delay: 0, easing: 'ease-out' },
  { id: 'anim-bounce', name: '弹跳进入', type: 'bounce', duration: 600, delay: 0, easing: 'ease' },
  { id: 'anim-flip', name: '翻转进入', type: 'flip', duration: 600, delay: 0, easing: 'ease-in-out' },
  { id: 'anim-rotate', name: '旋转进入', type: 'rotate', duration: 700, delay: 0, easing: 'ease-in-out' },
]

const showAnimationComposer = ref(false)
const currentAnimatingSlide = ref(0)
const editingAnimation = reactive<Partial<SlideAnimation>>({
  id: '',
  name: '',
  type: 'fade',
  duration: 600,
  delay: 0,
  easing: 'ease',
  direction: 'up'
})
const customAnimations = ref<SlideAnimation[]>([])

const openAnimationComposer = (slideIndex: number) => {
  currentAnimatingSlide.value = slideIndex
  const slideAnim = editableSlides.value[slideIndex]?.animation
  if (slideAnim) {
    Object.assign(editingAnimation, slideAnim)
  } else {
    Object.assign(editingAnimation, { id: '', name: '', type: 'fade', duration: 600, delay: 0, easing: 'ease', direction: 'up' })
  }
  showAnimationComposer.value = true
}

const applyAnimationToSlide = () => {
  const idx = currentAnimatingSlide.value
  if (!editableSlides.value[idx]) return
  const anim: SlideAnimation = {
    id: editingAnimation.id || `custom-${Date.now()}`,
    name: editingAnimation.name || '自定义动画',
    type: editingAnimation.type as SlideAnimation['type'],
    duration: editingAnimation.duration || 600,
    delay: editingAnimation.delay || 0,
    easing: editingAnimation.easing as SlideAnimation['easing'],
    direction: editingAnimation.direction as SlideAnimation['direction']
  }
  editableSlides.value[idx].animation = anim
  // Also add to customAnimations if new
  if (!customAnimations.value.find(a => a.id === anim.id)) {
    customAnimations.value.push(anim)
  }
  showAnimationComposer.value = false
  showSuccess('动画已应用', `第${idx + 1}页已应用「${anim.name}」动画`)
}

const replayCurrentSlideAnimation = () => {
  currentAnimatingSlide.value = currentEditingSlide.value - 1
  showPresentation.value = true
  // Will signal PresentationMode to replay via a dedicated mechanism
  replayAnimationSignal.value = Date.now()
}

const replayAnimationSignal = ref(0)

const getSlideAnimation = (slideIndex: number): SlideAnimation | undefined => {
  return editableSlides.value[slideIndex]?.animation
}

// 团队协作相关
const showTeamWorkspace = ref(false)
const showActivityFeed = ref(false)
const showCommentsPanel = ref(false)

// ─── 实时协作 (R71) ─────────────────────────────────────────────────────────────
// 用户身份 (如果没有则生成一个匿名 ID 存储在 localStorage)
const getOrCreateUserId = () => {
  let uid = localStorage.getItem('rabai_user_id')
  if (!uid) {
    uid = `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    localStorage.setItem('rabai_user_id', uid)
  }
  return uid
}
const getOrCreateUserName = () => {
  let name = localStorage.getItem('rabai_user_name')
  if (!name) {
    const adjectives = ['开心的', '热情的', '冷静的', '活泼的', '认真的']
    const nouns = ['兔子', '熊猫', '老虎', '小猫', '小狗']
    name = adjectives[Math.floor(Math.random() * adjectives.length)] +
           nouns[Math.floor(Math.random() * nouns.length)]
    localStorage.setItem('rabai_user_name', name)
  }
  return name
}
const currentUser = {
  id: getOrCreateUserId(),
  name: getOrCreateUserName(),
  avatar: '',
  role: 'editor',
}

// 协作实例 (条件初始化: 仅当有 taskId 时)
let _collaborationInstance: ReturnType<typeof useCollaboration> | null = null
const collaborationEnabled = ref(false)
const showCollaborationOverlay = ref(false)

const initCollaboration = () => {
  if (!taskId.value || _collaborationInstance) return
  _collaborationInstance = useCollaboration(taskId.value, currentUser)
  collaborationEnabled.value = true
  showCollaborationOverlay.value = true

  // 监听被跟随时的视口变化 → 自动跳转到对应幻灯片
  _collaborationInstance.onViewportChange((viewport) => {
    if (viewport && viewport.slide_num) {
      const targetSlide = viewport.slide_num - 1
      if (targetSlide >= 0 && targetSlide < editableSlides.value.length) {
        currentVisibleSlide.value = targetSlide
      }
    }
  })
}

// 鼠标移动 → 更新光标位置 (节流)
let _cursorThrottle = 0
const handleEditorMouseMove = (event: MouseEvent) => {
  if (!collaborationEnabled.value || !_collaborationInstance) return
  const now = Date.now()
  if (now - _cursorThrottle < 50) return
  _cursorThrottle = now

  const container = (event.currentTarget as HTMLElement)
  if (!container) return
  const rect = container.getBoundingClientRect()
  const x = (event.clientX - rect.left) / rect.width
  const y = (event.clientY - rect.top) / rect.height

  _collaborationInstance.updateCursor(
    x, y,
    currentVisibleSlide.value + 1,
    {
      viewportX: container.scrollLeft,
      viewportY: container.scrollTop,
      viewportZoom: 1,
    }
  )
}

// 协作评论 → 传递给 SlideCommentsPanel
const collabCommentsRef = computed(() => {
  if (!_collaborationInstance) return null
  return {
    addComment: _collaborationInstance.addComment,
    replyComment: _collaborationInstance.replyComment,
    resolveComment: _collaborationInstance.resolveComment,
  }
})
const showAdvancedAIPanel = ref(false)
const showSmartDesignPanel = ref(false)
const showSmartContentSuggestions = ref(false)
const showAccessibilityPanel = ref(false)
const showPresentationCoach = ref(false)
const currentEditingSlide = ref(1)

// ── Voice / Speech ────────────────────────────────────────────────────────
const showVoicePanel = ref(false)
const showRecordingPanel = ref(false)

// Recording & Webcam State
const isRecordingMode = ref(false)
const recordingChapters = ref<Array<{ id: string; title: string; time: number }>>([])
const currentWebcamConfig = ref<{
  enabled: boolean
  position: string
  size: number
  borderRadius: number
  mirror: boolean
  border: boolean
  stream: MediaStream | null
} | null>(null)

function handleAddChapter(time: number) {
  const chapter = {
    id: `ch-${Date.now()}`,
    title: `章节 ${recordingChapters.value.length + 1}`,
    time
  }
  recordingChapters.value.push(chapter)
}

// R157: Handle add-chapter from RecordingPanel (takes RecordingChapter object)
function handleRecordingAddChapter(chapter: { id: string; title: string; time: number }) {
  // Use the chapter from RecordingPanel (already has title)
  recordingChapters.value.push(chapter)
}

function handleAnnotateNotes(slideIndex: number, notes: string) {
  // Update the slide's presenterNotes in the local slides array
  const idx = editableSlides.value.findIndex(
    (s: any) => s._editIndex === slideIndex
  )
  if (idx >= 0) {
    editableSlides.value[idx].presenterNotes = notes
  }
  // Also update via slideUpdate if available
  slideUpdate(editableSlides.value[slideIndex], slideIndex)
}

function handleWebcamConfig(config: any) {
  currentWebcamConfig.value = config
}

// ── R157: Smart Presentation Mode Features ────────────────────────────
// Network quality is initialized at module level, used here
const networkQuality = getNetworkQuality()

// Quality-adaptive settings (reactively updated)
const networkQualityLevel = computed(() => networkQuality.networkState.value.qualityLevel)
const qualityLabel = computed(() => networkQuality.qualityLabel.value)

// 3. One-click recording via MediaRecorder
let mediaRecorder: MediaRecorder | null = null
let recordedChunks: Blob[] = []
let recordingStream: MediaStream | null = null
let recordingCanvas: HTMLCanvasElement | null = null
let recordingCtx: CanvasRenderingContext2D | null = null
let recordingAnimationId: number | null = null
let recordingStartTime = 0

const recordingBlob = ref<Blob | null>(null)
const recordingUrl = ref<string | null>(null)
const isActuallyRecording = ref(false)

async function handleStartRecord() {
  // Enter recording mode: capture presentation canvas
  isRecordingMode.value = true
  isActuallyRecording.value = true
  recordingChunks = []
  recordingStartTime = Date.now()
  
  // Create an offscreen canvas to capture slides
  const slidesEl = document.querySelector('.slides-container') as HTMLElement
  if (!slidesEl) {
    console.warn('[Recording] slides container not found')
    return
  }
  
  // Use html2canvas-like approach: capture via canvas
  recordingCanvas = document.createElement('canvas')
  recordingCanvas.width = 1920
  recordingCanvas.height = 1080
  recordingCtx = recordingCanvas.getContext('2d')
  if (!recordingCtx) return
  
  // Create a stream from the canvas
  try {
    recordingStream = recordingCanvas.captureStream(30) // 30fps
  } catch (e) {
    console.error('[Recording] captureStream not supported:', e)
    // Fallback: try to capture window
    try {
      recordingStream = (slidesEl as any).captureStream?.(30) || await navigator.mediaDevices.getDisplayMedia({ video: true })
    } catch (e2) {
      console.error('[Recording] Fallback capture failed:', e2)
      isActuallyRecording.value = false
      return
    }
  }
  
  // Add webcam stream if enabled
  if (currentWebcamConfig.value?.stream) {
    const combinedStream = new MediaStream()
    recordingStream.getVideoTracks().forEach(t => combinedStream.addTrack(t))
    // Add webcam track
    const webcamTrack = currentWebcamConfig.value.stream.getVideoTracks()[0]
    if (webcamTrack) combinedStream.addTrack(webcamTrack)
    recordingStream = combinedStream
  }
  
  // Set up MediaRecorder
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : MediaRecorder.isTypeSupported('video/webm')
    ? 'video/webm'
    : 'video/mp4'
  
  const bitsPerSecond = networkQualityLevel.value >= 2 ? 8000000 : networkQualityLevel.value >= 1 ? 4000000 : 2000000
  
  mediaRecorder = new MediaRecorder(recordingStream!, { mimeType, videoBitsPerSecond: bitsPerSecond })
  
  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      recordedChunks.push(e.data)
    }
  }
  
  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: mimeType })
    recordingBlob.value = blob
    recordingUrl.value = URL.createObjectURL(blob)
    isActuallyRecording.value = false
    
    // Auto-save recording to prevent loss
    autoSaveRecordingBlob(blob)
  }
  
  mediaRecorder.start(1000) // Collect data every second
  
  // Start canvas capture loop
  startCanvasCapture()
}

function startCanvasCapture() {
  if (!recordingCtx || !recordingCanvas || !isActuallyRecording.value) return
  
  const slidesEl = document.querySelector('.slides-container') as HTMLElement
  if (!slidesEl) {
    recordingAnimationId = requestAnimationFrame(startCanvasCapture)
    return
  }
  
  // Draw the current slide to canvas
  try {
    // Use dom-to-canvas approach: draw the slides container
    const dataUrl = slidesEl.toDataURL?.('image/png')
    if (dataUrl) {
      const img = new Image()
      img.onload = () => {
        recordingCtx!.drawImage(img, 0, 0, recordingCanvas!.width, recordingCanvas!.height)
      }
      img.src = dataUrl
    }
  } catch (e) {
    // Fallback: fill with solid color if capture fails
    recordingCtx.fillStyle = '#1a1a2e'
    recordingCtx.fillRect(0, 0, recordingCanvas!.width, recordingCanvas!.height)
  }
  
  // Draw recording time overlay
  if (isActuallyRecording.value) {
    const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000)
    const mins = Math.floor(elapsed / 60).toString().padStart(2, '0')
    const secs = (elapsed % 60).toString().padStart(2, '0')
    recordingCtx.fillStyle = 'rgba(0,0,0,0.6)'
    recordingCtx.fillRect(recordingCanvas!.width - 140, 20, 120, 40)
    recordingCtx.fillStyle = '#ff4444'
    recordingCtx.font = 'bold 24px monospace'
    recordingCtx.fillText(`● ${mins}:${secs}`, recordingCanvas!.width - 130, 50)
    
    // Draw chapter markers
    for (const ch of recordingChapters.value) {
      const chTime = ch.time
      if (elapsed >= chTime && elapsed < chTime + 2) {
        recordingCtx.fillStyle = 'rgba(22,93,255,0.8)'
        recordingCtx.fillRect(0, recordingCanvas!.height - 60, recordingCanvas!.width, 50)
        recordingCtx.fillStyle = '#fff'
        recordingCtx.font = 'bold 20px sans-serif'
        recordingCtx.fillText(`📑 ${ch.title}`, 20, recordingCanvas!.height - 25)
      }
    }
  }
  
  recordingAnimationId = requestAnimationFrame(startCanvasCapture)
}

async function autoSaveRecordingBlob(blob: Blob) {
  // Save recording blob to localStorage temporarily (limited size)
  // For large recordings, save to IndexedDB via service worker
  try {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      if (base64.length < 2 * 1024 * 1024) { // < 2MB
        localStorage.setItem('rabai_last_recording', JSON.stringify({
          data: base64,
          taskId: taskId.value,
          timestamp: Date.now()
        }))
      }
    }
    reader.readAsDataURL(blob)
  } catch (e) {
    console.warn('[Recording] auto-save failed:', e)
  }
}

function handleStopRecord() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }
  if (recordingAnimationId) {
    cancelAnimationFrame(recordingAnimationId)
    recordingAnimationId = null
  }
  if (recordingStream) {
    recordingStream.getTracks().forEach(t => t.stop())
    recordingStream = null
  }
  isRecordingMode.value = false
  isActuallyRecording.value = false
}

function handleExportRecording(options: any) {
  if (!recordingBlob.value && !recordingUrl.value) {
    showWarning('没有可导出的录制内容')
    return
  }
  
  const quality = networkQuality.recommendedSettings.value.recordingQuality
  const format = options?.format || 'webm'
  const blob = recordingBlob.value || new Blob([], { type: 'video/webm' })
  
  const url = recordingUrl.value || URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `presentation_${taskId.value}_${Date.now()}.${format}`
  a.click()
  
  showSuccess('录制已导出')
}

function handleStreamConfig(config: any) {
  // Handle live streaming config from RecordingPanel
  console.log('[Streaming] config:', config)
}

function handleRecordingPanelClose() {
  // If recording in progress, stop first
  if (isActuallyRecording.value) {
    handleStopRecord()
  }
  showRecordingPanel.value = false
}

// 4. Auto-save during presentation (enhanced)
// Already exists: autoSaveEnabled, autoSaveInterval, setupAutoSave
// Add: presentation-specific auto-save that triggers when entering presentation mode
const presentationAutoSaveEnabled = ref(true)
const presentationAutoSaveInterval = ref(60000) // Every 60s during presentation

watch(showPresentation, async (showing) => {
  if (showing && presentationAutoSaveEnabled.value) {
    // Start presentation-specific auto-save
    startPresentationAutoSave()
  } else {
    stopPresentationAutoSave()
  }
})

let presentationAutoSaveTimer: number | null = null

function startPresentationAutoSave() {
  if (presentationAutoSaveTimer) clearInterval(presentationAutoSaveTimer)
  presentationAutoSaveTimer = window.setInterval(async () => {
    if (!taskId.value) return
    try {
      // Save current state including slide position, timer, etc.
      const state = {
        currentSlide: currentEditingSlide.value,
        timestamp: Date.now(),
        type: 'presentation_autosave'
      }
      await api.ppt.autoSave(taskId.value, state)
      lastAutoSaveTime.value = Date.now()
    } catch (e) {
      console.warn('[AutoSave] Presentation auto-save failed:', e)
    }
  }, presentationAutoSaveInterval.value)
}

function stopPresentationAutoSave() {
  if (presentationAutoSaveTimer) {
    clearInterval(presentationAutoSaveTimer)
    presentationAutoSaveTimer = null
  }
}

// 5. Emergency backup on browser crash
// Use beforeunload + periodic backup + visibilitychange
let emergencyBackupTimer: number | null = null
let lastEmergencyBackupTime = 0

// Stable reference for visibility change handler
const visibilityChangeHandler = () => {
  if (document.visibilityState === 'hidden') {
    performEmergencyBackup()
  }
}

function setupEmergencyBackup() {
  // Periodic auto-backup every 2 minutes while editing
  emergencyBackupTimer = window.setInterval(async () => {
    if (!taskId.value) return
    const now = Date.now()
    if (now - lastEmergencyBackupTime < 120000) return // Max once every 2 min
    
    try {
      await api.ppt.createBackup(taskId.value, `紧急备份 ${new Date().toLocaleTimeString('zh-CN')}`, 'auto')
      lastEmergencyBackupTime = now
    } catch (e) {
      console.warn('[EmergencyBackup] failed:', e)
    }
  }, 120000)
  
  // Save immediately before page unload
  window.addEventListener('beforeunload', performEmergencyBackup)
  
  // Save on visibility change (tab hidden)
  document.addEventListener('visibilitychange', visibilityChangeHandler)
}

async function performEmergencyBackup() {
  if (!taskId.value) return
  try {
    // Use sendBeacon for reliable delivery on page unload
    const data = new URLSearchParams({
      name: `紧急备份 ${new Date().toLocaleTimeString('zh-CN')}`,
      backup_type: 'auto'
    })
    
    if (navigator.sendBeacon) {
      navigator.sendBeacon(`/api/v1/ppt/backups/${taskId.value}?${data.toString()}`)
    } else {
      // Fallback: async backup
      await api.ppt.createBackup(taskId.value, `紧急备份 ${new Date().toLocaleTimeString('zh-CN')}`, 'auto')
    }
  } catch (e) {
    console.warn('[EmergencyBackup] failed:', e)
  }
}

function cleanupEmergencyBackup() {
  if (emergencyBackupTimer) {
    clearInterval(emergencyBackupTimer)
    emergencyBackupTimer = null
  }
  window.removeEventListener('beforeunload', performEmergencyBackup)
  document.removeEventListener('visibilitychange', visibilityChangeHandler)
}
const voice = useVoiceCommands()
const voiceSettings = voice.settings
const voiceCustomCommands = voice.customCommands
const isVoiceListening = voice.isListening
const isVoiceSpeaking = voice.isSpeaking
const voiceCaptions = voice.captions
const voiceCaptionsVisible = voice.captionsVisible
const voiceCurrentTranscript = voice.currentTranscript
const voiceLastCommand = voice.lastRecognizedCommand
const voiceCommandError = voice.commandError

function updateVoiceSettings(updates: any) {
  voice.updateSettings(updates)
}

function toggleVoiceListening() {
  voice.toggleListening()
}

function stopVoiceSpeaking() {
  voice.stopSpeaking()
}

function toggleVoiceCaptions() {
  voice.toggleCaptions()
}

function addVoiceCommand(cmd: any) {
  voice.addCustomCommand(cmd)
}

function removeVoiceCommand(id: string) {
  voice.removeCustomCommand(id)
}

async function handleTranslate(text: string, sourceLang: string, targetLang: string) {
  try {
    const res = await api.translate.translateText({
      text,
      source_lang: sourceLang,
      target_lang: targetLang,
    } as any)
    if (res.data.success) {
      // VoicePanel will receive the result via its own state update
      // For now we use a toast-like approach
      return res.data.data.translated
    }
  } catch (e: any) {
    console.warn('[Translate] Error:', e)
  }
}

async function handleSpeakTranslation(text: string) {
  try {
    const res = await api.voice.tts({
      text,
      voice: voiceSettings.value.ttsVoice || 'zh-CN-Xiaoxiao',
      rate: voiceSettings.value.ttsRate || '+0%',
      volume: voiceSettings.value.ttsVolume || '+0%',
      pitch: voiceSettings.value.ttsPitch || '+0Hz',
    } as any)
    if (res.data.success) {
      const audioUrl = res.data.data.audio_url
      const audio = new Audio(audioUrl)
      audio.play().catch(() => {})
    }
  } catch (e) {
    console.warn('[SpeakTranslation] Error:', e)
  }
}

function openVoicePanel() {
  showVoicePanel.value = true
}

function openRecordingPanel() {
  showRecordingPanel.value = true
}

async function startReadAloud() {
  const idx = currentEditingSlide.value - 1
  const slide = editableSlides.value[idx]
  if (!slide) return

  const text = [slide.title, slide.content].filter(Boolean).join('。')
  if (!text) {
    alert('当前页没有内容可朗读')
    return
  }

  await voice.readSlideAloud(text)
}

async function batchGenerateVoiceover() {
  alert('批量配音功能开发中，敬请期待！')
}

// Set up voice navigation handler to work with slide navigation
voice.setNavigationHandler((action, value) => {
  if (value === 'next') {
    if (currentEditingSlide.value < slideCount.value) {
      currentEditingSlide.value++
    }
  } else if (value === 'prev') {
    if (currentEditingSlide.value > 1) {
      currentEditingSlide.value--
    }
  } else if (value === 'first') {
    currentEditingSlide.value = 1
  } else if (value === 'last') {
    currentEditingSlide.value = slideCount.value
  } else if (value?.startsWith('slide:')) {
    const num = parseInt(value.split(':')[1])
    if (num >= 1 && num <= slideCount.value) {
      currentEditingSlide.value = num
    }
  }
})

voice.setControlHandler((action, value) => {
  if (value === 'read') {
    startReadAloud()
  } else if (value === 'stop') {
    stopVoiceSpeaking()
  } else if (value === 'captions') {
    toggleVoiceCaptions()
  }
})

const currentSlideTitle = computed(() => {
  const idx = currentEditingSlide.value - 1
  return editableSlides.value[idx]?.title || ''
})

const currentSlideContent = computed(() => {
  const idx = currentEditingSlide.value - 1
  return editableSlides.value[idx]?.content || ''
})

const transitionTypes = [
  { value: 'slide', name: '滑动', icon: '→' },
  { value: 'fade', name: '淡入淡出', icon: '◐' },
  { value: 'zoom', name: '缩放', icon: '⊕' },
  { value: 'flip', name: '翻转', icon: '↺' },
  { value: 'morph', name: '变形', icon: '✦' },
  { value: 'random', name: '随机', icon: '⚡' }
]

// Sound effects for transitions
const soundEffects = [
  { value: 'none', name: '无音效', icon: '🔇' },
  { value: 'click', name: '点击声', icon: '👆' },
  { value: 'whoosh', name: '嗖声', icon: '💨' },
  { value: 'whoosh2', name: '嗖嗖', icon: '🌪️' },
  { value: 'drum', name: '鼓点', icon: '🥁' }
]

const durationOptions = [
  { value: 'fast', label: '快 (0.3s)' },
  { value: 'normal', label: '中 (0.5s)' },
  { value: 'slow', label: '慢 (0.8s)' }
]

const transitionSettings = reactive({
  type: 'slide' as 'slide' | 'fade' | 'zoom' | 'flip' | 'morph' | 'random',
  duration: 'normal' as 'fast' | 'normal' | 'slow',
  customDuration: 0.5, // seconds (0.1 to 2.0)
  useCustomDuration: false,
  soundEffect: 'none' as 'none' | 'click' | 'whoosh' | 'whoosh2' | 'drum',
  autoAdvance: false,
  autoDelay: 5000,
  morphEnabled: false,
  randomEnabled: false
})

// Morph transition: calculate similarity between slides
const getSlideSimilarity = (slideA: any, slideB: any): number => {
  if (!slideA || !slideB) return 0
  const contentA = (slideA.title || '') + ' ' + (slideA.content || '')
  const contentB = (slideB.title || '') + ' ' + (slideB.content || '')
  const wordsA = new Set(contentA.toLowerCase().split(/\s+/).filter(w => w.length > 2))
  const wordsB = new Set(contentB.toLowerCase().split(/\s+/).filter(w => w.length > 2))
  if (wordsA.size === 0 || wordsB.size === 0) return 0
  const intersection = new Set([...wordsA].filter(x => wordsB.has(x)))
  const union = new Set([...wordsA, ...wordsB])
  return intersection.size / union.size
}

// Get effective transition type (resolves random/morph)
const getEffectiveTransition = (index: number, prevIndex: number): string => {
  if (transitionSettings.type === 'random') {
    const baseTransitions = ['slide', 'fade', 'zoom', 'flip']
    return baseTransitions[Math.floor(Math.random() * baseTransitions.length)]
  }
  if (transitionSettings.type === 'morph') {
    const currentSlide = editableSlides.value[index]
    const prevSlide = editableSlides.value[prevIndex]
    const similarity = getSlideSimilarity(currentSlide, prevSlide)
    if (similarity > 0.4) return 'morph'
    return 'fade'
  }
  return transitionSettings.type
}

// Get actual duration in seconds
const getTransitionDuration = (): number => {
  if (transitionSettings.useCustomDuration) {
    return transitionSettings.customDuration
  }
  const durationMap: Record<string, number> = { fast: 0.3, normal: 0.5, slow: 0.8 }
  return durationMap[transitionSettings.duration] || 0.5
}

// Preview transition animation
const previewTransitionActive = ref(false)
const previewTransitionType = ref('slide')
const previewTransitionDuration = ref(0.5)

const startTransitionPreview = () => {
  previewTransitionType.value = transitionSettings.type
  previewTransitionDuration.value = getTransitionDuration()
  previewTransitionActive.value = true
  setTimeout(() => {
    previewTransitionActive.value = false
  }, previewTransitionDuration.value * 2000)
}

const playTransitionSound = () => {
  if (transitionSettings.soundEffect === 'none') return
  // Sound playback would be handled by audio API
  // For now we trigger a visual feedback
  console.log('Transition sound:', transitionSettings.soundEffect)
}

const getTransitionLabel = (type: string) => {
  return transitionTypes.find(t => t.value === type)?.name || type
}

const getSoundEffectLabel = (effect: string) => {
  return soundEffects.find(s => s.value === effect)?.name || effect
}

const applyTransitionToSlides = () => {
  // Transition is applied via the transitionSettings prop passed to PresentationMode
  // For per-slide transitions, we would need to modify the slides data
  showTransitionPanel.value = false
  // Open presentation mode to preview
  showPresentation.value = true
}

// 版本历史相关
const showVersionPanel = ref(false)
// 备份管理 R125
const showBackupPanel = ref(false)
const versionList = ref<Array<{version_id: string; name: string; created_at: string; slide_count: number; tags?: string[]; auto_created?: boolean; auto_type?: string}>>([])
const currentVersionId = ref('')
const showDiffView = ref(false)
// 版本标签
const versionTagList = ref<string[]>([])
const selectedTagFilter = ref('')
const showTagDialog = ref(false)
const editingVersionId = ref('')
const newTagInput = ref('')
// 自动版本化
const autoVersionStatus = ref<{
  significant_change_count: number
  last_significant_change_at?: string
  last_auto_version_at?: string
  auto_version_threshold: number
} | null>(null)
// 合并冲突解决
const mergeConflicts = ref<any[]>([])
const showMergeConflictDialog = ref(false)
const pendingMergeSource = ref('')
const pendingMergeTarget = ref('')
const slideResolutions = ref<Record<number, string>>({})
// A/B Testing
const showABTestPanel = ref(false)
const abTestList = ref<Array<{test_id: string; slide_index: number; variant_count: number; status: string; winner?: string; total_views: number}>>([])
const currentABTest = ref<any>(null)
const showABResult = ref(false)
// Suggest Improvements
const showSuggestPanel = ref(false)
const suggestList = ref<any[]>([])
const suggestLoading = ref(false)
// Slide-level version history
const slideHistoryMap = ref<Record<number, any[]>>({})
const expandedSlideHistory = ref<number | null>(null)
// 操作日志 & 撤销相关（高级版 - 支持100+级别和分支撤销）
const actionLog = ref<Array<{action_id: string; action_type: string; description: string; timestamp: string; undo_data?: any; branch_id?: string}>>([])
const undoStack = ref<Array<{action_id: string; action_type: string; description: string; timestamp: string; undo_data?: any}>>([])
const redoStack = ref<Array<{action_id: string; action_type: string; description: string; timestamp: string; undo_data?: any}>>([])
const actionTimeline = ref<Array<{action_id: string; action_type: string; description: string; timestamp: string; undo_data?: any; branch_id?: string}>>([])  // 完整时间线
const showTimeline = ref(false)  // 显示可视化时间线
const showBranchUndo = ref(false)  // 显示分支撤销选择器
const selectedBranchAction = ref<string | null>(null)  // 选中的分支撤销动作
const checkpoints = ref<Array<{checkpoint_id: string; name: string; type: string; created_at: string; action_count: number}>>([])  // 检查点列表
const collaborativeLocks = ref<Record<string, {user_id: string; slide_index?: number; locked_at: string}>>({})  // 协作编辑锁
const autoSaveEnabled = ref(true)
const autoSaveInterval = ref(300000) // 默认5分钟（300秒 = 300000毫秒）
const lastAutoSaveTime = ref<number | null>(null)
const lastCheckpointTime = ref<number | null>(null)
const checkpointInterval = 300000  // 5分钟检查点
const showRecoveryModal = ref(false)
const recoveryInfo = ref<{savedAt: number; state: any} | null>(null)
const showActionLog = ref(false)  // 是否显示操作日志tab
const diffData = ref<{
  version_a: string
  version_b: string
  version_a_id: string
  version_b_id: string
  diff: Array<{
    slide_index: number
    before: any
    after: any
    change_types?: string[]
    svg_a_path?: string
    svg_b_path?: string
    svg_changed?: boolean
    content_preview_a?: string
    content_preview_b?: string
    text_diff?: Array<{type: string; lines: string[]}>
  }>
  total_changes: number
  version_summary?: {
    version_a: {version_id: string; name: string; slide_count: number; created_at: string}
    version_b: {version_id: string; name: string; slide_count: number; created_at: string}
  }
}>({
  version_a: '',
  version_b: '',
  version_a_id: '',
  version_b_id: '',
  diff: [],
  total_changes: 0
})
const selectedLayout = ref('左图右文')
const selectedColorScheme = ref(0)
const selectedStyle = ref('professional')
const regeneratingSlideIndex = ref<number | null>(null)

// 存为模板相关
const showSaveTemplateModal = ref(false)
const showLocalizeModal = ref(false)
const showBatchThemeModal = ref(false)

// 批量导出弹窗
const showBatchExportModal = ref(false)
const batchExportList = ref<any[]>([])
const batchExportSelected = ref<Set<string>>(new Set())

// 存为模板相关
const batchThemeSecondary = ref('#0E42D2')
const batchThemeAccent = ref('#64D2FF')

// Localize / Translation state
const { locale: currentLocale, t } = useI18n()
const detectedSourceLocale = ref('')
const targetLocale = ref('en')
const applyRTL = ref(false)
const isLocalizing = ref(false)

// Available target locales (exclude current locale)
const availableTargetLocales = computed(() => {
  return LOCALES.filter(l => l.code !== currentLocale.value)
})

// Detect content language
const handleDetectLanguage = async () => {
  if (!taskId.value) return
  isLocalizing.value = true
  try {
    const res = await api.ppt.detectContentLanguage(taskId.value)
    if (res.data.success) {
      detectedSourceLocale.value = LOCALES.find(l => l.code === res.data.detected_locale)?.nativeName || res.data.detected_locale
    }
  } catch (e) {
    console.error('Detect language failed:', e)
    // Fallback to client-side detection
    detectedSourceLocale.value = detectLanguage(outlineText || '')
  } finally {
    isLocalizing.value = false
  }
}

// Handle localize / translate
const handleLocalize = async () => {
  if (!taskId.value || !targetLocale.value) return
  isLocalizing.value = true
  try {
    const res = await api.ppt.localize(taskId.value, {
      target_locale: targetLocale.value,
      source_locale: detectedSourceLocale.value,
      translate_content: true,
      apply_rtl: applyRTL.value || RTL_LOCALES.includes(targetLocale.value as any)
    })
    if (res.data.success) {
      showLocalizeModal.value = false
      // Reload the page with new task or notify success
      if (res.data.new_task_id) {
        router.push(`/result?taskId=${res.data.new_task_id}`)
      } else {
        window.location.reload()
      }
    }
  } catch (e) {
    console.error('Localize failed:', e)
    alert('翻译失败，请重试')
  } finally {
    isLocalizing.value = false
  }
}

const newTemplate = ref({
  name: '',
  description: '',
  sceneIndex: 0,
  styleIndex: 0,
  visibility: 'private',
  // Custom theme colors
  themePrimary: '#165DFF',
  themeSecondary: '#0E42D2',
  themeAccent: '#64D2FF'
})
// BUG修复: 从后端API加载场景/风格，不再硬编码
const scenes = ref<Array<{id: string; name: string}>>([
  { id: 'business', name: '商务' },
  { id: 'education', name: '教育' },
  { id: 'government', name: '政府' },
  { id: 'creative', name: '创意' },
  { id: 'marketing', name: '营销' }
])
const styles = ref<Array<{id: string; name: string}>>([
  { id: 'professional', name: '专业' },
  { id: 'creative', name: '创意' },
  { id: 'minimalist', name: '极简' },
  { id: 'classic', name: '经典' }
])

// 加载场景和风格从API
const loadScenesAndStyles = async () => {
  try {
    const [scenesRes, stylesRes] = await Promise.all([
      api.ppt.getScenes().catch(() => null),
      api.ppt.getStyles().catch(() => null)
    ])
    if (scenesRes?.data && Array.isArray(scenesRes.data)) {
      scenes.value = scenesRes.data
    }
    if (stylesRes?.data && Array.isArray(stylesRes.data)) {
      styles.value = stylesRes.data
    }
    console.log('[ResultView] 场景/风格已加载:', scenes.value.length, styles.value.length)
  } catch (e) {
    console.warn('[ResultView] 加载场景/风格失败，使用硬编码兜底:', e)
  }
}

async function saveAsTemplate() {
  if (!newTemplate.value.name.trim()) {
    showWarning('请填写模板名称', '模板名称不能为空')
    return
  }
  try {
    const res = await api.template.uploadTemplate({
      name: newTemplate.value.name,
      description: newTemplate.value.description,
      scene: scenes.value[newTemplate.value.sceneIndex]?.id || 'business',
      style: styles.value[newTemplate.value.styleIndex]?.id || 'professional',
      visibility: newTemplate.value.visibility,
      theme: {
        primary: newTemplate.value.themePrimary,
        secondary: newTemplate.value.themeSecondary,
        accent: newTemplate.value.themeAccent
      }
    })
    if (res.data.success) {
      const isTeam = newTemplate.value.visibility === 'team'
      if (isTeam) {
        // Share to team workspace immediately after saving
        const workspaceId = localStorage.getItem('workspace_id') || 'default'
        const userId = localStorage.getItem('rabai_user_id') || 'default'
        try {
          await api.workspace.shareTemplateToTeam(workspaceId, res.data.template_id, userId)
        } catch (e2) {
          console.warn('Failed to share to team:', e2)
        }
        showSuccess('模板已保存', `「${newTemplate.value.name}」已添加到团队模板库`)
      } else {
        showSuccess('模板已保存', `「${newTemplate.value.name}」已添加到我的模板`)
      }
      showSaveTemplateModal.value = false
    }
  } catch (e) {
    showError('保存失败', '请稍后重试')
  }
}

// R139: 分享当前PPT到团队模板库
const handleShareToTeam = async () => {
  showMoreMenu.value = false
  const workspaceId = localStorage.getItem('workspace_id') || 'default'
  const userId = localStorage.getItem('rabai_user_id') || 'default'
  if (!taskId.value) {
    showWarning('无可用PPT', '请先生成PPT后再分享到团队')
    return
  }
  // 从大纲信息构建模板数据并分享
  try {
    // 先保存为私人模板
    const res = await api.template.uploadTemplate({
      name: outline.value?.topic || `PPT_${taskId.value.slice(0, 8)}`,
      description: `分享自 ${outline.value?.topic || '演示文稿'}`,
      scene: outline.value?.scene || 'business',
      style: outline.value?.style || 'professional',
      visibility: 'private',
      theme: {
        primary: batchThemePrimary.value,
        secondary: batchThemeSecondary.value,
        accent: batchThemeAccent.value
      }
    })
    if (res.data.success) {
      await api.workspace.shareTemplateToTeam(workspaceId, res.data.template_id, userId)
      showSuccess('已分享到团队', '该PPT已保存并分享到团队模板库')
    }
  } catch (e) {
    console.error('Share to team failed:', e)
    showError('分享失败', '请稍后重试')
  }
}

// R40: 批量主题应用
const applyPresetTheme = (preset: { name: string; colors: string[] }) => {
  batchThemePrimary.value = preset.colors[0] || '#165DFF'
  batchThemeSecondary.value = preset.colors[1] || '#0E42D2'
  batchThemeAccent.value = preset.colors[2] || '#64D2FF'
}

const handleBatchApplyTheme = async () => {
  try {
    const res = await api.batch.applyTheme({
      task_ids: [taskId.value],
      theme_primary: batchThemePrimary.value,
      theme_secondary: batchThemeSecondary.value,
      theme_accent: batchThemeAccent.value
    })
    if (res.data.success) {
      showSuccess('主题已应用', `成功更新 ${res.data.updated?.length || 1} 个幻灯片`)
      showBatchThemeModal.value = false
      // 刷新预览
      await loadTaskPreview()
    }
  } catch (e) {
    showError('应用失败', (e as Error).message)
  }
}

const layoutOptions = [
  { value: '左图右文', icon: '🖼️', name: '左图右文' },
  { value: '上图下文', icon: '⬆️', name: '上图下文' },
  { value: '全图背景', icon: '🎨', name: '全图背景' },
  { value: '纯文字', icon: '📝', name: '纯文字' },
  { value: '左文右图', icon: '📖', name: '左文右图' },
  { value: '双栏', icon: '📊', name: '双栏' },
]

const colorSchemes = [
  { name: '商务蓝', colors: ['#165DFF', '#FFFFFF', '#F5F5F5'] },
  { name: '科技紫', colors: ['#667EEA', '#764BA2', '#F5F5F5'] },
  { name: '清新绿', colors: ['#34C759', '#FFFFFF', '#F0F9F0'] },
  { name: '活力橙', colors: ['#FF6B35', '#FFFFFF', '#FFF5F0'] },
  { name: '经典红', colors: ['#E53935', '#FFFFFF', '#FFEBEE'] },
  { name: '深空灰', colors: ['#1F2937', '#FFFFFF', '#F3F4F6'] },
]

const styleOptions = [
  { value: 'professional', icon: '💼', name: '专业商务' },
  { value: 'modern', icon: '🚀', name: '现代简约' },
  { value: 'creative', icon: '🎯', name: '创意时尚' },
  { value: 'academic', icon: '📚', name: '学术报告' },
]

// 保留原始生成配置（用于重新生成时保留 scene/style）
const originalScene = ref('')
const originalStyle = ref('professional')
const originalRequest = ref('')
const includeCharts = ref(false)

// 图表配置
const chartConfig = ref({
  include_charts: false,
  include_pie_chart: true,
  include_bar_chart: true,
  include_line_chart: false,
})

// PDF导出增强选项
const pdfOptions = ref({
  mode: 'slides', // slides | notes | handout
  pageSize: 'A4', // A4 | Letter | 16:9 | 4:3
  orientation: 'landscape', // portrait | landscape
  handoutLayout: '3', // 1 | 2 | 3 | 6
  notesPosition: 'below',
  notesFontSize: 10,
  watermarkEnabled: false,
  watermarkText: 'CONFIDENTIAL',
  watermarkOpacity: 0.15,
  watermarkAngle: 45,
  watermarkFontSize: 48,
  watermarkColor: '#888888',
  headerFooterEnabled: false,
  headerText: '',
  footerText: '',
  pageNumberFormat: 'Page {current} of {total}',
  headerFooterFontSize: 10,
  headerFooterColor: '#666666',
  aspectRatio: '16:9', // 16:9 | 4:3 | 1:1 | 9:16
})

const handleElementApply = (editedSlides: any) => {
  console.log('元素已更新:', editedSlides)
  triggerSignificantEditCheckpoint('元素编辑')
  alert('元素微调已保存！请下载更新后的PPT。')
}

// R118: 智能内容建议 - 应用添加的内容
const handleApplyAddition = (addition: any) => {
  console.log('应用添加的内容:', addition)
  const slideIndex = addition.slide_index
  if (slideIndex !== undefined && editableSlides.value[slideIndex]) {
    const slide = editableSlides.value[slideIndex]
    const newContent = slide.content ? slide.content + '\n\n' + addition.suggestion : addition.suggestion
    slide.content = newContent
    triggerSignificantEditCheckpoint('内容添加')
    alert('内容已添加到第 ' + (slideIndex + 1) + ' 页！')
  }
}

// 图表已生成
const handleChartGenerated = (chartData: any) => {
  console.log('图表已生成:', chartData)
  alert('图表已生成！点击"插入到幻灯片"添加到PPT中。')
}

// 插入图表到幻灯片
const handleInsertChartIntoSlide = (chartData: any) => {
  console.log('插入图表到幻灯片:', chartData)
  triggerSignificantEditCheckpoint('图表插入')
  alert('图表已插入到幻灯片！请下载查看。')
  showChartEditor.value = false
}

// 单页重生成
const regenerateSingleSlide = async (index: number) => {
  const slide = previewSlides.value[index]
  if (!slide) return
  
  regeneratingSlideIndex.value = index
  
  try {
    // 获取当前页的编辑内容（如果有）
    const editableSlide = editableSlides.value[index]
    
    const res = await api.ppt.regenerateSlide({
      taskId: taskId.value,
      slideIndex: slide.slideNum,
      scene: originalScene.value || 'business',
      style: originalStyle.value || 'professional',
      content: editableSlide?.content || '',
      layout: editableSlide?.layout || 'content',
      title: editableSlide?.title || ''
    })
    
    if (res.data.success) {
      // 更新当前页的SVG URL
      const newUrl = res.data.data?.svg_url
      if (newUrl) {
        previewSlides.value[index] = {
          ...slide,
          url: newUrl + '?t=' + Date.now() // 防止缓存
        }
        triggerSignificantEditCheckpoint('单页重生成')
        alert(`第 ${slide.slideNum} 页已更新`)
      }
    } else {
      alert(res.data.message || '重生成失败')
    }
  } catch (e) {
    console.error('单页重生成失败:', e)
    alert('重生成失败，请稍后重试')
  } finally {
    regeneratingSlideIndex.value = null
  }
}

// 应用布局选择
const applyLayout = (layout: string) => {
  selectedLayout.value = layout
}

// 应用配色选择
const applyColorScheme = (index: number) => {
  selectedColorScheme.value = index
}

// 应用风格选择
const applyStyle = (style: string) => {
  selectedStyle.value = style
}

// 应用调优并重新生成
const applyTuning = async () => {
  showLayoutPanel.value = false
  
  // 为所有页面应用新的布局选择
  const newLayout = selectedLayout.value
  // 将中文布局名转为英文（只映射后端支持的布局）
  const layoutMap: Record<string, string> = {
    '左图右文': 'left_image_right_text',
    '左文右图': 'left_text_right_image',
    '卡片': 'card',
    '双栏': 'two_column',
    '居中': 'center_radiation',
    '时间轴': 'timeline',
  }
  // 全图背景/上图下文/纯文字等暂不支持，回退到卡片布局
  const apiLayout = layoutMap[newLayout] || 'card'
  
  let updatedCount = 0
  let failedCount = 0
  
  // 更新每页的布局并重新生成
  for (let i = 0; i < previewSlides.value.length; i++) {
    const slide = previewSlides.value[i]
    const slideNum = slide.slideNum
    
    // 更新editableSlides中的布局
    if (editableSlides.value[i]) {
      editableSlides.value[i].layout = apiLayout
    }
    
    // 获取当前页的编辑内容（editableSlides可能为空，此时用slideNum作标题）
    const editableSlide = editableSlides.value[i]
    
    // 调用单页重生成API
    // 首次调用时重置_first_page_layout，确保新布局生效
    const isFirstSlide = i === 0
    try {
      const res = await api.ppt.regenerateSlide({
        taskId: taskId.value,
        slideIndex: slideNum,
        scene: originalScene.value || 'business',
        style: originalStyle.value || 'professional',
        content: editableSlide?.content || '',
        layout: apiLayout,
        title: editableSlide?.title || `第${slideNum}页`,
        // 强制使用 manual 模式 + 独立布局，确保每个 slide 用自己的 layout
        layout_mode: 'manual',
        unified_layout: false,
        reset_first_layout: isFirstSlide,
      })
      
      if (res.data.success) {
        const newUrl = res.data.data?.svg_url
        if (newUrl) {
          previewSlides.value[i] = {
            ...slide,
            url: newUrl + '?t=' + Date.now()
          }
          updatedCount++
        }
      } else {
        failedCount++
      }
    } catch (e) {
      console.error(`第${slideNum}页重生成失败:`, e)
      failedCount++
    }
    
    // 每页之间稍作延迟，避免请求过于密集
    if (i < previewSlides.value.length - 1) {
      await new Promise(r => setTimeout(r, 500))
    }
  }
  
  if (failedCount === 0) {
    showSuccess('布局更新成功', `已更新为「${newLayout}」，共${updatedCount}页`)
    triggerSignificantEditCheckpoint('布局调整')
  } else {
    showWarning('布局部分更新', `成功${updatedCount}页，失败${failedCount}页`)
  }
}

const editableSlides = ref<{
  title: string
  content: string
  layout: string
  imageUrl?: string
  // R152: Advanced Slide Notes & Annotations
  notes?: string            // 纯文本备注
  richNotes?: string        // 富文本备注（HTML格式）
  speakerNotes?: string     // 演讲者私有备注
  annotations?: any[]       // 演示标注数据
  stickyNotes?: any[]       // 便签协作数据
  presenterNotes?: string   // 兼容旧字段
  masterId?: string          // 关联的母版ID
  animation?: SlideAnimation // 自定义动画
}[]>([])

// R142: 切换编辑模式
const toggleEditMode = async () => {
  if (!isEditMode.value) {
    // 进入编辑模式，初始化可编辑数据
    await initEditableSlides()
    focusedSlideIndex.value = 0 // 重置焦点幻灯片索引
  }
  isEditMode.value = !isEditMode.value
}

// R142: 编辑模式键盘导航
const handleEditModeKeydown = (e: KeyboardEvent) => {
  // Escape: 退出编辑模式
  if (e.key === 'Escape') {
    e.preventDefault()
    isEditMode.value = false
    return
  }
  // Ctrl+S / Cmd+S: 保存并重新生成
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    if (!isRegenerating.value) {
      regenerateWithEdits()
    }
    return
  }
}

// R142: 幻灯片字段键盘导航 - 方向键在幻灯片间移动焦点
const handleSlideFieldKeydown = (e: KeyboardEvent, slideIndex: number, field: string) => {
  const maxSlides = editableSlides.value.length
  const fields = ['title', 'content', 'notes'] as const
  const fieldIndex = fields.indexOf(field as any)

  if (e.key === 'ArrowDown' && !e.shiftKey) {
    // ArrowDown: 移动到下一个幻灯片
    e.preventDefault()
    if (slideIndex < maxSlides - 1) {
      focusedSlideIndex.value = slideIndex + 1
      const nextFieldId = `slide-${fields[fieldIndex]}-${slideIndex + 1}`
      nextTick(() => {
        const el = document.getElementById(nextFieldId.replace(`-${fields[fieldIndex]}-`, `-${field}-`))
        const actualEl = document.getElementById(`slide-${field}-${slideIndex + 1}`)
        if (actualEl) actualEl.focus()
      })
    }
    return
  }
  if (e.key === 'ArrowUp' && !e.shiftKey) {
    // ArrowUp: 移动到上一个幻灯片
    e.preventDefault()
    if (slideIndex > 0) {
      focusedSlideIndex.value = slideIndex - 1
      nextTick(() => {
        const actualEl = document.getElementById(`slide-${field}-${slideIndex - 1}`)
        if (actualEl) actualEl.focus()
      })
    }
    return
  }
  if (e.key === 'ArrowRight') {
    // ArrowRight: 移动到下一个字段
    e.preventDefault()
    const nextField = fields[Math.min(fieldIndex + 1, fields.length - 1)]
    const targetId = `slide-${nextField}-${slideIndex}`
    nextTick(() => {
      const el = document.getElementById(targetId)
      if (el) el.focus()
    })
    return
  }
  if (e.key === 'ArrowLeft') {
    // ArrowLeft: 移动到上一个字段
    e.preventDefault()
    const prevField = fields[Math.max(fieldIndex - 1, 0)]
    const targetId = `slide-${prevField}-${slideIndex}`
    nextTick(() => {
      const el = document.getElementById(targetId)
      if (el) el.focus()
    })
    return
  }
  // Ctrl+Enter: 重新生成当前幻灯片
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault()
    regenerateSingleSlide(slideIndex)
    return
  }
}

// R142: 字号调节 (A-/A+)
const adjustFontSize = (delta: number) => {
  const newSize = currentSlideFontSize.value + delta
  if (newSize >= 12 && newSize <= 32) {
    currentSlideFontSize.value = newSize
    // 应用到 document root（与 useAccessibility 的 --base-font-size 机制一致）
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--result-font-size', `${newSize}px`)
    }
  }
}

// 初始化可编辑的幻灯片数据
const initEditableSlides = async () => {
  // 布局名标准化映射（中文/旧格式 → API格式）
  const normalizeLayout = (layout: string): string => {
    const map: Record<string, string> = {
      '标题页': 'title',
      '内容页': 'content',
      '左图右文': 'left_image_right_text',
      '左文右图': 'left_text_right_image',
      '上图下文': 'top_image_bottom_text',
      '全图背景': 'full_background',
      '纯文字': 'text_only',
      '双栏': 'two_column',
      '卡片': 'card',
      '居中': 'center_radiation',
      '时间轴': 'timeline',
      'image-left': 'left_image_right_text',
      'image-right': 'left_text_right_image',
      'two-column': 'two_column',
    }
    return map[layout] || layout || 'content'
  }

  // 优先从 localStorage（以当前任务ID为key）加载
  const taskBasedKey = `ppt_outline_${taskId.value}`
  const savedOutlineByTask = localStorage.getItem(taskBasedKey)
  const savedOutline = localStorage.getItem('ppt_outline')

  // 优先使用与当前任务ID关联的outline
  const outlineToUse = savedOutlineByTask || savedOutline

  if (outlineToUse) {
    try {
      const outline = JSON.parse(outlineToUse)
      if (outline.slides && outline.slides.length > 0) {
        editableSlides.value = outline.slides.map((s: any) => ({
          ...s,
          layout: normalizeLayout(s.layout),
          masterId: s.masterId || 'master-default'
        }))
        // BUG修复: 验证并同步数量
        if (editableSlides.value.length !== slideCount.value) {
          console.warn(`[initEditableSlides] localStorage count mismatch: editableSlides=${editableSlides.value.length}, slideCount=${slideCount.value}. Syncing...`)
          if (editableSlides.value.length > slideCount.value) {
            editableSlides.value = editableSlides.value.slice(0, slideCount.value)
          } else {
            while (editableSlides.value.length < slideCount.value) {
              const idx = editableSlides.value.length
              editableSlides.value.push({
                title: `第 ${idx + 1} 页标题`,
                content: '内容要点1\n内容要点2\n内容要点3',
                layout: idx === 0 ? 'title' : 'content'
              })
            }
          }
        }
        return
      }
    } catch (e) {
      console.warn('解析localStorage中的outline失败:', e)
    }
  }

  // 如果localStorage没有或无效，尝试从API获取
  if (taskId.value) {
    try {
      const res = await api.ppt.getOutline(taskId.value)
      if (res.data && res.data.slides && res.data.slides.length > 0) {
        editableSlides.value = res.data.slides.map((s: any) => ({
          ...s,
          layout: normalizeLayout(s.layout),
          masterId: s.masterId || 'master-default'
        }))
        // 缓存到localStorage
        localStorage.setItem(taskBasedKey, JSON.stringify(res.data))
        // BUG修复: 验证并同步数量
        if (editableSlides.value.length !== slideCount.value) {
          console.warn(`[initEditableSlides] API loaded count mismatch: editableSlides=${editableSlides.value.length}, slideCount=${slideCount.value}. Syncing...`)
          if (editableSlides.value.length > slideCount.value) {
            editableSlides.value = editableSlides.value.slice(0, slideCount.value)
          } else {
            while (editableSlides.value.length < slideCount.value) {
              const idx = editableSlides.value.length
              editableSlides.value.push({
                title: `第 ${idx + 1} 页标题`,
                content: '内容要点1\n内容要点2\n内容要点3',
                layout: idx === 0 ? 'title' : 'content'
              })
            }
          }
        }
        return
      }
    } catch (e) {
      console.warn('从API加载outline失败:', e)
    }
  }

  // 生成默认的幻灯片结构
  editableSlides.value = Array.from({ length: slideCount.value }, (_, i) => ({
    title: i === 0 ? '封面标题' : `第 ${i + 1} 页标题`,
    content: i === 0 ? '副标题\n演讲者信息' : '内容要点1\n内容要点2\n内容要点3',
    layout: i === 0 ? 'title' : 'content',
    masterId: 'master-default'
  }))
}

// 添加新页面
const addEditSlide = () => {
  editableSlides.value.push({
    title: '',
    content: '',
    layout: 'content'
  })
}

// 删除幻灯片
const deleteSlide = (index: number) => {
  if (editableSlides.value.length <= 1) {
    alert('至少需要保留一页幻灯片')
    return
  }
  editableSlides.value.splice(index, 1)
  triggerSignificantEditCheckpoint('删除幻灯片')
}

// 上移幻灯片
const moveSlideUp = (index: number) => {
  if (index === 0) return
  const temp = editableSlides.value[index]
  editableSlides.value[index] = editableSlides.value[index - 1]
  editableSlides.value[index - 1] = temp
}

// 下移幻灯片
const moveSlideDown = (index: number) => {
  if (index === editableSlides.value.length - 1) return
  const temp = editableSlides.value[index]
  editableSlides.value[index] = editableSlides.value[index + 1]
  editableSlides.value[index + 1] = temp
}

// 预览单页（调用 regenerateSlide 不跳转结果页）
const previewSlide = async (index: number) => {
  const slide = editableSlides.value[index]
  if (!slide) return
  
  // 映射前端布局名到API布局名
  const layoutMap: Record<string, string> = {
    '左图右文': 'left_image_right_text',
    '左文右图': 'left_text_right_image',
    '卡片': 'card',
    '双栏': 'two_column',
    '居中': 'center_radiation',
    '时间轴': 'timeline',
    'title': 'title',
    'content': 'content',
    'left_image_right_text': 'left_image_right_text',
    'left_text_right_image': 'left_text_right_image',
    'two_column': 'two_column',
    'card': 'card',
  }
  const apiLayout = layoutMap[slide.layout] || 'content'
  
  try {
    const res = await api.ppt.regenerateSlide({
      taskId: taskId.value,
      slideIndex: index + 1,
      scene: originalScene.value || 'business',
      style: originalStyle.value || 'professional',
      content: typeof slide.content === 'string' 
        ? slide.content.split('\n').filter(l => l.trim()).join('\n') 
        : (Array.isArray(slide.content) ? slide.content.join('\n') : ''),
      layout: apiLayout,
      title: slide.title || `第${index + 1}页`,
      layout_mode: 'manual',
      unified_layout: false,
      reset_first_layout: index === 0,
    })
    if (res.data.success && res.data.data?.svg_url) {
      // 更新 previewSlides 中对应页的 URL
      if (previewSlides.value[index]) {
        previewSlides.value[index] = {
          ...previewSlides.value[index],
          url: res.data.data.svg_url + '?t=' + Date.now()
        }
      }
    }
  } catch (e) {
    console.error('预览失败:', e)
  }
}

// Voice dictation for mobile slide content editing
const startDictationForField = async (slideIndex: number, field: 'title' | 'content' | 'notes') => {
  if (dictationActive.value) {
    stopDictation()
    dictationActive.value = false
    dictatingSlideIndex.value = null
    dictatingField.value = null
    return
  }

  const success = await startDictation()
  if (success) {
    dictationActive.value = true
    dictatingSlideIndex.value = slideIndex
    dictatingField.value = field
  }
}

// Watch for dictation state changes and inject results into the active field
watch(isDictating, (listening) => {
  if (listening) return
  // Dictation just stopped - inject the transcript into the active field
  if (dictatingSlideIndex.value === null || dictatingField.value === null) return
  const idx = dictatingSlideIndex.value
  const field = dictatingField.value
  const slide = editableSlides.value[idx]
  if (!slide) return
  const text = stopDictation() // also stops recognition
  if (text) {
    if (field === 'title') {
      slide.title = (slide.title || '') + text
    } else if (field === 'content') {
      slide.content = (slide.content || '') + text
    } else if (field === 'notes') {
      slide.presenterNotes = (slide.presenterNotes || '') + text
    }
  }
  dictationActive.value = false
  dictatingSlideIndex.value = null
  dictatingField.value = null
})

watch(dictationError, (err) => {
  if (err) {
    showError(err)
  }
})

// 图片上传 refs
const imageUploadRefs = ref<HTMLElement[]>([])

// 触发图片上传
const triggerImageUpload = (index: number) => {
  const refs = imageUploadRefs.value
  if (refs && refs[index]) {
    (refs[index] as HTMLInputElement).click()
  }
}

// 处理图片上传
const handleImageUpload = async (index: number, event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    // Compress image if performance mode is on or file > 1MB
    const fileToUpload = (isPerfMode.value || file.size > 1024 * 1024)
      ? await compressImage(file)
      : file

    if (fileToUpload !== file) {
      console.log(`图片压缩: ${(file.size / 1024).toFixed(0)}KB → ${(fileToUpload.size / 1024).toFixed(0)}KB`)
    }

    const formData = new FormData()
    formData.append('file', fileToUpload)

    const res = await fetch(`/api/v1/ppt/image/${taskId.value}/${index + 1}/upload`, {
      method: 'POST',
      body: formData
    })

    const data = await res.json()
    if (data.success) {
      // 更新 editableSlides 中的图片
      if (editableSlides.value[index]) {
        editableSlides.value[index].imageUrl = data.image_url
      }
      triggerSignificantEditCheckpoint('图片上传')
      showSuccess('图片上传成功', '图片已更新到幻灯片')
      // 刷新预览
      await previewSlide(index)
    } else {
      showError('图片上传失败', data.detail || '请重试')
    }
  } catch (e) {
    console.error('图片上传失败:', e)
    showError('图片上传失败', '请检查网络后重试')
  }

  // 清空 input
  input.value = ''
}

// 重新生成单页AI图片
const regenerateSlideImage = async (index: number) => {
  const slide = editableSlides.value[index]
  if (!slide) return

  try {
    const res = await api.ppt.updateSlideImage({
      taskId: taskId.value,
      slideIndex: index + 1,
      action: 'regenerate'
    })

    if (res.data.success) {
      // 更新 editableSlides 中的图片
      if (editableSlides.value[index]) {
        editableSlides.value[index].imageUrl = res.data.image_url
      }
      showSuccess('图片生成成功', '幻灯片图片已更新')
      // 刷新预览
      await previewSlide(index)
    } else {
      showError('图片生成失败', res.data.message || '请重试')
    }
  } catch (e) {
    console.error('图片生成失败:', e)
    showError('图片生成失败', '请稍后重试')
  }
}

// 移除单页图片
const removeSlideImage = async (index: number) => {
  if (!confirm('确定要移除这张图片吗？')) return

  try {
    const res = await api.ppt.updateSlideImage({
      taskId: taskId.value,
      slideIndex: index + 1,
      action: 'remove'
    })

    if (res.data.success) {
      // 清除 editableSlides 中的图片
      if (editableSlides.value[index]) {
        editableSlides.value[index].imageUrl = undefined
      }
      alert('图片已移除')
      // 刷新预览
      await previewSlide(index)
    } else {
      alert(res.data.message || '移除失败')
    }
  } catch (e) {
    console.error('移除图片失败:', e)
    alert('移除图片失败')
  }
}

// 使用编辑的内容重新生成PPT
const regenerateWithEdits = async () => {
  isRegenerating.value = true

  try {
    // 自动创建快照（重新生成前）
    if (taskId.value) {
      try {
        await api.ppt.createSnapshot(taskId.value, '重新生成前快照')
        await loadVersionHistory()
      } catch (e) {
        console.warn('自动创建快照失败:', e)
      }
    }
    // 构建大纲数据
    const outlineData = {
      slides: editableSlides.value.map(slide => ({
        title: slide.title,
        content: slide.content,
        layout: slide.layout,
        slide_type: slide.layout === 'title' ? 'title' : 'content',
      })),
      style: 'professional',
      theme: 'blue'
    }

    // 保存编辑后的大纲到 localStorage（备份）
    localStorage.setItem('ppt_outline', JSON.stringify(outlineData))

    // 构建 pre_generated_slides
    // BUG修复: content 应该是数组格式，不是带换行的字符串
    const preGeneratedSlides = editableSlides.value.map(slide => ({
      title: slide.title,
      content: typeof slide.content === 'string'
        ? slide.content.split('\n').filter(line => line.trim())
        : slide.content,
      slide_type: slide.layout === 'title' ? 'title' : 'content',
      layout: slide.layout,
    }))

    // Step 1: 先保存大纲到服务器（旧任务ID，留作备份）
    if (taskId.value) {
      await api.ppt.saveOutline(taskId.value, outlineData)
      console.log('✅ 大纲已保存到服务器（旧任务ID）')
    }

    // Step 2: 调用后端API创建新任务
    const response = await api.ppt.createTask({
      user_request: originalRequest.value || '用户重新编辑大纲并生成PPT',
      slide_count: preGeneratedSlides.length,
      scene: originalScene.value || 'business',
      style: originalStyle.value || 'professional',
      pre_generated_slides: preGeneratedSlides,
      include_charts: includeCharts.value,
    })

    const newTaskId = response.data.task_id

    // Step 3: 关键修复！用新任务ID保存大纲（这样结果页能通过 getOutline(new_task_id) 获取）
    await api.ppt.saveOutline(newTaskId, outlineData)
    console.log('✅ 大纲已保存到服务器（新任务ID）')

    // Step 4: 更新localStorage（以新任务ID为key存储，结果页会优先从API获取）
    localStorage.setItem(`ppt_outline_${newTaskId}`, JSON.stringify(outlineData))
    localStorage.setItem('ppt_outline', JSON.stringify(outlineData))

    // 跳转到生成页面，使用新任务ID
    router.push({
      path: '/generating',
      query: {
        taskId: newTaskId
      }
    })
  } catch (error) {
    console.error('重新生成失败:', error)
    showError('重新生成失败', '请稍后重试')
    isRegenerating.value = false
  }
}

// 导出格式选项
type ExportFormat = 'pptx' | 'pdf' | 'png' | 'jpg' | 'odp' | 'keynote' | 'mp3'
const selectedFormat = ref<ExportFormat>('pptx')
const isExporting = ref(false)

// 导出质量设置
type ExportQuality = 'standard' | 'high' | 'ultra'
const selectedQuality = ref<ExportQuality>('high')

// 自定义比例设置
type AspectRatio = '16:9' | '4:3' | '1:1' | '9:16'
const selectedAspectRatio = ref<AspectRatio>('16:9')

// 导出进度
const exportProgress = ref(0)
const exportStatusText = ref('')

// 导出历史记录（最近10条）
interface ExportHistoryItem {
  id: string
  taskId: string
  format: string
  quality: string
  fileName: string
  fileSize: string
  timestamp: string
  slideCount: number
}
const exportHistory = ref<ExportHistoryItem[]>([])

const loadExportHistory = () => {
  try {
    const saved = localStorage.getItem(`export_history_${taskId.value}`)
    if (saved) {
      exportHistory.value = JSON.parse(saved)
    }
  } catch (e) {
    console.warn('加载导出历史失败:', e)
  }
}

const addExportHistory = (format: string, quality: string, fileName: string, fileSize: string) => {
  const item: ExportHistoryItem = {
    id: Date.now().toString(),
    taskId: taskId.value,
    format,
    quality,
    fileName,
    fileSize,
    timestamp: new Date().toISOString(),
    slideCount: slideCount.value
  }
  exportHistory.value.unshift(item)
  // 只保留最近10条
  if (exportHistory.value.length > 10) {
    exportHistory.value = exportHistory.value.slice(0, 10)
  }
  try {
    localStorage.setItem(`export_history_${taskId.value}`, JSON.stringify(exportHistory.value))
  } catch (e) {
    console.warn('保存导出历史失败:', e)
  }
}

const formatExportTime = (isoString: string): string => {
  if (!isoString) return ''
  try {
    const date = new Date(isoString)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return isoString
  }
}

const formatClipboardTime = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return new Date(timestamp).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

const downloadExportHistoryItem = (item: ExportHistoryItem) => {
  // 根据历史记录重新触发导出
  const formatMap: Record<string, ExportFormat> = {
    'PPTX': 'pptx',
    'PDF': 'pdf',
    'PNG': 'png',
    'JPG': 'jpg'
  }
  selectedFormat.value = formatMap[item.format] || 'pptx'
  const qualityMap: Record<string, ExportQuality> = {
    '720p': 'standard',
    '1080p': 'high',
    '4K': 'ultra'
  }
  selectedQuality.value = qualityMap[item.quality] || 'high'
  showExportMenu.value = true
}

const exportFormats = [
  { id: 'pptx', name: 'PPTX', icon: '📊', desc: 'PowerPoint演示文稿', ext: '.pptx', quality: true },
  { id: 'pdf', name: 'PDF', icon: '📕', desc: '便携式文档格式', ext: '.pdf', quality: true },
  { id: 'png', name: 'PNG', icon: '🖼️', desc: 'PNG高清图片', ext: '.png', quality: true },
  { id: 'jpg', name: 'JPG', icon: '📷', desc: 'JPEG图片', ext: '.jpg', quality: true },
  { id: 'odp', name: 'ODP', icon: '📗', desc: 'OpenDocument演示文稿', ext: '.odp', quality: false },
  { id: 'keynote', name: 'Keynote', icon: '🍎', desc: 'Apple Keynote演示文稿', ext: '.key', quality: false },
  { id: 'mp3', name: 'MP3', icon: '🎧', desc: '音频叙述', ext: '.mp3', quality: false },
  { id: 'google-slides', name: 'Google Slides', icon: '📽️', desc: '导出到 Google Slides', ext: '', quality: false, platform: true },
  { id: 'notion', name: 'Notion', icon: '📒', desc: '导出到 Notion', ext: '', quality: false, platform: true }
]

const qualityOptions = [
  { id: 'standard', name: '720p', desc: '标准演示', size: '约 2MB', width: 1280, height: 720 },
  { id: 'high', name: '1080p', desc: '高清展示', size: '约 5MB', width: 1920, height: 1080 },
  { id: 'ultra', name: '4K', desc: '超清打印', size: '约 15MB', width: 3840, height: 2160 }
]

// 分辨率映射
const qualityResolutions: Record<ExportQuality, { width: number; height: number }> = {
  standard: { width: 1280, height: 720 },
  high: { width: 1920, height: 1080 },
  ultra: { width: 3840, height: 2160 }
}

const handleExport = () => {
  switch (selectedFormat.value) {
    case 'pptx':
      handleDownload()
      break
    case 'pdf':
      handleExportPDF()
      break
    case 'png':
    case 'jpg':
      if (previewSlides.value.length === 0) {
        alert('请等待预览加载完成')
        return
      }
      handleExportImages()
      break
    case 'odp':
      handleExportOdp()
      break
    case 'keynote':
      handleExportKeynote()
      break
    case 'mp3':
      handleExportMp3()
      break
    case 'google-slides':
      handleExportGoogleSlides()
      break
    case 'notion':
      handleExportNotion()
      break
  }
}



// 演示模式使用的幻灯片数据（从真实预览数据获取）
const presentationSlides = computed(() => {
  if (previewSlides.value && previewSlides.value.length > 0) {
    return previewSlides.value.map((s, idx) => ({
      title: `第 ${s.slideNum} 页`,
      content: '',
      background: '#ffffff',
      svgUrl: s.url,  // 真实 SVG URL
      presenterNotes: editableSlides.value[idx]?.presenterNotes || ''
    }))
  }
  return []
})

// 检查并加载收藏状态
const checkFavorite = () => {
  const saved = localStorage.getItem('ppt_history')
  if (saved) {
    const historyList = JSON.parse(saved)
    const item = historyList.find((h: any) => h.taskId === taskId.value)
    if (item) {
      isFavorite.value = item.favorite || false
    }
  }
}

// 切换收藏状态
const toggleFavorite = () => {
  const saved = localStorage.getItem('ppt_history')
  if (saved) {
    const historyList = JSON.parse(saved)
    const index = historyList.findIndex((h: any) => h.taskId === taskId.value)
    if (index > -1) {
      historyList[index].favorite = !historyList[index].favorite
      isFavorite.value = historyList[index].favorite
      localStorage.setItem('ppt_history', JSON.stringify(historyList))
      if (isFavorite.value) {
        showSuccess('已收藏', 'PPT已添加到收藏列表')
      } else {
        showInfo('已取消收藏', 'PPT已从收藏列表移除')
      }
    }
  }
}

// BUG修复: 预览图片加载错误处理
const onPreviewError = (event: Event, slideNum: number) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
  previewErrors.value.add(slideNum)
  console.warn(`Slide ${slideNum} 预览加载失败`)
}

// 加载预览（调用真实API获取SVG预览）
const loadPreview = async () => {
  if (!taskId.value) return
  // 清空之前的加载错误
  previewErrors.value.clear()
  previewLoadFailed.value = false
  previewLoaded.value = false

  try {
    const response = await api.ppt.getTaskPreview(taskId.value)
    if (response.data && response.data.slides) {
      previewSlides.value = response.data.slides.map((s: any) => ({
        url: s.url,
        slideNum: s.slide_num
      }))
    }
  } catch (e) {
    console.warn('预览加载失败:', e)
    previewLoadFailed.value = true
  } finally {
    previewLoaded.value = true
    // R149: Set up IntersectionObserver for lazy loading preview images
    setupPreviewObserver()
  }
}

// R149: Get cached preview URL or original URL
const getCachedPreviewUrl = (slide: { url: string; slideNum: number }): string => {
  const cached = getCached(taskId.value, slide.slideNum, { url: slide.url })
  return cached || slide.url
}

// R149: Mark preview as loaded
const onPreviewLoaded = (slideNum: number) => {
  loadedPreviews.value.add(slideNum)
}

// R149: Set up IntersectionObserver for lazy loading preview images
const setupPreviewObserver = () => {
  if (previewObserver) {
    previewObserver.disconnect()
    previewObserver = null
  }
  if (!('IntersectionObserver' in window)) {
    // Fallback: load all previews immediately
    previewSlides.value.forEach(slide => visiblePreviewSlides.value.add(slide.slideNum))
    return
  }
  previewObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        const slideNum = parseInt(entry.target.getAttribute('data-slide-num') || '0', 10)
        if (entry.isIntersecting) {
          visiblePreviewSlides.value.add(slideNum)
          // Cache the loaded URL for future use
          const slide = previewSlides.value.find(s => s.slideNum === slideNum)
          if (slide) {
            setCached(taskId.value, slideNum, { url: slide.url }, slide.url, 0)
          }
        }
      })
    },
    { rootMargin: '100px', threshold: 0.1 }
  )
  // Observe all preview slide elements
  const observer = previewObserver
  nextTick(() => {
    const container = previewGridRef.value
    if (container) {
      const slides = container.querySelectorAll('.preview-slide[data-slide-num]')
      slides.forEach(el => observer.observe(el))
    }
  })
}

// R149: Setup lazy loading ref on each preview slide element
const setupPreviewLazy = (el: HTMLElement | null, slideNum: number) => {
  if (el) {
    el.setAttribute('data-slide-num', String(slideNum))
    if (previewObserver) {
      previewObserver.observe(el)
    }
  }
}

// 加载任务状态
const loadStatus = async () => {
  if (!taskId.value) {
    status.value = 'failed'
    errorMessage.value = '任务ID不存在'
    return
  }

  try {
    const response = await api.ppt.getTask(taskId.value)
    const data = response.data

    status.value = data.status

    if (data.status === 'completed' && data.result) {
      slideCount.value = data.result.slide_count || 0
      // 显示实际文件大小
      const bytes = data.result.file_size || 0
      fileSize.value = formatSize(bytes)
      // 保留原始生成配置
      originalScene.value = data.result.scene || data.scene || 'business'
      originalStyle.value = data.result.style || data.style || 'professional'
      includeCharts.value = data.result.include_charts || false
      // 保留原始用户需求（用于重新生成）
      originalRequest.value = data.user_request || ''
      // 同步到图表配置
      chartConfig.value.include_charts = includeCharts.value

      // 保存到历史记录（如果不在历史中则添加）
      const saved = localStorage.getItem('ppt_history')
      const historyList: any[] = saved ? JSON.parse(saved) : []
      const exists = historyList.some((h: any) => h.taskId === taskId.value)
      if (!exists) {
        historyList.unshift({
          taskId: taskId.value,
          title: data.user_request?.slice(0, 50) || '未命名PPT',
          request: data.user_request || '',
          slideCount: data.result.slide_count || 0,
          style: data.result.style || data.style || 'professional',
          createdAt: new Date().toISOString(),
          favorite: false,
          tags: []
        })
        localStorage.setItem('ppt_history', JSON.stringify(historyList))
      }

      // Trigger push notification for generation complete
      const taskTitle = data.user_request?.slice(0, 30) || 'PPT 生成完成'
      notifyGenerationComplete(taskId.value, taskTitle)
    } else if (data.status === 'failed') {
      errorMessage.value = data.error?.message || '未知错误'
    }
  } catch (error: any) {
    // 429 限流不算失败，只是暂时不可用
    if (error?.response?.status === 429) {
      errorMessage.value = '服务器繁忙，请稍后刷新页面'
      // 不改变 status，保留当前状态
      return
    }
    status.value = 'failed'
    errorMessage.value = '加载失败，请重试'
  }
}

// 格式化文件大小
const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// 下载 — 支持密码保护和生物认证
const handleDownload = async () => {
  if (!taskId.value || isExporting.value) return

  // Pre-flight security check
  try {
    const configRes = await api.security.getConfig(taskId.value) as any
    const cfg = configRes.data

    // If password or biometric is required, show the unlock modal
    if (cfg.has_password || cfg.biometric_required || cfg.has_ip_restriction) {
      securityDownloadPassword.value = ''
      showSecurityDownloadModal.value = true
      // Store security config for modal to use
      securityConfig.value = cfg
      securityBiometricRequired.value = cfg.biometric_required
      return
    }
  } catch (e) {
    // If security check fails (e.g. not logged in), proceed without security
    console.warn('Security check skipped:', e)
  }

  await doDownload()
}

const doDownload = async (password = '') => {
  if (!taskId.value || isExporting.value) return

  isExporting.value = true
  exportProgress.value = 0
  exportStatusText.value = '正在准备...'
  showExportMenu.value = false
  showSecurityDownloadModal.value = false

  try {
    const qualityParams: Record<string, any> = {
      quality: selectedQuality.value,
      dpi: selectedQuality.value === 'ultra' ? 300 : (selectedQuality.value === 'high' ? 150 : 96)
    }
    if (password) qualityParams.password = password

    exportStatusText.value = '正在下载...'
    exportProgress.value = 30

    const response = await api.ppt.downloadPpt(taskId.value, qualityParams)

    const qualitySuffix = selectedQuality.value === 'standard' ? '' : `_${selectedQuality.value}`
    const qualityName = selectedQuality.value === 'ultra' ? '4K' : selectedQuality.value === 'high' ? '1080p' : '720p'

    exportStatusText.value = '正在保存...'
    exportProgress.value = 70

    const fileName = `presentation_${taskId.value}${qualitySuffix}.pptx`
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    addExportHistory('PPTX', qualityName, fileName, formatSize(response.data.size || 0))

    exportProgress.value = 100
    exportStatusText.value = '导出完成!'
    showSuccess('下载成功', `PPT已保存为 ${fileName}`)
  } catch (error: any) {
    console.error('下载失败:', error)
    const errData = error?.response?.data
    if (errData?.error === 'PASSWORD_REQUIRED') {
      showError('密码错误', '请输入正确的密码')
      securityDownloadPassword.value = ''
      showSecurityDownloadModal.value = true
      isExporting.value = false
      return
    } else if (errData?.error === 'BIOMETRIC_REQUIRED') {
      showError('需要生物认证', '请使用生物认证解锁')
      showSecurityDownloadModal.value = true
      isExporting.value = false
      return
    } else if (errData?.error === 'IP_NOT_ALLOWED') {
      showError('IP限制', '您的IP地址不在允许范围内')
      isExporting.value = false
      return
    }
    showError('下载失败', '请检查网络后重试')
  } finally {
    setTimeout(() => {
      isExporting.value = false
      exportProgress.value = 0
      exportStatusText.value = ''
    }, 1500)
  }
}

const handleSecurityDownload = async () => {
  const pw = securityDownloadPassword.value
  await doDownload(pw)
}

// 重试
const handleRetry = () => {
  router.push('/create')
}

// 新建
const handleNew = () => {
  router.push('/create')
}

// 导出 PDF
const handleExportPDF = async () => {
  if (isExporting.value) return

  isExporting.value = true
  exportProgress.value = 0
  exportStatusText.value = '正在准备...'
  showExportMenu.value = false

  try {
    exportStatusText.value = '正在转换PDF...'
    exportProgress.value = 10

    // 使用增强PDF导出API
    const pdfOpts = pdfOptions.value
    const exportPayload = {
      mode: pdfOpts.mode,
      page_size: pdfOpts.pageSize,
      orientation: pdfOpts.orientation,
      handout_layout: pdfOpts.handoutLayout,
      notes_position: pdfOpts.notesPosition,
      notes_font_size: pdfOpts.notesFontSize,
      watermark_enabled: pdfOpts.watermarkEnabled,
      watermark_text: pdfOpts.watermarkText,
      watermark_opacity: parseFloat(pdfOpts.watermarkOpacity),
      watermark_angle: parseInt(pdfOpts.watermarkAngle),
      watermark_font_size: parseInt(pdfOpts.watermarkFontSize),
      watermark_color: pdfOpts.watermarkColor,
      header_footer_enabled: pdfOpts.headerFooterEnabled,
      header_text: pdfOpts.headerText,
      footer_text: pdfOpts.footerText,
      page_number_format: pdfOpts.pageNumberFormat,
      header_footer_font_size: parseInt(pdfOpts.headerFooterFontSize),
      header_footer_color: pdfOpts.headerFooterColor,
      theme: exportTheme.value,
      aspect_ratio: selectedAspectRatio.value,
    }

    exportProgress.value = 20

    // 调用增强PDF导出API
    const apiBase = window.location.origin
    const response = await fetch(`${apiBase}/api/v1/ppt/export/enhanced-pdf/${taskId.value}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exportPayload),
    }).catch(() => null)

    if (response && response.ok) {
      exportStatusText.value = '正在下载...'
      exportProgress.value = 70

      const blob = await response.blob()
      const modeLabel = pdfOpts.mode === 'notes' ? '备注' : pdfOpts.mode === 'handout' ? `讲义${pdfOpts.handoutLayout}up` : '幻灯片'
      const fileName = `presentation_${taskId.value}_${modeLabel}.pdf`
      
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      // 记录到导出历史
      const sizeLabel = pdfOpts.pageSize
      addExportHistory('PDF', `${modeLabel} ${sizeLabel}`, fileName, formatSize(blob.size || 0))

      exportProgress.value = 100
      exportStatusText.value = '导出完成!'
    } else {
      // 后端API不可用，降级到旧版API
      exportStatusText.value = '使用兼容模式...'
      exportProgress.value = 30
      const legacyResponse = await api.ppt.exportPdf(taskId.value).catch(() => null)
      
      if (legacyResponse) {
        exportStatusText.value = '正在下载...'
        exportProgress.value = 70
        const fileName = `presentation_${taskId.value}.pdf`
        const url = window.URL.createObjectURL(new Blob([legacyResponse.data]))
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        addExportHistory('PDF', '标准', fileName, formatSize(legacyResponse.data.size || 0))
        exportProgress.value = 100
        exportStatusText.value = '导出完成!'
      } else {
        // 最终降级到浏览器打印
        exportViaPrint()
      }
    }
  } catch (error) {
    console.error('PDF导出失败，使用打印替代:', error)
    exportViaPrint()
  } finally {
    setTimeout(() => {
      isExporting.value = false
      exportProgress.value = 0
      exportStatusText.value = ''
    }, 1500)
  }
}

// 通过浏览器打印导出PDF
const exportViaPrint = () => {
  const slides = previewSlides.value

  // 创建打印窗口
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('请允许弹出窗口以导出PDF')
    return
  }

  // 生成打印HTML，使用真实SVG图片
  const slidesHtml = slides.map((slide, i) => `
    <div class="slide-page" style="page-break-after: always;">
      <img src="${slide.url}" alt="Slide ${i + 1}" style="width: 100%; height: auto;" />
    </div>
  `).join('')

  const printHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>PPT导出 - ${taskId.value}</title>
      <style>
        body { margin: 0; padding: 20px; font-family: sans-serif; }
        .slide-page { width: 100%; max-width: 960px; margin: 0 auto 20px; }
        img { width: 100%; height: auto; display: block; }
        @media print {
          .slide-page { page-break-after: always; margin: 0; }
        }
      </style>
    </head>
    <body>
      ${slidesHtml}
      <script>window.onload = () => { window.print(); };<\/script>
    </body>
    </html>
  `

  printWindow.document.write(printHtml)
  printWindow.document.close()
}

// R92: 批量导出 - 导出当前PPT为ZIP（调用后端批量导出API）
// 打开批量导出弹窗
const handleBatchExport = () => {
  showExportMenu.value = false
  // 加载历史记录
  try {
    const saved = localStorage.getItem('ppt_history')
    const historyList: any[] = saved ? JSON.parse(saved) : []
    // 只保留有 taskId 的项目，且不超过20条
    batchExportList.value = historyList.filter((h: any) => h.taskId).slice(0, 20)
    // 默认选中当前PPT
    batchExportSelected.value = new Set([taskId.value])
  } catch (e) {
    batchExportList.value = []
    batchExportSelected.value = new Set([taskId.value])
  }
  showBatchExportModal.value = true
}

// 切换批量导出选项
const toggleBatchExportItem = (taskId: string) => {
  if (batchExportSelected.value.has(taskId)) {
    batchExportSelected.value.delete(taskId)
  } else {
    batchExportSelected.value.add(taskId)
  }
}

// 执行批量导出
const doBatchExport = async () => {
  if (batchExportSelected.value.size === 0) return
  showBatchExportModal.value = false
  try {
    const taskIds = Array.from(batchExportSelected.value)
    const blob = await api.batch.exportPpts(taskIds, 'pptx')
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `batch_export_${taskIds.length}ppts_${new Date().toISOString().slice(0, 10)}.zip`
    a.click()
    URL.revokeObjectURL(url)
    showSuccess('批量导出成功', `已导出 ${taskIds.length} 个PPT`)
  } catch (e) {
    showError('批量导出失败', (e as Error).message)
  }
}

// 导出图片 - 使用真实SVG预览图（支持分辨率选择）
const handleExportImages = async () => {
  if (isExporting.value) return
  if (previewSlides.value.length === 0) {
    alert('请等待预览加载完成')
    return
  }

  isExporting.value = true
  exportProgress.value = 0
  exportStatusText.value = '正在准备...'
  showExportMenu.value = false

  try {
    const format = selectedFormat.value // 'png' or 'jpg'
    const slides = previewSlides.value
    const ext = format === 'jpg' ? 'jpg' : 'png'
    const resolution = qualityResolutions[selectedQuality.value]
    const qualityName = selectedQuality.value === 'ultra' ? '4K' : selectedQuality.value === 'high' ? '1080p' : '720p'

    // 为每张幻灯片生成图片并下载
    for (let i = 0; i < slides.length; i++) {
      const slideUrl = slides[i].url

      exportStatusText.value = `正在导出第 ${i + 1}/${slides.length} 页...`
      exportProgress.value = Math.round(((i + 1) / slides.length) * 80)

      // 创建图片元素
      const img = new Image()
      img.crossOrigin = 'anonymous'

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          // 创建canvas，使用选定的分辨率
          const canvas = document.createElement('canvas')
          canvas.width = resolution.width
          canvas.height = resolution.height
          const ctx = canvas.getContext('2d')

          if (!ctx) {
            reject(new Error('无法创建canvas上下文'))
            return
          }

          // 设置高质量渲染
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'

          // 绘制图片（缩放到目标分辨率）
          ctx.drawImage(img, 0, 0, resolution.width, resolution.height)

          // 下载
          const link = document.createElement('a')
          link.download = `slide_${i + 1}_${qualityName}.${ext}`
          link.href = canvas.toDataURL(`image/${ext}`, 0.95)
          link.click()

          // 避免同时触发多个下载
          setTimeout(resolve, 200)
        }
        img.onerror = () => {
          console.error(`幻灯片 ${i + 1} 图片加载失败`)
          resolve() // 继续处理下一张
        }
        img.src = slideUrl
      })
    }

    exportStatusText.value = '正在保存...'
    exportProgress.value = 90

    // 记录到导出历史
    const fileName = `slides_${qualityName}_${taskId.value}.zip`
    addExportHistory(ext.toUpperCase(), qualityName, `${slides.length}张图片`, '~')

    exportProgress.value = 100
    exportStatusText.value = '导出完成!'
    alert(`已成功导出 ${slides.length} 张 ${qualityName} 图片！`)
  } catch (error) {
    console.error('图片导出失败:', error)
    alert('图片导出失败，请重试')
  } finally {
    setTimeout(() => {
      isExporting.value = false
      exportProgress.value = 0
      exportStatusText.value = ''
    }, 1500)
  }
}

// 导出PNG序列（ZIP格式）- 调用后端API
const handleExportPngZip = async () => {
  if (isExporting.value) return

  isExporting.value = true
  exportProgress.value = 0
  exportStatusText.value = '正在准备PNG序列...'
  showExportMenu.value = false

  try {
    const qualityName = selectedQuality.value === 'ultra' ? '4K' : selectedQuality.value === 'high' ? '1080p' : '720p'
    const resolutionMap: Record<string, string> = {
      'standard': '720p',
      'high': '1080p',
      'ultra': '4K'
    }

    exportStatusText.value = '正在生成PNG序列...'
    exportProgress.value = 20

    const response = await api.ppt.exportPngSequence(taskId.value, resolutionMap[selectedQuality.value])

    exportStatusText.value = '正在打包ZIP...'
    exportProgress.value = 70

    const fileName = `slides_${resolutionMap[selectedQuality.value]}_${taskId.value}.zip`
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    // 记录到导出历史
    addExportHistory('PNG', qualityName, fileName, formatSize(response.data.size || 0))

    exportProgress.value = 100
    exportStatusText.value = '导出完成!'
    alert('PNG序列ZIP导出成功！')
  } catch (error) {
    console.error('PNG ZIP导出失败:', error)
    alert('PNG序列导出失败，请重试')
  } finally {
    setTimeout(() => {
      isExporting.value = false
      exportProgress.value = 0
      exportStatusText.value = ''
    }, 1500)
  }
}

// 导出到 Google Slides
const handleExportGoogleSlides = async () => {
  if (taskStatus.value !== 'completed') {
    alert('请等待 PPT 生成完成')
    return
  }
  
  isExporting.value = true
  exportProgress.value = 0
  exportStatusText.value = '正在连接 Google Slides...'
  
  try {
    const title = slideCount.value > 0 
      ? `PPT ${new Date().toLocaleDateString('zh-CN')}` 
      : `${displayBrandName.value} PPT`
    
    const response = await fetch(`/api/v1/ppt/export/google-slides/${taskId.value}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    })
    
    const result = await response.json()
    
    if (result.success) {
      showSuccess('Google Slides 导出成功', '正在打开...')
      if (result.presentation_url) {
        window.open(result.presentation_url, '_blank')
      }
    } else {
      if (result.method === 'manual' && result.guide) {
        // Show guide for manual export
        showError('需要手动导出', '请点击确定下载 PPT 文件，然后手动上传到 Google Slides')
        // Offer to download PPTX instead
        if (confirm('是否下载 PPTX 文件？\n\n手动导入 Google Slides 方法：\n1. 下载 PPTX 文件\n2. 打开 slides.google.com\n3. 点击"文件"→"打开"→"上传"')) {
          handleDownload()
        }
      } else {
        showError('Google Slides 导出失败', result.error || '未知错误')
      }
    }
  } catch (err) {
    console.error('Google Slides export error:', err)
    showError('导出失败', '网络错误，请稍后重试')
  } finally {
    isExporting.value = false
    exportProgress.value = 0
    exportStatusText.value = ''
  }
}

// 导出到 Notion
const handleExportNotion = async () => {
  if (taskStatus.value !== 'completed') {
    alert('请等待 PPT 生成完成')
    return
  }
  
  isExporting.value = true
  exportProgress.value = 0
  exportStatusText.value = '正在连接 Notion...'
  
  try {
    const title = slideCount.value > 0 
      ? `PPT ${new Date().toLocaleDateString('zh-CN')}` 
      : `${displayBrandName.value} PPT`
    
    // Extract slide content for Notion page
    const slidesContent = previewSlides.value.map((slide: any) => ({
      title: `第 ${slide.slideNum} 页`,
      content: ''
    }))
    
    const response = await fetch(`/api/v1/ppt/export/notion/${taskId.value}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, slides_content: slidesContent })
    })
    
    const result = await response.json()
    
    if (result.success) {
      showSuccess('Notion 导出成功', '正在打开...')
      if (result.page_url) {
        window.open(result.page_url, '_blank')
      }
    } else {
      if (result.method === 'manual' && result.guide) {
        showError('需要手动导出', '请先下载 PPTX 文件')
        if (confirm('是否下载 PPTX 文件？\n\nNotion 导出需要配置 API Token，详见弹窗说明')) {
          handleDownload()
        }
      } else {
        showError('Notion 导出失败', result.error || '未知错误')
      }
    }
  } catch (err) {
    console.error('Notion export error:', err)
    showError('导出失败', '网络错误，请稍后重试')
  } finally {
    isExporting.value = false
    exportProgress.value = 0
    exportStatusText.value = ''
  }
}

// 导出到 ODP
const handleExportOdp = async () => {
  if (taskStatus.value !== 'completed') {
    alert('请等待 PPT 生成完成')
    return
  }
  
  isExporting.value = true
  exportProgress.value = 0
  exportStatusText.value = '正在转换为 ODP...'
  
  try {
    const response = await fetch(`/api/v1/ppt/export/odp/${taskId.value}`, {
      method: 'GET'
    })
    
    if (response.ok) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `presentation_${taskId.value}.odp`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      showSuccess('ODP 导出成功', '文件已下载')
    } else {
      const result = await response.json()
      showError('ODP 导出失败', result.error || '未知错误')
    }
  } catch (err) {
    console.error('ODP export error:', err)
    showError('导出失败', '网络错误，请稍后重试')
  } finally {
    isExporting.value = false
    exportProgress.value = 0
    exportStatusText.value = ''
  }
}

// 导出到 Keynote
const handleExportKeynote = async () => {
  if (taskStatus.value !== 'completed') {
    alert('请等待 PPT 生成完成')
    return
  }
  
  isExporting.value = true
  exportProgress.value = 0
  exportStatusText.value = '正在转换为 Keynote...'
  
  try {
    const response = await fetch(`/api/v1/ppt/export/keynote/${taskId.value}`, {
      method: 'GET'
    })
    
    if (response.ok) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `presentation_${taskId.value}.key.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      showSuccess('Keynote 导出成功', '文件已下载，请在 Mac 上用 Keynote 打开')
    } else {
      const result = await response.json()
      showError('Keynote 导出失败', result.error || '未知错误')
    }
  } catch (err) {
    console.error('Keynote export error:', err)
    showError('导出失败', '网络错误，请稍后重试')
  } finally {
    isExporting.value = false
    exportProgress.value = 0
    exportStatusText.value = ''
  }
}

// 导出为 MP3 音频
const handleExportMp3 = async () => {
  if (taskStatus.value !== 'completed') {
    alert('请等待 PPT 生成完成')
    return
  }
  
  isExporting.value = true
  exportProgress.value = 0
  exportStatusText.value = '正在生成音频叙述...'
  
  try {
    // Build slides content for narration
    const slidesContent = previewSlides.value.map((slide: any, idx: number) => ({
      title: `第 ${idx + 1} 页`,
      content: ''
    }))
    
    const response = await fetch(`/api/v1/ppt/export/audio/${taskId.value}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        slides_content: slidesContent 
      })
    })
    
    if (response.ok) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `presentation_${taskId.value}.mp3`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      showSuccess('MP3 导出成功', '音频叙述已下载')
    } else {
      const result = await response.json()
      showError('MP3 导出失败', result.error || '未知错误')
    }
  } catch (err) {
    console.error('MP3 export error:', err)
    showError('导出失败', '网络错误，请稍后重试')
  } finally {
    isExporting.value = false
    exportProgress.value = 0
    exportStatusText.value = ''
  }
}

// 打印
const handlePrint = () => {
  showExportMenu.value = false
  window.print()
}

// 分享
const showShareMenu = ref(false)
const showMoreMenu = ref(false)
const showQRCode = ref(false)
const shareTitle = ref('RabAi Mind PPT')
const showShareLinkModal = ref(false)
const showScheduleModal = ref(false)
const showSharingAnalytics = ref(false)
const showSharePanel = ref(false)
const showAccessRequest = ref(false)
const showFolderPanel = ref(false)
const showEmbedCode = ref(false)
const shareLinkTitle = ref('RabAi Mind PPT')
const shareLinkDescription = ref('来看看我创建的精彩演示文稿')
const shareLinkThumbnail = ref<string | undefined>(undefined)

const onShareLinkSaved = (data: { title: string; description: string; thumbnail?: string }) => {
  shareLinkTitle.value = data.title
  shareLinkDescription.value = data.description
  shareLinkThumbnail.value = data.thumbnail
}

// R147: Schedule created callback
const onScheduleCreated = (schedule: any) => {
  console.log('定时任务已创建:', schedule)
}

const shareOptions = [
  { id: 'native', name: '系统分享', icon: '📤', supported: 'share' in navigator },
  { id: 'custom', name: '自定义分享', icon: '✏️' },
  { id: 'copy', name: '复制链接', icon: '📋' },
  { id: 'qrcode', name: '二维码', icon: '📱' },
  { id: 'wechat', name: '微信', icon: '💬' },
  { id: 'qq', name: 'QQ', icon: '🐧' },
  { id: 'weibo', name: '微博', icon: '🌐' },
  { id: 'email', name: '邮件', icon: '📧' },
  { id: 'twitter', name: 'Twitter', icon: '🐦' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
  { id: 'analytics', name: '分享数据', icon: '📊' },
  { id: 'request-access', name: '请求访问', icon: '🔐' },
  { id: 'folders', name: '文件夹管理', icon: '📁' },
  { id: 'physical', name: '物理分享', icon: '🔗' }
]

const generateQRCodeUrl = (url: string): string => {
  // 使用第三方QR码API
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`
}

const shareUrl = computed(() => `${window.location.origin}/result?taskId=${taskId.value}`)

const handleShare = async (type: string) => {
  const url = shareUrl.value

  switch (type) {
    case 'native':
      // 使用原生分享API
      if ('share' in navigator) {
        try {
          await navigator.share({
            title: shareTitle.value,
            text: '来看看我创建的PPT',
            url
          })
        } catch (e) {
          console.log('Share cancelled')
        }
      } else {
        alert('您的浏览器不支持系统分享功能')
      }
      break

    case 'custom':
      showShareLinkModal.value = true
      showShareMenu.value = false
      return

    case 'copy':
      try {
        await navigator.clipboard.writeText(url)
        alert('链接已复制到剪贴板！')
      } catch {
        // 降级方案
        const input = document.createElement('input')
        input.value = url
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
        alert('链接已复制！')
      }
      break

    case 'qrcode':
      showQRCode.value = true
      break

    case 'wechat':
      showQRCode.value = true
      break

    case 'qq':
      const qqUrl = `http://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(url)}&title=${encodeURIComponent(shareTitle.value)}&desc=${encodeURIComponent('来看看我创建的PPT')}`
      window.open(qqUrl, '_blank', 'width=600,height=400')
      break

    case 'weibo':
      const weiboUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(shareTitle.value)}`
      window.open(weiboUrl, '_blank', 'width=600,height=400')
      break

    case 'email':
      const mailto = `mailto:?subject=${encodeURIComponent(shareTitle.value)}&body=来看看我创建的PPT:%0A${encodeURIComponent(url)}`
      window.location.href = mailto
      break

    case 'twitter':
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent('来看看我创建的PPT')}&url=${encodeURIComponent(url)}`
      window.open(twitterUrl, '_blank', 'width=600,height=400')
      break

    case 'linkedin':
      const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
      window.open(linkedinUrl, '_blank', 'width=600,height=400')
      break
    case 'analytics':
      showSharingAnalytics.value = true
      if (type !== 'qrcode') showShareMenu.value = false
      return
    case 'request-access':
      showAccessRequest.value = true
      if (type !== 'qrcode') showShareMenu.value = false
      return
    case 'folders':
      showFolderPanel.value = true
      if (type !== 'qrcode') showShareMenu.value = false
      return
    case 'physical':
      showSharePanel.value = true
      showShareMenu.value = false
      return
  }

  if (type !== 'qrcode') {
    showShareMenu.value = false
  }
}

// 获取操作类型的图标
const getActionIcon = (actionType: string): string => {
  const iconMap: Record<string, string> = {
    'outline_edit': '📝',
    'slide_regenerate': '🔄',
    'rollback': '⏪',
    'undo': '↩️',
    'slide_image': '🖼️',
    'chart_edit': '📊',
    'element_edit': '✏️',
    'template_save': '💾',
    'create': '✨',
    'delete': '🗑️',
  }
  return iconMap[actionType] || '📋'
}

// 格式化时间
const formatTime = (isoString: string): string => {
  if (!isoString) return ''
  try {
    const date = new Date(isoString)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return isoString
  }
}

// 加载版本历史
const loadVersionHistory = async () => {
  if (!taskId.value) return
  try {
    const res = await api.ppt.listVersions(taskId.value)
    if (res.data && res.data.success) {
      versionList.value = res.data.versions || []
      // 设置当前版本为最新
      if (versionList.value.length > 0) {
        currentVersionId.value = versionList.value[versionList.value.length - 1].version_id
      }
    }
  } catch (e) {
    console.warn('加载版本历史失败:', e)
  }
}

// 加载操作日志
const loadActionLog = async () => {
  if (!taskId.value) return
  try {
    const res = await api.ppt.getActionLog(taskId.value, 20)
    if (res.data && res.data.success) {
      actionLog.value = res.data.action_log || []
    }
  } catch (e) {
    console.warn('加载操作日志失败:', e)
  }
}

// 加载撤销栈
const loadUndoStack = async () => {
  if (!taskId.value) return
  try {
    const res = await api.ppt.getUndoStack(taskId.value)
    if (res.data && res.data.success) {
      undoStack.value = res.data.undo_stack || []
    }
  } catch (e) {
    console.warn('加载撤销栈失败:', e)
  }
}

// 撤销上一操作
const undoLastAction = async () => {
  if (!taskId.value) return
  if (undoStack.value.length === 0) {
    showWarning('无可撤销的操作', '撤销栈为空')
    return
  }
  if (!confirm(`确认撤销「${undoStack.value[undoStack.value.length - 1]?.description}」？`)) return
  
  try {
    const res = await api.ppt.undo(taskId.value)
    if (res.data && res.data.success) {
      showSuccess('撤销成功', `已撤销: ${res.data.undone_action}`)
      // 刷新状态
      await loadStatus()
      await loadActionLog()
      await loadUndoStack()
      await loadRedoStack()
      await loadVersionHistory()
    } else {
      showError('撤销失败', res.data?.message || '未知错误')
    }
  } catch (e: any) {
    console.error('撤销失败:', e)
    showError('撤销失败', e?.response?.data?.detail || '网络错误')
  }
}

// 加载重做栈
const loadRedoStack = async () => {
  if (!taskId.value) return
  try {
    const res = await api.ppt.getRedoStack(taskId.value)
    if (res.data && res.data.success) {
      redoStack.value = res.data.redo_stack || []
    }
  } catch (e) {
    console.warn('加载重做栈失败:', e)
  }
}

// 重做上一操作
const redoLastAction = async () => {
  if (!taskId.value) return
  if (redoStack.value.length === 0) {
    showWarning('无可重做的操作', '重做栈为空')
    return
  }
  if (!confirm(`确认重做「${redoStack.value[redoStack.value.length - 1]?.description}」？`)) return
  
  try {
    const res = await api.ppt.redo(taskId.value)
    if (res.data && res.data.success) {
      showSuccess('重做成功', `已重做: ${res.data.redone_action}`)
      // 刷新状态
      await loadStatus()
      await loadActionLog()
      await loadUndoStack()
      await loadRedoStack()
      await loadVersionHistory()
    } else {
      showError('重做失败', res.data?.message || '未知错误')
    }
  } catch (e: any) {
    console.error('重做失败:', e)
    showError('重做失败', e?.response?.data?.detail || '网络错误')
  }
}

// ========== 高级撤销/重做功能 ==========

// 加载完整操作时间线
const loadActionTimeline = async () => {
  if (!taskId.value) return
  try {
    const res = await api.ppt.getActionTimeline(taskId.value, 100)
    if (res.data && res.data.success) {
      actionTimeline.value = res.data.timeline || []
    }
  } catch (e) {
    console.warn('加载操作时间线失败:', e)
  }
}

// 分支撤销 - 撤销指定操作（不影响其他操作）
const undoByActionId = async (actionId: string, force: boolean = false) => {
  if (!taskId.value) return
  const action = actionTimeline.value.find(a => a.action_id === actionId)
  if (!action) {
    showError('操作不存在', `未找到操作 ${actionId}`)
    return
  }
  
  if (!force) {
    // 选择性撤销模式：仅撤销目标操作
    if (!confirm(`确认选择性撤销「${action.description}」？仅撤销此操作，其他操作不受影响。`)) return
  } else {
    // 分支撤销模式：撤销目标及其后续所有操作
    if (!confirm(`确认分支撤销「${action.description}」？这将撤销该操作之后的所有操作。`)) return
  }
  
  try {
    const res = await api.ppt.undoByActionId(taskId.value, actionId, force)
    if (res.data && res.data.success) {
      const mode = res.data.mode === 'selective_undo' ? '选择性撤销' : '分支撤销'
      const warning = res.data.warning ? ` (${res.data.warning})` : ''
      showSuccess(`${mode}成功`, `已撤销: ${res.data.undone_action}（影响${res.data.affected_actions}个操作）${warning}`)
      await loadStatus()
      await loadActionLog()
      await loadUndoStack()
      await loadRedoStack()
      await loadActionTimeline()
      await loadVersionHistory()
    } else {
      showError(`${res.data.mode === 'selective_undo' ? '选择性撤销' : '分支撤销'}失败`, res.data?.message || '未知错误')
    }
  } catch (e: any) {
    console.error('撤销操作失败:', e)
    showError('撤销失败', e?.response?.data?.detail || '网络错误')
  }
}

// 选择性撤销（仅撤销目标操作，不影响其他）
const selectiveUndo = async (actionId: string) => {
  await undoByActionId(actionId, false)
}

// 分支撤销（撤销目标及其后续所有操作）
const branchUndo = async (actionId: string) => {
  await undoByActionId(actionId, true)
}

// 切换时间线视图
const toggleTimeline = async () => {
  showTimeline.value = !showTimeline.value
  if (showTimeline.value) {
    showBranchUndo.value = false
    await loadActionTimeline()
  }
}

// 切换分支撤销视图
const toggleBranchUndo = async () => {
  showBranchUndo.value = !showBranchUndo.value
  if (showBranchUndo.value) {
    showTimeline.value = false
    await loadActionTimeline()
  }
}

// 加载检查点列表
const loadCheckpoints = async () => {
  if (!taskId.value) return
  try {
    const res = await api.ppt.getCheckpoints(taskId.value, 20)
    if (res.data && res.data.success) {
      checkpoints.value = res.data.checkpoints || []
    }
  } catch (e) {
    console.warn('加载检查点列表失败:', e)
  }
}

// 创建检查点（手动）
const createCheckpointManual = async () => {
  if (!taskId.value) return
  const name = prompt('请输入检查点名称:', `手动检查点 ${new Date().toLocaleString()}`)
  if (name === null) return
  
  try {
    const res = await api.ppt.createCheckpoint(taskId.value, name, 'manual')
    if (res.data && res.data.success) {
      showSuccess('检查点已创建', `检查点「${name}」已创建`)
      await loadCheckpoints()
    } else {
      showError('创建检查点失败', res.data?.message || '未知错误')
    }
  } catch (e: any) {
    console.error('创建检查点失败:', e)
    showError('创建检查点失败', e?.response?.data?.detail || '网络错误')
  }
}

// 从检查点恢复
const restoreFromCheckpoint = async (checkpointId: string, checkpointName: string) => {
  if (!taskId.value) return
  if (!confirm(`确认从检查点「${checkpointName}」恢复？这将撤销所有后续操作。`)) return
  
  try {
    const res = await api.ppt.restoreCheckpoint(taskId.value, checkpointId)
    if (res.data && res.data.success) {
      showSuccess('已从检查点恢复', res.data.message)
      await loadStatus()
      await loadActionLog()
      await loadUndoStack()
      await loadRedoStack()
      await loadActionTimeline()
      await loadVersionHistory()
    } else {
      showError('恢复失败', res.data?.message || '未知错误')
    }
  } catch (e: any) {
    console.error('从检查点恢复失败:', e)
    showError('从检查点恢复失败', e?.response?.data?.detail || '网络错误')
  }
}

// 加载协作编辑锁
const loadCollaborativeLocks = async () => {
  if (!taskId.value) return
  try {
    const res = await api.ppt.getCollaborativeLocks(taskId.value)
    if (res.data && res.data.success) {
      collaborativeLocks.value = res.data.locks || {}
    }
  } catch (e) {
    console.warn('加载协作锁失败:', e)
  }
}

// 自动创建检查点（每5分钟）
const autoCreateCheckpoint = async () => {
  if (!taskId.value || !autoSaveEnabled.value) return
  const now = Date.now()
  if (lastCheckpointTime.value && (now - lastCheckpointTime.value) < checkpointInterval) {
    return  // 距离上次检查点不足5分钟
  }
  
  try {
    const res = await api.ppt.createCheckpoint(taskId.value, `自动检查点`, 'auto')
    if (res.data && res.data.success) {
      lastCheckpointTime.value = now
      await loadCheckpoints()
    }
  } catch (e) {
    console.warn('自动创建检查点失败:', e)
  }
}

// 重要编辑后自动创建检查点（减少间隔限制，加速备份）
const triggerSignificantEditCheckpoint = async (editType: string) => {
  if (!taskId.value || !autoSaveEnabled.value) return
  const now = Date.now()
  // 重要编辑后缩短检查点间隔：至少30秒
  const minInterval = 30000
  if (lastCheckpointTime.value && (now - lastCheckpointTime.value) < minInterval) {
    return  // 距离上次检查点不足30秒
  }
  
  try {
    const res = await api.ppt.createCheckpoint(taskId.value, `编辑备份: ${editType}`, 'auto')
    if (res.data && res.data.success) {
      lastCheckpointTime.value = now
      await loadCheckpoints()
      console.log(`[自动备份] ${editType} - 检查点已创建`)
    }
  } catch (e) {
    console.warn('自动备份失败:', e)
  }

  // R136: 记录显著变化并检查是否需要自动创建版本
  try {
    const autoRes = await api.ppt.checkAutoVersion(taskId.value)
    if (autoRes.data && autoRes.data.auto_created) {
      showSuccess('⚡自动版本已创建', `版本: ${autoRes.data.version_name}`)
      await loadVersionHistory()
    }
  } catch (e) {
    console.warn('自动版本化检查失败:', e)
  }
}

// 从指定版本创建分支
const branchFromVersion = async (versionId: string) => {
  if (!taskId.value) return
  const branchName = prompt('请输入分支名称:', '新分支')
  if (branchName === null) return // 用户取消
  
  try {
    const res = await api.ppt.branchVersion(taskId.value, versionId, branchName)
    if (res.data && res.data.success) {
      showSuccess('分支已创建', `分支「${branchName}」已创建`)
      await loadVersionHistory()
    } else {
      showError('创建分支失败', res.data?.message || '未知错误')
    }
  } catch (e: any) {
    console.error('创建分支失败:', e)
    showError('创建分支失败', e?.response?.data?.detail || '网络错误')
  }
}

// 合并分支版本到当前版本
const mergeFromVersion = async (sourceVersionId: string) => {
  if (!taskId.value) return
  
  // 选择合并策略
  const selected = prompt(`选择合并策略（输入数字）：\n1: branch_wins（分支优先）\n2: main_wins（当前优先）\n3: newest_first（最新优先）\n4: manual（手动解决冲突）`, '1')
  if (selected === null) return // 用户取消
  
  let strategy = 'branch_wins'
  if (selected === '2') strategy = 'main_wins'
  else if (selected === '3') strategy = 'newest_first'
  else if (selected === '4') strategy = 'manual'
  
  if (!confirm(`确认合并分支到当前版本？\n策略: ${strategy}\n\n这将创建新的合并版本。`)) return
  
  try {
    const res = await api.ppt.mergeVersions(taskId.value, sourceVersionId, undefined, strategy)
    if (res.data) {
      // 检查是否有冲突需要解决
      if (res.data.has_conflicts && res.data.conflicts && res.data.conflicts.length > 0) {
        // 显示冲突解决对话框
        mergeConflicts.value = res.data.conflicts
        pendingMergeSource.value = sourceVersionId
        pendingMergeTarget.value = res.data.merged_to || ''
        slideResolutions.value = {}
        showMergeConflictDialog.value = true
        return
      }
      
      if (res.data.success) {
        showSuccess('合并成功', `合并版本 ${res.data.version_id} 已创建`)
        await loadVersionHistory()
      } else {
        showError('合并失败', res.data.message || '未知错误')
      }
    }
  } catch (e: any) {
    console.error('合并失败:', e)
    showError('合并失败', e?.response?.data?.detail || '网络错误')
  }
}

// 执行冲突解决后的合并
const resolveMergeConflicts = async () => {
  if (!taskId.value || !pendingMergeSource.value) return
  
  try {
    const res = await api.ppt.mergeVersions(
      taskId.value, 
      pendingMergeSource.value, 
      pendingMergeTarget.value || undefined, 
      'manual', 
      slideResolutions.value
    )
    if (res.data && res.data.success) {
      showSuccess('合并成功', `已解决 ${res.data.conflict_count || 0} 个冲突，合并版本 ${res.data.version_id} 已创建`)
      showMergeConflictDialog.value = false
      mergeConflicts.value = []
      await loadVersionHistory()
    }
  } catch (e: any) {
    console.error('合并失败:', e)
    showError('合并失败', e?.response?.data?.detail || '网络错误')
  }
}

// 取消合并
const cancelMerge = () => {
  showMergeConflictDialog.value = false
  mergeConflicts.value = []
  pendingMergeSource.value = ''
  pendingMergeTarget.value = ''
  slideResolutions.value = {}
}

// 加载指定版本
const loadVersion = async (versionId: string) => {
  if (!taskId.value) return
  try {
    const res = await api.ppt.getVersion(taskId.value, versionId)
    if (res.data && res.data.success) {
      const version = res.data.version
      // 加载该版本的 slides 到预览
      const slides = version.config?.slides || []
      previewSlides.value = slides.map((s: any, idx: number) => ({
        ...s,
        url: s.image_url || `/api/v1/ppt/svg/${taskId.value}/${idx + 1}`,
        slideNum: idx + 1
      }))
      currentVersionId.value = versionId
      // 可选：显示提示
      console.log(`已加载: ${version.name}`)
    }
  } catch (e) {
    console.error('加载版本失败:', e)
  }
}

// 回滚到指定版本
const rollbackToVersion = async (versionId: string) => {
  if (!taskId.value) return
  if (!confirm('确认回滚？回滚将生成新版本，当前内容会作为快照保留')) return
  
  try {
    const res = await api.ppt.rollbackVersion(taskId.value, versionId)
    if (res.data && res.data.success) {
      showSuccess('回滚成功', res.data.message || '已恢复到指定版本')
      // 重新加载版本历史和当前版本
      await loadVersionHistory()
      await loadVersion(versionId)
      // 重新加载任务状态
      await loadStatus()
    }
  } catch (e) {
    console.error('回滚失败:', e)
    showError('回滚失败', '请稍后重试')
  }
}

// 对比版本
const compareVersion = async (versionId: string) => {
  if (!taskId.value || !currentVersionId.value) return
  if (versionId === currentVersionId.value) {
    alert('请先加载不同版本进行对比')
    return
  }
  
  try {
    const res = await api.ppt.diffVersions(taskId.value, currentVersionId.value, versionId)
    if (res.data && res.data.success) {
      diffData.value = res.data
      showDiffView.value = true
    }
  } catch (e) {
    console.error('版本对比失败:', e)
    alert('版本对比失败，请稍后重试')
  }
}

// ========== A/B Testing ==========
const loadABTests = async () => {
  if (!taskId.value) return
  try {
    const res = await api.ppt.listABTests(taskId.value)
    if (res.data && res.data.success) {
      abTestList.value = res.data.tests || []
    }
  } catch (e) {
    console.error('加载A/B测试失败:', e)
  }
}

const createABTest = async (slideIndex: number) => {
  if (!taskId.value) return
  try {
    const res = await api.ppt.createABTest(taskId.value, slideIndex, 2)
    if (res.data && res.data.success) {
      showSuccess('A/B测试已创建', '生成了2个变体版本')
      await loadABTests()
      // 显示结果
      currentABTest.value = res.data
      showABResult.value = true
    }
  } catch (e: any) {
    console.error('创建A/B测试失败:', e)
    showError('创建失败', e?.response?.data?.detail || '请稍后重试')
  }
}

const loadABTestResult = async (testId: string) => {
  if (!taskId.value) return
  try {
    const res = await api.ppt.getABTest(taskId.value, testId)
    if (res.data && res.data.success) {
      currentABTest.value = res.data.test
      showABResult.value = true
    }
  } catch (e) {
    console.error('加载A/B测试结果失败:', e)
  }
}

const applyABWinner = async (testId: string, variantId: string) => {
  if (!taskId.value) return
  try {
    const res = await api.ppt.selectABWinner(taskId.value, testId, variantId)
    if (res.data && res.data.success) {
      showSuccess('获胜变体已应用', '幻灯片已更新')
      showABResult.value = false
      await loadABTests()
    }
  } catch (e) {
    console.error('应用获胜变体失败:', e)
    showError('应用失败', '请稍后重试')
  }
}

// ========== Suggest Improvements ==========
const loadSuggestions = async () => {
  if (!taskId.value) return
  suggestLoading.value = true
  try {
    const res = await api.ppt.suggestImprovements(taskId.value)
    if (res.data && res.data.success) {
      suggestList.value = res.data.suggestions || []
      showSuggestPanel.value = true
    }
  } catch (e) {
    console.error('加载改进建议失败:', e)
    showError('加载失败', '请稍后重试')
  } finally {
    suggestLoading.value = false
  }
}

// ========== Slide Version History ==========
const loadSlideHistory = async (slideIndex: number) => {
  if (!taskId.value) return
  try {
    const res = await api.ppt.getSlideHistory(taskId.value, slideIndex)
    if (res.data && res.data.success) {
      slideHistoryMap.value[slideIndex] = res.data.history || []
      expandedSlideHistory.value = expandedSlideHistory.value === slideIndex ? null : slideIndex
    }
  } catch (e) {
    console.error('加载幻灯片历史失败:', e)
  }
}

// 手动创建快照
const createSnapshot = async () => {
  if (!taskId.value) return
  try {
    const res = await api.ppt.createSnapshot(taskId.value)
    if (res.data && res.data.success) {
      showSuccess('快照已创建', '可随时从版本历史中恢复')
      await loadVersionHistory()
    }
  } catch (e) {
    console.error('创建快照失败:', e)
    showError('创建快照失败', '请稍后重试')
  }
}

// ========== 自动保存 & 崩溃恢复 & 检查点 ==========

let autoSaveTimer: number | null = null
let checkpointTimer: number | null = null  // 检查点定时器（每5分钟）

// 保存自动保存设置到 localStorage
const saveAutoSaveSettings = () => {
  localStorage.setItem('ppt_autosave_settings', JSON.stringify({
    enabled: autoSaveEnabled.value,
    interval: autoSaveInterval.value,
  }))
  // 重启定时器
  stopAutoSaveTimer()
  if (autoSaveEnabled.value) {
    startAutoSaveTimer()
  }
}

// 加载自动保存设置
const loadAutoSaveSettings = () => {
  try {
    const saved = localStorage.getItem('ppt_autosave_settings')
    if (saved) {
      const settings = JSON.parse(saved)
      autoSaveEnabled.value = settings.enabled ?? true
      autoSaveInterval.value = settings.interval ?? 30000
    }
  } catch (e) {
    console.warn('加载自动保存设置失败:', e)
  }
}

// 启动自动保存定时器
const startAutoSaveTimer = () => {
  if (autoSaveTimer) return
  autoSaveTimer = window.setInterval(() => {
    triggerAutoSave()
  }, autoSaveInterval.value)
}

// 停止自动保存定时器
const stopAutoSaveTimer = () => {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
    autoSaveTimer = null
  }
}

// 启动检查点定时器（每5分钟自动保存检查点）
const startCheckpointTimer = () => {
  if (checkpointTimer) return
  checkpointTimer = window.setInterval(() => {
    autoCreateCheckpoint()
  }, checkpointInterval)  // 5分钟 = 300000毫秒
}

// 停止检查点定时器
const stopCheckpointTimer = () => {
  if (checkpointTimer) {
    clearInterval(checkpointTimer)
    checkpointTimer = null
  }
}

// 触发一次自动保存
const triggerAutoSave = async () => {
  if (!taskId.value || !autoSaveEnabled.value) return
  try {
    // 收集当前编辑状态
    const state = {
      previewSlides: previewSlides.value,
      editableSlides: editableSlides.value,
      slideCount: slideCount.value,
    }
    await api.ppt.autoSave(taskId.value, state)
    lastAutoSaveTime.value = Date.now()
  } catch (e) {
    console.warn('自动保存失败:', e)
  }
}

// 检查崩溃恢复状态
const checkRecoveryState = async () => {
  if (!taskId.value) return
  try {
    const res = await api.ppt.getAutoSave(taskId.value)
    if (res.data && res.data.success && res.data.state) {
      recoveryInfo.value = {
        savedAt: new Date(res.data.saved_at).getTime(),
        state: res.data.state,
      }
      showRecoveryModal.value = true
    } else {
      showInfo('无恢复数据', '当前没有可恢复的编辑状态')
    }
  } catch (e) {
    console.warn('检查恢复状态失败:', e)
  }
}

// 从崩溃恢复
const recoverFromCrash = () => {
  if (!recoveryInfo.value || !recoveryInfo.value.state) {
    showError('恢复失败', '无恢复数据')
    showRecoveryModal.value = false
    return
  }
  const state = recoveryInfo.value.state
  if (state.previewSlides) {
    previewSlides.value = state.previewSlides
  }
  if (state.editableSlides) {
    editableSlides.value = state.editableSlides
  }
  if (state.slideCount) {
    slideCount.value = state.slideCount
  }
  showRecoveryModal.value = false
  recoveryInfo.value = null
  showSuccess('恢复成功', '已恢复至上一次编辑状态')
}

// 放弃恢复
const dismissRecovery = () => {
  showRecoveryModal.value = false
  recoveryInfo.value = null
  // 清除后端的自动保存状态
  if (taskId.value) {
    api.ppt.autoSave(taskId.value, {}).catch(() => {})
  }
}

// 备份恢复后刷新数据 R125
const onBackupRestored = async () => {
  showBackupPanel.value = false
  // 重新加载预览和状态
  await loadPreview()
  await loadStatus()
  showSuccess('恢复成功', '演示文稿已从备份恢复')
}

// ========== Keyboard Shortcuts ==========

// 全局键盘快捷键
useKeyboardShortcuts([
  {
    key: 's',
    ctrl: true,
    handler: () => {
      if (!isExporting.value) {
        handleDownload()
        showSuccess('下载已触发', 'PPT正在生成下载中...')
      }
    },
    description: '保存/下载PPT (Ctrl+S)'
  },
  {
    key: 'z',
    ctrl: true,
    shift: false,
    handler: () => {
      undoLastAction()
    },
    description: '撤销 (Ctrl+Z)'
  },
  {
    key: 'z',
    ctrl: true,
    shift: true,
    handler: () => {
      redoLastAction()
    },
    description: '重做 (Ctrl+Shift+Z)'
  },
  {
    key: 'y',
    ctrl: true,
    handler: () => {
      redoLastAction()
    },
    description: '重做 (Ctrl+Y)'
  },
  {
    key: 'Escape',
    handler: () => {
      if (showSaveTemplateModal.value) {
        showSaveTemplateModal.value = false
      } else if (showMoreMenu.value) {
        showMoreMenu.value = false
      } else if (showShareMenu.value) {
        showShareMenu.value = false
      } else if (showLayoutPanel.value) {
        showLayoutPanel.value = false
      } else if (showVersionPanel.value) {
        showVersionPanel.value = false
      } else if (isEditMode.value) {
        isEditMode.value = false
      }
    },
    description: '关闭/取消 (Esc)'
  }
])

onMounted(() => {
  loadStatus()
  loadPreview()
  checkFavorite()
  loadVersionHistory()
  // BUG修复: 从API加载场景/风格配置
  loadScenesAndStyles()
  // 加载导出历史
  loadExportHistory()
  // 初始化自动保存
  loadAutoSaveSettings()
  if (autoSaveEnabled.value) {
    startAutoSaveTimer()
  }
  // 启动检查点定时器（每5分钟自动保存）
  if (autoSaveEnabled.value) {
    startCheckpointTimer()
    lastCheckpointTime.value = Date.now()
  }
  // 检查崩溃恢复
  checkRecoveryState()
  // 粘贴事件监听（编辑模式下全局捕获）
  document.addEventListener('paste', handleGlobalPaste)
  // 初始化实时协作 (R71)
  initCollaboration()
  // Prepare push notification permission
  prepareForGeneration()
  // R149: Start performance profiler for render time metrics
  startProfiler()
  // R157: Initialize network quality detection for adaptive quality
  initNetworkQuality()
  // R157: Set up emergency backup on crash
  setupEmergencyBackup()
})

onUnmounted(() => {
  stopAutoSaveTimer()
  stopCheckpointTimer()
  cleanupEmergencyBackup()
  document.removeEventListener('paste', handleGlobalPaste)
  if (_collaborationInstance) {
    _collaborationInstance.disconnect()
    _collaborationInstance = null
  }
  if (_scrollCleanup) {
    _scrollCleanup()
    _scrollCleanup = null
  }
  // R149: Cleanup lazy loading observer
  if (previewObserver) {
    previewObserver.disconnect()
    previewObserver = null
  }
  endViewSession()
})
</script>

<style scoped>
.result {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.result-card {
  max-width: 700px;
  width: 100%;
  padding: 48px 40px;
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.1);
  text-align: center;
}

/* 成功状态 */
.success-icon {
  font-size: 72px;
  margin-bottom: 24px;
  animation: bounce 0.6s ease;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

.result-title {
  font-size: 28px;
  font-weight: 700;
  color: #1A1A1A;
  margin-bottom: 8px;
}

.result-desc {
  font-size: 16px;
  color: #666;
  margin-bottom: 32px;
}

.file-info {
  display: flex;
  justify-content: center;
  gap: 32px;
  padding: 20px;
  background: #F5F5F5;
  border-radius: 12px;
  margin-bottom: 32px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #999;
}

.info-value {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A1A;
}

/* PPT预览 */
.ppt-preview-section {
  margin-bottom: 40px;
  padding: 24px;
  background: #fafafa;
  border-radius: 16px;
}

.preview-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
  text-align: center;
}

.preview-loading {
  text-align: center;
  padding: 40px;
  color: #999;
}

.preview-loading .loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #165DFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  padding: 8px;
}

.preview-slide {
  aspect-ratio: 16/9;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s, box-shadow 0.2s;
}

.slide-number-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  z-index: 5;
}

.preview-slide:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.preview-slide .slide-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.85);
  padding: 8px;
  display: flex;
  justify-content: center;
  gap: 8px;
  opacity: 0.7;
  transition: opacity 0.2s;
  z-index: 10;
}

.preview-slide:hover .slide-actions,
.preview-slide:focus-within .slide-actions,
.preview-slide:active .slide-actions {
  opacity: 1;
}

.btn-regenerate {
  background: #165DFF;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 4px 12px;
  font-size: 12px;
  cursor: pointer;
}

.btn-regenerate:hover {
  background: #0D47A1;
}

.btn-regenerate:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.preview-empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 14px;
}

.preview-load-failed {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
  color: #FF3B30;
  font-size: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

/* BUG修复: 预览图片加载失败样式 */
.preview-error {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f5f5, #e0e0e0);
  color: #999;
  font-size: 12px;
  border-radius: 8px;
}

.preview-more {
  aspect-ratio: 16/9;
  background: #f0f0f0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 14px;
}

.preview-tip {
  text-align: center;
  font-size: 13px;
  color: #999;
  margin-top: 12px;
}

/* R149: Lazy loading styles */
.preview-slide.slide-loading {
  min-height: 120px;
}

.preview-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
}

.preview-skeleton {
  width: 80%;
  height: 70%;
  background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 8px;
}

.preview-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  z-index: 8;
}

.loading-spinner.small {
  width: 24px;
  height: 24px;
  border-width: 3px;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.preview-image.image-loaded {
  opacity: 1;
}

/* R149: Performance metrics badge */
.preview-perf-badge {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.6);
  color: #4ade80;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  z-index: 10;
  font-variant-numeric: tabular-nums;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* 失败状态 */
.failed-icon {
  font-size: 72px;
  margin-bottom: 24px;
}

.result-error {
  font-size: 14px;
  color: #FF3B30;
  margin-bottom: 16px;
  padding: 12px;
  background: #FFEBEE;
  border-radius: 8px;
}

.error-suggestions {
  margin-bottom: 24px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  text-align: left;
}

.suggestion-title {
  font-size: 14px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
}

.suggestion-list {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  color: #888;
}

.suggestion-list li {
  margin-bottom: 4px;
}

/* 加载状态 */
.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #E5E5E5;
  border-top-color: #165DFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 24px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 操作按钮 */
.result-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.btn-lg {
  padding: 14px 32px;
  font-size: 16px;
}

.btn-export {
  background: #34C759;
  color: #fff;
}

.btn-export:hover {
  background: #2dad4a;
}

.btn-share {
  background: #5856D6;
  color: #fff;
}

.btn-share:hover {
  background: #4644cd;
}

.btn-presentation {
  background: #FF9500;
  color: #fff;
}

.btn-presentation:hover {
  background: #e08600;
}

.btn-favorite {
  background: #f5f5f5;
  color: #666;
}

.btn-favorite:hover {
  background: #ffe4b3;
  color: #b8860b;
}

.btn-favorite-active {
  background: #FFF3CD;
  color: #FFB800;
}

.btn-favorite-active:hover {
  background: #ffe4b3;
}

.btn-outline-edit {
  background: white;
  border: 1px solid #165DFF;
  color: #165DFF;
}

.btn-outline-edit:hover {
  background: #EEF2FF;
}

.btn-element-edit {
  background: white;
  border: 1px solid #7C3AED;
  color: #7C3AED;
}

.btn-element-edit:hover {
  background: #F5F3FF;
}

.btn-tune {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.btn-tune:hover {
  background: linear-gradient(135deg, #5a71d6 0%, #6a4190 100%);
}

.btn-chart-editor {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
  border: none;
}

.btn-chart-editor:hover {
  background: linear-gradient(135deg, #0f8a7f 0%, #30d66e 100%);
}

/* 更多操作下拉菜单 */
.more-actions-dropdown {
  position: relative;
}

.more-actions-dropdown .btn {
  background: white;
  border: 1px solid #ddd;
  color: #666;
}

.more-actions-dropdown .btn:hover {
  background: #f5f5f5;
  border-color: #ccc;
}

.more-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 8px;
  z-index: 100;
  min-width: 160px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.more-menu .menu-separator {
  text-align: center;
  font-size: 11px;
  color: #999;
  padding: 6px 8px 2px;
  letter-spacing: 0.5px;
}

.more-menu button {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 16px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
  transition: background 0.2s;
}

.more-menu button:hover {
  background: #f5f5f5;
}

.more-menu button span {
  font-size: 16px;
}

/* 浮动工具栏 */
.function-toolbar {
  position: fixed;
  right: 24px;
  bottom: 80px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 50;
}

.toolbar-btn {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: none;
  background: white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  font-size: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
}

.toolbar-btn:active {
  transform: scale(0.95);
}

/* 内容编辑面板 */
.content-edit-panel {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-top: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.edit-header {
  margin-bottom: 20px;
}

.edit-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px;
}

.edit-tip {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.edit-slides {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.edit-slide-card {
  background: #f9fafb;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e5e5e5;
}

.edit-slide-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.slide-num {
  font-size: 13px;
  font-weight: 600;
  color: #165DFF;
}

.layout-select {
  padding: 4px 8px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 12px;
  background: white;
  cursor: pointer;
}

.edit-slide-title {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 10px;
  outline: none;
  transition: border-color 0.2s;
}

.edit-slide-title:focus {
  border-color: #165DFF;
}

/* Edit field row with dictation button */
.edit-field-row {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: nowrap;
}

.edit-field-row input,
.edit-field-row textarea {
  flex: 1;
  margin-bottom: 0;
}

/* Voice dictation button - touch friendly 44px+ */
.dictation-btn {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  min-width: 44px;
  border-radius: 10px;
  border: 1.5px solid #e5e5e5;
  background: white;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  touch-action: manipulation;
  -webkit-tap-highlight-color: rgba(22, 93, 255, 0.12);
}

.dictation-btn:active {
  transform: scale(0.93);
  opacity: 0.85;
}

.dictation-btn.active {
  background: #165DFF;
  border-color: #165DFF;
  color: white;
  animation: dictation-pulse 1.2s infinite;
}

@keyframes dictation-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(22, 93, 255, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(22, 93, 255, 0); }
}

/* Dictation live feedback text */
.dictation-feedback {
  font-size: 13px;
  color: #165DFF;
  padding: 4px 8px;
  margin-top: -6px;
  margin-bottom: 10px;
  min-height: 28px;
  font-style: italic;
  opacity: 0.85;
}

/* Mobile dictation button */
@media (max-width: 768px) {
  .dictation-btn {
    width: 44px;
    height: 44px;
    font-size: 18px;
  }
}

.edit-slide-content {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
}

.edit-slide-content:focus {
  border-color: #165DFF;
}

/* 演讲者备注 */
.edit-slide-notes {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.6;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
  background: #f8f9ff;
  color: #555;
}

.edit-slide-notes:focus {
  border-color: #165DFF;
  background: #f0f4ff;
}

/* R152: 高级备注编辑器 */
.notes-editor-panel {
  border: 1px solid #e0e7ff;
  border-radius: 10px;
  background: #fafbff;
  margin-top: 8px;
  overflow: hidden;
}

.notes-tabs {
  display: flex;
  background: #e8edff;
  border-bottom: 1px solid #dde;
}

.notes-tab {
  flex: 1;
  padding: 8px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.notes-tab.active {
  background: #fff;
  color: #165DFF;
  font-weight: 600;
}

.sticky-badge {
  background: #EE5A5A;
  color: #fff;
  border-radius: 10px;
  padding: 0 6px;
  font-size: 11px;
  font-weight: 600;
}

.notes-content {
  padding: 10px;
}

.notes-template-row {
  margin-bottom: 6px;
}

.notes-template-select {
  width: 100%;
  padding: 4px 8px;
  border: 1px solid #dde;
  border-radius: 6px;
  font-size: 12px;
  color: #555;
  background: #fff;
  cursor: pointer;
}

.speaker-notes {
  margin-top: 6px;
  background: #fff9e6 !important;
  border-color: #ffe580 !important;
}

/* 便签面板 */
.sticky-content {
  padding: 10px;
}

.sticky-add-form {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 8px;
}

.sticky-color-picker {
  display: flex;
  gap: 4px;
}

.sticky-color-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.sticky-color-dot.active {
  border-color: #333;
  transform: scale(1.2);
}

.sticky-input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #dde;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
}

.sticky-input:focus {
  border-color: #165DFF;
}

.sticky-list {
  max-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sticky-note-item {
  padding: 8px 10px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.sticky-note-content {
  font-size: 13px;
  color: #333;
  line-height: 1.5;
  word-break: break-word;
}

.sticky-note-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}

.sticky-author {
  font-size: 11px;
  color: rgba(0,0,0,0.5);
}

.sticky-delete-btn {
  background: rgba(0,0,0,0.1);
  border: none;
  border-radius: 4px;
  width: 20px;
  height: 20px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sticky-delete-btn:hover {
  background: rgba(0,0,0,0.2);
}

.sticky-empty {
  text-align: center;
  color: #aaa;
  font-size: 12px;
  padding: 12px;
}

/* 幻灯片卡片操作按钮 */
.slide-action-btns {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

.slide-action-btn {
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  line-height: 1;
}

.slide-action-btn:hover:not(:disabled) {
  background: #e8f0fe;
  border-color: #165DFF;
}

.slide-action-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* 单页预览按钮 */
.btn-preview {
  margin-top: 8px;
  width: 100%;
  padding: 6px 12px;
  background: #f0f7ff;
  color: #165DFF;
  border: 1px solid #d0e0ff;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-preview:hover {
  background: #e0edff;
  border-color: #165DFF;
}

/* 图片操作按钮 */
.slide-image-controls {
  margin-top: 8px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.slide-image-controls .btn-sm {
  flex: 1;
  min-width: 80px;
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid;
  transition: all 0.2s;
}

.btn-image-upload {
  background: #f0f9ff;
  color: #165DFF;
  border-color: #d0e0ff;
}

.btn-image-upload:hover {
  background: #e0edff;
  border-color: #165DFF;
}

.btn-image-regenerate {
  background: #f5f0ff;
  color: #7c3aed;
  border-color: #e0d0ff;
}

.btn-image-regenerate:hover {
  background: #ede0ff;
  border-color: #7c3aed;
}

.btn-image-remove {
  background: #fff5f5;
  color: #dc3545;
  border-color: #ffd0d0;
}

.btn-image-remove:hover {
  background: #ffe0e0;
  border-color: #dc3545;
}

/* 图片预览 */
.slide-image-preview {
  width: 100%;
  margin-top: 8px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}

.slide-image-preview img {
  width: 100%;
  height: auto;
  max-height: 120px;
  object-fit: cover;
  display: block;
}

.btn-sm {
  padding: 4px 10px;
  font-size: 13px;
}

.edit-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding-top: 16px;
  border-top: 1px solid #e5e5e5;
}

/* 导出菜单 */
.export-menu {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 12px;
}

.export-format-section {
  margin-bottom: 12px;
}

.export-section-title {
  font-size: 13px;
  color: #666;
  margin-bottom: 10px;
  font-weight: 500;
}

.format-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.format-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  background: #fff;
  border: 2px solid #e5e5e5;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.format-option:hover {
  border-color: #b3b3b3;
}

.format-option.active {
  border-color: var(--primary);
  background: #f0f5ff;
}

.format-radio {
  display: none;
}

.format-icon {
  font-size: 24px;
}

.format-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.format-desc {
  font-size: 11px;
  color: #999;
}

.export-quality-section {
  margin: 12px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e5e5;
}

.pdf-options-section {
  margin: 12px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e5e5;
}

.pdf-mode-group,
.pdf-handout-group,
.pdf-size-group,
.pdf-orientation-group {
  margin-bottom: 10px;
}

.pdf-mode-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
  font-weight: 500;
}

.pdf-mode-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.pdf-mode-btn {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  color: #333;
}

.pdf-mode-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.pdf-mode-btn.active {
  background: #1890ff;
  border-color: #1890ff;
  color: #fff;
}

.pdf-watermark-group,
.pdf-header-footer-group {
  margin-top: 10px;
  padding: 10px;
  background: #fafafa;
  border-radius: 8px;
}

.pdf-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.pdf-toggle-label {
  font-size: 13px;
  color: #333;
}

.pdf-switch {
  transform: scale(0.8);
}

.pdf-watermark-options,
.pdf-hf-options {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pdf-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 12px;
  box-sizing: border-box;
}

.pdf-input:focus {
  outline: none;
  border-color: #1890ff;
}

.pdf-slider-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pdf-slider-label {
  font-size: 12px;
  color: #666;
  min-width: 50px;
}

.pdf-slider {
  flex: 1;
  height: 4px;
  cursor: pointer;
}

.pdf-slider-value {
  font-size: 11px;
  color: #1890ff;
  min-width: 35px;
  text-align: right;
}

.pdf-select {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 12px;
  background: #fff;
  cursor: pointer;
}

.pdf-page-format-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chart-config-section {
  margin: 12px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e5e5;
}

.aspect-ratio-section {
  margin: 12px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e5e5;
}

.aspect-ratio-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.aspect-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 8px;
  background: #fff;
  border: 2px solid #e5e5e5;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.aspect-btn:hover {
  border-color: #b3b3b3;
}

.aspect-btn.active {
  border-color: #165DFF;
  background: #f0f5ff;
}

.aspect-label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.aspect-desc {
  font-size: 11px;
  color: #999;
}

.aspect-note {
  font-size: 11px;
  color: #999;
  margin-top: 8px;
  text-align: center;
}

.chart-toggles {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chart-toggle-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.chart-toggle-item.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.chart-toggle-label {
  font-size: 13px;
  color: #333;
}

.chart-switch {
  transform: scale(0.8);
}

.quality-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.quality-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.quality-option:hover {
  border-color: #b3b3b3;
}

.quality-option.active {
  border-color: #165DFF;
  background: #f0f5ff;
}

.quality-radio {
  display: none;
}

.quality-name {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  min-width: 40px;
}

.quality-desc {
  flex: 1;
  font-size: 12px;
  color: #666;
}

.quality-size {
  font-size: 11px;
  color: #999;
}

.quality-note {
  font-size: 11px;
  color: #999;
  margin-top: 6px;
  text-align: center;
}

.export-theme-toggle {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e5e5;
  margin-bottom: 4px;
}

.theme-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.theme-btn {
  padding: 8px 16px;
  border: 1px solid #e5e5e5;
  background: #fff;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.theme-btn:hover {
  border-color: var(--primary);
}

.theme-btn.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}

.export-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.export-option:hover {
  border-color: #165DFF;
  background: #f0f7ff;
}

.export-option.export-batch {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  border: none;
}

.export-option.export-batch:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

.export-icon {
  font-size: 24px;
}

/* 导出进度指示器 */
.export-progress-section {
  margin: 12px 0;
  padding: 12px;
  background: #f0f7ff;
  border-radius: 8px;
  border: 1px solid #d0e0ff;
}

.export-progress-bar {
  width: 100%;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.export-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #165DFF, #34C759);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.export-progress-text {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
}

/* PNG ZIP 导出按钮 */
.export-png-zip-btn {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%) !important;
  color: white !important;
  margin-top: 8px;
}

.export-png-zip-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* 导出历史记录 */
.export-history-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e5e5;
}

.export-history-empty {
  text-align: center;
  padding: 16px;
  color: #999;
  font-size: 13px;
}

.export-history-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 200px;
  overflow-y: auto;
}

.export-history-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: #f9f9f9;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.export-history-item:hover {
  background: #f0f7ff;
  border-color: #d0e0ff;
}

.export-history-info {
  display: flex;
  gap: 8px;
  align-items: center;
}

.export-history-format {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  background: #e6f0ff;
  padding: 2px 8px;
  border-radius: 4px;
}

.export-history-quality {
  font-size: 12px;
  color: #666;
}

.export-history-slides {
  font-size: 11px;
  color: #999;
  margin-left: auto;
}

.export-history-meta {
  display: flex;
  gap: 8px;
  justify-content: space-between;
  font-size: 11px;
  color: #999;
}

/* 分享菜单 */
.share-menu {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 16px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 12px;
}

.share-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 20px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.share-option:hover {
  border-color: #165DFF;
  background: #f0f7ff;
}

.share-icon {
  font-size: 24px;
}

.share-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.share-option.disabled:hover {
  background: white;
  border-color: #e5e5e5;
}

/* 二维码分享 */
.qrcode-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: white;
  border-radius: 12px;
}

.qrcode-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.qrcode-header h4 {
  margin: 0;
  font-size: 16px;
}

.qrcode-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  color: #999;
}

.qrcode-image {
  width: 180px;
  height: 180px;
  border-radius: 8px;
}

.qrcode-tip {
  font-size: 13px;
  color: #666;
  margin: 0;
}

/* 安全设置面板 (R122) */
.security-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.security-panel {
  background: white;
  border-radius: 16px;
  width: 560px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.security-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #eee;
}

.security-panel-header h3 {
  margin: 0;
  font-size: 18px;
  color: #222;
}

.security-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  gap: 12px;
}

.security-panel-content {
  padding: 0 24px 24px;
}

.security-section {
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.security-section:last-child {
  border-bottom: none;
}

.security-section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.security-status-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.security-status-label {
  font-size: 13px;
  color: #666;
}

.security-badge {
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.security-badge.badge-active {
  background: #e6f7e6;
  color: #52c41a;
}

.security-badge.badge-inactive {
  background: #f5f5f5;
  color: #999;
}

.security-info-row {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.security-info-label {
  color: #666;
}

.security-desc {
  font-size: 12px;
  color: #888;
  margin: 0 0 10px;
}

.security-password-group,
.security-ip-group {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.security-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #555;
  padding: 4px 0;
}

.security-checkbox {
  width: 40px;
  height: 22px;
  accent-color: #165DFF;
  cursor: pointer;
}

.security-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 13px;
  outline: none;
}

.security-input:focus {
  border-color: #165DFF;
}

.security-textarea {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 13px;
  resize: vertical;
  outline: none;
}

.security-textarea:focus {
  border-color: #165DFF;
}

.security-ip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.security-ip-badge {
  background: #f0f0f0;
  color: #555;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.security-watermark-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.security-slider-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
}

.security-slider {
  flex: 1;
  accent-color: #165DFF;
}

.security-color {
  width: 40px;
  height: 32px;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
}

.security-empty-log {
  font-size: 13px;
  color: #999;
  padding: 12px 0;
  text-align: center;
}

.security-log-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 200px;
  overflow-y: auto;
}

.security-log-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #555;
  padding: 6px 8px;
  background: #f9f9f9;
  border-radius: 6px;
}

.log-action {
  flex: 1;
  font-weight: 500;
  color: #333;
}

.log-time {
  color: #999;
  white-space: nowrap;
}

.log-ip {
  color: #888;
  font-family: monospace;
}

/* 安全下载验证弹窗 */
.security-download-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.security-download-modal {
  background: white;
  border-radius: 16px;
  width: 400px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.security-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #eee;
}

.security-modal-header h3 {
  margin: 0;
  font-size: 17px;
  color: #222;
}

.security-modal-body {
  padding: 20px 24px;
}

.security-modal-field {
  margin-bottom: 16px;
}

.security-modal-field:last-child {
  margin-bottom: 0;
}

.security-modal-field label {
  display: block;
  font-size: 13px;
  color: #555;
  margin-bottom: 6px;
}

.security-modal-tip {
  font-size: 13px;
  color: #666;
  margin: 0 0 12px;
}

.security-modal-tip.security-error {
  color: #ff4d4f;
  font-weight: 500;
}

.security-modal-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 12px 24px 20px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .result-card {
    margin: 16px;
    padding: 20px 16px;
  }

  .success-icon {
    font-size: 56px;
  }

  .result-title {
    font-size: 22px;
  }

  .file-info {
    flex-wrap: wrap;
    gap: 12px;
  }

  .result-actions {
    flex-direction: column;
    gap: 10px;
  }

  .btn-lg {
    width: 100%;
    justify-content: center;
    padding: 12px 16px;
    font-size: 14px;
  }

  .export-menu {
    padding: 12px;
  }

  .format-grid {
    grid-template-columns: 1fr;
  }

  .quality-options {
    gap: 8px;
  }

  .quality-option {
    padding: 10px;
  }

  .quality-name {
    min-width: 36px;
    font-size: 12px;
  }

  .quality-desc {
    font-size: 11px;
  }

  .export-confirm-btn {
    width: 100%;
    padding: 12px;
  }

  .export-others {
    flex-direction: column;
  }

  .export-option {
    padding: 12px;
    font-size: 13px;
  }

  .preview-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .content-edit-panel {
    padding: 16px;
  }

  .edit-slides {
    grid-template-columns: 1fr;
    max-height: 300px;
  }

  .edit-slide-card {
    padding: 12px;
  }

  .edit-actions {
    flex-direction: column;
  }

  .edit-actions .btn {
    width: 100%;
  }
}

/* 版本历史面板样式 */
.btn-version {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #e5e5e5;
}

.btn-version:hover {
  background: #fff3e0;
  color: #e65100;
  border-color: #ff9800;
}

.version-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}

.version-panel {
  width: 400px;
  max-width: 90vw;
  height: 100%;
  background: #fff;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease;
  overflow: hidden;
}

.version-panel .panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  background: #fafafa;
}

.version-panel .panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.version-panel .panel-actions {
  display: flex;
  gap: 8px;
}

.btn-snapshot {
  background: #165DFF;
  color: #fff;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}

.btn-snapshot:hover {
  background: #0D47A1;
}

.btn-close-panel {
  background: #f5f5f5;
  color: #666;
  border: none;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.btn-close-panel:hover {
  background: #e0e0e0;
}

.version-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.version-item {
  display: flex;
  flex-direction: column;
  padding: 12px;
  margin-bottom: 8px;
  background: #f9f9f9;
  border: 2px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.version-item:hover {
  background: #f0f7ff;
  border-color: #e6f0ff;
}

.version-item.current {
  border-color: #165DFF;
  background: #e6f0ff;
}

.version-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.version-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.version-time {
  font-size: 12px;
  color: #999;
}

.version-slides {
  font-size: 11px;
  color: #666;
  background: #e5e5e5;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
  width: fit-content;
}

.version-actions {
  display: flex;
  gap: 8px;
}

.btn-mini {
  padding: 4px 10px;
  font-size: 11px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
}

.btn-mini:hover {
  border-color: #165DFF;
  color: #165DFF;
}

.btn-rollback {
  color: #e65100;
}

.btn-rollback:hover {
  background: #fff3e0;
  border-color: #ff9800;
  color: #e65100;
}

/* 标签页 */
.panel-tabs {
  display: flex;
  border-bottom: 1px solid #eee;
  background: #fafafa;
}

.panel-tabs .tab-btn {
  flex: 1;
  padding: 10px 12px;
  text-align: center;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.panel-tabs .tab-btn:hover {
  color: #165DFF;
  background: #f0f7ff;
}

.panel-tabs .tab-btn.active {
  color: #165DFF;
  border-bottom-color: #165DFF;
  font-weight: 600;
}

/* 操作日志 */
.action-log-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.undo-bar {
  padding: 10px 12px;
  border-bottom: 1px solid #eee;
  background: #fff;
}

.btn-undo {
  background: #ff9800;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  width: 100%;
  font-weight: 600;
}

.btn-undo:hover {
  background: #e65100;
}

.action-log-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.action-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px;
  margin-bottom: 8px;
  background: #f9f9f9;
  border-radius: 8px;
}

.action-item.undo-entry {
  background: #fff3e0;
  border: 1px solid #ffe0b2;
}

.action-icon {
  font-size: 18px;
  width: 28px;
  text-align: center;
  flex-shrink: 0;
}

.action-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.action-desc {
  font-size: 13px;
  color: #333;
}

.action-time {
  font-size: 11px;
  color: #999;
}

/* ========== 高级撤销/重做工具栏 ========== */
.undo-toolbar {
  padding: 10px 12px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.undo-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.undo-count {
  font-size: 12px;
  color: #666;
}
.checkpoint-info {
  font-size: 11px;
  color: #4caf50;
}
.undo-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.btn-timeline {
  background: #e3f2fd !important;
  color: #1976d2 !important;
  border: 1px solid #bbdefb !important;
}
.btn-timeline.active {
  background: #1976d2 !important;
  color: #fff !important;
}
.btn-branch {
  background: #f3e5f5 !important;
  color: #7b1fa2 !important;
  border: 1px solid #e1bee7 !important;
}
.btn-branch.active {
  background: #7b1fa2 !important;
  color: #fff !important;
}
.btn-merge {
  background: #fff3e0 !important;
  color: #e65100 !important;
  border: 1px solid #ffe0b2 !important;
}
.btn-merge:hover {
  background: #ffe0b2 !important;
}
.btn-checkpoint {
  background: #e8f5e9 !important;
  color: #388e3c !important;
  border: 1px solid #c8e6c9 !important;
}

/* ========== 可视化时间线 ========== */
.timeline-container {
  padding: 12px;
  max-height: 50%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.timeline-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}
.timeline-count {
  font-size: 11px;
  color: #999;
}
.timeline-scroll {
  flex: 1;
  max-height: 300px;
}
.timeline-list {
  position: relative;
  padding-left: 20px;
}
.timeline-item {
  position: relative;
  padding-left: 20px;
  margin-bottom: 12px;
}
.timeline-dot {
  position: absolute;
  left: 0;
  top: 4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #2196f3;
  border: 2px solid #fff;
  box-shadow: 0 0 0 2px #e3f2fd;
  z-index: 1;
}
.timeline-item.timeline-undo .timeline-dot {
  background: #ff9800;
  box-shadow: 0 0 0 2px #fff3e0;
}
.timeline-item.timeline-redo .timeline-dot {
  background: #4caf50;
  box-shadow: 0 0 0 2px #e8f5e9;
}
.timeline-item.timeline-checkpoint .timeline-dot {
  background: #9c27b0;
  box-shadow: 0 0 0 2px #f3e5f5;
}
.timeline-item.timeline-branch .timeline-dot {
  background: #e91e63;
  box-shadow: 0 0 0 2px #fce4ec;
}
.timeline-line {
  position: absolute;
  left: 4px;
  top: 16px;
  width: 2px;
  height: calc(100% - 4px);
  background: #e0e0e0;
}
.timeline-content {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: background 0.2s;
}
.timeline-content:hover {
  background: #f0f0f0;
}
.timeline-icon {
  font-size: 16px;
}
.timeline-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.timeline-desc {
  font-size: 12px;
  color: #333;
}
.timeline-time {
  font-size: 10px;
  color: #999;
}
.timeline-action {
  flex-shrink: 0;
}
.btn-branch-undo {
  font-size: 10px;
  padding: 2px 6px;
  background: #fff3e0;
  color: #e65100;
  border: 1px solid #ffe0b2;
  border-radius: 4px;
}

/* ========== 检查点列表 ========== */
.checkpoint-list {
  padding: 12px;
  border-top: 1px solid #e0e0e0;
}
.checkpoint-header {
  margin-bottom: 10px;
}
.checkpoint-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}
.checkpoint-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: #f9f9f9;
  border-radius: 6px;
  margin-bottom: 6px;
}
.checkpoint-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  cursor: pointer;
}
.checkpoint-name {
  font-size: 12px;
  color: #333;
}
.checkpoint-time {
  font-size: 10px;
  color: #999;
}
.checkpoint-type {
  font-size: 10px;
  color: #4caf50;
}

/* ========== 协作锁状态 ========== */
.collab-locks {
  padding: 12px;
  border-top: 1px solid #e0e0e0;
  background: #fff8e1;
}
.collab-title {
  font-size: 12px;
  font-weight: 600;
  color: #f57c00;
  display: block;
  margin-bottom: 8px;
}
.collab-lock-item {
  font-size: 11px;
  color: #e65100;
  padding: 4px 0;
}

.empty-tip {
  text-align: center;
  color: #999;
  font-size: 13px;
  padding: 20px;
}

/* ========== A/B Testing ========== */
.ab-test-panel {
  padding: 12px;
  max-height: 70%;
  overflow-y: auto;
}
.ab-test-header {
  margin-bottom: 12px;
}
.ab-test-header .section-title {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}
.ab-test-tip {
  font-size: 11px;
  color: #999;
}
.ab-create-section {
  background: #f0f7ff;
  border: 1px solid #d0e8ff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  text-align: center;
}
.ab-create-label {
  display: block;
  font-size: 13px;
  color: #333;
  margin-bottom: 8px;
}
.btn-create-ab {
  font-size: 13px;
  padding: 6px 16px;
}
.ab-test-list {
  margin-top: 8px;
}
.list-title {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}
.ab-test-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 8px;
}
.ab-test-info {
  flex: 1;
}
.ab-test-name {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #333;
}
.ab-test-meta {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}
.status-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
}
.status-badge.running {
  background: #e3f2fd;
  color: #1976d2;
}
.status-badge.completed {
  background: #e8f5e9;
  color: #388e3c;
}
.meta-text {
  font-size: 11px;
  color: #999;
}
.btn-view-result {
  font-size: 12px;
  padding: 4px 10px;
}
/* A/B Result */
.ab-result-section {
  margin-top: 8px;
}
.ab-result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.variant-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.variant-card {
  background: #fff;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 12px;
}
.variant-card:first-child {
  border-color: #bbdefb;
}
.variant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.variant-label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}
.winner-badge {
  font-size: 11px;
  background: #fff8e1;
  color: #f57f17;
  padding: 2px 8px;
  border-radius: 4px;
}
.variant-strategy {
  font-size: 11px;
  color: #666;
  margin-bottom: 8px;
}
.variant-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-bottom: 8px;
}
.stat-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}
.stat-label {
  color: #999;
}
.stat-value {
  color: #333;
  font-weight: 500;
}
.stat-value.highlight {
  color: #e65100;
  font-weight: 700;
}
.variant-preview {
  background: #fafafa;
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 8px;
}
.preview-title {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}
.preview-content {
  font-size: 11px;
  color: #666;
}
.btn-apply-winner {
  width: 100%;
  font-size: 13px;
  padding: 8px;
}
/* ========== Suggest Improvements ========== */
.suggest-panel {
  padding: 12px;
  max-height: 70%;
  overflow-y: auto;
}
.suggest-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.suggest-header .section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}
.suggest-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.suggest-item {
  display: flex;
  gap: 10px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 10px;
  align-items: flex-start;
}
.suggest-item.priority-high {
  border-left: 3px solid #f44336;
}
.suggest-item.priority-medium {
  border-left: 3px solid #ff9800;
}
.suggest-item.priority-low {
  border-left: 3px solid #4caf50;
}
.suggest-icon {
  font-size: 16px;
  flex-shrink: 0;
}
.suggest-content {
  flex: 1;
}
.suggest-title {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}
.suggest-desc {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}
.suggest-action {
  display: block;
  font-size: 11px;
  color: #165DFF;
  margin-bottom: 2px;
}
.suggest-slide {
  display: block;
  font-size: 11px;
  color: #999;
}
.priority-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}
.priority-badge.high {
  background: #ffebee;
  color: #c62828;
}
.priority-badge.medium {
  background: #fff3e0;
  color: #e65100;
}
.priority-badge.low {
  background: #e8f5e9;
  color: #2e7d32;
}
/* ========== Enhanced Diff View ========== */
.diff-view {
  border-top: 1px solid #eee;
  padding: 12px;
  background: #fafafa;
  max-height: 70%;
  overflow-y: auto;
}
.diff-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}
.diff-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.diff-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}
.diff-count {
  font-size: 12px;
  color: #e65100;
  background: #fff3e0;
  padding: 2px 8px;
  border-radius: 4px;
}
.diff-slides {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.diff-item {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 12px;
}
.diff-slide-title {
  font-size: 12px;
  font-weight: 600;
  color: #165DFF;
  margin-bottom: 8px;
}
.diff-content.side-by-side {
  display: flex;
  gap: 8px;
  flex-direction: row;
}
.diff-side {
  flex: 1;
  min-width: 0;
}
.side-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}
.side-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
}
.before-badge {
  background: #ffebee;
  color: #c62828;
}
.after-badge {
  background: #e8f5e9;
  color: #2e7d32;
}
.side-label {
  font-size: 10px;
  color: #999;
}
.slide-preview-box {
  background: #fafafa;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 8px;
}
.preview-label-title {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}
.preview-label-layout {
  display: block;
  font-size: 10px;
  color: #999;
  margin-bottom: 4px;
}
.preview-text {
  font-size: 11px;
  color: #666;
  word-break: break-all;
  line-height: 1.4;
}
/* R136: Visual diff thumbnails */
.visual-diff-thumbnail {
  width: 100%;
  margin-bottom: 8px;
  border-radius: 6px;
  overflow: hidden;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
}
.diff-slide-img {
  width: 100%;
  height: auto;
  display: block;
  object-fit: contain;
}
.change-type-tags {
  display: inline-flex;
  gap: 4px;
  margin-left: 8px;
}
.change-type-tag {
  font-size: 10px;
  padding: 1px 6px;
  background: #fff3e0;
  color: #e65100;
  border-radius: 4px;
  font-weight: normal;
}
.diff-footer {
  margin-top: 12px;
  text-align: center;
}
/* ========== Panel Action Buttons ========== */
.btn-abtest {
  background: #e8f5e9;
  color: #2e7d32;
  border: none;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
}
.btn-suggest {
  background: #fff8e1;
  color: #f57f17;
  border: none;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
}

.diff-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.diff-before, .diff-after {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.diff-before .label {
  font-size: 10px;
  color: #999;
}

.diff-after .label {
  font-size: 10px;
  color: #4caf50;
}

.diff-slide-text {
  font-size: 13px;
  color: #333;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
}

.diff-footer {
  margin-top: 12px;
  text-align: center;
}

/* 快速调优侧边栏样式 */
.layout-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}

.layout-panel {
  width: 360px;
  max-width: 90vw;
  height: 100%;
  background: #fff;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.panel-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
  padding: 4px;
}

.panel-close:hover {
  color: #333;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.panel-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
}

.layout-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.layout-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border: 2px solid #e5e5e5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.layout-item:hover {
  border-color: #165DFF;
  background: #f0f9ff;
}

.layout-item.active {
  border-color: #165DFF;
  background: #e6f0ff;
}

.layout-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.layout-name {
  font-size: 12px;
  color: #333;
  text-align: center;
}

.color-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.color-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border: 2px solid #e5e5e5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.color-item:hover {
  border-color: #165DFF;
}

.color-item.active {
  border-color: #165DFF;
  background: #f0f9ff;
}

.color-swatches {
  display: flex;
  gap: 4px;
  margin-right: 12px;
}

.color-swatch {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.color-name {
  font-size: 13px;
  color: #333;
}

.style-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.style-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border: 2px solid #e5e5e5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.style-item:hover {
  border-color: #165DFF;
}

.style-item.active {
  border-color: #165DFF;
  background: #e6f0ff;
}

.style-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.style-name {
  font-size: 12px;
  color: #333;
  text-align: center;
}

.panel-footer {
  padding: 16px 20px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 12px;
}

.panel-footer .btn {
  flex: 1;
  padding: 10px 16px;
}

@media (max-width: 480px) {
  .layout-panel {
    width: 100%;
  }

  .layout-options,
  .style-options {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Transition Panel */
.transition-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}

.transition-panel {
  width: 360px;
  max-width: 90vw;
  height: 100%;
  background: #fff;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease;
}

.transition-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.transition-options-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.transition-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 8px;
  border: 2px solid #e5e5e5;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafafa;
}

.transition-item:hover {
  border-color: #165DFF;
  background: #f0f5ff;
}

.transition-item.active {
  border-color: #165DFF;
  background: #e8f0ff;
}

.transition-icon {
  font-size: 24px;
  margin-bottom: 6px;
}

.transition-name {
  font-size: 12px;
  color: #333;
}

.duration-options {
  display: flex;
  gap: 8px;
}

.duration-item {
  flex: 1;
  padding: 8px 12px;
  background: #f5f5f5;
  border: 2px solid #e5e5e5;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  color: #333;
}

.duration-item:hover {
  border-color: #165DFF;
}

.duration-item.active {
  border-color: #165DFF;
  background: #e8f0ff;
  color: #165DFF;
  font-weight: 600;
}

/* Custom Duration Slider */
.custom-duration-slider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.duration-range {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: linear-gradient(to right, #165DFF 0%, #e8f0ff 100%);
  border-radius: 3px;
  outline: none;
}

.duration-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: #165DFF;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.duration-range::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: #165DFF;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.duration-value {
  font-size: 14px;
  font-weight: 600;
  color: #165DFF;
  min-width: 40px;
  text-align: right;
}

/* Sound Effects */
.sound-effects-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.sound-effect-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 6px;
  border: 2px solid #e5e5e5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafafa;
}

.sound-effect-item:hover {
  border-color: #165DFF;
  background: #f0f5ff;
}

.sound-effect-item.active {
  border-color: #165DFF;
  background: #e8f0ff;
}

.sound-icon {
  font-size: 20px;
  margin-bottom: 4px;
}

.sound-name {
  font-size: 11px;
  color: #333;
}

/* Morph & Random Info */
.morph-info, .random-info {
  background: #f5f7ff;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.morph-desc, .random-desc {
  font-size: 12px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

.morph-badge, .random-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #165DFF;
  color: #fff;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  width: fit-content;
}

.morph-icon, .random-icon {
  font-size: 14px;
}

/* Toggle Switch Small */
.toggle-switch-small {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
  margin-left: 8px;
}

.toggle-switch-small input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider-small {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 20px;
}

.toggle-slider-small:before {
  position: absolute;
  content: "";
  height: 14px;
  width: 14px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

.toggle-switch-small input:checked + .toggle-slider-small {
  background-color: #165DFF;
}

.toggle-switch-small input:checked + .toggle-slider-small:before {
  transform: translateX(16px);
}

/* Preview Button */
.preview-btn {
  margin-left: auto;
  padding: 4px 10px;
  background: #165DFF;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.preview-btn:hover {
  background: #0d47cc;
}

.preview-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* Live Preview Container */
.live-preview-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  border-radius: 10px;
  overflow: hidden;
  min-height: 160px;
}

.preview-slide-a, .preview-slide-b {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.preview-box {
  width: 100px;
  height: 60px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 6px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.preview-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
}

.preview-transition-indicator {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
}

.sound-effect-badge {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
}

/* Preview Animations */
.preview-slide-active {
  animation: slideInPreview 0.5s ease forwards;
}

@keyframes slideInPreview {
  from { transform: translateX(-30px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes fadeInPreview {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes zoomInPreview {
  from { opacity: 0; transform: scale(0.5); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes flipInPreview {
  from { opacity: 0; transform: rotateY(-40deg); }
  to { opacity: 1; transform: rotateY(0); }
}

@keyframes morphPreview {
  0% { transform: scale(1) skewX(0deg); filter: blur(0); }
  50% { transform: scale(0.95) skewX(5deg); filter: blur(2px); }
  100% { transform: scale(1) skewX(0deg); filter: blur(0); }
}

@keyframes randomPreview {
  0% { transform: translateX(0) rotate(0deg); }
  25% { transform: translateX(10px) rotate(2deg); }
  50% { transform: translateX(-5px) rotate(-1deg); }
  75% { transform: translateX(8px) rotate(1deg); }
  100% { transform: translateX(0) rotate(0deg); }
}

/* Live preview when playing */
.live-preview-container.previewing .preview-slide-a {
  animation: slideOutPreview 0.5s ease forwards;
}

.live-preview-container.previewing .preview-slide-b {
  animation: fadeInPreview 0.5s ease forwards;
}

@keyframes slideOutPreview {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(30px); opacity: 0; }
}

/* Morph transition preview */
.preview-morph-active {
  animation: morphPreview 0.6s ease infinite;
}

/* Random transition preview */
.preview-random-active {
  animation: randomPreview 0.5s ease infinite;
}

/* Box variations for different transitions */
.preview-box-slide-active {
  animation: slideInPreview 0.5s ease infinite alternate;
}

.preview-box-fade-active {
  animation: fadeInPreview 0.5s ease infinite alternate;
}

.preview-box-zoom-active {
  animation: zoomInPreview 0.5s ease infinite alternate;
}

.preview-box-flip-active {
  animation: flipInPreview 0.5s ease infinite alternate;
}

.preview-box-morph-active {
  animation: morphPreview 0.6s ease infinite alternate;
}

.preview-box-random-active {
  animation: randomPreview 0.5s ease infinite alternate;
}

.apply-options {
  display: flex;
  gap: 16px;
}

.apply-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  cursor: pointer;
  color: #333;
}

.auto-advance-option {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
  color: #333;
}

.auto-delay-select {
  padding: 8px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 13px;
  background: #fff;
  color: #333;
}

.transition-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 10px;
}

.preview-box {
  width: 80px;
  height: 50px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 4px;
  transition: all 0.5s ease;
}

.preview-label {
  font-size: 12px;
  color: #666;
}

.preview-slide .preview-box {
  animation: previewSlide 0.5s ease infinite alternate;
}

.preview-fade .preview-box {
  animation: previewFade 0.5s ease infinite alternate;
}

.preview-zoom .preview-box {
  animation: previewZoom 0.5s ease infinite alternate;
}

.preview-flip .preview-box {
  animation: previewFlip 0.5s ease infinite alternate;
}

@keyframes previewSlide {
  0% { transform: translateX(-20px); opacity: 0.5; }
  100% { transform: translateX(0); opacity: 1; }
}

@keyframes previewFade {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes previewZoom {
  0% { transform: scale(0.7); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes previewFlip {
  0% { transform: rotateY(-30deg); opacity: 0; }
  100% { transform: rotateY(0deg); opacity: 1; }
}

@media (max-width: 480px) {
  .transition-panel {
    width: 100%;
  }

  .transition-options {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* ============ Mobile Touch & Responsive Enhancements ============ */

/* Swipe hint indicator */
.swipe-hint {
  text-align: center;
  font-size: 12px;
  color: #999;
  margin-bottom: 12px;
  animation: pulse 2s ease-in-out infinite;
}

@media (min-width: 769px) {
  .swipe-hint {
    display: none;
  }
}

/* Mobile: Make side panels full-screen */
@media (max-width: 767px) {
  .version-panel-overlay,
  .layout-panel-overlay,
  .transition-panel-overlay {
    align-items: flex-end !important;
    justify-content: stretch !important;
  }

  .version-panel,
  .layout-panel,
  .transition-panel {
    width: 100% !important;
    max-width: 100vw !important;
    height: 90vh !important;
    border-radius: 20px 20px 0 0 !important;
    animation: slideInUp 0.3s ease !important;
  }

  .layout-panel-overlay .layout-panel {
    height: 95vh !important;
  }
}

/* Mobile: result card adjustments */
@media (max-width: 767px) {
  .result-card {
    border-radius: 20px 20px 0 0 !important;
    margin: 0 !important;
    padding: 20px 12px !important;
    min-height: 100vh;
  }

  .result {
    padding: 0 !important;
    align-items: flex-start !important;
  }

  .file-info {
    gap: 12px;
    padding: 12px;
  }

  .ppt-preview-section {
    padding: 12px;
  }

  .preview-grid {
    display: flex !important;
    overflow-x: auto !important;
    scroll-snap-type: x mandatory !important;
    gap: 12px !important;
    padding-bottom: 8px !important;
    -webkit-overflow-scrolling: touch;
  }

  .preview-slide {
    flex: 0 0 85% !important;
    scroll-snap-align: center !important;
    aspect-ratio: 16/9 !important;
  }

  .result-actions {
    position: sticky !important;
    bottom: 0 !important;
    background: white !important;
    padding: 12px 0 !important;
    margin: 0 -12px !important;
    padding-left: 12px !important;
    padding-right: 12px !important;
    box-shadow: 0 -4px 12px rgba(0,0,0,0.1) !important;
    z-index: 10;
  }

  /* Mobile: floating toolbar repositions */
  .function-toolbar {
    right: 12px !important;
    bottom: 160px !important;
  }

  .toolbar-btn {
    width: 52px !important;
    height: 52px !important;
    font-size: 22px !important;
  }

  /* Mobile: more menu full-width */
  .more-menu {
    left: 0 !important;
    right: 0 !important;
    border-radius: 12px 12px 0 0 !important;
    bottom: 60px !important;
    top: auto !important;
  }
}

/* Tablet breakpoint */
@media (min-width: 768px) and (max-width: 1024px) {
  .result-card {
    max-width: 90%;
    padding: 32px 24px;
  }

  .preview-grid {
    grid-template-columns: repeat(3, 1fr) !important;
  }

  .function-toolbar {
    right: 16px;
    bottom: 60px;
  }
}

@keyframes slideInUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

/* Mobile: ensure all dialogs/modals are mobile-friendly */
@media (max-width: 767px) {
  .modal-mask .save-template-modal {
    width: 100% !important;
    max-width: 100vw !important;
    height: 100vh !important;
    max-height: 100vh !important;
    border-radius: 0 !important;
    margin: 0 !important;
    overflow-y: auto !important;
    padding: 24px 16px !important;
  }

  .share-menu {
    flex-wrap: wrap;
  }

  .share-option {
    flex: 1 1 40%;
    padding: 10px 12px;
  }

  .export-menu {
    padding: 12px;
  }

  .export-confirm-btn {
    width: 100% !important;
    padding: 14px !important;
  }
}

/* 模板保存 - 主题色 */
.theme-colors-item .form-label {
  display: block;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 8px;
}

.theme-color-pickers {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.theme-color-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.theme-color-field label {
  font-size: 12px;
  color: #666;
  width: 36px;
  flex-shrink: 0;
}

.theme-color-input {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.theme-color-input input[type="color"] {
  width: 36px;
  height: 28px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  padding: 1px;
}

.theme-color-input input[type="text"] {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
}

.theme-preview-strip {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.strip-primary,
.strip-secondary,
.strip-accent {
  height: 20px;
  border-radius: 4px;
  flex: 1;
  border: 1px solid rgba(0,0,0,0.08);
}

/* 批量主题弹窗 */
.modal-mask .batch-theme-modal {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  width: 420px;
  max-width: 95vw;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  animation: fadeIn 0.2s ease;
}

.modal-mask .batch-theme-modal .modal-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #1a1a1a;
}
/* 批量导出弹窗 */
.modal-mask .batch-export-modal {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  width: 440px;
  max-width: 95vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  animation: fadeIn 0.2s ease;
}

.modal-mask .batch-export-modal .modal-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #1a1a1a;
}

.modal-mask .batch-export-modal .modal-desc {
  font-size: 13px;
  color: #888;
  margin-bottom: 16px;
}

.batch-export-list {
  flex: 1;
  overflow-y: auto;
  max-height: 300px;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.batch-export-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.batch-export-item:hover {
  border-color: #b3b3b3;
  background: #fafafa;
}

.batch-export-item.selected {
  border-color: #165DFF;
  background: #f0f5ff;
}

.batch-export-item.current {
  border-color: #52c41a;
  background: #f6ffed;
}

.batch-export-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.batch-export-info {
  flex: 1;
  min-width: 0;
}

.batch-export-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.batch-export-meta {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

.batch-current-tag {
  font-size: 10px;
  color: #52c41a;
  background: #f6ffed;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #b7eb8f;
  flex-shrink: 0;
}

.batch-export-summary {
  font-size: 13px;
  color: #666;
  margin: 12px 0;
  text-align: center;
  font-weight: 500;
}

.modal-mask .batch-theme-modal .modal-desc {
  font-size: 13px;
  color: #888;
  margin-bottom: 20px;
}

.theme-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.preset-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  background: #fafafa;
  cursor: pointer;
  font-size: 12px;
  color: #333;
  transition: all 0.2s;
}

.preset-btn:hover {
  border-color: #165DFF;
  background: #f0f5ff;
}

.preset-colors {
  display: flex;
  gap: 2px;
}

.preset-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(0,0,0,0.1);
}

.color-input-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-picker {
  width: 40px;
  height: 36px;
  padding: 2px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  cursor: pointer;
}

.color-text {
  flex: 1;
  height: 36px;
  padding: 0 10px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 13px;
  font-family: monospace;
}

/* 团队协作面板 */
.workspace-panel-overlay,
.activity-panel-overlay,
.comments-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
  animation: fadeIn 0.2s ease;
}

.workspace-panel,
.activity-panel,
.comments-panel {
  width: 400px;
  max-width: 90vw;
  height: 100%;
  background: #fff;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease;
  overflow: hidden;
}

:global(.dark) .workspace-panel,
:global(.dark) .activity-panel,
:global(.dark) .comments-panel {
  background: #1a1a1a;
}

.workspace-panel-overlay .panel-close,
.activity-panel-overlay .panel-close,
.comments-panel-overlay .panel-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
  padding: 4px 8px;
  border-radius: 4px;
}

.workspace-panel-overlay .panel-close:hover,
.activity-panel-overlay .panel-close:hover,
.comments-panel-overlay .panel-close:hover {
  background: #f0f0f0;
}

/* 工具栏协作按钮激活状态 */
.function-toolbar .toolbar-btn.active {
  background: #165DFF;
  color: white;
  box-shadow: 0 2px 8px rgba(22, 93, 255, 0.3);
}

.ai-toolbar-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  color: white !important;
}

.ai-toolbar-btn:hover {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%) !important;
}

.ai-toolbar-btn.active {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
  color: white !important;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .workspace-panel-overlay,
  .activity-panel-overlay,
  .comments-panel-overlay {
    align-items: flex-end;
    justify-content: stretch;
  }

  .workspace-panel,
  .activity-panel,
  .comments-panel {
    width: 100%;
    max-width: 100vw;
    height: 85vh;
    border-radius: 20px 20px 0 0;
    animation: slideInUp 0.3s ease;
  }

  .function-toolbar .toolbar-btn.active {
    background: #165DFF;
    color: white;
  }

  .function-toolbar {
    right: 12px !important;
    bottom: 160px !important;
  }
}

@keyframes slideInUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

/* ===== Master Editor & Animation Composer shared panel styles ===== */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-grid .form-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-grid .form-item .form-input,
.form-grid .form-item .form-select {
  width: 100%;
}

/* Master preview box */
.master-preview-box {
  padding: 20px;
  border-radius: 8px;
  border: 1px solid rgba(128,128,128,0.2);
  min-height: 80px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all 0.3s ease;
}

.master-preview-title {
  font-weight: 700;
  line-height: 1.2;
}

.master-preview-body {
  line-height: 1.5;
}

.apply-tip {
  font-size: 12px;
  color: #64748b;
  margin-left: 8px;
}

/* ===== Timeline Transition Preview ===== */
.timeline-transition-preview-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  padding: 12px 0;
  position: relative;
}

.timeline-slide-thumb {
  width: 64px;
  height: 48px;
  background: #e2e8f0;
  border: 2px solid #cbd5e1;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.next-thumb {
  background: #bfdbfe;
  border-color: #2563eb;
}

.timeline-transition-arrow {
  display: flex;
  align-items: center;
  flex: 1;
  justify-content: center;
  position: relative;
  z-index: 0;
}

.tl-arrow-line {
  flex: 1;
  height: 2px;
  background: linear-gradient(to right, #cbd5e1, #94a3b8);
  position: relative;
}

.tl-arrow-head {
  width: 20px;
  text-align: center;
  color: #64748b;
  font-size: 10px;
}

/* Transition animations */
.tl-trans-slide {
  animation: tl-slide-arrow 0.5s ease-in-out infinite alternate;
}

.tl-next-slide {
  animation: tl-slide-next 0.5s ease-in-out infinite alternate;
}

.tl-trans-fade {
  animation: tl-fade-arrow 0.5s ease-in-out infinite alternate;
}

.tl-next-fade {
  animation: tl-fade-next 0.5s ease-in-out infinite alternate;
}

.tl-trans-zoom {
  animation: tl-zoom-arrow 0.5s ease-in-out infinite alternate;
}

.tl-next-zoom {
  animation: tl-zoom-next 0.5s ease-in-out infinite alternate;
}

.tl-trans-flip {
  animation: tl-flip-arrow 0.5s ease-in-out infinite alternate;
}

.tl-next-flip {
  animation: tl-flip-next 0.5s ease-in-out infinite alternate;
}

@keyframes tl-slide-arrow {
  0% { opacity: 0.4; }
  100% { opacity: 1; }
}

@keyframes tl-slide-next {
  0% { transform: translateX(-8px); opacity: 0.5; }
  100% { transform: translateX(0); opacity: 1; }
}

@keyframes tl-fade-arrow {
  0% { opacity: 0.3; }
  100% { opacity: 0.8; }
}

@keyframes tl-fade-next {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes tl-zoom-arrow {
  0% { opacity: 0.3; transform: scale(0.9); }
  100% { opacity: 0.8; transform: scale(1); }
}

@keyframes tl-zoom-next {
  0% { opacity: 0; transform: scale(0.8); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes tl-flip-arrow {
  0% { opacity: 0.3; }
  100% { opacity: 0.8; }
}

@keyframes tl-flip-next {
  0% { transform: rotateY(0deg); opacity: 0; }
  100% { transform: rotateY(180deg); opacity: 1; }
}

.transition-duration-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
}

.transition-label-text {
  font-size: 13px;
  color: #475569;
}

.transition-speed-badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.speed-fast { background: #dbeafe; color: #1d4ed8; }
.speed-normal { background: #dcfce7; color: #166534; }
.speed-slow { background: #fef9c3; color: #854d0e; }

/* ===== Animation Preview Stage ===== */
.animation-preview-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f1f5f9;
  border-radius: 8px;
  min-height: 90px;
}

.animation-preview-box {
  width: 48px;
  height: 48px;
  background: #2563eb;
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
}

.preview-desc {
  font-size: 11px;
  color: #64748b;
  text-align: center;
}

/* Animation keyframes for preview */
@keyframes preview-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes preview-slide {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes preview-zoom {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes preview-bounce {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.95); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes preview-flip {
  from { transform: rotateY(0deg); opacity: 0; }
  to { transform: rotateY(180deg); opacity: 1; }
}

@keyframes preview-rotate {
  from { transform: rotate(-90deg) scale(0.8); opacity: 0; }
  to { transform: rotate(0deg) scale(1); opacity: 1; }
}

/* ========== Clipboard & Content Integration Styles ========== */

/* Drag overlay */
.drag-overlay {
  position: absolute;
  inset: 0;
  background: rgba(22, 93, 255, 0.08);
  border: 3px dashed #165DFF;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  animation: fadeIn 0.15s ease;
}

.drag-hint {
  text-align: center;
}

.drag-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.drag-hint p {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #165DFF;
}

.drag-tip {
  font-size: 13px !important;
  font-weight: 400 !important;
  color: #666 !important;
  margin-top: 4px !important;
}

.content-edit-panel.drag-over {
  position: relative;
}

/* Clip tip */
.clip-tip {
  font-size: 12px;
  color: #999;
  font-weight: 400;
  margin-left: 8px;
}

/* Edit actions - new clipboard buttons */
.edit-actions .btn-clip {
  font-size: 13px;
}

/* Clipboard history overlay */
.clipboard-history-overlay,
.paste-preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease;
}

.clipboard-history-panel,
.paste-preview-panel {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 520px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
}

.clip-panel-header,
.paste-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.clip-panel-header h3,
.paste-panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.clip-panel-actions {
  display: flex;
  gap: 8px;
}

.clip-empty {
  padding: 40px 20px;
  text-align: center;
  color: #999;
}

.clip-empty p {
  margin: 0 0 8px;
}

.clip-empty-tip {
  font-size: 13px;
  color: #bbb;
}

.clip-list {
  overflow-y: auto;
  max-height: 60vh;
  padding: 8px;
}

.clip-item {
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid #f0f0f0;
  margin-bottom: 8px;
  transition: all 0.15s ease;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.clip-item:hover {
  background: #f5f7ff;
  border-color: #165DFF;
}

.clip-item-type {
  font-size: 12px;
  color: #999;
}

.clip-item-preview img {
  max-width: 100%;
  max-height: 120px;
  border-radius: 6px;
  object-fit: contain;
}

.clip-item-text {
  font-size: 13px;
  color: #333;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.clip-item-time {
  font-size: 11px;
  color: #bbb;
  text-align: right;
}

/* Paste preview panel */
.paste-panel-body {
  padding: 20px;
  overflow-y: auto;
  max-height: 60vh;
}

.paste-image-preview img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  object-fit: contain;
  border: 1px solid #eee;
}

.paste-text-preview {
  background: #f9fafb;
  border-radius: 10px;
  padding: 16px;
}

.paste-preview-title {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.paste-text-content {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.paste-text-bullets {
  font-size: 14px;
  color: #555;
  line-height: 1.8;
}

.paste-text-bullets > div {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.paste-layout-hint {
  margin-top: 12px;
  font-size: 12px;
  color: #999;
}

.paste-layout-hint span {
  color: #165DFF;
  font-weight: 500;
}

.paste-panel-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .clipboard-history-panel,
  .paste-preview-panel {
    width: 95%;
    max-height: 85vh;
  }

  .edit-actions .btn-clip span {
    display: none;
  }
}

/* Localize Modal */
.localize-modal {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  width: 420px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
}

.localize-modal .modal-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #1a1a1a;
}

.localize-modal .modal-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
}

.detected-lang-display {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #f5f5f5;
  border-radius: 8px;
  font-weight: 500;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}

.checkbox-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

/* RWD: security panel (R122) */
@media (max-width: 767px) {
  .security-panel {
    width: 100vw !important;
    max-height: 90vh !important;
    border-radius: 20px 20px 0 0 !important;
    height: auto !important;
  }

  .security-download-modal {
    width: 100vw !important;
    max-width: 100vw !important;
    border-radius: 20px 20px 0 0 !important;
    height: auto !important;
  }
}

/* Sharing Analytics & Folder Panel overlays */
.sharing-analytics-overlay,
.folder-panel-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 900;
}

.sharing-analytics-panel,
.folder-panel {
  max-height: 90vh;
  max-width: 95vw;
  overflow: hidden;
  border-radius: 16px;
}

@media (max-width: 767px) {
  .sharing-analytics-panel,
  .folder-panel {
    width: 100vw !important;
    max-height: 90vh !important;
    border-radius: 20px 20px 0 0 !important;
    height: auto !important;
  }
}

</style>
