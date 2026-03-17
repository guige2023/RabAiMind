import axios from 'axios';

const API_BASE = '';

export interface PPTRequest {
  user_request: string;
  slide_count?: number;
  scene?: string;
  style?: string;
  aspect_ratio?: string;
}

export interface PPTResponse {
  request_id: string;
  status: string;
  task_id: string;
  message: string;
  download_url?: string;
}

export interface TaskStatus {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  created_at: string;
  updated_at: string;
  result?: {
    success: boolean;
    pptx_path?: string;
    slide_count?: number;
  };
  error?: string;
}

export const pptApi = {
  // 生成 PPT
  generate: async (request: PPTRequest): Promise<PPTResponse> => {
    const response = await axios.post<PPTResponse>(`${API_BASE}/api/v1/ppt/generate`, request);
    return response.data;
  },

  // 获取任务状态
  getStatus: async (taskId: string): Promise<TaskStatus> => {
    const response = await axios.get<TaskStatus>(`${API_BASE}/api/v1/ppt/status/${taskId}`);
    return response.data;
  },

  // 下载 PPT
  download: async (taskId: string): Promise<Blob> => {
    const response = await axios.get(`${API_BASE}/api/v1/ppt/download/${taskId}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // 取消任务
  cancel: async (taskId: string): Promise<void> => {
    await axios.delete(`${API_BASE}/api/v1/ppt/task/${taskId}`);
  },

  // 获取模板列表
  getTemplates: async (): Promise<{ templates: { name: string; path: string }[] }> => {
    const response = await axios.get(`${API_BASE}/api/v1/templates`);
    return response.data;
  },

  // 健康检查
  health: async (): Promise<{ status: string }> => {
    const response = await axios.get(`${API_BASE}/health`);
    return response.data;
  },
};
