/**
 * PPT API Client
 * 前端API客户端 - 与后端 /api/v1/ppt 通信
 */

const API_BASE = '/api/v1/ppt';

export interface PPTRequest {
  user_request: string;
  slide_count: number;
  scene: string;
  style: string;
  template?: string;
  theme_color?: string;
}

export interface TaskStatus {
  success: boolean;
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  current_step: string;
  created_at: string;
  updated_at: string;
  result?: {
    pptx_path: string;
    slide_count: number;
    file_size: number;
    compression_ratio: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface GenerateResponse {
  success: boolean;
  task_id: string;
  status: string;
  message: string;
  estimated_time?: number;
}

class PPTApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  /**
   * 生成PPT
   */
  async generate(request: PPTRequest): Promise<GenerateResponse> {
    const response = await fetch(`${this.baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: '请求失败' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * 获取任务状态
   */
  async getStatus(taskId: string): Promise<TaskStatus> {
    const response = await fetch(`${this.baseUrl}/task/${taskId}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: '获取状态失败' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * 下载PPT文件
   */
  async download(taskId: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/download/${taskId}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: '下载失败' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.blob();
  }

  /**
   * 获取PPT预览图列表
   */
  async getPreview(taskId: string): Promise<{
    success: boolean;
    task_id: string;
    slides: Array<{
      slide_num: number;
      filename: string;
      url: string;
    }>;
    total: number;
  }> {
    const response = await fetch(`${this.baseUrl}/preview/${taskId}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: '获取预览失败' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * 获取SVG文件
   */
  async getSvg(taskId: string, slideNum: number): Promise<string> {
    const response = await fetch(`${this.baseUrl}/svg/${taskId}/${slideNum}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.text();
  }

  /**
   * 取消任务
   */
  async cancel(taskId: string): Promise<{ success: boolean; task_id: string; status: string }> {
    const response = await fetch(`${this.baseUrl}/task/${taskId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: '取消失败' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * 获取模板列表
   */
  async getTemplates(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    thumbnail: string;
  }>> {
    const response = await fetch(`${this.baseUrl}/templates`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * 获取场景类型
   */
  async getScenes(): Promise<Array<{
    id: string;
    name: string;
    description: string;
  }>> {
    const response = await fetch(`${this.baseUrl}/scenes`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * 获取风格类型
   */
  async getStyles(): Promise<Array<{
    id: string;
    name: string;
    description: string;
  }>> {
    const response = await fetch(`${this.baseUrl}/styles`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  }
}

export const pptApi = new PPTApiClient();
