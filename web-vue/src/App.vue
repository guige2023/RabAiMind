<template>
  <div id="app">
    <!-- 顶部导航 -->
    <header class="app-header">
      <div class="header-container">
        <div class="logo">
          <span class="logo-icon">🎨</span>
          <span class="logo-text">RabAi Mind</span>
        </div>
        <nav class="nav">
          <a href="#" class="nav-link active">首页</a>
          <a href="#" class="nav-link">模板</a>
          <a href="#" class="nav-link">历史</a>
        </nav>
        <div class="header-actions">
          <button class="btn btn-ghost">登录</button>
        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="app-main">
      <PptGenerator />
    </main>

    <!-- 底部 -->
    <footer class="app-footer">
      <div class="footer-container">
        <p class="footer-text">
          © 2026 RabAi Mind · AI PPT 生成平台
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
/**
 * App 根组件
 *
 * 应用布局容器，包含头部导航、主内容区、底部
 */
import PptGenerator from './components/PptGenerator.vue'
</script>

<style scoped>
/* 应用容器 */
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 顶部导航 */
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #E5E5E5;
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  font-size: 24px;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: #165DFF;
}

.nav {
  display: flex;
  gap: 32px;
}

.nav-link {
  font-size: 15px;
  color: #666;
  text-decoration: none;
  transition: color 0.2s;
}

.nav-link:hover {
  color: #165DFF;
}

.nav-link.active {
  color: #165DFF;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 主内容区 */
.app-main {
  flex: 1;
  background: #F5F5F5;
}

/* 底部 */
.app-footer {
  background: #fff;
  border-top: 1px solid #E5E5E5;
  padding: 24px 0;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  text-align: center;
}

.footer-text {
  font-size: 14px;
  color: #999;
  margin: 0;
}

/* 按钮 */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-ghost {
  background: transparent;
  color: #666;
}

.btn-ghost:hover {
  background: #F5F5F5;
  color: #333;
}
</style>
