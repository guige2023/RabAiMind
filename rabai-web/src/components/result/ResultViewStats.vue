<template>
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
</template>

<script setup lang="ts">
interface Props {
  slideCount: number
  fileSize: string
}

defineProps<Props>()
</script>

<style scoped>
.file-info {
  display: flex;
  justify-content: center;
  gap: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  margin: 20px 0;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.info-label {
  font-size: 13px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

@media (max-width: 600px) {
  .file-info {
    flex-direction: column;
    gap: 15px;
  }
  
  .info-item {
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    padding: 8px 0;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .info-item:last-child {
    border-bottom: none;
  }
}
</style>
