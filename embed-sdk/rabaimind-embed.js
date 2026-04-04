/**
 * RabAiMind Embed SDK
 * 
 * 在任意第三方网站嵌入 RabAiMind PPT 创建组件。
 * 支持：iframe 嵌入、Web Component、自定义按钮触发。
 * 
 * @version 1.0.0
 * @author Claude
 * @date 2026-04-04
 * 
 * 使用示例：
 * ```html
 * <!-- 方式1: 直接嵌入（iframe） -->
 * <div id="rabaimind-container"></div>
 * <script src="rabaimind-embed.js"></script>
 * <script>
 *   RabAiMind.init({
 *     container: '#rabaimind-container',
 *     apiUrl: 'https://your-api.com',
 *     apiKey: 'your-api-key',
 *     theme: 'light',   // 'light' | 'dark' | 'auto'
 *     onComplete: (taskId, result) => { console.log('PPT 已生成', taskId); }
 *   });
 * </script>
 * 
 * <!-- 方式2: Web Component -->
 * <rabaimind-embed api-url="https://your-api.com" api-key="xxx" theme="light"></rabaimind-embed>
 * <script type="module" src="rabaimind-embed.js"></script>
 * ```
 */

(function (global) {
  "use strict";

  // ── 默认配置 ─────────────────────────────────────────────
  const DEFAULT_API_URL = "http://localhost:8003";
  const DEFAULT_THEME = "auto";
  const DEFAULT_WIDTH = 800;
  const DEFAULT_HEIGHT = 600;

  // ── SDK 主类 ─────────────────────────────────────────────
  class RabAiMindSDK {
    constructor(options) {
      this.options = Object.assign(
        {
          apiUrl: DEFAULT_API_URL,
          apiKey: "",
          theme: DEFAULT_THEME,
          container: null,
          width: DEFAULT_WIDTH,
          height: DEFAULT_HEIGHT,
          locale: "zh-CN",
          // Callbacks
          onComplete: null,      // (taskId, result) => void
          onError: null,         // (error) => void
          onStatusChange: null,  // (status) => void
          onReady: null,         // () => void
          // 预设参数
          defaultScene: "general",
          defaultStyle: "professional",
          defaultTitle: "",
        },
        options
      );

      this._container = null;
      this._iframe = null;
      this._taskId = null;
      this._pollTimer = null;
      this._eventHandlers = {};
      this._ready = false;

      this._init();
    }

    // ── 初始化 ─────────────────────────────────────────────

    _init() {
      this._resolveContainer();
      this._renderIframe();
      this._listenForMessages();
      // 通知 iframe SDK 已就绪
      window.addEventListener("message", this._handleMessage.bind(this));
      setTimeout(() => this._notifyIframe("ready"), 100);
    }

    _resolveContainer() {
      if (!this.options.container) {
        throw new Error("RabAiMind: container 选项是必填的 (CSS 选择器或 DOM 元素)");
      }
      this._container =
        typeof this.options.container === "string"
          ? document.querySelector(this.options.container)
          : this.options.container;

      if (!this._container) {
        throw new Error(`RabAiMind: 找不到容器 ${this.options.container}`);
      }
    }

    _renderIframe() {
      // 构建嵌入 URL（带 query 参数）
      const params = new URLSearchParams({
        theme: this.options.theme,
        locale: this.options.locale,
        sdk: "1",
        scene: this.options.defaultScene,
        style: this.options.defaultStyle,
      });
      if (this.options.defaultTitle) params.set("title", this.options.defaultTitle);

      const embedUrl = `${this.options.apiUrl}/embed?${params.toString()}`;

      const iframe = document.createElement("iframe");
      iframe.src = embedUrl;
      iframe.id = "rabaimind-embed-iframe";
      iframe.style.cssText = `
        width: ${this.options.width}px;
        height: ${this.options.height}px;
        border: none;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        display: block;
      `;
      iframe.setAttribute("allow", "clipboard-write");
      iframe.setAttribute("title", "RabAiMind PPT Creator");

      // 清理容器并插入
      this._container.innerHTML = "";
      this._container.style.width = `${this.options.width}px`;
      this._container.appendChild(iframe);
      this._iframe = iframe;

      iframe.onload = () => {
        this._ready = true;
        this._sendConfigToIframe();
        if (typeof this.options.onReady === "function") this.options.onReady();
      };

      iframe.onerror = () => {
        this._container.innerHTML = `
          <div style="width:${this.options.width}px;height:${this.options.height}px;
            display:flex;align-items:center;justify-content:center;background:#f8fafc;
            border-radius:12px;border:1px solid #e2e8f0;font-family:sans-serif;color:#64748b;font-size:14px;">
            加载 RabAiMind 出错，请检查 API 地址是否正确
          </div>`;
        if (typeof this.options.onError === "function") {
          this.options.onError(new Error("Iframe 加载失败"));
        }
      };
    }

    _sendConfigToIframe() {
      this._postToIframe({
        type: "config",
        apiUrl: this.options.apiUrl,
        apiKey: this.options.apiKey,
        theme: this.options.theme,
        locale: this.options.locale,
        scene: this.options.defaultScene,
        style: this.options.defaultStyle,
        title: this.options.defaultTitle,
      });
    }

    _postToIframe(message) {
      if (this._iframe && this._iframe.contentWindow) {
        this._iframe.contentWindow.postMessage(
          { source: "rabaimind-sdk", ...message },
          "*"
        );
      }
    }

    _notifyIframe(event) {
      this._postToIframe({ type: event });
    }

    // ── 事件处理 ────────────────────────────────────────────

    _listenForMessages() {
      window.addEventListener("message", this._handleMessage.bind(this));
    }

    _handleMessage(event) {
      // 只处理来自 iframe 的消息
      if (!event.data || event.data.source !== "rabaimind-embed") return;

      const msg = event.data;
      switch (msg.type) {
        case "sdk-ready":
          this._ready = true;
          this._sendConfigToIframe();
          if (typeof this.options.onReady === "function") this.options.onReady();
          break;

        case "ppt-generated":
          this._taskId = msg.taskId;
          if (typeof this.options.onComplete === "function") {
            this.options.onComplete(msg.taskId, msg.result);
          }
          break;

        case "ppt-error":
          if (typeof this.options.onError === "function") {
            this.options.onError(new Error(msg.error));
          }
          break;

        case "status-change":
          if (typeof this.options.onStatusChange === "function") {
            this.options.onStatusChange(msg.status);
          }
          break;

        case "user-action":
          this._emit("user-action", msg.action, msg.data);
          break;
      }
    }

    // ── 公开 API ───────────────────────────────────────────

    /**
     * 提交 PPT 生成请求
     * @param {Object} options
     * @param {string} options.userRequest - 用户输入内容/主题
     * @param {string} [options.scene] - 场景类型
     * @param {string} [options.style] - 风格
     * @param {string} [options.title] - PPT 标题
     * @param {Array} [options.slides] - 自定义幻灯片大纲
     */
    generate(options = {}) {
      if (!this._ready) {
        console.warn("[RabAiMind] SDK 尚未就绪，请等待 onReady 回调");
      }

      this._postToIframe({
        type: "generate",
        payload: {
          user_request: options.userRequest || options.user_request || "",
          scene: options.scene || this.options.defaultScene,
          style: options.style || this.options.defaultStyle,
          title: options.title || this.options.defaultTitle,
          slides: options.slides || [],
        },
      });
    }

    /**
     * 查询任务状态
     * @param {string} taskId
     * @returns {Promise<Object>}
     */
    async getStatus(taskId) {
      const tid = taskId || this._taskId;
      if (!tid) throw new Error("RabAiMind: 缺少 taskId");

      const resp = await fetch(
        `${this.options.apiUrl}/api/v1/ppt/status/${tid}`,
        {
          headers: this._authHeaders(),
        }
      );
      if (!resp.ok) throw new Error(`API 错误: ${resp.status}`);
      return resp.json();
    }

    /**
     * 获取 PPT 下载 URL
     * @param {string} taskId
     * @returns {string}
     */
    getDownloadUrl(taskId) {
      const tid = taskId || this._taskId;
      if (!tid) throw new Error("RabAiMind: 缺少 taskId");
      return `${this.options.apiUrl}/api/v1/ppt/download/${tid}`;
    }

    /**
     * 销毁 SDK 实例（清理 iframe 和轮询）
     */
    destroy() {
      if (this._pollTimer) clearInterval(this._pollTimer);
      window.removeEventListener("message", this._handleMessage);
      if (this._iframe) {
        this._container.removeChild(this._iframe);
        this._iframe = null;
      }
      this._ready = false;
    }

    /**
     * 监听 SDK 事件
     * @param {string} event
     * @param {Function} handler
     */
    on(event, handler) {
      if (!this._eventHandlers[event]) this._eventHandlers[event] = [];
      this._eventHandlers[event].push(handler);
    }

    _emit(event, ...args) {
      (this._eventHandlers[event] || []).forEach((h) => h(...args));
    }

    // ── 工具方法 ───────────────────────────────────────────

    _authHeaders() {
      const h = { "Content-Type": "application/json" };
      if (this.options.apiKey) h["X-API-Key"] = this.options.apiKey;
      return h;
    }

    /**
     * 轮询任务状态直到完成
     * @param {string} taskId
     * @param {Function} onProgress - (status, progress) => void
     * @param {number} interval - 轮询间隔（毫秒），默认 3000
     */
    pollUntilComplete(taskId, onProgress, interval = 3000) {
      const tid = taskId || this._taskId;
      if (!tid) throw new Error("RabAiMind: 缺少 taskId");

      this._pollTimer = setInterval(async () => {
        try {
          const status = await this.getStatus(tid);
          if (typeof onProgress === "function") onProgress(status, status.progress);

          if (status.status === "completed") {
            clearInterval(this._pollTimer);
            this._pollTimer = null;
            if (typeof this.options.onComplete === "function") {
              this.options.onComplete(tid, status.result);
            }
          } else if (status.status === "failed") {
            clearInterval(this._pollTimer);
            this._pollTimer = null;
            if (typeof this.options.onError === "function") {
              this.options.onError(new Error(status.error || "生成失败"));
            }
          }
        } catch (err) {
          console.error("[RabAiMind] 轮询出错:", err);
        }
      }, interval);
    }
  }

  // ── Web Component ────────────────────────────────────────
  // <rabaimind-embed api-url="..." api-key="..." theme="light"></rabaimind-embed>

  class RabAiMindEmbedElement extends HTMLElement {
    static get observedAttributes() {
      return ["api-url", "api-key", "theme", "width", "height", "default-scene", "default-style", "default-title"];
    }

    connectedCallback() {
      const sdk = new RabAiMindSDK({
        container: this,
        apiUrl: this.getAttribute("api-url") || DEFAULT_API_URL,
        apiKey: this.getAttribute("api-key") || "",
        theme: this.getAttribute("theme") || DEFAULT_THEME,
        width: parseInt(this.getAttribute("width") || String(DEFAULT_WIDTH), 10),
        height: parseInt(this.getAttribute("height") || String(DEFAULT_HEIGHT), 10),
        defaultScene: this.getAttribute("default-scene") || "general",
        defaultStyle: this.getAttribute("default-style") || "professional",
        defaultTitle: this.getAttribute("default-title") || "",
        onReady: () => this.dispatchEvent(new CustomEvent("ready")),
        onComplete: (taskId, result) =>
          this.dispatchEvent(new CustomEvent("complete", { detail: { taskId, result } })),
        onError: (err) =>
          this.dispatchEvent(new CustomEvent("error", { detail: { error: err } })),
      });

      this._sdk = sdk;
    }

    disconnectedCallback() {
      if (this._sdk) {
        this._sdk.destroy();
        this._sdk = null;
      }
    }

    generate(options) {
      this._sdk?.generate(options);
    }

    getStatus(taskId) {
      return this._sdk?.getStatus(taskId);
    }

    getDownloadUrl(taskId) {
      return this._sdk?.getDownloadUrl(taskId);
    }
  }

  // 注册 Web Component
  if (!customElements.get("rabaimind-embed")) {
    customElements.define("rabaimind-embed", RabAiMindEmbedElement);
  }

  // ── 导出全局对象 ─────────────────────────────────────────
  const SDK = {
    version: "1.0.0",
    init: function (options) {
      return new RabAiMindSDK(options);
    },
    createEmbed: function (options) {
      return new RabAiMindSDK(options);
    },
    // 便捷方法：直接打开全屏弹窗
    openDialog: function (options) {
      options = options || {};
      const overlay = document.createElement("div");
      overlay.id = "rabaimind-dialog-overlay";
      overlay.style.cssText = `
        position:fixed;top:0;left:0;right:0;bottom:0;
        background:rgba(0,0,0,0.5);z-index:99999;
        display:flex;align-items:center;justify-content:center;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      `;

      const container = document.createElement("div");
      overlay.appendChild(container);
      document.body.appendChild(overlay);

      const sdk = new RabAiMindSDK(
        Object.assign({}, options, {
          container,
          width: Math.min(options.width || DEFAULT_WIDTH, window.innerWidth - 40),
          height: Math.min(options.height || DEFAULT_HEIGHT, window.innerHeight - 80),
          _overlay: overlay,
          onComplete: (taskId, result) => {
            if (typeof options.onComplete === "function") options.onComplete(taskId, result);
            if (options.autoClose !== false) sdk.destroy();
          },
          onError: (err) => {
            if (typeof options.onError === "function") options.onError(err);
          },
        })
      );

      // 点击遮罩关闭
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          sdk.destroy();
          document.body.removeChild(overlay);
        }
      });

      return sdk;
    },
    // 注册 Web Component
    WebComponent: RabAiMindEmbedElement,
  };

  // AMD / CommonJS / 全局
  if (typeof module !== "undefined" && module.exports) {
    module.exports = SDK;
  } else if (typeof define === "function" && define.amd) {
    define(function () { return SDK; });
  } else {
    global.RabAiMind = SDK;
  }

})(typeof window !== "undefined" ? window : this);
