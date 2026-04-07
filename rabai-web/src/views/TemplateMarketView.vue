<template>
  <div class="template-market">
    <!-- Header -->
    <header class="market-header">
      <div class="container">
        <div class="market-title-row">
          <div>
            <h1 class="market-title">模板市场</h1>
            <p class="market-subtitle">发现适合您演示的精美模板</p>
          </div>
          <!-- R102: Share your template button -->
          <button class="share-template-btn" @click="openUploadModal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16,6 12,2 8,6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            分享模板
          </button>
        </div>

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
            @keyup.enter="performAdvancedSearch()"
          />
          <!-- R111: AI Semantic Search toggle -->
          <button class="ai-search-btn" @click="performAdvancedSearch()" title="AI智能搜索">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </button>
          <!-- R111: Search Analytics button -->
          <button class="analytics-btn" @click="openSearchAnalytics()" title="搜索分析">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          </button>
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
              class="filter-btn category-filter-btn"
              :class="{ active: selectedCategory === cat.id }"
              @click="selectedCategory = cat.id"
            >
              <span class="filter-icon">{{ cat.icon }}</span>
              {{ cat.name }}
              <span class="filter-count">{{ categoryStats[cat.id] || 0 }}</span>
              <!-- R48: 订阅按钮 -->
              <button
                class="subscribe-btn"
                :class="{ subscribed: subscribedCategories.includes(cat.id) }"
                @click.stop="toggleSubscription(cat.id)"
                :title="subscribedCategories.includes(cat.id) ? '取消订阅' : '订阅新模板通知'"
              >
                {{ subscribedCategories.includes(cat.id) ? '🔔' : '🔕' }}
              </button>
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

        <!-- R111: Advanced Multi-filter: Author -->
        <div class="filter-section">
          <h3 class="filter-title">作者</h3>
          <input
            v-model="advancedAuthor"
            type="text"
            placeholder="按作者筛选..."
            class="advanced-filter-input"
            @keyup.enter="performAdvancedSearch()"
          />
        </div>

        <!-- R111: Advanced Multi-filter: Date Range -->
        <div class="filter-section">
          <h3 class="filter-title">日期范围</h3>
          <div class="date-range-inputs">
            <input v-model="advancedDateFrom" type="date" class="advanced-filter-input date-input" placeholder="开始日期" />
            <span class="date-separator">至</span>
            <input v-model="advancedDateTo" type="date" class="advanced-filter-input date-input" placeholder="结束日期" />
          </div>
        </div>

        <!-- R111: Advanced Multi-filter: Template Type -->
        <div class="filter-section">
          <h3 class="filter-title">模板类型</h3>
          <div class="filter-options">
            <button
              class="filter-btn"
              :class="{ active: advancedTemplateType === 'all' }"
              @click="advancedTemplateType = 'all'"
            >全部</button>
            <button
              class="filter-btn"
              :class="{ active: advancedTemplateType === 'ugc' }"
              @click="advancedTemplateType = 'ugc'"
            >用户上传</button>
            <button
              class="filter-btn"
              :class="{ active: advancedTemplateType === 'system' }"
              @click="advancedTemplateType = 'system'"
            >系统模板</button>
          </div>
        </div>

        <!-- R111: Advanced Multi-filter: Tags -->
        <div class="filter-section">
          <h3 class="filter-title">标签</h3>
          <div class="filter-options tag-filter-options">
            <button
              v-for="tag in availableTags"
              :key="tag.name"
              class="filter-btn tag-filter-btn"
              :class="{ active: advancedTags.includes(tag.name) }"
              @click="toggleAdvancedTag(tag.name)"
              :style="{ borderColor: advancedTags.includes(tag.name) ? tag.color : 'transparent' }"
            >
              <span class="tag-icon">{{ tag.icon }}</span>
              {{ tag.name }}
            </button>
          </div>
        </div>

        <!-- R111: Advanced Search Actions -->
        <div class="filter-section">
          <button class="advanced-search-btn" @click="performAdvancedSearch()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            AI智能搜索
          </button>
          <button class="clear-filters-btn" @click="clearAdvancedFilters()">清除筛选</button>
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
            <!-- R92: Batch select toggle (only in 我的模板 tab) -->
            <button 
              v-if="showMyTemplates"
              class="tab-btn tab-btn-batch"
              :class="{ active: isTemplateSelectMode }"
              @click="toggleTemplateSelectMode">
              {{ isTemplateSelectMode ? '✓ 完成选择' : '☐ 批量选择' }}
            </button>
            <button
              class="tab-btn tab-btn-create"
              @click="goToTemplateEditor">
              ✨ 创建模板
            </button>
            <button 
              class="tab-btn" 
              :class="{ active: showFavorites }"
              @click="showMyTemplates = false; showFavorites = true">
              ⭐ 收藏
            </button>
            <button 
              class="tab-btn" 
              :class="{ active: showBundles }"
              @click="showBundles = true; showMyTemplates = false; showFavorites = false">
              📦 捆绑包
            </button>
            <!-- R139: Team Templates Tab -->
            <button
              class="tab-btn"
              :class="{ active: showTeamTemplates }"
              @click="showTeamTemplates = true; showMyTemplates = false; showFavorites = false; showBundles = false; loadTeamTemplates()">
              👥 团队模板
            </button>
          </div>
          <span class="templates-count">
            {{ displayTemplates.length }} 个模板
          </span>
        </div>

        <!-- R92: Batch action bar -->
        <div v-if="isTemplateSelectMode && showMyTemplates" class="batch-action-bar">
          <span class="batch-selected-count">已选择 {{ selectedTemplates.size }} 个模板</span>
          <div class="batch-actions">
            <button class="batch-action-btn select-all" @click="selectAllTemplates">全选</button>
            <button class="batch-action-btn deselect-all" @click="deselectAllTemplates">取消全选</button>
            <button class="batch-action-btn batch-rename" @click="openBatchRename" :disabled="selectedTemplates.size === 0">
              ✏️ 批量重命名
            </button>
            <button class="batch-action-btn batch-delete" @click="batchDeleteTemplates" :disabled="selectedTemplates.size === 0">
              🗑️ 批量删除
            </button>
          </div>
        </div>

        <!-- R102: 今日推荐模板 -->
        <div v-if="!showMyTemplates && !showFavorites && templateOfTheDay" class="recommendation-section daily-section">
          <div class="recommendation-header">
            <div class="recommendation-title">
              <svg viewBox="0 0 24 24" fill="currentColor" class="daily-icon">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span>🌟 今日推荐</span>
            </div>
            <span class="recommendation-subtitle">{{ templateOfTheDay.date }} · 每日自动更新</span>
          </div>
          <div class="daily-template-card" @click="selectTemplate(templateOfTheDay.template)">
            <div class="daily-thumbnail">
              <img
                v-if="templateOfTheDay.template.thumbnail"
                :src="getThumbUrl(templateOfTheDay.template.thumbnail)"
                :alt="templateOfTheDay.template.name"
                class="template-thumb-img"
                @error="$event.target.style.display='none'"
              />
              <div v-else class="thumbnail-placeholder daily-thumb-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M9 9h6M9 12h6M9 15h4"/>
                </svg>
              </div>
              <span class="daily-badge">今日</span>
            </div>
            <div class="daily-info">
              <h3 class="daily-name">{{ templateOfTheDay.template.name }}</h3>
              <p class="daily-desc">{{ templateOfTheDay.template.description }}</p>
              <div class="daily-tags">
                <span class="daily-tag category-tag">{{ templateOfTheDay.template.category }}</span>
                <span class="daily-tag style-tag">{{ templateOfTheDay.template.style }}</span>
              </div>
              <button class="daily-use-btn" @click.stop="selectTemplate(templateOfTheDay.template)">
                使用此模板 →
              </button>
            </div>
          </div>
        </div>

        <!-- R48: 精选模板（仅"全部模板"标签页显示） -->
        <div v-if="!showMyTemplates && !showFavorites && featuredTemplates.length > 0" class="recommendation-section featured-section">
          <div class="recommendation-header">
            <div class="recommendation-title">
              <svg viewBox="0 0 24 24" fill="currentColor" class="featured-icon">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span>🏆 精选模板</span>
            </div>
            <span class="recommendation-subtitle">管理员精选推荐</span>
          </div>
          <div class="recommendation-grid featured-grid">
            <article
              v-for="template in featuredTemplates"
              :key="template.id"
              class="template-card featured-card"
              @click="selectTemplate(template)"
            >
              <div class="template-thumbnail">
                <img
                  v-if="template.thumbnail"
                  :src="getThumbUrl(template.thumbnail)"
                  :alt="template.name"
                  class="template-thumb-img"
                  @error="$event.target.style.display='none'"
                />
                <div v-else class="thumbnail-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M9 9h6M9 12h6M9 15h4"/>
                  </svg>
                </div>
                <span class="featured-badge">🏆</span>
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
                <img
                  v-if="template.thumbnail"
                  :src="getThumbUrl(template.thumbnail)"
                  :alt="template.name"
                  class="template-thumb-img"
                  @error="$event.target.style.display='none'"
                />
                <div v-else class="thumbnail-placeholder">
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
                <img
                  v-if="template.thumbnail"
                  :src="getThumbUrl(template.thumbnail)"
                  :alt="template.name"
                  class="template-thumb-img"
                  @error="$event.target.style.display='none'"
                />
                <div v-else class="thumbnail-placeholder">
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

        <!-- R48: Bundles Section -->
        <div v-if="showBundles" class="bundles-section">
          <div class="bundles-header">
            <div class="bundles-title">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
              <span>模板捆绑包</span>
            </div>
            <p class="bundles-subtitle">多模板组合，超值折扣</p>
          </div>
          <div v-if="loadingBundles" class="bundles-loading">
            <p>加载中...</p>
          </div>
          <div v-else-if="bundles.length === 0" class="bundles-empty">
            <p>暂无可用捆绑包</p>
          </div>
          <div v-else class="bundles-grid">
            <div v-for="bundle in bundles" :key="bundle.id" class="bundle-card">
              <div class="bundle-header">
                <h3 class="bundle-name">{{ bundle.name }}</h3>
                <span class="bundle-discount">{{ bundle.discount_percent }}% OFF</span>
              </div>
              <p class="bundle-desc">{{ bundle.description }}</p>
              <div class="bundle-templates">
                <div
                  v-for="tpl in (bundle.templates || []).slice(0, 4)"
                  :key="tpl.id"
                  class="bundle-template-thumb"
                  @click="selectTemplate({ id: tpl.id, name: tpl.name, description: '', category: tpl.category, style: tpl.style, thumbnail: tpl.thumbnail, tags: [tpl.category], slides: 8, popularity: 80, isPremium: false, isFavorite: false, is_ugc: false, author: '', createdAt: '' } as Template)"
                >
                  <img v-if="tpl.thumbnail" :src="getThumbUrl(tpl.thumbnail)" :alt="tpl.name" class="bundle-thumb-img" @error="$event.target.style.display='none'" />
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M9 9h6M9 12h6M9 15h4"/>
                  </svg>
                  <span>{{ tpl.name }}</span>
                </div>
                <div v-if="(bundle.templates || []).length > 4" class="bundle-template-more">
                  +{{ (bundle.templates || []).length - 4 }} more
                </div>
              </div>
              <div class="bundle-footer">
                <span class="bundle-templates-count">{{ (bundle.template_ids || []).length }} 个模板</span>
                <button class="bundle-purchase-btn" @click="purchaseBundle(bundle.id)">
                  立即领取
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- R139: Team Templates Section -->
        <div v-if="showTeamTemplates" class="team-templates-section">
          <div class="team-templates-header">
            <div class="team-templates-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span>团队模板库</span>
            </div>
            <p class="team-templates-subtitle">团队成员共享的模板，整个组织可使用</p>
          </div>
          <div v-if="loadingTeamTemplates" class="team-templates-loading">
            <p>加载团队模板中...</p>
          </div>
          <div v-else-if="teamTemplates.length === 0" class="team-templates-empty">
            <p>暂无团队模板</p>
            <p class="team-templates-hint">在「我的模板」中点击「分享到团队」将模板共享给团队</p>
          </div>
          <div v-else class="team-templates-grid">
            <article
              v-for="template in teamTemplates"
              :key="template.id"
              class="template-card"
              @click="selectTemplate(template)"
            >
              <div class="template-thumbnail">
                <img
                  v-if="template.thumbnail"
                  :src="getThumbUrl(template.thumbnail)"
                  :alt="template.name"
                  class="template-thumb-img"
                  @error="$event.target.style.display='none'"
                />
                <div v-else class="thumbnail-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M9 9h6M9 12h6M9 15h4"/>
                  </svg>
                </div>
                <!-- Author badge -->
                <div class="template-author-badge" :title="'由 ' + (template.author_name || '团队成员') + ' 分享'">
                  👤 {{ template.author_name || '团队成员' }}
                </div>
              </div>
              <div class="template-info">
                <h3 class="template-name">{{ template.name }}</h3>
                <p class="template-desc">{{ template.description }}</p>
                <div v-if="template.colors" class="template-colors">
                  <span v-for="color in template.colors.slice(0, 4)" :key="color" class="color-dot" :style="{ background: color }"></span>
                </div>
              </div>
            </article>
          </div>
        </div>

        <!-- Templates Grid -->
        <div v-if="displayTemplates.length > 0 && !showBundles && !showTeamTemplates" class="templates-grid">
          <article
            v-for="template in displayTemplates"
            :key="template.id"
            class="template-card"
            :class="{ 'is-my-template': showMyTemplates && isMyTemplate(template) }"
            @click="selectTemplate(template)"
          >
            <!-- Thumbnail with Hover Animation -->
            <div class="template-thumbnail">
              <img
                v-if="template.thumbnail"
                :src="getThumbUrl(template.thumbnail)"
                :alt="template.name"
                class="template-thumb-img"
                @error="$event.target.style.display='none'"
              />
              <div v-else class="thumbnail-placeholder">
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

              <!-- R92: Batch select checkbox -->
              <div v-if="isTemplateSelectMode && isMyTemplate(template)" 
                   class="batch-select-checkbox"
                   :class="{ selected: selectedTemplates.has(template.id) }"
                   @click.stop="toggleTemplateSelection(template)">
                <svg v-if="selectedTemplates.has(template.id)" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </div>
              
              <!-- My Template Actions (Edit/Delete/Publish) -->
              <div v-if="showMyTemplates && isMyTemplate(template)" class="my-template-actions">
                <!-- R48: Publish to marketplace -->
                <button
                  class="template-action-btn publish-btn"
                  :class="{ publishing: publishingTemplate === template.id }"
                  @click.stop="publishTemplate(template)"
                  :title="'发布到市场'"
                  :disabled="publishingTemplate === template.id"
                >
                  <svg v-if="publishingTemplate !== template.id" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                    <polyline points="16,6 12,2 8,6"/>
                    <line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                  <span v-else class="publishing-spinner">⏳</span>
                </button>
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
                <!-- R139: Share to Team -->
                <button
                  class="template-action-btn team-share-btn"
                  @click.stop="shareTemplateToTeam(template)"
                  title="分享到团队"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
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
              <!-- R128: Subcategory tag -->
              <div v-if="template.subcategory" class="template-subcategory">
                <span class="subcategory-tag">{{ template.subcategory }}</span>
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
                <!-- R128: Download counter -->
                <span class="meta-item downloads" v-if="template.download_count">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  {{ template.download_count >= 1000 ? (template.download_count / 1000).toFixed(1) + 'k' : template.download_count }}
                </span>
                <!-- R128: Ratings mini -->
                <span class="meta-item rating-mini" v-if="template.rating_breakdown">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  {{ template.rating_breakdown.total.toFixed(1) }}
                </span>
              </div>
            </div>
          </article>
        </div>

        <!-- R128: Template Collections Section -->
        <section v-if="!isLoading && collections.length > 0" class="collections-section">
          <div class="section-header">
            <h2 class="section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
              精选合集
            </h2>
          </div>
          <div class="collections-grid">
            <div v-for="collection in collections" :key="collection.id" class="collection-card" @click="openCollection(collection)">
              <div class="collection-cover" :style="{ background: getCollectionGradient(collection.id) }">
                <span class="collection-count">{{ collection.template_ids?.length || 0 }}个模板</span>
                <div class="collection-tags">
                  <span v-for="tag in (collection.tags || []).slice(0, 2)" :key="tag" class="collection-tag">{{ tag }}</span>
                </div>
              </div>
              <div class="collection-info">
                <h3 class="collection-name">{{ collection.name }}</h3>
                <p class="collection-desc">{{ collection.description }}</p>
              </div>
            </div>
          </div>
        </section>

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

    <!-- R92: Batch Rename Modal -->
    <Teleport to="body">
      <div v-if="showBatchRenameModal" class="modal-overlay" @click.self="showBatchRenameModal = false">
        <div class="delete-confirm-dialog">
          <div class="dialog-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </div>
          <h3>批量重命名 {{ selectedTemplates.size }} 个模板</h3>
          <p>将统一修改为：</p>
          <input
            v-model="batchRenameValue"
            class="input"
            placeholder="输入新的模板名称"
            @keyup.enter="executeBatchRename"
            style="margin-top: 12px; width: 100%"
          />
          <div class="dialog-actions">
            <button class="dialog-btn cancel-btn" @click="showBatchRenameModal = false">取消</button>
            <button class="dialog-btn confirm-btn" @click="executeBatchRename" :disabled="!batchRenameValue.trim()">
              确认重命名
            </button>
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
            <!-- R128: Live Interactive Preview -->
            <div class="template-preview">
              <div class="preview-tabs">
                <button class="preview-tab" :class="{ active: previewTab === 'slides' }" @click="previewTab = 'slides'">幻灯片预览</button>
                <button class="preview-tab" :class="{ active: previewTab === 'interactive' }" @click="loadInteractivePreview(selectedTemplate)">交互预览</button>
              </div>

              <!-- Slides Preview -->
              <div v-if="previewTab === 'slides'" class="slides-preview">
                <div class="slides-nav">
                  <button class="slide-nav-btn" @click="prevPreviewSlide" :disabled="currentPreviewSlideIndex === 0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                  <span class="slide-indicator">{{ currentPreviewSlideIndex + 1 }} / {{ previewSlides.length || 1 }}</span>
                  <button class="slide-nav-btn" @click="nextPreviewSlide" :disabled="currentPreviewSlideIndex >= previewSlides.length - 1">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                </div>
                <div class="slide-preview-card" :style="{ background: selectedTemplate.colors?.[0] || '#165DFF' }">
                  <div class="slide-type-badge">{{ previewSlides[currentPreviewSlideIndex]?.type || 'title' }}</div>
                  <h4 class="slide-preview-title">{{ previewSlides[currentPreviewSlideIndex]?.title || selectedTemplate.name }}</h4>
                  <p class="slide-preview-subtitle">{{ previewSlides[currentPreviewSlideIndex]?.subtitle || selectedTemplate.description }}</p>
                  <div v-if="previewSlides[currentPreviewSlideIndex]?.items" class="slide-preview-items">
                    <div v-for="(item, i) in previewSlides[currentPreviewSlideIndex].items" :key="i" class="slide-preview-item">
                      <span class="item-bullet">&#8226;</span> {{ item }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Interactive Preview -->
              <div v-if="previewTab === 'interactive'" class="interactive-preview">
                <div class="interactive-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M9 9h6M9 12h6M9 15h4"/>
                  </svg>
                  <span>{{ interactivePreviewLoading ? '加载中...' : '拖拽调整元素，即时预览效果' }}</span>
                </div>
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
                <!-- R128: Download count in detail -->
                <span class="meta-item downloads" v-if="selectedTemplate.download_count">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  {{ selectedTemplate.download_count >= 1000 ? (selectedTemplate.download_count / 1000).toFixed(1) + 'k' : selectedTemplate.download_count }} 次下载
                </span>
                <span v-if="selectedTemplate.isPremium" class="meta-item premium">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z"/>
                  </svg>
                  VIP模板
                </span>
              </div>

              <!-- R128: Ratings breakdown -->
              <div v-if="selectedTemplate.rating_breakdown" class="ratings-breakdown">
                <div class="rating-header">
                  <span class="rating-score">{{ selectedTemplate.rating_breakdown.total.toFixed(1) }}</span>
                  <div class="rating-stars">
                    <span v-for="n in 5" :key="n" class="star" :class="{ filled: n <= Math.round(selectedTemplate.rating_breakdown.total) }">&#9733;</span>
                  </div>
                  <span class="rating-count">({{ selectedTemplate.rating_breakdown.count }}人评分)</span>
                </div>
                <div class="rating-bars">
                  <div class="rating-bar-item">
                    <span class="rating-label">设计</span>
                    <div class="rating-bar-track">
                      <div class="rating-bar-fill design" :style="{ width: (selectedTemplate.rating_breakdown.design / 5 * 100) + '%' }"></div>
                    </div>
                    <span class="rating-value">{{ selectedTemplate.rating_breakdown.design.toFixed(1) }}</span>
                  </div>
                  <div class="rating-bar-item">
                    <span class="rating-label">易用性</span>
                    <div class="rating-bar-track">
                      <div class="rating-bar-fill usability" :style="{ width: (selectedTemplate.rating_breakdown.usability / 5 * 100) + '%' }"></div>
                    </div>
                    <span class="rating-value">{{ selectedTemplate.rating_breakdown.usability.toFixed(1) }}</span>
                  </div>
                  <div class="rating-bar-item">
                    <span class="rating-label">功能</span>
                    <div class="rating-bar-track">
                      <div class="rating-bar-fill features" :style="{ width: (selectedTemplate.rating_breakdown.features / 5 * 100) + '%' }"></div>
                    </div>
                    <span class="rating-value">{{ selectedTemplate.rating_breakdown.features.toFixed(1) }}</span>
                  </div>
                </div>
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

              <!-- R48: 模板点评 -->
              <div class="reviews-section">
                <div class="reviews-header">
                  <h4 class="reviews-title">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    用户点评
                  </h4>
                  <div class="reviews-stats" v-if="reviewStats.count > 0">
                    <span class="avg-rating">{{ reviewStats.average.toFixed(1) }}</span>
                    <div class="star-row">
                      <span v-for="n in 5" :key="n" class="star" :class="{ filled: n <= Math.round(reviewStats.average) }">★</span>
                    </div>
                    <span class="review-count">({{ reviewStats.count }}条)</span>
                  </div>
                </div>

                <!-- 提交点评 -->
                <div class="review-form">
                  <div class="rating-input">
                    <span>评分：</span>
                    <button
                      v-for="n in 5"
                      :key="n"
                      class="star-btn"
                      :class="{ active: n <= reviewRating }"
                      @click="reviewRating = n"
                    >★</button>
                  </div>
                  <textarea
                    v-model="reviewContent"
                    class="review-textarea"
                    placeholder="分享你的使用体验..."
                    rows="2"
                  ></textarea>
                  <button
                    class="submit-review-btn"
                    @click="submitReview"
                    :disabled="submittingReview || (!reviewContent.trim())"
                  >
                    {{ submittingReview ? '提交中...' : '发表评论' }}
                  </button>
                </div>

                <!-- 点评列表 -->
                <div class="reviews-list" v-if="templateReviews.length > 0">
                  <div v-for="review in templateReviews" :key="review.id" class="review-item">
                    <div class="review-header">
                      <span class="reviewer-name">{{ review.user_name }}</span>
                      <div class="review-stars">
                        <span v-for="n in 5" :key="n" class="star" :class="{ filled: n <= review.rating }">★</span>
                      </div>
                      <span class="review-date">{{ new Date(review.created_at).toLocaleDateString() }}</span>
                    </div>
                    <p class="review-content">{{ review.content }}</p>
                  </div>
                </div>
                <div v-else class="reviews-empty">
                  <p>暂无点评，来做第一个评价的用户吧！</p>
                </div>
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
                      <img v-if="sim.thumbnail" :src="getThumbUrl(sim.thumbnail)" :alt="sim.name" class="similar-thumb-img" @error="$event.target.style.display='none'" />
                      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor">
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

    <!-- R102: Upload/Share Template Modal -->
    <Teleport to="body">
      <div v-if="showUploadModal" class="modal-overlay" @click="showUploadModal = false">
        <div class="modal-content upload-modal" @click.stop>
          <button class="modal-close" @click="showUploadModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
          <div class="upload-modal-body">
            <h2 class="upload-modal-title">📤 发布模板到市场</h2>
            <p class="upload-modal-subtitle">分享您的创意模板，供其他用户下载使用</p>

            <div class="upload-form">
              <div class="upload-field">
                <label class="upload-label">模板名称 <span class="required">*</span></label>
                <input v-model="uploadForm.name" class="upload-input" placeholder="例如：科技感产品发布会" maxlength="50" />
              </div>

              <div class="upload-field">
                <label class="upload-label">模板描述 <span class="required">*</span></label>
                <textarea v-model="uploadForm.description" class="upload-textarea" placeholder="简要描述模板的适用场景、特点等..." rows="3" maxlength="300"></textarea>
              </div>

              <div class="upload-row">
                <div class="upload-field">
                  <label class="upload-label">场景分类 <span class="required">*</span></label>
                  <select v-model="uploadForm.scene" class="upload-select">
                    <option value="business">💼 商业</option>
                    <option value="education">📚 教育</option>
                    <option value="tech">🚀 科技</option>
                    <option value="creative">💡 创意</option>
                    <option value="personal">👤 个人</option>
                    <option value="government">🏛️ 政府</option>
                  </select>
                </div>
                <div class="upload-field">
                  <label class="upload-label">设计风格 <span class="required">*</span></label>
                  <select v-model="uploadForm.style" class="upload-select">
                    <option value="professional">💼 专业商务</option>
                    <option value="minimal">✨ 简约现代</option>
                    <option value="energetic">🔥 活力动感</option>
                    <option value="premium">👑 高端大气</option>
                    <option value="tech">🔬 科技未来</option>
                    <option value="creative">🎨 创意艺术</option>
                    <option value="elegant">🌸 优雅古典</option>
                    <option value="playful">🎮 卡通趣味</option>
                  </select>
                </div>
              </div>

              <div class="upload-field">
                <label class="upload-label">可见性</label>
                <div class="upload-radio-group">
                  <label class="upload-radio">
                    <input type="radio" v-model="uploadForm.visibility" value="public" />
                    <span>🌐 公开</span> — 所有人可见
                  </label>
                  <label class="upload-radio">
                    <input type="radio" v-model="uploadForm.visibility" value="private" />
                    <span>🔒 私有</span> — 仅自己可见
                  </label>
                </div>
              </div>

              <div class="upload-actions">
                <button class="upload-cancel-btn" @click="showUploadModal = false">取消</button>
                <button
                  class="upload-submit-btn"
                  :disabled="uploadingTemplate || !uploadForm.name.trim() || !uploadForm.description.trim()"
                  @click="submitUpload"
                >
                  <span v-if="uploadingTemplate">⏳ 发布中...</span>
                  <span v-else>🚀 发布模板</span>
                </button>
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

// R111: Advanced Search State
const showSearchAnalytics = ref(false)
const searchAnalytics = ref<{
  trendingQueries: Array<{ query: string; count: number }>
  searchVolumeOverTime: Array<{ date: string; count: number }>
  noResultQueries: Array<{ query: string; count: number }>
  topClickedTemplates: Array<{ id: string; name: string; category: string; click_count: number }>
  popularFilterCombinations: Array<{ filters: string; count: number }>
  totalSearches: number
  uniqueQueries: number
} | null>(null)
const searchAnalyticsLoading = ref(false)

// R111: Advanced filters (multi-filter combination)
const advancedSearchQuery = ref('')
const advancedDateFrom = ref('')
const advancedDateTo = ref('')
const advancedAuthor = ref('')
const advancedTags = ref<string[]>([])
const advancedTemplateType = ref<'all' | 'ugc' | 'system'>('all')
const advancedSortBy = ref<'relevance' | 'newest' | 'popularity' | 'name'>('relevance')
const advancedResults = ref<any[]>([])
const advancedTotal = ref(0)
const advancedLoading = ref(false)
const advancedHighlighted = ref<Record<string, any>>({})
const advancedPage = ref(1)
const advancedTotalPages = ref(1)

// R111: Perform advanced search via API
const performAdvancedSearch = async (page = 1) => {
  advancedLoading.value = true
  try {
    const res = await api.template.advancedSearch({
      query: advancedSearchQuery.value || searchQuery.value,
      category: selectedCategory.value || undefined,
      style: selectedStyle.value || undefined,
      author: advancedAuthor.value || undefined,
      tags: advancedTags.value.length > 0 ? advancedTags.value : undefined,
      date_from: advancedDateFrom.value || undefined,
      date_to: advancedDateTo.value || undefined,
      template_type: advancedTemplateType.value,
      sort_by: advancedSortBy.value,
      page,
      limit: 20,
      use_semantic: true,
    })
    if (res.data.success) {
      advancedResults.value = res.data.results
      advancedTotal.value = res.data.total
      advancedPage.value = res.data.page
      advancedTotalPages.value = res.data.total_pages
      advancedHighlighted.value = res.data.highlighted_fields || {}
    }
  } catch (e) {
    console.error('[AdvancedSearch] failed:', e)
  } finally {
    advancedLoading.value = false
  }
}

// R111: Load search analytics dashboard
const loadSearchAnalytics = async (days = 30) => {
  searchAnalyticsLoading.value = true
  try {
    const res = await api.template.getSearchAnalyticsDashboard(days)
    if (res.data.success) {
      searchAnalytics.value = {
        trendingQueries: res.data.trending_queries,
        searchVolumeOverTime: res.data.search_volume_over_time,
        noResultQueries: res.data.no_result_queries,
        topClickedTemplates: res.data.top_clicked_templates,
        popularFilterCombinations: res.data.popular_filter_combinations,
        totalSearches: res.data.total_searches,
        uniqueQueries: res.data.unique_queries,
      }
    }
  } catch (e) {
    console.error('[SearchAnalytics] failed:', e)
  } finally {
    searchAnalyticsLoading.value = false
  }
}

// R111: Open search analytics panel
const openSearchAnalytics = () => {
  showSearchAnalytics.value = true
  loadSearchAnalytics()
}

// R111: Toggle tag filter
const toggleAdvancedTag = (tag: string) => {
  const idx = advancedTags.value.indexOf(tag)
  if (idx >= 0) {
    advancedTags.value.splice(idx, 1)
  } else {
    advancedTags.value.push(tag)
  }
}

// R111: Clear all advanced filters
const clearAdvancedFilters = () => {
  advancedSearchQuery.value = ''
  advancedDateFrom.value = ''
  advancedDateTo.value = ''
  advancedAuthor.value = ''
  advancedTags.value = []
  advancedTemplateType.value = 'all'
  advancedSortBy.value = 'relevance'
  advancedResults.value = []
  advancedTotal.value = 0
}

// Delete confirmation
const deleteConfirmTemplate = ref<Template | null>(null)

// Inline rename
const renamingTemplate = ref<Template | null>(null)
const renameValue = ref('')
const renameInputRef = ref<HTMLInputElement | null>(null)

// R92: Batch rename state
const isTemplateSelectMode = ref(false)
const selectedTemplates = ref<Set<string>>(new Set())
const showBatchRenameModal = ref(false)
const batchRenameValue = ref('')

// R128: Preview state
const previewTab = ref<'slides' | 'interactive'>('slides')
const previewSlides = ref<Array<{ type: string; title: string; subtitle?: string; items?: string[] }>>([])
const currentPreviewSlideIndex = ref(0)
const interactivePreviewLoading = ref(false)

// R128: Collections state
interface TemplateCollection {
  id: string
  name: string
  description: string
  template_ids: string[]
  tags: string[]
}
const collections = ref<TemplateCollection[]>([
  { id: 'startup-pitch', name: '创业路演', description: '打动投资人的完美融资演示', template_ids: ['t1', 't2', 't3'], tags: ['路演', '融资'] },
  { id: 'product-launch', name: '产品发布', description: '引爆全场的新品发布会', template_ids: ['t4', 't5'], tags: ['产品', '发布'] },
  { id: 'annual-report', name: '年度汇报', description: '专业数据驱动的年度报告', template_ids: ['t6', 't7', 't8'], tags: ['数据', '报告'] },
  { id: 'courseware', name: '教学课件', description: '让学生爱上课堂的课件模板', template_ids: ['t9', 't10'], tags: ['教育', '教学'] },
])

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

// R48: Featured templates state & data
const featuredTemplates = ref<Template[]>([])
// R102: Template of the day
const templateOfTheDay = ref<{ template: Template; date: string; reason: string } | null>(null)
const loadTemplateOfTheDay = async () => {
  try {
    const res = await api.template.getTemplateOfTheDay()
    if (res.data?.success && res.data.template) {
      templateOfTheDay.value = {
        template: {
          id: res.data.template.id,
          name: res.data.template.name,
          description: res.data.template.description || '',
          category: res.data.template.category || 'business',
          style: res.data.template.style || 'professional',
          thumbnail: res.data.template.thumbnail || '',
          tags: [res.data.template.category, res.data.template.style].filter(Boolean),
          slides: 8,
          popularity: 100,
          isPremium: false,
          isFavorite: false,
          is_ugc: false,
          author: '每日推荐',
          createdAt: new Date().toISOString().split('T')[0]
        },
        date: res.data.date || new Date().toISOString().split('T')[0],
        reason: res.data.reason || ''
      }
    }
  } catch (e) {
    console.warn('加载今日推荐失败:', e)
  }
}

const loadFeaturedTemplates = async () => {
  try {
    const res = await api.template.getFeatured(10)
    if (res.data?.success && res.data.templates?.length > 0) {
      featuredTemplates.value = res.data.templates.map((t: any) => ({
        id: t.id,
        name: t.name,
        description: t.description || '',
        category: t.category || 'business',
        style: t.style || 'professional',
        thumbnail: t.thumbnail || '',
        tags: [t.category, t.style].filter(Boolean),
        slides: 8,
        popularity: 95,
        isPremium: true,
        isFavorite: false,
        is_ugc: false,
        author: '官方精选',
        createdAt: new Date().toISOString().split('T')[0]
      }))
    }
  } catch (e) {
    console.warn('加载精选模板失败:', e)
  }
}

// R48: Reviews state
const templateReviews = ref<any[]>([])
const reviewStats = ref({ count: 0, average: 0 })
const reviewRating = ref(5)
const reviewContent = ref('')
const submittingReview = ref(false)
const loadReviews = async (templateId: string) => {
  try {
    const res = await api.template.getReviews(templateId)
    if (res.data?.success) {
      templateReviews.value = res.data.reviews || []
      reviewStats.value = { count: res.data.count || 0, average: res.data.average_rating || 0 }
    }
  } catch (e) {
    console.warn('加载点评失败:', e)
  }
}
const submitReview = async () => {
  if (!selectedTemplate.value) return
  submittingReview.value = true
  try {
    const userId = localStorage.getItem('user_id') || 'anonymous'
    const res = await api.template.addReview(selectedTemplate.value.id, {
      user_id: userId,
      user_name: '用户',
      rating: reviewRating.value,
      content: reviewContent.value
    })
    if (res.data?.success) {
      templateReviews.value = res.data.reviews || []
      reviewStats.value = { count: res.data.count || 0, average: res.data.average_rating || 0 }
      reviewContent.value = ''
      reviewRating.value = 5
    }
  } catch (e) {
    console.error('提交点评失败:', e)
  }
  submittingReview.value = false
}

// R48: Subscriptions
const subscribedCategories = ref<string[]>([])
const loadSubscriptions = async () => {
  try {
    const userId = localStorage.getItem('user_id') || 'anonymous'
    const res = await api.template.getSubscriptions(userId)
    if (res.data?.success) {
      subscribedCategories.value = res.data.categories || []
    }
  } catch (e) {
    console.warn('加载订阅失败:', e)
  }
}
const toggleSubscription = async (category: string) => {
  const userId = localStorage.getItem('user_id') || 'anonymous'
  if (subscribedCategories.value.includes(category)) {
    await api.template.unsubscribe(category, userId)
    subscribedCategories.value = subscribedCategories.value.filter(c => c !== category)
  } else {
    await api.template.subscribe(category, userId)
    subscribedCategories.value.push(category)
  }
}

// R48: Bundles
const showBundles = ref(false)
const bundles = ref<any[]>([])
const loadingBundles = ref(false)
const loadBundles = async () => {
  loadingBundles.value = true
  try {
    const res = await api.template.getBundles()
    if (res.data?.success) {
      bundles.value = res.data.bundles || []
    }
  } catch (e) {
    console.warn('加载捆绑包失败:', e)
  }
  loadingBundles.value = false
}
const purchaseBundle = async (bundleId: string) => {
  const userId = localStorage.getItem('user_id') || 'anonymous'
  try {
    const res = await api.template.purchaseBundle(bundleId, userId)
    if (res.data?.success) {
      alert('领取成功！模板已添加到你的账户')
    }
  } catch (e) {
    console.error('领取捆绑包失败:', e)
  }
}

// R48: Publish to marketplace
// R139: Team Templates
const showTeamTemplates = ref(false)
const teamTemplates = ref<any[]>([])
const loadingTeamTemplates = ref(false)
const currentWorkspaceId = ref(localStorage.getItem('workspace_id') || 'default')

const loadTeamTemplates = async () => {
  if (teamTemplates.value.length > 0) return  // Already loaded
  loadingTeamTemplates.value = true
  try {
    const userId = localStorage.getItem('user_id') || 'default'
    const res = await api.workspace.getTeamTemplates(currentWorkspaceId.value, userId)
    if (res.data?.success) {
      teamTemplates.value = res.data.templates || []
    }
  } catch (e) {
    console.warn('加载团队模板失败:', e)
  }
  loadingTeamTemplates.value = false
}

const shareTemplateToTeam = async (template: Template) => {
  try {
    const userId = localStorage.getItem('user_id') || 'default'
    const res = await api.workspace.shareTemplateToTeam(currentWorkspaceId.value, template.id, userId)
    if (res.data?.success) {
      alert(`"${template.name}" 已分享到团队模板库！`)
    } else {
      alert('分享失败：' + (res.data?.message || '未知错误'))
    }
  } catch (e) {
    console.error('分享模板到团队失败:', e)
    alert('分享失败，请重试')
  }
}

const unshareTemplateFromTeam = async (template: Template) => {
  try {
    const res = await api.workspace.unshareTemplateFromTeam(currentWorkspaceId.value, template.id)
    if (res.data?.success) {
      teamTemplates.value = teamTemplates.value.filter(t => t.id !== template.id)
      alert(`"${template.name}" 已从团队模板库移除`)
    }
  } catch (e) {
    console.error('从团队取消分享模板失败:', e)
  }
}

// R48: Publish to marketplace
const publishingTemplate = ref<string | null>(null)
const publishTemplate = async (template: Template) => {
  publishingTemplate.value = template.id
  try {
    const res = await api.template.publishTemplate(template.id, 'public')
    if (res.data?.success) {
      alert(`"${template.name}" 已发布到模板市场！`)
      // Refresh my templates
      await loadMyTemplates()
    }
  } catch (e) {
    console.error('发布模板失败:', e)
    alert('发布失败，请重试')
  }
  publishingTemplate.value = null
}

// R102: Upload/Share template modal
const showUploadModal = ref(false)
const uploadingTemplate = ref(false)
const uploadForm = ref({
  name: '',
  description: '',
  scene: 'business',
  style: 'professional',
  visibility: 'public'
})

const openUploadModal = () => {
  uploadForm.value = {
    name: '',
    description: '',
    scene: 'business',
    style: 'professional',
    visibility: 'public'
  }
  showUploadModal.value = true
}

const submitUpload = async () => {
  if (!uploadForm.value.name.trim() || !uploadForm.value.description.trim()) return
  uploadingTemplate.value = true
  try {
    const res = await apiClient.post('/templates/upload', null, {
      params: {
        name: uploadForm.value.name.trim(),
        description: uploadForm.value.description.trim(),
        scene: uploadForm.value.scene,
        style: uploadForm.value.style,
        visibility: uploadForm.value.visibility
      }
    })
    if (res.data?.success) {
      alert(`"${uploadForm.value.name}" 发布成功！`)
      showUploadModal.value = false
      await loadMyTemplates()
    }
  } catch (e) {
    console.error('发布模板失败:', e)
    alert('发布失败，请重试')
  }
  uploadingTemplate.value = false
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
  // R48: 加载精选模板、订阅、捆绑包
  loadFeaturedTemplates()
  loadSubscriptions()
  loadBundles()
  // R102: 加载今日推荐
  loadTemplateOfTheDay()
})

// 模板创建工作室
const goToTemplateEditor = () => {
  router.push('/template-editor')
}

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
  if (showBundles.value) return []  // Bundles section uses separate UI
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
  // R48: 加载点评
  templateReviews.value = []
  reviewStats.value = { count: 0, average: 0 }
  loadReviews(template.id)
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
  selectedTemplate.value = template
  previewTab.value = 'slides'
  // Build preview slides from template data
  previewSlides.value = [
    { type: '封面', title: template.name, subtitle: template.description, items: template.tags },
    { type: '目录', title: '目录', subtitle: '内容概览' },
    { type: '章节', title: '核心内容', subtitle: template.description },
    { type: '数据', title: '数据展示', subtitle: '关键指标' },
    { type: '结尾', title: '谢谢观看', subtitle: template.description },
  ]
  currentPreviewSlideIndex.value = 0
}

const loadInteractivePreview = (template: Template) => {
  previewTab.value = 'interactive'
  interactivePreviewLoading.value = true
  setTimeout(() => { interactivePreviewLoading.value = false }, 800)
}

const prevPreviewSlide = () => {
  if (currentPreviewSlideIndex.value > 0) currentPreviewSlideIndex.value--
}

const nextPreviewSlide = () => {
  if (currentPreviewSlideIndex.value < previewSlides.value.length - 1) currentPreviewSlideIndex.value++
}

const openCollection = (collection: TemplateCollection) => {
  // Filter templates by collection template_ids
  console.log('Open collection:', collection.name)
}

const getCollectionGradient = (id: string): string => {
  const gradients: Record<string, string> = {
    'startup-pitch': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'product-launch': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'annual-report': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'courseware': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  }
  return gradients[id] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
}

// Convert thumbnail URL from .png to .svg (local thumbnails are SVG files)
const getThumbUrl = (thumb: string): string => {
  if (!thumb) return ''
  // Use SVG version for local thumbnails
  if (thumb.startsWith('/templates/')) {
    return thumb.replace(/\.png$/, '.svg')
  }
  return thumb
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

// R92: Batch selection
const toggleTemplateSelectMode = () => {
  isTemplateSelectMode.value = !isTemplateSelectMode.value
  if (!isTemplateSelectMode.value) {
    selectedTemplates.value.clear()
  }
}

const toggleTemplateSelection = (template: Template) => {
  if (selectedTemplates.value.has(template.id)) {
    selectedTemplates.value.delete(template.id)
  } else {
    selectedTemplates.value.add(template.id)
  }
}

const selectAllTemplates = () => {
  displayTemplates.value.forEach(t => {
    if (isMyTemplate(t)) selectedTemplates.value.add(t.id)
  })
}

const deselectAllTemplates = () => {
  selectedTemplates.value.clear()
}

// R92: Batch rename
const openBatchRename = () => {
  if (selectedTemplates.value.size === 0) return
  batchRenameValue.value = ''
  showBatchRenameModal.value = true
}

const executeBatchRename = async () => {
  if (!batchRenameValue.value.trim() || selectedTemplates.value.size === 0) {
    showBatchRenameModal.value = false
    return
  }
  try {
    const renames = Array.from(selectedTemplates.value).map(template_id => ({
      template_id,
      new_name: batchRenameValue.value.trim()
    }))
    const res = await api.batch.renameTemplates(renames)
    if (res.data.success) {
      // Update local state
      res.data.renamed?.forEach((r: { template_id: string; new_name: string }) => {
        const idx = myTemplates.value.findIndex(t => t.id === r.template_id)
        if (idx !== -1) myTemplates.value[idx].name = r.new_name
        const storeIdx = store.templates.value.findIndex(t => t.id === r.template_id)
        if (storeIdx !== -1) store.templates.value[storeIdx].name = r.new_name
      })
      alert(`成功重命名 ${res.data.renamed?.length || 0} 个模板`)
    } else {
      alert(res.data.summary || '批量重命名失败')
    }
  } catch (e) {
    alert('批量重命名失败: ' + (e as Error).message)
  }
  selectedTemplates.value.clear()
  isTemplateSelectMode.value = false
  showBatchRenameModal.value = false
}

// R92: Batch delete templates
const batchDeleteTemplates = async () => {
  if (selectedTemplates.value.size === 0) return
  if (!confirm(`确定要删除选中的 ${selectedTemplates.value.size} 个模板吗？`)) return
  try {
    const ids = Array.from(selectedTemplates.value)
    for (const id of ids) {
      await api.template.deleteTemplate(id)
    }
    myTemplates.value = myTemplates.value.filter(t => !selectedTemplates.value.has(t.id))
    selectedTemplates.value.clear()
    isTemplateSelectMode.value = false
    alert(`成功删除 ${ids.length} 个模板`)
  } catch (e) {
    alert('批量删除失败: ' + (e as Error).message)
  }
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

/* R102: Share template button */
.market-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.share-template-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.share-template-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.8);
}

.share-template-btn svg {
  width: 18px;
  height: 18px;
}

/* R111: AI Search & Analytics buttons */
.ai-search-btn,
.analytics-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: #f0f0f0;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: 4px;
}
.ai-search-btn:hover,
.analytics-btn:hover {
  background: #e0e0e0;
  color: #333;
}
.ai-search-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
.ai-search-btn:hover {
  background: linear-gradient(135deg, #5568d3 0%, #6a3f91 100%);
}
.analytics-btn:hover {
  background: #e0e0e0;
  color: #333;
}

/* R111: Advanced filter inputs */
.advanced-filter-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 13px;
  background: #fff;
  color: #333;
  box-sizing: border-box;
}
.advanced-filter-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}
.date-range-inputs {
  display: flex;
  align-items: center;
  gap: 6px;
}
.date-separator {
  color: #999;
  font-size: 12px;
}
.date-input {
  flex: 1;
}
.tag-filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.tag-filter-btn {
  font-size: 12px !important;
  padding: 4px 8px !important;
}

/* R111: Advanced search action buttons */
.advanced-search-btn {
  width: 100%;
  padding: 10px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
  margin-bottom: 8px;
}
.advanced-search-btn:hover {
  background: linear-gradient(135deg, #5568d3 0%, #6a3f91 100%);
  transform: translateY(-1px);
}
.clear-filters-btn {
  width: 100%;
  padding: 8px;
  background: #f5f5f5;
  color: #666;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}
.clear-filters-btn:hover {
  background: #e8e8e8;
  color: #333;
}

/* R111: Search result highlighting */
:deep(.search-highlight) {
  background: linear-gradient(135deg, #fef08a 0%, #fde047 100%);
  color: #333;
  padding: 0 2px;
  border-radius: 2px;
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

.tab-btn-create {
  background: linear-gradient(135deg, #5856D6, #165DFF) !important;
  color: white !important;
  border-color: transparent !important;
  margin-left: auto;
}

.tab-btn-create:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(88, 86, 214, 0.3);
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
  overflow: hidden;
}

.template-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
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

/* R92: Batch Selection */
.tab-btn-batch {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 20px;
  margin-left: 8px;
}

.tab-btn-batch.active {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.batch-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf3 100%);
  border-radius: 12px;
  margin-bottom: 16px;
  border: 2px solid #667eea;
}

.batch-selected-count {
  font-weight: 600;
  color: #667eea;
  font-size: 14px;
}

.batch-actions {
  display: flex;
  gap: 8px;
}

.batch-action-btn {
  padding: 6px 14px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.batch-action-btn.select-all {
  background: #e8ecf3;
  color: #667eea;
}

.batch-action-btn.deselect-all {
  background: #f0f0f0;
  color: #666;
}

.batch-action-btn.batch-rename {
  background: #667eea;
  color: white;
}

.batch-action-btn.batch-rename:hover:not(:disabled) {
  background: #5a70d6;
  transform: scale(1.02);
}

.batch-action-btn.batch-delete {
  background: #ff4757;
  color: white;
}

.batch-action-btn.batch-delete:hover:not(:disabled) {
  background: #e63946;
  transform: scale(1.02);
}

.batch-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.batch-select-checkbox {
  position: absolute;
  top: 12px;
  left: 12px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 3px solid white;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 10;
}

.batch-select-checkbox:hover {
  background: rgba(102, 126, 234, 0.3);
  transform: scale(1.1);
}

.batch-select-checkbox.selected {
  background: #667eea;
  border-color: #667eea;
}

.batch-select-checkbox svg {
  width: 16px;
  height: 16px;
  color: white;
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
  overflow: hidden;
}

.similar-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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

/* R102: Template of the day */
.daily-section {
  margin-bottom: 32px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
}

.daily-section .recommendation-title {
  color: white;
}

.daily-section .recommendation-subtitle {
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
}

.daily-icon {
  color: #ffd700;
}

.daily-template-card {
  display: flex;
  gap: 24px;
  background: white;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.daily-template-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.daily-thumbnail {
  position: relative;
  width: 200px;
  height: 140px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.daily-thumbnail .template-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.daily-thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
}

.daily-thumb-placeholder svg {
  width: 48px;
  height: 48px;
  stroke: white;
  opacity: 0.6;
}

.daily-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #ff6b35;
  color: white;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 700;
}

.daily-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.daily-name {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
}

.daily-desc {
  font-size: 14px;
  color: #666;
  margin: 0;
  flex: 1;
}

.daily-tags {
  display: flex;
  gap: 8px;
}

.daily-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.category-tag {
  background: #e8f0fe;
  color: #1a73e8;
}

.style-tag {
  background: #fce8e6;
  color: #d93025;
}

.daily-use-btn {
  align-self: flex-start;
  padding: 8px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.daily-use-btn:hover {
  opacity: 0.9;
}

/* R48: Featured templates */
.featured-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: linear-gradient(135deg, #f5af19, #f12711);
  color: white;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 700;
}

.featured-card {
  border: 2px solid #ffd700;
}

.featured-icon {
  color: #ffd700;
}

/* R48: Category subscription */
.subscribe-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  padding: 2px 4px;
  border-radius: 4px;
  transition: all 0.2s;
  opacity: 0.7;
}

.subscribe-btn:hover {
  opacity: 1;
  background: #f0f0f0;
}

.subscribe-btn.subscribed {
  opacity: 1;
}

.category-filter-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* R48: Publish button */
.publish-btn {
  background: #10b981 !important;
  color: white !important;
}

.publish-btn:hover {
  background: #059669 !important;
}

.publishing-spinner {
  font-size: 14px;
}

/* R139: Team Share Button */
.team-share-btn {
  background: #6366f1 !important;
  color: white !important;
}

.team-share-btn:hover {
  background: #4f46e5 !important;
}

/* R139: Team Templates Section */
.team-templates-section {
  padding: 24px 0;
}

.team-templates-header {
  margin-bottom: 24px;
}

.team-templates-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.team-templates-title svg {
  color: #6366f1;
}

.team-templates-subtitle {
  color: #888;
  font-size: 14px;
  margin-top: 4px;
}

.team-templates-loading,
.team-templates-empty {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 14px;
}

.team-templates-hint {
  color: #aaa;
  font-size: 13px;
  margin-top: 8px;
}

.team-templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.template-author-badge {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: rgba(99, 102, 241, 0.9);
  color: white;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  white-space: nowrap;
}

/* R48: Reviews */
.reviews-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #eee;
}

.reviews-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.reviews-title {
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #333;
}

.reviews-stats {
  display: flex;
  align-items: center;
  gap: 6px;
}

.avg-rating {
  font-size: 20px;
  font-weight: 700;
  color: #f5a623;
}

.star-row {
  display: flex;
  gap: 2px;
}

.star {
  color: #ddd;
  font-size: 14px;
}

.star.filled {
  color: #f5a623;
}

.review-count {
  font-size: 12px;
  color: #999;
}

.review-form {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.rating-input {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 14px;
  color: #666;
}

.star-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #ddd;
  cursor: pointer;
  transition: color 0.2s;
}

.star-btn.active {
  color: #f5a623;
}

.review-textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  box-sizing: border-box;
  font-family: inherit;
}

.review-textarea:focus {
  outline: none;
  border-color: #667eea;
}

.submit-review-btn {
  margin-top: 10px;
  padding: 8px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.submit-review-btn:hover:not(:disabled) {
  background: #5568d3;
}

.submit-review-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.review-item {
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 12px;
}

.review-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.reviewer-name {
  font-weight: 600;
  font-size: 13px;
  color: #333;
}

.review-date {
  font-size: 11px;
  color: #999;
  margin-left: auto;
}

.review-content {
  font-size: 13px;
  color: #555;
  line-height: 1.5;
}

.reviews-empty {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
}

/* R48: Bundles */
.bundles-section {
  padding: 24px 0;
}

.bundles-header {
  margin-bottom: 24px;
}

.bundles-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.bundles-title svg {
  color: #667eea;
}

.bundles-subtitle {
  color: #888;
  font-size: 14px;
  margin-top: 4px;
}

.bundles-loading,
.bundles-empty {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 14px;
}

.bundles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.bundle-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 2px solid transparent;
  transition: all 0.2s;
}

.bundle-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.15);
}

.bundle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.bundle-name {
  font-size: 16px;
  font-weight: 700;
  color: #333;
}

.bundle-discount {
  background: linear-gradient(135deg, #f5af19, #f12711);
  color: white;
  font-size: 12px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
}

.bundle-desc {
  font-size: 13px;
  color: #666;
  margin-bottom: 16px;
  line-height: 1.5;
}

.bundle-templates {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.bundle-template-thumb {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: background 0.2s;
  overflow: hidden;
  min-height: 60px;
}

.bundle-thumb-img {
  width: 100%;
  height: 36px;
  object-fit: cover;
  border-radius: 4px;
}

.bundle-template-thumb:hover {
  background: #e8eeff;
}

.bundle-template-thumb svg {
  width: 24px;
  height: 24px;
  color: #aaa;
}

.bundle-template-thumb span {
  font-size: 11px;
  color: #555;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.bundle-template-more {
  background: #f0f0f0;
  border-radius: 8px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #888;
}

.bundle-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bundle-templates-count {
  font-size: 13px;
  color: #888;
}

.bundle-purchase-btn {
  padding: 8px 20px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.bundle-purchase-btn:hover {
  opacity: 0.9;
}

/* Featured grid */
.featured-grid .template-card {
  border: 2px solid #ffd700;
}

/* R102: Upload/Share Template Modal */
.upload-modal {
  max-width: 560px;
  width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
}

.upload-modal-body {
  padding: 32px;
}

.upload-modal-title {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 8px;
}

.upload-modal-subtitle {
  font-size: 14px;
  color: #666;
  margin: 0 0 24px;
}

.upload-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.upload-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.upload-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.required {
  color: #e53935;
}

.upload-input,
.upload-textarea,
.upload-select {
  padding: 10px 14px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s;
  background: white;
  color: #333;
}

.upload-input:focus,
.upload-textarea:focus,
.upload-select:focus {
  outline: none;
  border-color: #667eea;
}

.upload-textarea {
  resize: vertical;
  min-height: 80px;
}

.upload-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.upload-radio-group {
  display: flex;
  gap: 16px;
}

.upload-radio {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #555;
  cursor: pointer;
}

.upload-radio input[type="radio"] {
  cursor: pointer;
}

.upload-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

.upload-cancel-btn {
  padding: 10px 20px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: background 0.2s;
}

.upload-cancel-btn:hover {
  background: #f5f5f5;
}

.upload-submit-btn {
  padding: 10px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  cursor: pointer;
  transition: opacity 0.2s;
}

.upload-submit-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.upload-submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* R128: Subcategory tag */
.template-subcategory {
  margin-bottom: 6px;
}
.subcategory-tag {
  display: inline-block;
  padding: 2px 8px;
  background: linear-gradient(135deg, #667eea22, #764ba222);
  border: 1px solid #667eea44;
  border-radius: 4px;
  font-size: 11px;
  color: #667eea;
  font-weight: 500;
}

/* R128: Download counter */
.meta-item.downloads {
  color: #00b42a;
}

/* R128: Ratings mini */
.meta-item.rating-mini {
  color: #ff7d00;
}

/* R128: Preview tabs */
.preview-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.preview-tab {
  padding: 6px 16px;
  border: 1px solid #e5e6eb;
  border-radius: 6px;
  background: white;
  font-size: 13px;
  color: #646a73;
  cursor: pointer;
  transition: all 0.2s;
}
.preview-tab.active {
  background: #165dff;
  border-color: #165dff;
  color: white;
}

/* R128: Slides preview */
.slides-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.slides-nav {
  display: flex;
  align-items: center;
  gap: 12px;
}
.slide-nav-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid #e5e6eb;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}
.slide-nav-btn:hover:not(:disabled) {
  background: #f4f5f5;
}
.slide-nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.slide-nav-btn svg {
  width: 16px;
  height: 16px;
}
.slide-indicator {
  font-size: 13px;
  color: #646a73;
  min-width: 60px;
  text-align: center;
}
.slide-preview-card {
  width: 100%;
  max-width: 320px;
  aspect-ratio: 16/9;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: white;
  position: relative;
  overflow: hidden;
}
.slide-type-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 2px 6px;
  background: rgba(0,0,0,0.25);
  border-radius: 3px;
  font-size: 10px;
  color: white;
}
.slide-preview-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 4px;
  color: white;
}
.slide-preview-subtitle {
  font-size: 11px;
  color: rgba(255,255,255,0.8);
  margin: 0;
}
.slide-preview-items {
  margin-top: 8px;
}
.slide-preview-item {
  font-size: 10px;
  color: rgba(255,255,255,0.9);
  margin: 2px 0;
}
.item-bullet {
  margin-right: 4px;
}

/* R128: Interactive preview */
.interactive-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px;
}
.interactive-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #8f9093;
}
.interactive-placeholder svg {
  width: 48px;
  height: 48px;
  opacity: 0.4;
}
.interactive-placeholder span {
  font-size: 13px;
}

/* R128: Ratings breakdown */
.ratings-breakdown {
  margin: 16px 0;
  padding: 16px;
  background: #f7f8fc;
  border-radius: 8px;
}
.rating-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.rating-score {
  font-size: 28px;
  font-weight: 700;
  color: #1f1f1f;
}
.rating-stars {
  display: flex;
  gap: 2px;
}
.rating-stars .star {
  font-size: 16px;
  color: #d9d9d9;
}
.rating-stars .star.filled {
  color: #ff7d00;
}
.rating-count {
  font-size: 12px;
  color: #8f9093;
}
.rating-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.rating-bar-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.rating-label {
  font-size: 12px;
  color: #646a73;
  min-width: 40px;
}
.rating-bar-track {
  flex: 1;
  height: 6px;
  background: #e5e6eb;
  border-radius: 3px;
  overflow: hidden;
}
.rating-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s;
}
.rating-bar-fill.design { background: #165dff; }
.rating-bar-fill.usability { background: #00b42a; }
.rating-bar-fill.features { background: #ff7d00; }
.rating-value {
  font-size: 12px;
  font-weight: 600;
  color: #1f1f1f;
  min-width: 28px;
  text-align: right;
}

/* R128: Collections section */
.collections-section {
  padding: 32px 0;
  border-top: 1px solid #f1f1f1;
  margin-top: 24px;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 600;
  color: #1f1f1f;
  margin: 0;
}
.section-title svg {
  width: 22px;
  height: 22px;
  color: #165dff;
}
.collections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
.collection-card {
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  background: white;
  border: 1px solid #f1f1f1;
}
.collection-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}
.collection-cover {
  height: 120px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  position: relative;
}
.collection-count {
  font-size: 12px;
  color: rgba(255,255,255,0.9);
  background: rgba(0,0,0,0.2);
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
  margin-bottom: 6px;
}
.collection-tags {
  display: flex;
  gap: 4px;
}
.collection-tag {
  font-size: 10px;
  color: rgba(255,255,255,0.85);
  background: rgba(0,0,0,0.15);
  padding: 1px 6px;
  border-radius: 3px;
}
.collection-info {
  padding: 12px 16px;
}
.collection-name {
  font-size: 15px;
  font-weight: 600;
  color: #1f1f1f;
  margin: 0 0 4px;
}
.collection-desc {
  font-size: 12px;
  color: #8f9093;
  margin: 0;
}

</style>
