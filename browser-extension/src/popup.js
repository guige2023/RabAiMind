/**
 * RabAiMind Browser Extension — Popup Script
 * 
 * 作者: Claude
 * 日期: 2026-04-04
 */

let currentPayload = null;

// 初始化
document.addEventListener("DOMContentLoaded", async () => {
  // 获取存储的内容
  const data = await chrome.storage.local.get([
    "rabaimind_payload",
    "rabaimind_source",
    "rabaimind_api_url",
    "rabaimind_api_key",
  ]);

  const source = data.rabaimind_source || {};
  const payload = data.rabaimind_payload || {};

  // 显示来源信息
  const sourceEl = document.getElementById("sourceText");
  if (source.selectedText) {
    sourceEl.textContent = source.selectedText.substring(0, 120) + (source.selectedText.length > 120 ? "…" : "");
  } else if (source.pageTitle) {
    sourceEl.textContent = source.pageTitle;
  } else {
    sourceEl.textContent = "当前页面（无选中文字）";
  }

  // 填充表单
  if (payload.scene) {
    document.getElementById("scene").value = payload.scene;
  }

  currentPayload = payload;

  // 检查 API 配置
  if (!data.rabaimind_api_url || !data.rabaimind_api_key) {
    showStatus(
      "warning",
      "⚠️ 请先点击「设置 API」配置服务器地址和 API Key"
    );
  }
});

// 生成 PPT
async function generatePPT() {
  const btn = document.getElementById("generateBtn");
  const apiUrl = await getConfig("rabaimind_api_url");
  const apiKey = await getConfig("rabaimind_api_key");

  if (!apiUrl) {
    showStatus("error", "请先配置 API 地址（点击「设置 API」）");
    return;
  }

  const payload = {
    ...currentPayload,
    scene: document.getElementById("scene").value,
    style: document.getElementById("style").value,
  };

  btn.disabled = true;
  showStatus("loading", "正在提交生成请求...");

  try {
    const headers = { "Content-Type": "application/json" };
    if (apiKey) headers["X-API-Key"] = apiKey;

    const response = await fetch(`${apiUrl}/api/v1/ppt/generate`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API 错误 ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    const taskId = result.task_id;

    showStatus("success", `✅ 任务已创建！task_id: ${taskId}\n正在等待生成完成...`);

    // 轮询任务状态
    pollTaskStatus(taskId, apiUrl, apiKey);

  } catch (err) {
    showStatus("error", `❌ 提交失败: ${err.message}`);
    btn.disabled = false;
  }
}

// 轮询任务状态
async function pollTaskStatus(taskId, apiUrl, apiKey) {
  const maxAttempts = 60; // 最多等 5 分钟（每 5 秒）
  let attempts = 0;

  const poll = async () => {
    if (attempts >= maxAttempts) {
      showStatus("error", "⏰ 生成超时，请稍后在历史记录查看");
      document.getElementById("generateBtn").disabled = false;
      return;
    }

    try {
      const headers = {};
      if (apiKey) headers["X-API-Key"] = apiKey;

      const resp = await fetch(`${apiUrl}/api/v1/ppt/status/${taskId}`, {
        headers,
      });
      const status = await resp.json();

      if (status.status === "completed") {
        showStatus(
          "success",
          `✅ PPT 生成完成！\n📥 <a href="${apiUrl}/api/v1/ppt/download/${taskId}" target="_blank">点击下载 PPTX</a>`
        );
        document.getElementById("generateBtn").disabled = false;
        return;
      } else if (status.status === "failed") {
        showStatus("error", `❌ 生成失败: ${status.error || "未知错误"}`);
        document.getElementById("generateBtn").disabled = false;
        return;
      }

      // 继续轮询
      showStatus("loading", `⏳ 生成中 (${Math.round(status.progress || 0)}%)，请稍候...`);
      attempts++;
      setTimeout(poll, 5000);

    } catch (err) {
      showStatus("error", `❌ 查询失败: ${err.message}`);
      document.getElementById("generateBtn").disabled = false;
    }
  };

  // 首次延迟
  setTimeout(poll, 5000);
}

// 打开设置页
function openSettings() {
  chrome.runtime.openOptionsPage();
}

// 获取配置项
function getConfig(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => resolve(result[key]));
  });
}

// 显示状态
function showStatus(type, html) {
  const el = document.getElementById("statusBox");
  el.className = `status ${type}`;
  el.innerHTML = html;
  el.style.display = "block";
}
