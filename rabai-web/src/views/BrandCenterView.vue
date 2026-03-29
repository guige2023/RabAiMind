<template>
  <div class="brand-center">
    <h2>品牌中心</h2>

    <div class="brand-form">
      <div class="form-item">
        <label>品牌名称</label>
        <input v-model="brand.brand_name" placeholder="输入品牌名称" />
      </div>

      <div class="form-item">
        <label>主色</label>
        <input type="color" v-model="brand.primary_color" />
        <span class="color-value">{{ brand.primary_color }}</span>
      </div>

      <div class="form-item">
        <label>辅色</label>
        <input type="color" v-model="brand.secondary_color" />
        <span class="color-value">{{ brand.secondary_color }}</span>
      </div>

      <div class="form-item">
        <label>强调色</label>
        <input type="color" v-model="brand.accent_color" />
        <span class="color-value">{{ brand.accent_color }}</span>
      </div>

      <div class="form-item">
        <label>字体</label>
        <input v-model="brand.fonts" placeholder="字体1, 字体2" />
      </div>

      <div class="form-item">
        <label>Slogan</label>
        <input v-model="brand.slogan" placeholder="品牌口号" />
      </div>

      <button class="btn-save" @click="saveBrand">保存品牌配置</button>
    </div>

    <div class="preview" v-if="brand.brand_name">
      <h3>预览</h3>
      <div
        class="preview-card"
        :style="{
          background: `linear-gradient(135deg, ${brand.primary_color}, ${brand.secondary_color})`
        }"
      >
        <h4>{{ brand.brand_name }}</h4>
        <p>{{ brand.slogan || '品牌slogan' }}</p>
        <div class="preview-accent" :style="{ background: brand.accent_color }"></div>
      </div>
    </div>

    <div class="history" v-if="brandList.length > 0">
      <h3>已有品牌配置</h3>
      <div class="brand-list">
        <div
          v-for="b in brandList"
          :key="b.user_id"
          class="brand-item"
          @click="loadBrand(b)"
        >
          <span class="brand-name">{{ b.brand_name }}</span>
          <span class="brand-colors">
            <span
              v-for="c in [b.primary_color, b.secondary_color, b.accent_color]"
              :key="c"
              class="color-dot"
              :style="{ background: c }"
            ></span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../api/client'

const brand = ref({
  brand_name: '',
  primary_color: '#165DFF',
  secondary_color: '#0E42D2',
  accent_color: '#FF9500',
  fonts: '思源黑体, Arial',
  slogan: '',
})

const brandList = ref([])

const saveBrand = async () => {
  try {
    // 解析字体字符串为数组
    const payload = {
      ...brand.value,
      fonts: brand.value.fonts.split(',').map(f => f.trim()),
    }
    await api.post('/brand/save', payload)
    alert('品牌配置已保存')
    loadBrandList()
  } catch (e) {
    console.error('保存失败:', e)
    alert('保存失败: ' + e.message)
  }
}

const loadBrand = async (b) => {
  brand.value = {
    brand_name: b.brand_name,
    primary_color: b.primary_color,
    secondary_color: b.secondary_color,
    accent_color: b.accent_color,
    fonts: Array.isArray(b.fonts) ? b.fonts.join(', ') : b.fonts,
    slogan: b.slogan || '',
  }
}

const loadBrandList = async () => {
  try {
    const res = await api.get('/brand/list')
    brandList.value = res.data || []
  } catch (e) {
    console.error('加载品牌列表失败:', e)
  }
}

onMounted(() => {
  loadBrandList()
})
</script>

<style scoped>
.brand-center {
  padding: 24px;
  max-width: 600px;
}

.brand-form {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.form-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.form-item label {
  width: 80px;
  font-weight: 600;
  flex-shrink: 0;
}

.form-item input[type='text'] {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.form-item input[type='color'] {
  width: 48px;
  height: 32px;
  border: none;
  cursor: pointer;
  border-radius: 6px;
}

.color-value {
  font-family: monospace;
  font-size: 13px;
  color: #666;
}

.btn-save {
  width: 100%;
  padding: 12px;
  background: #165dff;
  color: #fff;
  border: none;
  border-radius: 8px;
  margin-top: 8px;
  cursor: pointer;
  font-size: 16px;
}

.btn-save:hover {
  background: #0e42d2;
}

.preview h3,
.history h3 {
  margin-bottom: 12px;
  color: #333;
}

.preview-card {
  padding: 32px;
  border-radius: 16px;
  color: #fff;
  text-align: center;
  position: relative;
}

.preview-card h4 {
  margin: 0 0 8px;
  font-size: 24px;
}

.preview-card p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.preview-accent {
  position: absolute;
  bottom: 16px;
  right: 16px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.5);
}

.history {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
}

.brand-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.brand-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.brand-item:hover {
  background: #f5f5f5;
}

.brand-name {
  font-weight: 600;
}

.brand-colors {
  display: flex;
  gap: 6px;
}

.color-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: inline-block;
  border: 1px solid rgba(0, 0, 0, 0.1);
}
</style>
