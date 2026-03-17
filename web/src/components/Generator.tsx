import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pptApi } from '../api/ppt';
import type { TaskStatus } from '../api/ppt';

const PROGRESS_STEPS = [
  { progress: 10, label: '解析需求，生成内容...' },
  { progress: 30, label: '内容质量检查...' },
  { progress: 50, label: '渲染 SVG...' },
  { progress: 70, label: '转换为 PPTX...' },
  { progress: 90, label: '优化 PPTX...' },
  { progress: 100, label: '生成完成！' },
];

export default function Generator() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<TaskStatus | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!taskId) return;

    const fetchStatus = async () => {
      try {
        const data = await pptApi.getStatus(taskId);
        setStatus(data);

        if (data.status === 'completed') {
          navigate(`/result/${taskId}`);
        } else if (data.status === 'failed') {
          setError(data.error || '生成失败');
        }
      } catch (err: any) {
        setError(err.message || '获取状态失败');
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);

    return () => clearInterval(interval);
  }, [taskId, navigate]);

  const getCurrentStep = () => {
    if (!status) return PROGRESS_STEPS[0];
    const progress = status.progress;
    return PROGRESS_STEPS.find((s) => progress <= s.progress) || PROGRESS_STEPS[0];
  };

  const getProgressPercent = () => {
    if (!status) return 0;
    return status.progress;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">AI 正在生成你的 PPT</h1>
            <p className="text-purple-200">请稍候，正在处理中...</p>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-white mb-2">
              <span>{getCurrentStep().label}</span>
              <span>{getProgressPercent()}%</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                style={{ width: `${getProgressPercent()}%` }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {PROGRESS_STEPS.map((step, index) => {
              const isActive = status && status.progress >= step.progress;
              const isCurrent = getCurrentStep().progress === step.progress;

              return (
                <div
                  key={index}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                    isCurrent
                      ? 'bg-purple-500/20 border border-purple-400/50'
                      : isActive
                      ? 'bg-white/10'
                      : 'bg-white/5 opacity-50'
                  }`}
                >
                  <div className="text-2xl">{isActive ? '✓' : '○'}</div>
                  <div className={`${isActive ? 'text-white' : 'text-purple-300'}`}>
                    {step.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Error */}
          {error && (
            <div className="mt-8 p-4 bg-red-500/20 border border-red-400/50 rounded-xl text-red-200">
              <p className="font-medium">生成失败</p>
              <p className="text-sm mt-1">{error}</p>
              <button
                onClick={() => navigate('/')}
                className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                返回首页重试
              </button>
            </div>
          )}

          {/* Task ID */}
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
