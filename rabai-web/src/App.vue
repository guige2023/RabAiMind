<template>
  <div class="app">
    <header class="header">
      <div class="header-content">
        <router-link to="/" class="logo">
          <span class="logo-icon">✨</span>
          <span class="logo-text">RabAi Mind</span>
        </router-link>
        <nav class="nav">
          <router-link to="/" class="nav-link">首页</router-link>
          <router-link to="/create" class="nav-link">创建PPT</router-link>
        </nav>
      </div>
    </header>
    <main class="main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <footer class="footer">
      <p>© 2026 RabAi Mind · AI PPT 生成平台</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(22, 93, 255, 0.1);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}

.logo-icon {
  font-size: 28px;
}

.logo-text {
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(135deg, #165DFF 0%, #5AC8FA 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
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
  position: relative;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: #165DFF;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #165DFF, #5AC8FA);
  transition: width 0.3s;
}

.nav-link:hover::after,
.nav-link.router-link-active::after {
  width: 100%;
}

.main {
  flex: 1;
}

.footer {
  padding: 24px;
  text-align: center;
  color: #999;
  font-size: 14px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
