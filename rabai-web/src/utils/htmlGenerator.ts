// HTML生成工具 - 用于PPT导出

// 获取对比色
export const getContrastColor = (bg: string, opacity = 1): string => {
  if (!bg) return '#333333'
  if (bg.startsWith('#')) {
    const r = parseInt(bg.slice(1, 3), 16)
    const g = parseInt(bg.slice(3, 5), 16)
    const b = parseInt(bg.slice(5, 7), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5 ? `rgba(0,0,0,${opacity})` : `rgba(255,255,255,${opacity})`
  }
  return `rgba(255,255,255,${opacity})`
}

// 生成完整可交互的HTML演示文稿
export const generateFullHTML = (slides: any[], isDark: boolean): string => {
  const bgColor = isDark ? '#1a1a2e' : '#f5f5f5'
  const textColor = isDark ? '#ffffff' : '#333333'
  const accentColor = '#165DFF'

  const slidesHtml = slides.map((slide, i) => `
    <div class="slide${i === 0 ? ' active' : ''}" data-index="${i}" style="background: ${slide.background || (isDark ? '#1a1a2e' : '#ffffff')}">
      <div class="slide-content">
        <div class="slide-title" style="color: ${getContrastColor(slide.background, isDark ? 0.9 : 1)}">${slide.title || `第${i + 1}页`}</div>
        <div class="slide-content-text" style="color: ${getContrastColor(slide.background, isDark ? 0.7 : 0.7)}">${slide.content || ''}</div>
      </div>
    </div>`).join('')

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PPT演示文稿</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: '思源黑体', '思源宋体', sans-serif; background: ${bgColor}; color: ${textColor}; overflow: hidden; }
    .presentation { width: 100vw; height: 100vh; position: relative; }
    .slide { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: none; align-items: center; justify-content: center; padding: 60px; }
    .slide.active { display: flex; }
    .slide-content { max-width: 1200px; width: 100%; text-align: center; }
    .slide-title { font-size: 56px; font-weight: bold; margin-bottom: 40px; line-height: 1.3; }
    .slide-content-text { font-size: 28px; line-height: 1.8; white-space: pre-wrap; }
    .nav { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); display: flex; gap: 12px; z-index: 100; }
    .nav-btn { width: 50px; height: 50px; border-radius: 50%; border: none; background: ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}; color: ${textColor}; font-size: 20px; cursor: pointer; transition: all 0.3s; }
    .nav-btn:hover { background: ${accentColor}; color: white; }
    .page-indicator { position: fixed; top: 20px; right: 20px; font-size: 16px; opacity: 0.7; }
    .progress-bar { position: fixed; top: 0; left: 0; height: 4px; background: ${accentColor}; transition: width 0.3s; }
    .fullscreen-hint { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); font-size: 14px; opacity: 0.5; }
  </style>
</head>
<body>
  <div class="progress-bar" id="progress"></div>
  <div class="fullscreen-hint">按 F11 全屏 | ← → 翻页</div>
  <div class="page-indicator"><span id="current">1</span> / <span id="total">${slides.length}</span></div>
  <div class="presentation">${slidesHtml}</div>
  <div class="nav">
    <button class="nav-btn" onclick="prevSlide()">←</button>
    <button class="nav-btn" onclick="nextSlide()">→</button>
  </div>
  <script>
    let currentIndex = 0;
    const slides = document.querySelectorAll('.slide');
    const total = slides.length;
    function showSlide(index) {
      slides.forEach(s => s.classList.remove('active'));
      slides[index].classList.add('active');
      document.getElementById('current').textContent = index + 1;
      document.getElementById('progress').style.width = ((index + 1) / total * 100) + '%';
    }
    function nextSlide() { currentIndex = (currentIndex + 1) % total; showSlide(currentIndex); }
    function prevSlide() { currentIndex = (currentIndex - 1 + total) % total; showSlide(currentIndex); }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'Home') { currentIndex = 0; showSlide(0); }
      if (e.key === 'End') { currentIndex = total - 1; showSlide(total - 1); }
    });
    let touchStartX = 0;
    document.addEventListener('touchstart', e => touchStartX = e.touches[0].clientX);
    document.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) diff > 0 ? nextSlide() : prevSlide();
    });
    document.getElementById('total').textContent = total;
    showSlide(0);
  </script>
</body>
</html>`
}

// 生成打印用的HTML
export const generatePrintHTML = (slides: any[]): string => {
  const slidesHtml = slides.map((slide, i) => `
  <div class="slide" style="background: ${slide.background || '#ffffff'}">
    <div class="slide-content">
      <div class="slide-title" style="color: ${getContrastColor(slide.background)}">${slide.title || `第${i+1}页`}</div>
      <div class="slide-content-text" style="color: ${getContrastColor(slide.background, 0.7)}">${slide.content || ''}</div>
    </div>
  </div>`).join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>PPT演示文稿</title>
  <style>
    @page { size: A4 landscape; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .slide { width: 297mm; height: 210mm; page-break-after: always; display: flex; align-items: center; justify-content: center; }
    .slide:last-child { page-break-after: avoid; }
    .slide-content { width: 90%; height: 90%; display: flex; flex-direction: column; justify-content: center; padding: 40px; }
    .slide-title { font-size: 48px; font-weight: bold; margin-bottom: 30px; }
    .slide-content-text { font-size: 24px; line-height: 1.8; }
  </style>
</head>
<body>
${slidesHtml}
</body>
</html>`
}

// 生成单张幻灯片图片HTML
export const generateSlideImageHTML = (slide: any, pageNum: number): string => {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Slide ${pageNum}</title>
  <style>
    * { margin: 0; padding: 0; }
    .slide { width: 1920px; height: 1080px; display: flex; align-items: center; justify-content: center; }
    .content { text-align: center; padding: 100px; }
    .title { font-size: 72px; font-weight: bold; margin-bottom: 40px; }
    .text { font-size: 36px; line-height: 1.8; }
  </style>
</head>
<body>
  <div class="slide" style="background: ${slide.background || '#fff'}">
    <div class="content">
      <div class="title" style="color: ${getContrastColor(slide.background)}">${slide.title || `第${pageNum}页`}</div>
      <div class="text" style="color: ${getContrastColor(slide.background, 0.8)}">${slide.content || ''}</div>
    </div>
  </div>
</body>
</html>`
}
