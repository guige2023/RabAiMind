<template>
  <div class="home">
    <!-- Hero 区域 -->
    <section class="hero">
      <div class="hero-bg">
        <div class="hero-gradient"></div>
        <div class="hero-grid"></div>
      </div>
      <div class="hero-content">
        <h1 class="hero-title animate-fadeIn">
          <span class="title-main">AI 智能 PPT 生成平台</span>
        </h1>
        <p class="hero-subtitle animate-fadeIn" style="animation-delay: 0.1s">
          输入需求，AI 自动生成专业演示文稿
        </p>
        <div class="hero-actions animate-fadeIn" style="animation-delay: 0.2s">
          <router-link to="/create" class="btn btn-primary btn-lg">
            <span>🚀</span>
            立即开始创建
          </router-link>
        </div>
        <!-- 统计数据 -->
        <div class="hero-stats animate-fadeIn" style="animation-delay: 0.3s" v-if="statistics.totalGenerations > 0">
          <div class="stat-item">
            <span class="stat-value">{{ statistics.totalGenerations }}</span>
            <span class="stat-label">已生成</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">{{ statistics.totalSlides }}</span>
            <span class="stat-label">幻灯片</span>
          </div>
        </div>
      </div>
      <div class="hero-visual">
        <div class="ppt-preview">
          <div class="ppt-slide" v-for="i in 3" :key="i">
            <div class="slide-content">
              <div class="slide-title"></div>
              <div class="slide-body">
                <div class="slide-line" v-for="j in 3" :key="j"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 特性区域 -->
    <section class="features">
      <div class="container">
        <h2 class="section-title">为什么选择 RabAi Mind</h2>
        <div class="features-grid">
          <div class="feature-card" v-for="feature in features" :key="feature.title">
            <div class="feature-icon">{{ feature.icon }}</div>
            <h3 class="feature-title">{{ feature.title }}</h3>
            <p class="feature-desc">{{ feature.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 场景区域 -->
    <section class="scenes">
      <div class="container">
        <h2 class="section-title">多场景支持</h2>
        <div class="scenes-grid">
          <div
            class="scene-card"
            v-for="scene in scenes"
            :key="scene.id"
            @click="selectScene(scene.id)"
          >
            <div class="scene-icon">{{ scene.icon }}</div>
            <h3 class="scene-name">{{ scene.name }}</h3>
            <p class="scene-desc">{{ scene.desc }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useStatistics } from '../composables/useStatistics'

const router = useRouter()
const { statistics } = useStatistics()

const features = [
  { icon: '⚡', title: '快速生成', desc: '3分钟完成PPT生成' },
  { icon: '🎨', title: '专业设计', desc: 'AI 驱动视觉设计' },
  { icon: '📱', title: '多端支持', desc: 'Web/小程序全覆盖' },
  { icon: '🔄', title: '格式兼容', desc: 'Office/WPS 完美兼容' },
]

const scenes = [
  { id: 'business', icon: '💼', name: '商务', desc: '商业计划、工作汇报' },
  { id: 'education', icon: '📚', name: '教育', desc: '课件培训、学术报告' },
  { id: 'tech', icon: '🚀', name: '科技', desc: '技术分享、产品发布' },
  { id: 'creative', icon: '💡', name: '创意', desc: '营销策划、创意展示' },
]

const selectScene = (sceneId: string) => {
  router.push({ path: '/create', query: { scene: sceneId } })
}
</script>

<style scoped>
/* Hero 区域 */
.hero {
  position: relative;
  min-height: 80vh;
  display: flex;
  align-items: center;
  overflow: hidden;
  background: linear-gradient(135deg, #0A1628 0%, #1a2744 100%);
}

.hero-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.hero-gradient {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 0%, rgba(22, 93, 255, 0.3) 0%, transparent 60%);
}

.hero-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(22, 93, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(22, 93, 255, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 600px;
  padding: 60px 24px;
  margin-left: auto;
  margin-right: auto;
  text-align: center;
}

.hero-title {
  margin-bottom: 20px;
}

.title-main {
  display: block;
  font-size: 52px;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
  background: linear-gradient(135deg, #fff 0%, #5AC8FA 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 40px;
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.btn-lg {
  padding: 16px 40px;
  font-size: 17px;
}

.hero-visual {
  display: none;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .hero {
    min-height: 60vh;
  }

  .hero-content {
    padding: 40px 20px;
  }

  .title-main {
    font-size: 32px;
  }

  .subtitle-text {
    font-size: 16px;
  }

  .hero-actions {
    flex-direction: column;
    gap: 12px;
  }

  .btn-lg {
    padding: 14px 28px;
    font-size: 15px;
    width: 100%;
  }

  .ppt-preview {
    transform: perspective(800px) rotateY(-10deg) rotateX(5deg);
    gap: 10px;
  }

  .ppt-slide {
    width: 140px;
    height: 100px;
    padding: 10px;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .feature-card {
    padding: 20px;
  }

  .section-title {
    font-size: 24px;
  }
}

@media (min-width: 1024px) {
  .hero {
    justify-content: space-between;
  }

  .hero-content {
    margin-left: 10%;
    text-align: left;
    padding: 60px;
  }

  .hero-actions {
    justify-content: flex-start;
  }

  .hero-visual {
    display: block;
    padding: 60px;
  }
}

/* PPT 预览动画 */
.ppt-preview {
  display: flex;
  gap: 16px;
  transform: perspective(1000px) rotateY(-15deg) rotateX(5deg);
}

.ppt-slide {
  width: 200px;
  height: 140px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  padding: 16px;
  animation: float 3s ease-in-out infinite;
}

.ppt-slide:nth-child(2) {
  animation-delay: 0.5s;
  margin-top: 20px;
}

.ppt-slide:nth-child(3) {
  animation-delay: 1s;
  margin-top: 40px;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes shine {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

.hero-title {
  animation: slideUp 0.8s ease-out;
}

.hero-subtitle {
  animation: slideUp 0.8s ease-out 0.2s both;
}

.hero-actions {
  animation: slideUp 0.8s ease-out 0.4s both;
}

.ppt-preview {
  animation: slideUp 0.8s ease-out 0.6s both;
}

.feature-card {
  animation: slideUp 0.6s ease-out both;
}

.feature-card:nth-child(1) { animation-delay: 0.1s; }
.feature-card:nth-child(2) { animation-delay: 0.2s; }
.feature-card:nth-child(3) { animation-delay: 0.3s; }

.title-main {
  background: linear-gradient(90deg, #fff, #5AC8FA, #fff);
  background-size: 200% auto;
  animation: shine 3s linear infinite;
}

.slide-content {
  height: 100%;
}

.slide-title {
  height: 16px;
  background: linear-gradient(90deg, #165DFF, #5AC8FA);
  border-radius: 4px;
  margin-bottom: 12px;
  width: 60%;
}

.slide-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slide-line {
  height: 8px;
  background: #E5E5E5;
  border-radius: 4px;
}

.slide-line:nth-child(2) { width: 80%; }
.slide-line:nth-child(3) { width: 60%; }

/* 特性区域 */
.features {
  padding: 80px 0;
  background: #fff;
}

.section-title {
  text-align: center;
  font-size: 32px;
  font-weight: 600;
  color: #1A1A1A;
  margin-bottom: 48px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
}

.feature-card {
  padding: 32px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid #E5E5E5;
  text-align: center;
  transition: all 0.3s;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(22, 93, 255, 0.1);
  border-color: rgba(22, 93, 255, 0.3);
}

.feature-icon {
  font-size: 40px;
  margin-bottom: 16px;
}

.feature-title {
  font-size: 18px;
  font-weight: 600;
  color: #1A1A1A;
  margin-bottom: 8px;
}

.feature-desc {
  font-size: 14px;
  color: #666;
}

/* 场景区域 */
.scenes {
  padding: 80px 0;
  background: linear-gradient(180deg, #F5F5F5 0%, #fff 100%);
}

.scenes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

.scene-card {
  padding: 28px;
  background: #fff;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.scene-card:hover {
  border-color: #165DFF;
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(22, 93, 255, 0.15);
}

.scene-icon {
  font-size: 36px;
  margin-bottom: 12px;
}

.scene-name {
  font-size: 18px;
  font-weight: 600;
  color: #1A1A1A;
  margin-bottom: 4px;
}

.scene-desc {
  font-size: 14px;
  color: #666;
}

/* 统计样式 */
.hero-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  margin-top: 40px;
  padding: 16px 32px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
}

.stat-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
}

@media (max-width: 768px) {
  .hero-stats {
    padding: 12px 20px;
    gap: 16px;
  }

  .stat-value {
    font-size: 22px;
  }
}
</style>
