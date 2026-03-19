// 导出生成工具

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

// 解析渐变背景
export const parseGradient = (css: string, ctx: CanvasRenderingContext2D, w: number, h: number) => {
  const match = css.match(/linear-gradient\((\d+)deg,\s*(.+)\)/)
  if (!match) return '#ffffff'

  const angle = parseInt(match[1]) * Math.PI / 180
  const colors = match[2].split(/,\s*/).map((c: string) => c.trim())

  const x1 = w / 2 - Math.cos(angle) * w
  const y1 = h / 2 - Math.sin(angle) * h
  const x2 = w / 2 + Math.cos(angle) * w
  const y2 = h / 2 + Math.sin(angle) * h

  const gradient = ctx.createLinearGradient(x1, y1, x2, y2)
  colors.forEach((color: string, i: number) => {
    gradient.addColorStop(i / (colors.length - 1), color)
  })

  return gradient
}

// 生成交互式HTML演示文稿
export const generateInteractiveHTML = (slides: any[], isDark: boolean): string => {
  const bgColor = isDark ? '#1a1a2e' : '#f5f5f5'
  const textColor = isDark ? '#ffffff' : '#333333'

  const slidesHtml = slides.map((slide, i) => `
    <div class="slide${i === 0 ? ' active' : ''}" style="background: ${slide.background || (isDark ? '#1a1a2e' : '#ffffff')}">
      <div class="content">
        <h1 style="color: ${getContrastColor(slide.background, isDark ? 0.9 : 1)}">${slide.title || `第${i + 1}页`}</h1>
        <p style="color: ${getContrastColor(slide.background, isDark ? 0.7 : 0.7)}">${slide.content || ''}</p>
      </div>
    </div>`).join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PPT演示文稿</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: '思源黑体', '思源宋体', sans-serif; background: ${bgColor}; color: ${textColor}; overflow: hidden; }
    .slide { position: absolute; width: 100%; height: 100%; display: none; align-items: center; justify-content: center; }
    .slide.active { display: flex; }
    .content { text-align: center; max-width: 800px; padding: 60px; }
    h1 { font-size: 56px; margin-bottom: 40px; }
    p { font-size: 28px; line-height: 1.8; white-space: pre-wrap; }
    .nav { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); display: flex; gap: 12px; }
    .nav button { width: 50px; height: 50px; border-radius: 50%; border: none; background: ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}; color: ${textColor}; font-size: 20px; cursor: pointer; }
    .nav button:hover { background: #165DFF; color: white; }
    .progress { position: fixed; top: 20px; right: 20px; font-size: 16px; opacity: 0.7; }
    .hint { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); font-size: 14px; opacity: 0.5; }
  </style>
</head>
<body>
  <div class="hint">按 ← → 翻页 | 空格下一页</div>
  <div class="progress"><span id="cur">1</span> / <span id="tot">${slides.length}</span></div>
  ${slidesHtml}
  <div class="nav">
    <button onclick="prev()">←</button>
    <button onclick="next()">→</button>
  </div>
  <script>
    let idx = 0, tot = ${slides.length};
    const slides = document.querySelectorAll('.slide');
    function show(i) {
      slides.forEach(s => s.classList.remove('active'));
      slides[i].classList.add('active');
      document.getElementById('cur').textContent = i + 1;
    }
    function next() { idx = (idx + 1) % tot; show(idx); }
    function prev() { idx = (idx - 1 + tot) % tot; show(idx); }
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === ' ') next();
      if (e.key === 'ArrowLeft') prev();
    });
    show(0);
  </script>
</body>
</html>`
}

// 生成打印HTML
export const generatePrintHTML = (slides: any[]): string => {
  const slidesHtml = slides.map((slide, i) => `
  <div class="slide" style="background: ${slide.background || '#fff'}">
    <div class="content">
      <h1 style="color: ${getContrastColor(slide.background)}">${slide.title || `第${i+1}页`}</h1>
      <p style="color: ${getContrastColor(slide.background, 0.7)}">${slide.content || ''}</p>
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
    .content { text-align: center; padding: 40px; }
    h1 { font-size: 42px; margin-bottom: 30px; }
    p { font-size: 22px; line-height: 1.8; }
  </style>
</head>
<body>
${slidesHtml}
</body>
</html>`
}
