import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pptApi } from '../api/ppt';
import type { PPTRequest } from '../api/ppt';

const SCENES = [
  { value: 'business', label: '商业汇报', description: '适合企业汇报、方案展示' },
  { value: 'education', label: '教育培训', description: '适合课程培训、学术讲座' },
  { value: 'marketing', label: '营销推广', description: '适合品牌宣传、营销活动' },
  { value: 'technology', label: '技术分享', description: '适合技术演示、产品介绍' },
  { value: 'personal', label: '个人展示', description: '适合个人简历、演讲展示' },
];

const STYLES = [
  { value: 'professional', label: '专业商务', color: 'blue' },
  { value: 'creative', label: '创意时尚', color: 'purple' },
  { value: 'simple', label: '简约清新', color: 'green' },
  { value: 'tech', label: '科技未来', color: 'cyan' },
];

export default function Home() {
  const navigate = useNavigate();
  const [request, setRequest] = useState<PPTRequest>({
    user_request: '',
    slide_count: 10,
    scene: 'business',
    style: 'professional',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!request.user_request.trim()) {
      setError('请输入 PPT 需求描述');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await pptApi.generate(request);
      navigate(`/generator/${response.task_id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || '生成失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            RabAi Mind
          </h1>
          <p className="text-xl text-purple-200">
            AI 智能 PPT 生成平台
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
          {/* Request Input */}
          <div className="mb-8">
            <label className="block text-white text-lg font-medium mb-3">
              描述你的需求
            </label>
            <textarea
              className="w-full h-40 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
              placeholder="例如：创建一个关于人工智能在教育领域应用的产品介绍PPT，包含市场分析、产品功能、竞争优势等..."
              value={request.user_request}
              onChange={(e) => setRequest({ ...request, user_request: e.target.value })}
            />
          </div>

          {/* Slide Count */}
          <div className="mb-8">
            <label className="block text-white text-lg font-medium mb-3">
              幻灯片数量: {request.slide_count} 页
            </label>
            <input
              type="range"
              min="5"
              max="20"
              value={request.slide_count}
              onChange={(e) => setRequest({ ...request, slide_count: parseInt(e.target.value) })}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-400"
            />
            <div className="flex justify-between text-purple-300 text-sm mt-1">
              <span>5页</span>
              <span>20页</span>
            </div>
          </div>

          {/* Scene Selection */}
          <div className="mb-8">
            <label className="block text-white text-lg font-medium mb-3">
              选择场景
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SCENES.map((scene) => (
                <button
                  key={scene.value}
                  onClick={() => setRequest({ ...request, scene: scene.value })}
                  className={`p-4 rounded-xl text-left transition-all ${
                    request.scene === scene.value
                      ? 'bg-purple-500/30 border-2 border-purple-400'
                      : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                  }`}
                >
                  <div className="text-white font-medium">{scene.label}</div>
                  <div className="text-purple-300 text-sm">{scene.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Style Selection */}
          <div className="mb-8">
            <label className="block text-white text-lg font-medium mb-3">
              选择风格
            </label>
            <div className="flex flex-wrap gap-3">
              {STYLES.map((style) => (
                <button
                  key={style.value}
                  onClick={() => setRequest({ ...request, style: style.value })}
                  className={`px-6 py-2 rounded-full font-medium transition-all ${
                    request.style === style.value
                      ? `bg-${style.color}-500 text-white`
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-400/50 rounded-xl text-red-200">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white text-xl font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                正在生成中...
              </span>
            ) : (
              '开始生成 PPT'
            )}
          </button>
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 backdrop-blur rounded-xl p-6 text-center">
            <div className="text-3xl mb-2">🤖</div>
            <h3 className="text-white font-semibold mb-2">AI 智能生成</h3>
            <p className="text-purple-300 text-sm">基于火山引擎大模型，自动生成专业 PPT 内容</p>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-xl p-6 text-center">
            <div className="text-3xl mb-2">🎨</div>
            <h3 className="text-white font-semibold mb-2">多种风格</h3>
            <p className="text-purple-300 text-sm">商务、教育、营销等多种场景模板</p>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-xl p-6 text-center">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="text-white font-semibold mb-2">快速下载</h3>
            <p className="text-purple-300 text-sm">生成完成后可直接下载 PPT 文件</p>
          </div>
        </div>
      </div>
    </div>
  );
}
