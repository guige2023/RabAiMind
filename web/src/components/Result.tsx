import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pptApi } from '../api/ppt';
import type { TaskStatus } from '../api/ppt';

export default function Result() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<TaskStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!taskId) return;

    const fetchStatus = async () => {
      try {
        const data = await pptApi.getStatus(taskId);
        setStatus(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [taskId]);

  const handleDownload = async () => {
    if (!taskId) return;

    setDownloading(true);
    try {
      const blob = await pptApi.download(taskId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `presentation_${taskId.slice(0, 8)}.pptx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    );
  }

  if (!status || status.status !== 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
          <div className="text-red-400 text-xl mb-4">生成失败</div>
          <p className="text-purple-200 mb-6">{status?.error || '未知错误'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const result = status.result as { slide_count?: number } | undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold text-white mb-2">PPT 生成成功!</h1>
            <p className="text-purple-200">你的演示文稿已准备就绪</p>
          </div>

          {/* Result Info */}
          <div className="bg-white/5 rounded-xl p-6 mb-8">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-purple-300 text-sm mb-1">幻灯片数量</div>
                <div className="text-white text-2xl font-bold">{result?.slide_count || 10} 页</div>
              </div>
              <div>
                <div className="text-purple-300 text-sm mb-1">文件格式</div>
                <div className="text-white text-2xl font-bold">PPTX</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white text-lg font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {downloading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  下载中...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  下载 PPT 文件
                </>
              )}
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
            >
              创建新的 PPT
            </button>
          </div>

          {/* Task Info */}
          {taskId && (
            <div className="mt-8 text-center text-purple-300 text-sm">
              任务 ID: {taskId}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
