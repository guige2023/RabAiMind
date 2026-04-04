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
            <div class="preview-grid" v-else>
              <template v-if="previewSlides.length > 0">
                <div
                  v-for="(slide, index) in previewSlides.slice(0, 6)"
                  :key="slide.slideNum"
                  class="preview-slide"
                >
                  <div class="slide-number-badge">{{ slide.slideNum }}</div>
                  <img
                    :src="slide.url"
                    :alt="`第 ${slide.slideNum} 页`"
                    class="preview-image"
                    @error="onPreviewError($event, slide.slideNum)"
                  />
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
                <button @click="showVersionPanel = true; showMoreMenu = false; loadVersionHistory()">
                  <span>📜</span> 版本历史
                </button>
                <button @click="handleNew">
                  <span>✨</span> 创建新的
                </button>
              </div>
            </div>
          </div>

          <!-- 浮动工具栏 -->
          <div class="function-toolbar">
            <button class="toolbar-btn" @click="showLayoutPanel = true" title="快速调优">
              🎨
            </button>
            <button class="toolbar-btn" @click="showChartEditor = true" title="图表编辑">
              📊
            </button>
            <button class="toolbar-btn" @click="showElementEditor = true" title="元素微调">
              🛠️
            </button>
            <button class="toolbar-btn" @click="showTransitionPanel = true" title="幻灯片过渡">
              🔀
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

          <!-- 内容编辑面板 -->
          <div v-if="isEditMode" class="content-edit-panel">
            <div class="edit-header">
              <h3>编辑幻灯片内容</h3>
              <p class="edit-tip">点击下方标题或内容进行编辑，修改后可重新生成</p>
            </div>
            <div class="edit-slides">
              <div
                v-for="(slide, index) in editableSlides"
                :key="index"
                class="edit-slide-card"
              >
                <div class="edit-slide-header">
                  <span class="slide-num">第 {{ index + 1 }} 页</span>
                  <select v-model="slide.layout" class="layout-select">
                    <option value="title">标题页</option>
                    <option value="content">内容页</option>
                    <option value="two_column">双栏</option>
                    <option value="left_image_right_text">左图右文</option>
                    <option value="left_text_right_image">左文右图</option>
                    <option value="card">卡片</option>
                    <option value="center_radiation">居中</option>
                  </select>
                  <!-- 操作按钮 -->
                  <div class="slide-action-btns">
                    <button class="slide-action-btn" @click="moveSlideUp(index)" :disabled="index === 0" title="上移">⬆️</button>
                    <button class="slide-action-btn" @click="moveSlideDown(index)" :disabled="index === editableSlides.length - 1" title="下移">⬇️</button>
                    <button class="slide-action-btn" @click="deleteSlide(index)" :disabled="editableSlides.length <= 1" title="删除">🗑️</button>
                  </div>
                </div>
                <input
                  v-model="slide.title"
                  type="text"
                  class="edit-slide-title"
                  placeholder="幻灯片标题"
                />
                <textarea
                  v-model="slide.content"
                  class="edit-slide-content"
                  placeholder="幻灯片内容，每行一个要点"
                  rows="4"
                ></textarea>
                <!-- 单页预览按钮 -->
                <button class="btn btn-sm btn-preview" @click="previewSlide(index)">
                  👁️ 预览此页
                </button>
                <!-- 图片操作按钮 -->
                <div class="slide-image-controls">
                  <button class="btn btn-sm btn-image-upload" @click="triggerImageUpload(index)">
                    📷 上传图片
                  </button>
                  <button class="btn btn-sm btn-image-regenerate" @click="regenerateSlideImage(index)">
                    🎨 AI生成
                  </button>
                  <button
                    class="btn btn-sm btn-image-remove"
                    @click="removeSlideImage(index)"
                    v-if="slide.imageUrl"
                  >
                    🗑️ 移除图片
                  </button>
                  <input
                    type="file"
                    :ref="el => imageUploadRefs[index] = el"
                    accept="image/*"
                    style="display: none"
                    @change="handleImageUpload(index, $event)"
                  />
                  <!-- 当前图片预览 -->
                  <div v-if="slide.imageUrl" class="slide-image-preview">
                    <img :src="slide.imageUrl" alt="当前图片" />
                  </div>
                </div>
              </div>
            </div>
            <div class="edit-actions">
              <button class="btn btn-outline" @click="addEditSlide">
                + 添加页面
              </button>
              <button class="btn btn-primary" @click="regenerateWithEdits" :disabled="isRegenerating">
                {{ isRegenerating ? '重新生成中...' : '💾 重新生成PPT' }}
              </button>
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
    />

    <!-- 版本历史侧边面板 -->
    <div v-if="showVersionPanel" class="version-panel-overlay" @click="showVersionPanel = false">
      <div class="version-panel" @click.stop>
        <view class="panel-header">
          <text class="panel-title">📜 版本历史</text>
          <view class="panel-actions">
            <button class="btn btn-sm btn-snapshot" @click="createSnapshot">💾 快照</button>
            <button class="btn btn-sm btn-close-panel" @click="showVersionPanel = false">✕</button>
          </view>
        </view>
        
        <!-- 标签页切换: 版本历史 / 操作日志 -->
        <view class="panel-tabs">
          <view :class="['tab-btn', !showActionLog ? 'active' : '']" @click="showActionLog = false; loadVersionHistory()">
            <text>📜 版本</text>
          </view>
          <view :class="['tab-btn', showActionLog ? 'active' : '']" @click="showActionLog = true; loadActionLog(); loadUndoStack()">
            <text>📝 操作日志</text>
          </view>
        </view>
        
        <!-- 版本历史列表 -->
        <view v-if="!showActionLog" class="version-list">
          <view v-for="v in versionList" 
                :key="v.version_id"
                :class="['version-item', v.version_id === currentVersionId ? 'current' : '']">
            <view class="version-info" @click="loadVersion(v.version_id)">
              <text class="version-name">{{ v.name }}</text>
              <text class="version-time">{{ formatTime(v.created_at) }}</text>
              <text class="version-slides">{{ v.slide_count }} 页</text>
            </view>
            <view class="version-actions">
              <button class="btn btn-mini" @click="compareVersion(v.version_id)">对比</button>
              <button class="btn btn-mini btn-rollback" @click="rollbackToVersion(v.version_id)">回滚</button>
            </view>
          </view>
          <view v-if="versionList.length === 0" class="empty-tip">暂无版本记录</view>
        </view>
        
        <!-- 操作日志列表 -->
        <view v-if="showActionLog" class="action-log-container">
          <!-- 撤销按钮 -->
          <view class="undo-bar" v-if="undoStack.length > 0">
            <button class="btn btn-sm btn-undo" @click="undoLastAction">
              ↩️ 撤销 ({{ undoStack.length }})
            </button>
          </view>
          <view class="action-log-list">
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
        
        <!-- 版本对比视图 -->
        <view v-if="showDiffView" class="diff-view">
          <view class="diff-header">
            <text class="diff-title">{{ diffData.version_a }} vs {{ diffData.version_b }}</text>
            <text class="diff-count">{{ diffData.total_changes }} 处变更</text>
          </view>
          <view class="diff-slides">
            <view v-for="d in diffData.diff" :key="d.slide_index" class="diff-item">
              <view class="diff-slide-title">第 {{ d.slide_index }} 页</view>
              <view class="diff-content">
                <view class="diff-before" v-if="d.before">
                  <text class="label">变更前</text>
                  <text class="diff-slide-text">{{ d.before.title || '(无)' }}</text>
                </view>
                <view class="diff-after" v-if="d.after">
                  <text class="label">变更后</text>
                  <text class="diff-slide-text">{{ d.after.title || '(无)' }}</text>
                </view>
              </view>
            </view>
          </view>
          <view class="diff-footer">
            <button class="btn btn-sm" @click="showDiffView = false">关闭对比</button>
          </view>
        </view>
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
            <div class="transition-options">
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

          <!-- 过渡速度 -->
          <div class="panel-section">
            <h4 class="section-title">过渡速度</h4>
            <div class="duration-options">
              <button
                v-for="d in durationOptions"
                :key="d.value"
                class="duration-item"
                :class="{ active: transitionSettings.duration === d.value }"
                @click="transitionSettings.duration = d.value"
              >
                {{ d.label }}
              </button>
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

          <!-- 预览效果 -->
          <div class="panel-section">
            <h4 class="section-title">效果预览</h4>
            <div class="transition-preview" :class="'preview-' + transitionSettings.type">
              <div class="preview-box"></div>
              <span class="preview-label">{{ getTransitionLabel(transitionSettings.type) }}</span>
            </div>
          </div>
        </div>
        <div class="panel-footer">
          <button class="btn btn-outline" @click="showTransitionPanel = false">关闭</button>
          <button class="btn btn-primary" @click="applyTransitionToSlides">应用</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from '../api/client'
import PresentationMode from '../components/PresentationMode.vue'
import SlideElementEditor from '../components/SlideElementEditor.vue'
import ChartEditor from '../components/ChartEditor.vue'
import { useSwipeGesture } from '../composables/useSwipeGesture'
import { getDeviceMode } from '../composables/useDeviceMode'
import { useInteractionFeedback } from '../composables/useInteractionFeedback'
import { useKeyboardShortcuts } from '../composables/useKeyboardShortcuts'
import { useImageCompressor } from '../composables/useImageCompressor'
import { usePerformanceMode } from '../composables/usePerformanceMode'

const router = useRouter()
const route = useRoute()

// Device mode detection
const deviceMode = getDeviceMode()
const isMobile = deviceMode.isMobile

// Toast notifications
const { showSuccess, showError, showWarning, showInfo } = useInteractionFeedback()

// Image compression
const { compressImage } = useImageCompressor()
const { isPerformanceMode: isPerfMode } = usePerformanceMode()

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
// 预览加载失败状态（区分"暂无数据"和"加载失败"）
const previewLoadFailed = ref(false)
const isFavorite = ref(false)
const exportTheme = ref<'light' | 'dark'>('light')
const showPresentation = ref(false)

// 内容编辑模式
const isEditMode = ref(false)
const isRegenerating = ref(false)

// 元素微调模式
const showElementEditor = ref(false)

// 快速调优侧边栏
const showLayoutPanel = ref(false)

// 图表编辑器
const showChartEditor = ref(false)

// 幻灯片过渡设置
const showTransitionPanel = ref(false)
const transitionApplyScope = ref<'current' | 'all'>('all')

const transitionTypes = [
  { value: 'slide', name: '滑动', icon: '→' },
  { value: 'fade', name: '淡入淡出', icon: '◐' },
  { value: 'zoom', name: '缩放', icon: '⊕' },
  { value: 'flip', name: '翻转', icon: '↺' }
]

const durationOptions = [
  { value: 'fast', label: '快 (0.3s)' },
  { value: 'normal', label: '中 (0.5s)' },
  { value: 'slow', label: '慢 (0.8s)' }
]

const transitionSettings = reactive({
  type: 'slide' as 'slide' | 'fade' | 'zoom' | 'flip',
  duration: 'normal' as 'fast' | 'normal' | 'slow',
  autoAdvance: false,
  autoDelay: 5000
})

const getTransitionLabel = (type: string) => {
  return transitionTypes.find(t => t.value === type)?.name || type
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
const versionList = ref<Array<{version_id: string; name: string; created_at: string; slide_count: number}>>([])
const currentVersionId = ref('')
const showDiffView = ref(false)
// 操作日志 & 撤销相关
const actionLog = ref<Array<{action_type: string; description: string; timestamp: string; undo_data?: any}>>([])
const undoStack = ref<Array<{action_type: string; description: string; timestamp: string; undo_data?: any}>>([])
const showActionLog = ref(false)  // 是否显示操作日志tab
const diffData = ref<{
  version_a: string
  version_b: string
  diff: Array<{
    slide_index: number
    before: any
    after: any
  }>
  total_changes: number
}>({
  version_a: '',
  version_b: '',
  diff: [],
  total_changes: 0
})
const selectedLayout = ref('左图右文')
const selectedColorScheme = ref(0)
const selectedStyle = ref('professional')
const regeneratingSlideIndex = ref<number | null>(null)

// 存为模板相关
const showSaveTemplateModal = ref(false)
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
      showSuccess('模板已保存', `「${newTemplate.value.name}」已添加到我的模板`)
      showSaveTemplateModal.value = false
    }
  } catch (e) {
    showError('保存失败', '请稍后重试')
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

const handleElementApply = (editedSlides: any) => {
  console.log('元素已更新:', editedSlides)
  alert('元素微调已保存！请下载更新后的PPT。')
}

// 图表已生成
const handleChartGenerated = (chartData: any) => {
  console.log('图表已生成:', chartData)
  alert('图表已生成！点击"插入到幻灯片"添加到PPT中。')
}

// 插入图表到幻灯片
const handleInsertChartIntoSlide = (chartData: any) => {
  console.log('插入图表到幻灯片:', chartData)
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
  } else {
    showWarning('布局部分更新', `成功${updatedCount}页，失败${failedCount}页`)
  }
}

const editableSlides = ref<{
  title: string
  content: string
  layout: string
  imageUrl?: string
}[]>([])

// 切换编辑模式
const toggleEditMode = async () => {
  if (!isEditMode.value) {
    // 进入编辑模式，初始化可编辑数据
    await initEditableSlides()
  }
  isEditMode.value = !isEditMode.value
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
          layout: normalizeLayout(s.layout)
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
          layout: normalizeLayout(s.layout)
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
    layout: i === 0 ? 'title' : 'content'
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
type ExportFormat = 'pptx' | 'pdf' | 'png' | 'jpg'
const selectedFormat = ref<ExportFormat>('pptx')
const isExporting = ref(false)

// 导出质量设置
type ExportQuality = 'standard' | 'high' | 'ultra'
const selectedQuality = ref<ExportQuality>('high')

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
  { id: 'jpg', name: 'JPG', icon: '📷', desc: 'JPEG图片', ext: '.jpg', quality: true }
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
  }
}



// 演示模式使用的幻灯片数据（从真实预览数据获取）
const presentationSlides = computed(() => {
  if (previewSlides.value && previewSlides.value.length > 0) {
    return previewSlides.value.map(s => ({
      title: `第 ${s.slideNum} 页`,
      content: '',
      background: '#ffffff',
      svgUrl: s.url  // 真实 SVG URL
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

// 下载
const handleDownload = async () => {
  if (!taskId.value || isExporting.value) return

  isExporting.value = true
  exportProgress.value = 0
  exportStatusText.value = '正在准备...'
  showExportMenu.value = false

  try {
    // 根据质量设置调整请求参数
    const qualityParams = {
      quality: selectedQuality.value,
      dpi: selectedQuality.value === 'ultra' ? 300 : (selectedQuality.value === 'high' ? 150 : 96)
    }

    exportStatusText.value = '正在下载...'
    exportProgress.value = 30

    const response = await api.ppt.downloadPpt(taskId.value, qualityParams)

    // 根据质量添加后缀
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

    // 记录到导出历史
    addExportHistory('PPTX', qualityName, fileName, formatSize(response.data.size || 0))

    exportProgress.value = 100
    exportStatusText.value = '导出完成!'
    showSuccess('下载成功', `PPT已保存为 ${fileName}`)
  } catch (error) {
    console.error('下载失败:', error)
    showError('下载失败', '请检查网络后重试')
  } finally {
    setTimeout(() => {
      isExporting.value = false
      exportProgress.value = 0
      exportStatusText.value = ''
    }, 1500)
  }
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
    exportProgress.value = 20

    // 尝试调用后端API
    const response = await api.ppt.exportPdf(taskId.value).catch(() => null)

    if (response) {
      exportStatusText.value = '正在下载...'
      exportProgress.value = 70

      const fileName = `presentation_${taskId.value}.pdf`
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      // 记录到导出历史
      const qualityName = selectedQuality.value === 'ultra' ? '4K' : selectedQuality.value === 'high' ? '1080p' : '720p'
      addExportHistory('PDF', qualityName, fileName, formatSize(response.data.size || 0))

      exportProgress.value = 100
      exportStatusText.value = '导出完成!'
    } else {
      // 后端不可用，使用浏览器打印功能
      exportViaPrint()
    }
  } catch (error) {
    console.error('PDF导出失败，使用打印替代:', error)
    // 降级到打印
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

// 批量导出
const handleBatchExport = async () => {
  showExportMenu.value = false
  alert('批量导出功能开发中，将同时导出PDF和图片格式')
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

const shareOptions = [
  { id: 'native', name: '系统分享', icon: '📤', supported: 'share' in navigator },
  { id: 'copy', name: '复制链接', icon: '📋' },
  { id: 'qrcode', name: '二维码', icon: '📱' },
  { id: 'wechat', name: '微信', icon: '💬' },
  { id: 'qq', name: 'QQ', icon: '🐧' },
  { id: 'weibo', name: '微博', icon: '🌐' },
  { id: 'email', name: '邮件', icon: '📧' },
  { id: 'twitter', name: 'Twitter', icon: '🐦' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼' }
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
      await loadVersionHistory()
    } else {
      showError('撤销失败', res.data?.message || '未知错误')
    }
  } catch (e: any) {
    console.error('撤销失败:', e)
    showError('撤销失败', e?.response?.data?.detail || '网络错误')
  }
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

// Global keyboard shortcuts
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
    handler: () => {
      if (isEditMode.value) {
        // Undo last edit - move slide back to previous position (simplified undo)
        showWarning('撤销', '编辑模式下的撤销功能')
      }
    },
    description: '撤销 (Ctrl+Z)'
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

.chart-config-section {
  margin: 12px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e5e5;
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

.empty-tip {
  text-align: center;
  color: #999;
  font-size: 13px;
  padding: 20px;
}

/* 版本对比视图 */
.diff-view {
  border-top: 1px solid #eee;
  padding: 12px;
  background: #fafafa;
  max-height: 50%;
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
  gap: 8px;
}

.diff-item {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 10px;
}

.diff-slide-title {
  font-size: 12px;
  font-weight: 600;
  color: #165DFF;
  margin-bottom: 8px;
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
    width: 48px !important;
    height: 48px !important;
    font-size: 20px !important;
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
</style>
