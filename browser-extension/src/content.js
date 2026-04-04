/**
 * RabAiMind Browser Extension — Content Script
 * 
 * 功能：
 * - 监听页面文本选择，显示「生成 PPT」浮动按钮
 * - 右键菜单：在选中文本上生成 PPT
 * - 提取页面主题/标题作为 PPT 大纲输入
 * 
 * 作者: Claude
 * 日期: 2026-04-04
 */

// 浮动按钮容器 ID
const FLOAT_BTN_ID = "rabaimind-float-btn";

// 显示浮动按钮
function showFloatButton(selection) {
  removeFloatButton();

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  const btn = document.createElement("div");
  btn.id = FLOAT_BTN_ID;
  btn.innerHTML = `
    <div style="
      position: fixed;
      top: ${rect.bottom + window.scrollY + 8}px;
      left: ${rect.left + window.scrollX}px;
      z-index: 2147483647;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      border: none;
      border-radius: 8px;
      padding: 8px 14px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(99,102,241,0.4);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: transform 0.1s, box-shadow 0.1s;
      user-select: none;
    "
    onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 20px rgba(99,102,241,0.5)';"
    onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 16px rgba(99,102,241,0.4)';"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M7 7h4M7 12h10M7 17h7"/>
      </svg>
      用 AI 生成 PPT
    </div>
  `;

  btn.addEventListener("click", () => handleGeneratePPT(selection.toString()));
  document.body.appendChild(btn);
}

// 移除浮动按钮
function removeFloatButton() {
  const existing = document.getElementById(FLOAT_BTN_ID);
  if (existing) existing.remove();
}

// 生成 PPT 处理
async function handleGeneratePPT(selectedText) {
  removeFloatButton();

  const pageTitle = document.title || "";
  const pageUrl = window.location.href;

  // 提取页面主题（meta description 或前几段文字）
  const metaDesc = document.querySelector('meta[name="description"]')?.content || "";
  const ogTitle = document.querySelector('meta[property="og:title"]')?.content || "";

  const topic = ogTitle || metaDesc || pageTitle;

  // 构建 PPT 生成请求
  const payload = {
    user_request: selectedText || topic || "请根据页面内容生成 PPT",
    scene: "general",
    style: "professional",
    slides: [],
    title: pageTitle.substring(0, 100),
    source_url: pageUrl,
  };

  // 发送到 background script → popup → 用户确认
  // 通过 chrome.storage 共享数据
  chrome.storage.local.set({
    rabaimind_payload: payload,
    rabaimind_source: {
      pageTitle,
      pageUrl,
      selectedText,
      timestamp: Date.now(),
    },
  });

  // 打开 popup
  chrome.action.openPopup().catch(() => {
    // fallback: 直接跳转到配置页面
    alert("请点击浏览器右上角 RabAiMind 扩展图标使用");
  });
}

// 监听文本选择
document.addEventListener("mouseup", (e) => {
  // 忽略点击在已有按钮上的
  if (e.target.closest && e.target.closest("#" + FLOAT_BTN_ID)) return;

  const selection = window.getSelection();
  const text = selection.toString().trim();

  if (text.length > 10 && text.length < 5000) {
    showFloatButton(selection);
  } else {
    removeFloatButton();
  }
});

// 移除按钮 on scroll / keypress
document.addEventListener("scroll", removeFloatButton, { passive: true });
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") removeFloatButton();
});
