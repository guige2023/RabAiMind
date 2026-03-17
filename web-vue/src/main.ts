/**
 * RabAi Mind 前端入口文件
 *
 * Vue3 应用主入口
 * 使用 Vite 作为构建工具
 */
import { createApp } from 'vue'
import App from './App.vue'
import './assets/main.css'

// 创建 Vue 应用实例
const app = createApp(App)

// 挂载应用到 DOM
app.mount('#app')

// 全局错误处理
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue 错误:', err)
  console.error('组件实例:', instance)
  console.error('错误信息:', info)
}

// 打印应用启动信息
console.log('RabAi Mind 前端已启动')
console.log('环境:', import.meta.env.MODE)
console.log('API 地址:', import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000')
