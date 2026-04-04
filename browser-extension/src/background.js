/**
 * RabAiMind Browser Extension — Service Worker (Background)
 * 
 * 功能：
 * - 管理右键菜单
 * - 持久化 API 配置（apiUrl, apiKey）
 * - 消息转发（content ↔ popup）
 * 
 * 作者: Claude
 * 日期: 2026-04-04
 */

// 安装时创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "rabaimind-generate-ppt",
    title: "用 RabAiMind 生成 PPT",
    contexts: ["selection", "page"],
  });

  // 初始化默认配置
  chrome.storage.local.get(["rabaimind_api_url"], (result) => {
    if (!result.rabaimind_api_url) {
      chrome.storage.local.set({
        rabaimind_api_url: "http://localhost:8003",
        rabaimind_api_key: "",
        rabaimind_auto_submit: false,
      });
    }
  });

  console.log("[RabAiMind] 扩展已安装");
});

// 右键菜单处理
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "rabaimind-generate-ppt") return;

  const selectedText = info.selectionText || "";
  const pageTitle = tab.title || "";
  const pageUrl = info.pageUrl || "";

  const payload = {
    user_request: selectedText || pageTitle || "根据网页内容生成 PPT",
    scene: "general",
    style: "professional",
    title: pageTitle.substring(0, 100),
    source_url: pageUrl,
  };

  chrome.storage.local.set({
    rabaimind_payload: payload,
    rabaimind_source: {
      pageTitle,
      pageUrl,
      selectedText,
      timestamp: Date.now(),
    },
  });

  // 打开 popup 或跳转到选项页
  chrome.action.openPopup().catch(() => {
    chrome.runtime.openOptionsPage();
  });
});

// 监听来自 popup 或 content script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_CONFIG") {
    chrome.storage.local.get(
      ["rabaimind_api_url", "rabaimind_api_key", "rabaimind_auto_submit"],
      (result) => {
        sendResponse(result);
      }
    );
    return true; // 异步响应
  }

  if (message.type === "SET_CONFIG") {
    chrome.storage.local.set(message.config, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === "GENERATE_PPT") {
    handleGeneratePPT(message.payload)
      .then((result) => sendResponse({ success: true, result }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === "GET_TASK_STATUS") {
    handleGetTaskStatus(message.taskId)
      .then((result) => sendResponse({ success: true, result }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

// 调用 RabAiMind API 生成 PPT
async function handleGeneratePPT(payload) {
  const config = await new Promise((resolve) =>
    chrome.storage.local.get(["rabaimind_api_url", "rabaimind_api_key"], resolve)
  );

  const apiUrl = config.rabaimind_api_url || "http://localhost:8003";
  const apiKey = config.rabaimind_api_key || "";

  const headers = {
    "Content-Type": "application/json",
  };
  if (apiKey) {
    headers["X-API-Key"] = apiKey;
  }

  const response = await fetch(`${apiUrl}/api/v1/ppt/generate`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API 错误 ${response.status}: ${errorText}`);
  }

  return await response.json();
}

// 查询任务状态
async function handleGetTaskStatus(taskId) {
  const config = await new Promise((resolve) =>
    chrome.storage.local.get(["rabaimind_api_url", "rabaimind_api_key"], resolve)
  );

  const apiUrl = config.rabaimind_api_url || "http://localhost:8003";
  const apiKey = config.rabaimind_api_key || "";

  const headers = {};
  if (apiKey) headers["X-API-Key"] = apiKey;

  const response = await fetch(`${apiUrl}/api/v1/ppt/status/${taskId}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error(`API 错误 ${response.status}`);
  }

  return await response.json();
}
