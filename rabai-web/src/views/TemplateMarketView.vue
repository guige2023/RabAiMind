<template>
  <div class="template-market">
    <!-- Header -->
    <header class="market-header">
      <div class="container">
        <h1 class="market-title">模板市场</h1>
        <p class="market-subtitle">发现适合您演示的精美模板</p>

        <!-- Search Bar -->
        <div class="search-bar">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索模板名称、描述或标签..."
            class="search-input"
            @focus="showSearchHistory = true"
            @blur="hideSearchHistory"
          />
          <button v-if="searchQuery" class="clear-btn" @click="clear()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
          <!-- Search History Dropdown -->
          <div v-if="showSearchHistory && searchHistory.length > 0 && !searchQuery" class="search-history-dropdown">
            <div class="history-header">
              <span>最近搜索</span>
              <button class="clear-history-btn" @click="clearHistory">清除</button>
            </div>
            <div
              v-for="item in searchHistory"
              :key="item.query"
              class="history-item"
              @mousedown="setQuery(item.query)"
            >
              <svg class="history-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
              </svg>
              <span>{{ item.query }}</span>
              <span class="history-results">{{ item.resultsCount }}个结果</span>
              <button class="remove-history-btn" @click.stop="removeFromHistory(item.query)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="market-main container">
      <!-- Filters Sidebar -->
      <aside class="filters-sidebar">
        <!-- R34: Scene Filter -->
        <div class="filter-section">
          <h3 class="filter-title">场景</h3>
          <div class="filter-options scene-options">
            <button
              class="filter-btn"
              :class="{ active: !selectedScene }"
              @click="selectedScene = null"
            >
              全部
            </button>
            <button
              v-for="scene in templateScenes"
              :key="scene.id"
              class="filter-btn"
              :class="{ active: selectedScene === scene.id }"
              @click="selectedScene = scene.id"
            >
              <span class="filter-icon">{{ scene.icon }}</span>
              {{ scene.name }}
            </button>
          </div>
        </div>

        <!-- Categories -->
        <div class="filter-section">
          <h3 class="filter-title">分类</h3>
          <div class="filter-options">
            <button
              class="filter-btn"
              :class="{ active: !selectedCategory }"
              @click="selectedCategory = null"
            >
              全部
            </button>
            <button
              v-for="cat in templateCategories"
              :key="cat.id"
              class="filter-btn"
              :class="{ active: selectedCategory === cat.id }"
              @click="selectedCategory = cat.id"
            >
              <span class="filter-icon">{{ cat.icon }}</span>
              {{ cat.name }}
              <span class="filter-count">{{ categoryStats[cat.id] || 0 }}</span>
            </button>
          </div>
        </div>

        <!-- Styles -->
        <div class="filter-section">
          <h3 class="filter-title">风格</h3>
          <div class="filter-options">
            <button
              class="filter-btn"
              :class="{ active: !selectedStyle }"
              @click="selectedStyle = null"
            >
              全部
            </button>
            <button
              v-for="style in templateStyles"
              :key="style.id"
              class="filter-btn"
              :class="{ active: selectedStyle === style.id }"
              @click="selectedStyle = style.id"
            >
              <span class="filter-icon">{{ style.icon }}</span>
              {{ style.name }}
            </button>
          </div>
        </div>

        <!-- Sort -->
        <div class="filter-section">
          <h3 class="filter-title">排序</h3>
          <select v-model="sortBy" class="sort-select">
            <option value="popularity">最受欢迎</option>
            <option value="newest">最新</option>
            <option value="name">名称</option>
          </select>
        </div>

        <!-- Favorites Toggle -->
        <div class="filter-section">
          <button
            class="favorites-toggle"
            :class="{ active: showFavorites }"
            @click="showFavorites = !showFavorites"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            只显示收藏
          </button>
        </div>

        <!-- R35: 热门搜索词 -->
        <div class="filter-section popular-searches-section" v-if="trendingQueries.length > 0">
          <h3 class="filter-title">
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            热门搜索
          </h3>
          <div class="popular-searches-list">
            <button
              v-for="(item, idx) in trendingQueries"
              :key="item.query"
              class="popular-search-item"
              @click="setQuery(item.query)"
            >
              <span class="search-rank">{{ idx + 1 }}</span>
              <span class="search-query">{{ item.query }}</span>
              <span class="search-count">{{ item.count }}</span>
            </button>
          </div>
        </div>
      </aside>

      <!-- Templates Grid -->
      <section class="templates-section">
        <div class="templates-header">
          <div class="templates-tabs">
            <button 
              class="tab-btn" 
              :class="{ active: !showMyTemplates && !showFavorites }"
              @click="showMyTemplates = false; showFavorites = false">
              全部模板
            </button>
            <button 
              class="tab-btn" 
              :class="{ active: showMyTemplates }"
              @click="showMyTemplates = true; showFavorites = false">
              📁 我的模板
            </button>
            <button 
              class="tab-btn" 
              :class="{ active: showFavorites }"
              @click="showMyTemplates = false; showFavorites = true">
              ⭐ 收藏
            </button>
          </div>
          <span class="templates-count">
            {{ displayTemplates.length }} 个模板
          </span>
        </div>

        <!-- R35: 热门模板推荐（仅"全部模板"标签页显示） -->
        <div v-if="!showMyTemplates && !showFavorites && trendingTemplates.length > 0" class="recommendation-section trending-section">
          <div class="recommendation-header">
            <div class="recommendation-title">
              <svg viewBox="0 0 24 24" fill="currentColor" class="trend-icon">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              <span>🔥 热门模板</span>
            </div>
            <span class="recommendation-subtitle">根据使用频率推荐</span>
          </div>
          <div class="recommendation-grid trending-grid">
            <article
              v-for="template in trendingTemplates"
              :key="template.id"
              class="template-card trending-card"
              @click="selectTemplate(template)"
            >
              <div class="template-thumbnail">
                <div class="thumbnail-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M9 9h6M9 12h6M9 15h4"/>
                  </svg>
                </div>
                <span class="trending-rank">🔥</span>
                <button
                  class="favorite-btn"
                  :class="{ active: isFavorite(template.id) }"
                  @click.stop="toggleFavorite(template.id)"
                >
                  <svg viewBox="0 0 24 24" :fill="isFavorite(template.id) ? 'currentColor' : 'none'" stroke="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </button>
              </div>
              <div class="template-info">
                <h3 class="template-name">{{ template.name }}</h3>
                <p class="template-desc">{{ template.description }}</p>
              </div>
            </article>
          </div>
        </div>

        <!-- R35: 为你推荐（仅"全部模板"标签页显示） -->
        <div v-if="!showMyTemplates && !showFavorites && recommendedTemplates.length > 0" class="recommendation-section recommended-section">
          <div class="recommendation-header">
            <div class="recommendation-title">
              <svg viewBox="0 0 24 24" fill="currentColor" class="rec-icon">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span>⭐ 为你推荐</span>
            </div>
            <span class="recommendation-subtitle">基于你的使用历史</span>
          </div>
          <div class="recommendation-grid">
            <article
              v-for="template in recommendedTemplates"
              :key="template.id"
              class="template-card recommended-card"
              @click="selectTemplate(template)"
            >
              <div class="template-thumbnail">
                <div class="thumbnail-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M9 9h6M9 12h6M9 15h4"/>
                  </svg>
                </div>
                <button
                  class="favorite-btn"
                  :class="{ active: isFavorite(template.id) }"
                  @click.stop="toggleFavorite(template.id)"
                >
                  <svg viewBox="0 0 24 24" :fill="isFavorite(template.id) ? 'currentColor' : 'none'" stroke="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </button>
              </div>
              <div class="template-info">
                <h3 class="template-name">{{ template.name }}</h3>
                <p class="template-desc">{{ template.description }}</p>
              </div>
            </article>
          </div>
        </div>

        <!-- Templates Grid -->
        <div v-if="displayTemplates.length > 0" class="templates-grid">
          <article
            v-for="template in displayTemplates"
            :key="template.id"
            class="template-card"
            :class="{ 'is-my-template': showMyTemplates && isMyTemplate(template) }"
            @click="selectTemplate(template)"
          >
            <!-- Thumbnail with Hover Animation -->
            <div class="template-thumbnail">
              <div class="thumbnail-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M9 9h6M9 12h6M9 15h4"/>
                </svg>
              </div>
              
              <!-- Hover Overlay -->
              <div class="thumbnail-hover-overlay">
                <div class="hover-actions">
                  <button class="hover-action-btn preview-btn" @click.stop="previewTemplate(template)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    预览
                  </button>
                  <button class="hover-action-btn use-btn" @click.stop="useTemplateAndNavigate(template)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                    使用
                  </button>
                </div>
              </div>
              
              <!-- Premium Badge -->
              <span v-if="template.isPremium" class="premium-badge">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z"/>
                </svg>
                VIP
              </span>
              
              <!-- Favorite Button -->
              <button
                class="favorite-btn"
                :class="{ active: isFavorite(template.id) }"
                @click.stop="toggleFavorite(template.id)"
              >
                <svg viewBox="0 0 24 24" :fill="isFavorite(template.id) ? 'currentColor' : 'none'" stroke="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </button>
              
              <!-- My Template Actions (Edit/Delete) -->
              <div v-if="showMyTemplates && isMyTemplate(template)" class="my-template-actions">
                <button class="template-action-btn edit-btn" @click.stop="startRename(template)" title="重命名">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button class="template-action-btn delete-btn" @click.stop="confirmDelete(template)" title="删除">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="3,6 5,6 21,6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Info -->
            <div class="template-info">
              <!-- Inline Rename Input -->
              <div v-if="renamingTemplate?.id === template.id" class="rename-input-wrapper" @click.stop>
                <input
                  v-model="renameValue"
                  class="rename-input"
                  placeholder="输入模板名称"
                  @keyup.enter="saveRename"
                  @keyup.escape="cancelRename"
                  @blur="saveRename"
                  ref="renameInputRef"
                />
                <div class="rename-actions">
                  <button class="rename-confirm-btn" @click="saveRename">✓</button>
                  <button class="rename-cancel-btn" @click="cancelRename">✕</button>
                </div>
              </div>
              <h3 v-else class="template-name" v-html="highlightText(template.name)"></h3>
              <p class="template-desc" v-html="highlightText(template.description)"></p>

              <!-- Tags -->
              <div class="template-tags">
                <span v-for="tag in template.tags.slice(0, 3)" :key="tag" class="tag">
                  {{ tag }}
                </span>
              </div>

              <!-- Meta -->
              <div class="template-meta">
                <span class="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                  </svg>
                  {{ template.slides }}页
                </span>
                <span class="meta-item popularity">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  {{ template.popularity }}
                </span>
              </div>
            </div>
          </article>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <div class="empty-illustration">
            <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- 背景圆 -->
              <circle cx="120" cy="100" r="80" fill="#F0F5FF" />
              <circle cx="120" cy="100" r="60" fill="#E8EEFF" />
              <!-- 空白文档 -->
              <rect x="90" y="60" width="60" height="80" rx="6" fill="white" stroke="#D0D7E8" stroke-width="2"/>
              <rect x="98" y="75" width="44" height="4" rx="2" fill="#E0E7FF"/>
              <rect x="98" y="85" width="30" height="4" rx="2" fill="#E0E7FF"/>
              <rect x="98" y="95" width="38" height="4" rx="2" fill="#E0E7FF"/>
              <rect x="98" y="105" width="25" height="4" rx="2" fill="#E0E7FF"/>
              <!-- 放大镜 -->
              <circle cx="140" cy="130" r="20" fill="#165DFF" opacity="0.15"/>
              <circle cx="140" cy="130" r="14" fill="white" stroke="#165DFF" stroke-width="2"/>
              <line x1="150" y1="140" x2="160" y2="150" stroke="#165DFF" stroke-width="2.5" stroke-linecap="round"/>
              <!-- 装饰点 -->
              <circle cx="70" cy="70" r="4" fill="#165DFF" opacity="0.3"/>
              <circle cx="170" cy="85" r="3" fill="#52C41A" opacity="0.4"/>
              <circle cx="60" cy="120" r="3" fill="#FAAD14" opacity="0.4"/>
            </svg>
          </div>
          <h3>没有找到模板</h3>
          <p>试试调整筛选条件或搜索词</p>
          <button class="reset-btn" @click="resetFilters">重置筛选</button>
        </div>
      </section>
    </main>

    <!-- Delete Confirmation Dialog -->
    <Teleport to="body">
      <div v-if="deleteConfirmTemplate" class="modal-overlay" @click.self="deleteConfirmTemplate = null">
        <div class="delete-confirm-dialog">
          <div class="dialog-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h3>确认删除模板</h3>
          <p>确定要删除模板 "<strong>{{ deleteConfirmTemplate.name }}</strong>" 吗？此操作无法撤销。</p>
          <div class="dialog-actions">
            <button class="dialog-btn cancel-btn" @click="deleteConfirmTemplate = null">取消</button>
            <button class="dialog-btn confirm-btn" @click="executeDelete">确认删除</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Template Detail Modal -->
    <Teleport to="body">
      <div v-if="selectedTemplate" class="modal-overlay" @click="selectedTemplate = null">
        <div class="modal-content template-modal" @click.stop>
          <button class="modal-close" @click="selectedTemplate = null">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>

          <div class="modal-body">
            <!-- Preview -->
            <div class="template-preview">
              <div class="preview-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M9 9h6M9 12h6M9 15h4"/>
                </svg>
                <span>{{ selectedTemplate.name }}</span>
              </div>
            </div>

            <!-- Details -->
            <div class="template-details">
              <div class="detail-header">
                <h2>{{ selectedTemplate.name }}</h2>
                <button
                  class="favorite-btn large"
                  :class="{ active: isFavorite(selectedTemplate.id) }"
                  @click="toggleFavorite(selectedTemplate.id)"
                >
                  <svg viewBox="0 0 24 24" :fill="isFavorite(selectedTemplate.id) ? 'currentColor' : 'none'" stroke="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  {{ isFavorite(selectedTemplate.id) ? '已收藏' : '收藏' }}
                </button>
              </div>

              <p class="template-description">{{ selectedTemplate.description }}</p>

              <div class="detail-tags">
                <span v-for="tag in selectedTemplate.tags" :key="tag" class="tag">
                  {{ tag }}
                </span>
              </div>

              <div class="detail-meta">
                <span class="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <path d="M14 2v6h6"/>
                  </svg>
                  {{ selectedTemplate.slides }} 页
                </span>
                <span class="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                  {{ selectedTemplate.createdAt }}
                </span>
                <span class="meta-item">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  热度 {{ selectedTemplate.popularity }}
                </span>
                <span v-if="selectedTemplate.isPremium" class="meta-item premium">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z"/>
                  </svg>
                  VIP模板
                </span>
              </div>

              <div class="detail-actions">
                <button class="action-btn primary" @click="useTemplateAndNavigate(selectedTemplate)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  使用此模板
                </button>
                <button class="action-btn secondary" @click="previewTemplate(selectedTemplate)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  预览
                </button>
              </div>

              <!-- R35: 相似模板 -->
              <div v-if="selectedTemplateSimilar.length > 0" class="similar-templates-section">
                <div class="similar-header">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    <path d="M9 17H7A5 5 0 0 1 7 7h2v4H5a3 3 0 0 0 0 6h4v0zm5-4h2a5 5 0 0 1 0 10h-2V13h2a3 3 0 0 0 0-6h-2v0zm3-5a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm0 4a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
                  </svg>
                  <span>相似模板</span>
                </div>
                <div class="similar-grid">
                  <div
                    v-for="sim in selectedTemplateSimilar"
                    :key="sim.id"
                    class="similar-card"
                    @click="selectTemplate(sim); loadSelectedTemplateSimilar()"
                  >
                    <div class="similar-thumbnail">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <path d="M9 9h6M9 12h6M9 15h4"/>
                      </svg>
                    </div>
                    <span class="similar-name">{{ sim.name }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  useTemplateStore,
  templateCategories,
  templateStyles,
  type Template
} from '../composables/useTemplateStore'
import { useSearch } from '../composables/useSearch'
import { api } from '../api/client'

const router = useRouter()
const store = useTemplateStore()

// Reactive state from store
const selectedCategory = ref<string | null>(null)
const selectedStyle = ref<string | null>(null)
// R34: Scene filter
const selectedScene = ref<string | null>(null)

// R34: Scene options
const templateScenes = [
  { id: 'business', name: '💼 商务', icon: '💼' },
  { id: 'education', name: '📚 教育', icon: '📚' },
  { id: 'tech', name: '🚀 科技', icon: '🚀' },
  { id: 'creative', name: '💡 创意', icon: '💡' },
  { id: 'marketing', name: '📣 营销', icon: '📣' },
  { id: 'finance', name: '💰 金融', icon: '💰' },
  { id: 'medical', name: '🏥 医疗', icon: '🏥' },
  { id: 'government', name: '🏛️ 政府', icon: '🏛️' }
]
const sortBy = ref<'popularity' | 'newest' | 'name'>('popularity')
const showFavorites = ref(false)
const showMyTemplates = ref(false)
const myTemplates = ref<Template[]>([])
const selectedTemplate = ref<Template | null>(null)
const showSearchHistory = ref(false)

// Delete confirmation
const deleteConfirmTemplate = ref<Template | null>(null)

// Inline rename
const renamingTemplate = ref<Template | null>(null)
const renameValue = ref('')
const renameInputRef = ref<HTMLInputElement | null>(null)

// R35: 推荐相关状态
const selectedTemplateSimilar = ref<Template[]>([])
const trendingTemplates = computed(() => store.trendingTemplates)
const recommendedTemplates = computed(() => store.recommendedTemplates)
const trendingQueries = computed(() => store.trendingQueries)

// R35: 加载相似模板
const loadSelectedTemplateSimilar = async () => {
  if (!selectedTemplate.value) return
  try {
    const res = await api.template.getSimilar(selectedTemplate.value.id, 4)
    if (res.data?.success && res.data.templates?.length > 0) {
      selectedTemplateSimilar.value = res.data.templates.map((t: any) => ({
        id: t.id,
        name: t.name,
        description: t.description || '',
        category: t.category || 'business',
        style: t.style || 'professional',
        thumbnail: t.thumbnail || '',
        tags: [t.category, t.style].filter(Boolean),
        slides: 8,
        popularity: 80,
        isPremium: false,
        isFavorite: false,
        is_ugc: false,
        author: 'RabAi Mind',
        createdAt: new Date().toISOString().split('T')[0]
      }))
    } else {
      selectedTemplateSimilar.value = []
    }
  } catch (e) {
    console.warn('加载相似模板失败:', e)
    selectedTemplateSimilar.value = []
  }
}

// R35: 加载热门模板
const loadTrendingTemplates = async () => {
  try {
    await store.loadTrendingTemplates(6, 7)
  } catch (e) {
    console.warn('加载热门模板失败:', e)
  }
}

// R35: 加载为你推荐
const loadRecommendedTemplates = async () => {
  try {
    const userId = localStorage.getItem('user_id') || 'anonymous'
    await store.loadRecommendedTemplates(userId, 6)
  } catch (e) {
    console.warn('加载推荐模板失败:', e)
  }
}

// R35: 加载热门搜索词
const loadTrendingQueries = async () => {
  try {
    await store.loadTrendingQueries(10, 7)
  } catch (e) {
    console.warn('加载热门搜索词失败:', e)
  }
}

// 隐藏搜索历史
const hideSearchHistory = () => {
  setTimeout(() => {
    showSearchHistory.value = false
  }, 200)
}

// 增强搜索功能 - 使用getter函数保持响应式
const {
  query: searchQuery,
  results: searchResults,
  searchHistory,
  setQuery,
  clear,
  highlightText,
  removeFromHistory,
  clearHistory
} = useSearch<Template>(
  () => store.templates.value,
  ['name', 'description', 'tags', 'category', 'style', 'author'],
  { maxHistory: 10 }
)

// Sync with store
onMounted(() => {
  store.loadTemplates()
  store.loadCategoriesAndStyles()  // BUG修复: 从API加载分类/风格
  store.loadFavorites()
  loadMyTemplates()
  // R35: 加载推荐数据
  loadTrendingTemplates()
  loadRecommendedTemplates()
  loadTrendingQueries()
})

// 加载我的模板
const loadMyTemplates = async () => {
  try {
    const res = await api.template.listMyTemplates()
    if (res.data.success) {
      myTemplates.value = res.data.templates.map((t: any) => ({
        id: t.id,
        name: t.name,
        description: t.description || t.example || '',
        category: t.category || 'business',
        style: t.style || 'professional',
        thumbnail: t.thumbnail || '',
        tags: [t.category, t.style].filter(Boolean),
        slides: 8,
        popularity: 50,
        isPremium: false,
        isFavorite: false,
        is_ugc: true,
        author: t.author,
        createdAt: t.created_at ? t.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
      }))
    }
  } catch (e) {
    console.error('加载我的模板失败:', e)
  }
}

// Computed - 使用增强搜索结果
const filteredTemplates = computed(() => {
  // 使用useSearch的模糊搜索结果（已按相关性排序）
  let result = searchResults.value.length > 0 || searchQuery.value.trim()
    ? [...searchResults.value]
    : [...store.templates.value]

  // Category filter
  if (selectedCategory.value) {
    result = result.filter(t => t.category === selectedCategory.value)
  }

  // Style filter
  if (selectedStyle.value) {
    result = result.filter(t => t.style === selectedStyle.value)
  }

  // R34: Scene filter (scene maps to category in templates)
  if (selectedScene.value) {
    result = result.filter(t => t.category === selectedScene.value)
  }

  // Sort - 如果没有搜索关键词则按排序，否则保持相关性排序
  if (!searchQuery.value.trim()) {
    switch (sortBy.value) {
      case 'popularity':
        result.sort((a, b) => b.popularity - a.popularity)
        break
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
    }
  }

  return result
})

const displayTemplates = computed(() => {
  if (showMyTemplates.value) {
    // My Templates: apply search filter to user's templates
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase()
      return myTemplates.value.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags?.some((tag: string) => tag.toLowerCase().includes(query))
      )
    }
    return myTemplates.value
  }
  if (showFavorites.value) {
    return store.favoriteTemplates.value.filter(t =>
      filteredTemplates.value.some(ft => ft.id === t.id)
    )
  }
  return filteredTemplates.value
})

const categoryStats = computed(() => store.categoryStats.value)

// Store methods
const { toggleFavorite, isFavorite, useTemplate, favoriteTemplates } = store

// Actions
const selectTemplate = (template: Template) => {
  selectedTemplate.value = template
  // R35: 加载相似模板
  selectedTemplateSimilar.value = []
  loadSelectedTemplateSimilar()
  // 跟踪点击事件
  store.trackTemplateEvent('click', template.id, { query: searchQuery.value })
}

const useTemplateAndNavigate = (template: Template) => {
  useTemplate(template)
  router.push({
    path: '/create',
    query: { template: template.id }
  })
}

const previewTemplate = (template: Template) => {
  // Open preview in modal or new tab
  console.log('Preview:', template.name)
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = null
  selectedStyle.value = null
  selectedScene.value = null
  sortBy.value = 'popularity'
  showFavorites.value = false
}

// Check if template belongs to current user (UGC templates start with 'user_')
const isMyTemplate = (template: Template): boolean => {
  // Check if it's in the user's templates list
  if (myTemplates.value.some(t => t.id === template.id)) {
    return true
  }
  // Check if it's a UGC template (starts with 'user_')
  if ((template as any).is_ugc || template.id.startsWith('user_')) {
    return true
  }
  return false
}

// Inline rename
const startRename = (template: Template) => {
  renamingTemplate.value = template
  renameValue.value = template.name
  // Focus input after render
  setTimeout(() => {
    renameInputRef.value?.focus()
    renameInputRef.value?.select()
  }, 50)
}

const saveRename = async () => {
  if (!renamingTemplate.value || !renameValue.value.trim()) {
    cancelRename()
    return
  }
  try {
    const res = await api.template.renameTemplate(renamingTemplate.value.id, { name: renameValue.value.trim() })
    if (res.data.success) {
      // Update local state
      const idx = myTemplates.value.findIndex(t => t.id === renamingTemplate.value!.id)
      if (idx !== -1) {
        myTemplates.value[idx].name = renameValue.value.trim()
      }
      // Also update in store if present
      const storeIdx = store.templates.value.findIndex(t => t.id === renamingTemplate.value!.id)
      if (storeIdx !== -1) {
        store.templates.value[storeIdx].name = renameValue.value.trim()
      }
    }
  } catch (e) {
    console.error('重命名失败:', e)
    alert('重命名失败')
  }
  cancelRename()
}

const cancelRename = () => {
  renamingTemplate.value = null
  renameValue.value = ''
}

// Delete template
const confirmDelete = (template: Template) => {
  deleteConfirmTemplate.value = template
}

const executeDelete = async () => {
  if (!deleteConfirmTemplate.value) return
  try {
    const res = await api.template.deleteTemplate(deleteConfirmTemplate.value.id)
    if (res.data.success) {
      // Remove from local state
      myTemplates.value = myTemplates.value.filter(t => t.id !== deleteConfirmTemplate.value!.id)
      // Refresh the list
      await loadMyTemplates()
    } else {
      alert(res.data.error || '删除失败')
    }
  } catch (e) {
    console.error('删除模板失败:', e)
    alert('删除模板失败')
  }
  deleteConfirmTemplate.value = null
}
</script>

<style scoped>
.template-market {
  min-height: 100vh;
  background: #f8f9fa;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Header */
.market-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 48px 0 32px;
  color: white;
}

.market-title {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 8px;
}

.market-subtitle {
  font-size: 18px;
  opacity: 0.9;
  margin-bottom: 24px;
}

/* Search Bar */
.search-bar {
  position: relative;
  max-width: 600px;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: #666;
}

.search-input {
  width: 100%;
  padding: 14px 48px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.search-input:focus {
  outline: none;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
}

.clear-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  border: none;
  background: #e0e0e0;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-btn svg {
  width: 14px;
  height: 14px;
  color: #666;
}

/* Search History Dropdown */
.search-history-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 8px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 100;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  font-size: 13px;
  color: #666;
}

.clear-history-btn {
  border: none;
  background: none;
  color: #e74c3c;
  cursor: pointer;
  font-size: 13px;
}

.clear-history-btn:hover {
  text-decoration: underline;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.history-item:hover {
  background: #f5f5f5;
}

.history-icon {
  width: 16px;
  height: 16px;
  color: #999;
}

.history-results {
  margin-left: auto;
  font-size: 12px;
  color: #999;
}

.remove-history-btn {
  border: none;
  background: none;
  cursor: pointer;
  padding: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.history-item:hover .remove-history-btn {
  opacity: 1;
}

.remove-history-btn svg {
  width: 14px;
  height: 14px;
  color: #999;
}

.remove-history-btn:hover svg {
  color: #e74c3c;
}

/* Highlighted text */
:deep(mark) {
  background: #fff3cd;
  color: #856404;
  padding: 0 2px;
  border-radius: 2px;
}

/* Main Layout */
.market-main {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 32px;
  padding: 32px 24px;
}

/* Filters Sidebar */
.filters-sidebar {
  position: sticky;
  top: 24px;
  height: fit-content;
}

.filter-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.filter-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #555;
  text-align: left;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: #f5f5f5;
}

.filter-btn.active {
  background: #667eea;
  color: white;
}

.filter-icon {
  font-size: 16px;
}

.filter-count {
  margin-left: auto;
  font-size: 12px;
  background: #eee;
  padding: 2px 8px;
  border-radius: 10px;
}

.filter-btn.active .filter-count {
  background: rgba(255, 255, 255, 0.2);
}

.sort-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.favorites-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #555;
  transition: all 0.2s;
}

.favorites-toggle svg {
  width: 18px;
  height: 18px;
}

.favorites-toggle:hover {
  border-color: #ff4757;
  color: #ff4757;
}

.favorites-toggle.active {
  background: #ff4757;
  border-color: #ff4757;
  color: white;
}

/* Templates Section */
.templates-section {
  min-height: 400px;
}

.templates-header {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.templates-tabs {
  display: flex;
  gap: 8px;
}

.tab-btn {
  padding: 8px 16px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
}

.tab-btn:hover {
  background: #f5f5f5;
  border-color: #165DFF;
  color: #165DFF;
}

.tab-btn.active {
  background: #165DFF;
  border-color: #165DFF;
  color: white;
}

.templates-count {
  font-size: 14px;
  color: #666;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

/* Template Card */
.template-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.3s;
}

.template-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.template-thumbnail {
  position: relative;
  height: 180px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumbnail-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #aaa;
}

.thumbnail-placeholder svg {
  width: 48px;
  height: 48px;
}

.thumbnail-placeholder span {
  font-size: 14px;
}

.premium-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: linear-gradient(135deg, #ffd700 0%, #ffb800 100%);
  color: #333;
  font-size: 12px;
  font-weight: 600;
  border-radius: 20px;
}

.premium-badge svg {
  width: 12px;
  height: 12px;
}

.favorite-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  border: none;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.favorite-btn svg {
  width: 18px;
  height: 18px;
  color: #ff4757;
}

.favorite-btn:hover {
  transform: scale(1.1);
}

.favorite-btn.large {
  width: auto;
  padding: 8px 16px;
  border-radius: 20px;
  gap: 6px;
  font-size: 14px;
}

/* Hover Overlay */
.thumbnail-hover-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  backdrop-filter: blur(4px);
}

.template-card:hover .thumbnail-hover-overlay {
  opacity: 1;
}

.hover-actions {
  display: flex;
  gap: 12px;
}

.hover-action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.hover-action-btn svg {
  width: 16px;
  height: 16px;
}

.preview-btn {
  background: white;
  color: #333;
}

.preview-btn:hover {
  background: #f5f5f5;
}

.use-btn {
  background: #667eea;
  color: white;
}

.use-btn:hover {
  background: #5568d3;
}

/* My Template Actions */
.my-template-actions {
  position: absolute;
  bottom: 12px;
  left: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.template-card:hover .my-template-actions {
  opacity: 1;
}

.template-action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.template-action-btn svg {
  width: 14px;
  height: 14px;
}

.edit-btn {
  background: rgba(255, 255, 255, 0.95);
  color: #333;
}

.edit-btn:hover {
  background: white;
  transform: scale(1.05);
}

.delete-btn {
  background: rgba(255, 75, 75, 0.9);
  color: white;
}

.delete-btn:hover {
  background: #ff4757;
  transform: scale(1.05);
}

/* Inline Rename */
.rename-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.rename-input {
  flex: 1;
  padding: 6px 10px;
  border: 2px solid #667eea;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
}

.rename-input:focus {
  border-color: #5568d3;
}

.rename-actions {
  display: flex;
  gap: 4px;
}

.rename-confirm-btn,
.rename-cancel-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.rename-confirm-btn {
  background: #667eea;
  color: white;
}

.rename-confirm-btn:hover {
  background: #5568d3;
}

.rename-cancel-btn {
  background: #e0e0e0;
  color: #666;
}

.rename-cancel-btn:hover {
  background: #d0d0d0;
}

/* Delete Confirmation Dialog */
.delete-confirm-dialog {
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 400px;
  width: 100%;
  text-align: center;
  animation: dialog-enter 0.2s ease;
}

@keyframes dialog-enter {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.dialog-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 20px;
  background: #fff3f3;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-icon svg {
  width: 32px;
  height: 32px;
  color: #ff4757;
}

.delete-confirm-dialog h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 12px;
}

.delete-confirm-dialog p {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 24px;
}

.delete-confirm-dialog strong {
  color: #333;
}

.dialog-actions {
  display: flex;
  gap: 12px;
}

.dialog-btn {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.cancel-btn:hover {
  background: #e8e8e8;
}

.confirm-btn {
  background: #ff4757;
  color: white;
}

.confirm-btn:hover {
  background: #ff3344;
}

/* Template Info */
.template-info {
  padding: 16px;
}

.template-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.template-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.template-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.tag {
  padding: 4px 10px;
  background: #f0f2f5;
  color: #555;
  font-size: 12px;
  border-radius: 12px;
}

.template-meta {
  display: flex;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #888;
}

.meta-item svg {
  width: 14px;
  height: 14px;
}

.meta-item.popularity {
  color: #ffa502;
}

/* R35: 推荐区域 */
.recommendation-section {
  margin-bottom: 32px;
  padding: 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.recommendation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.recommendation-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.recommendation-title svg {
  width: 18px;
  height: 18px;
}

.trend-icon {
  color: #ff6b6b;
}

.rec-icon {
  color: #ffa502;
}

.recommendation-subtitle {
  font-size: 12px;
  color: #999;
}

.recommendation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.trending-grid .template-card {
  margin: 0;
}

.trending-rank {
  position: absolute;
  top: 8px;
  left: 8px;
  font-size: 14px;
}

.trending-card .template-thumbnail {
  height: 120px;
}

.recommended-card .template-thumbnail {
  height: 120px;
}

/* R35: 相似模板（弹窗内） */
.similar-templates-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.similar-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.similar-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.similar-card {
  cursor: pointer;
  text-align: center;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #e5e5e5;
  transition: all 0.2s;
}

.similar-card:hover {
  border-color: #165DFF;
  background: #f0f5ff;
}

.similar-thumbnail {
  width: 100%;
  height: 60px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.similar-thumbnail svg {
  width: 28px;
  height: 28px;
  color: #aaa;
}

.similar-name {
  font-size: 12px;
  color: #333;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* R35: 热门搜索词（侧边栏） */
.popular-searches-section {
  background: linear-gradient(135deg, #fff9f0 0%, #fff5e6 100%);
}

.popular-searches-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.popular-search-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: none;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.popular-search-item:hover {
  background: #f0f5ff;
  transform: translateX(4px);
}

.search-rank {
  width: 18px;
  height: 18px;
  background: #ffd700;
  color: #333;
  font-size: 10px;
  font-weight: 700;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.popular-search-item:nth-child(1) .search-rank { background: #ffd700; }
.popular-search-item:nth-child(2) .search-rank { background: #c0c0c0; }
.popular-search-item:nth-child(3) .search-rank { background: #cd7f32; }

.search-query {
  flex: 1;
  font-size: 13px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-count {
  font-size: 11px;
  color: #999;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-illustration {
  width: 240px;
  height: 200px;
  margin-bottom: 24px;
}

.empty-illustration svg {
  width: 100%;
  height: 100%;
}

.empty-state svg {
  width: 64px;
  height: 64px;
  color: #ccc;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.empty-state p {
  color: #666;
  margin-bottom: 20px;
  font-size: 14px;
}

.reset-btn {
  padding: 10px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.reset-btn:hover {
  background: #5568d3;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.modal-content {
  background: white;
  border-radius: 20px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow: auto;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  border: none;
  background: #f5f5f5;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.modal-close svg {
  width: 20px;
  height: 20px;
  color: #666;
}

.modal-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}

.template-preview {
  background: #f5f7fa;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: #aaa;
}

.preview-placeholder svg {
  width: 80px;
  height: 80px;
}

.preview-placeholder span {
  font-size: 18px;
  font-weight: 600;
}

.template-details {
  padding: 32px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.detail-header h2 {
  font-size: 24px;
  color: #333;
}

.template-description {
  color: #666;
  line-height: 1.6;
  margin-bottom: 16px;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}

.detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
}

.meta-item.premium {
  color: #ffa502;
}

.detail-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn svg {
  width: 18px;
  height: 18px;
}

.action-btn.primary {
  background: #667eea;
  color: white;
  flex: 1;
}

.action-btn.primary:hover {
  background: #5568d3;
}

.action-btn.secondary {
  background: #f5f5f5;
  color: #333;
}

.action-btn.secondary:hover {
  background: #e8e8e8;
}

@media (max-width: 900px) {
  .market-main {
    grid-template-columns: 1fr;
  }

  .filters-sidebar {
    position: static;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }

  .filter-section {
    margin-bottom: 0;
  }

  .modal-body {
    grid-template-columns: 1fr;
  }
}
</style>
