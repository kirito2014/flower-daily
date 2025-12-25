'use client';

import { useState, useEffect } from 'react';
// AI 相关从 admin 导入
import { 
  saveSystemConfig, toggleAIProvider, deleteSystemConfig, testAIConnection, getSystemConfig
} from '@/app/actions/admin';
// Image 相关全部从 image 导入
import { 
  saveImageConfig, getImageConfig, testImageConnection, toggleImageProvider, deleteImageConfig 
} from '@/app/actions/image';
import { 
  Loader2, Bot, Image as ImageIcon, Sparkles, Zap, Power, Trash2, Edit2, CheckCircle2, XCircle, Save, Activity, Info
} from 'lucide-react';

// === 常量定义 ===

const AI_PROVIDERS = [
  { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat', icon: Sparkles, note: '性价比极高，响应速度快，推荐作为主力模型使用。' },
  { id: 'moonshot', name: 'Moonshot (Kimi)', baseUrl: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k', icon: Bot, note: '中文理解能力强，适合生成优美、治愈的花语。' },
  { id: 'aliyun', name: 'Aliyun (通义千问)', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-turbo', icon: Zap, note: '阿里通义千问模型，稳定可靠。' },
  { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-3.5-turbo', icon: Bot, note: '国际标准模型，需要确保服务器网络环境可访问。' },
  // === 恢复：自定义服务 ===
  { id: 'custom', name: '自定义服务', baseUrl: '', model: '', icon: Bot, note: '兼容 OpenAI 接口协议的其他任意服务商。' },
];

const IMG_PROVIDERS = [
  { id: 'unsplash', name: 'Unsplash', baseUrl: 'https://api.unsplash.com', icon: ImageIcon, note: '全球最大的免费高清图库，图片质量极高。' },
  // { id: 'pexels', name: 'Pexels', baseUrl: 'https://api.pexels.com/v1', icon: ImageIcon, note: '优秀的免费图库，支持视频和图片搜索。' },
];

// === 子组件：服务商卡片 ===

interface ProviderCardProps {
  provider: any;
  type: 'ai' | 'image';
  config: any;
  isActive: boolean;
  onRefresh: () => void;
}

function ProviderCard({ provider, type, config, isActive, onRefresh }: ProviderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    baseUrl: provider.baseUrl,
    modelName: provider.model || '',
    apiKey: '', // 默认不回显 Key，只在保存时覆盖
    accessKey: '', // Image
    secretKey: ''  // Image
  });

  // 自定义名称状态
  const [customName, setCustomName] = useState('');

  // 初始化数据
  useEffect(() => {
    if (config) {
      setFormData(prev => ({
        ...prev,
        baseUrl: config.baseUrl || provider.baseUrl,
        modelName: config.modelName || provider.model || '',
      }));
      
      // === 解析自定义名称 ===
      if (provider.id === 'custom' && config.name) {
        // 尝试去除 "(自定义服务)" 后缀以回显
        const match = config.name.match(/^(.*)\(自定义服务\)$/);
        setCustomName(match ? match[1] : config.name);
      }
    }
  }, [config, provider]);

  const handleTest = async () => {
    setLoading(true);
    setTestResult(null);
    try {
        if (type === 'ai') {
           const res = await testAIConnection(provider.id);
           setTestResult(res);
        } else {
           const res = await testImageConnection(provider.id);
           setTestResult(res);
        }
    } catch (e) {
      setTestResult({ success: false, message: '请求失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('key', provider.id);
      fd.append('baseUrl', formData.baseUrl);
      
      // === 处理名称存储逻辑 ===
      if (provider.id === 'custom') {
        // 自定义服务：存储为 "用户输入(自定义服务)"
        const finalName = customName.trim() ? `${customName.trim()}(自定义服务)` : 'Custom AI(自定义服务)';
        fd.append('name', finalName);
      } else {
        // 标准服务：使用预设名称
        fd.append('name', provider.name);
      }
      
      if (type === 'ai') {
        fd.append('apiKey', formData.apiKey);
        fd.append('modelName', formData.modelName);
        await saveSystemConfig(fd);
      } else {
        fd.append('accessKey', formData.accessKey);
        fd.append('secretKey', formData.secretKey);
        await saveImageConfig(fd);
      }
      
      // 保存成功后自动折叠，并刷新父级
      setIsExpanded(false);
      onRefresh();
    } catch (e) {
      alert('保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定清除该配置吗？')) return;
    setLoading(true);
    try {
      if (type === 'ai') await deleteSystemConfig(provider.id);
      else await deleteImageConfig(provider.id);
      
      setFormData({ ...formData, apiKey: '', accessKey: '', secretKey: '' });
      setCustomName('');
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!config) return alert('请先配置并保存信息');
    setLoading(true);
    try {
      if (type === 'ai') await toggleAIProvider(provider.id, !isActive);
      else await toggleImageProvider(provider.id, !isActive);
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const Icon = provider.icon;
  const hasConfig = !!config;

  return (
    <div className={`bg-white border rounded-2xl transition-all duration-300 overflow-hidden ${isActive ? 'border-purple-500 shadow-md shadow-purple-100 ring-1 ring-purple-100' : 'border-stone-200 shadow-sm'} ${isExpanded ? 'ring-2 ring-stone-100' : ''}`}>
      
      {/* === 卡片头部 === */}
      <div className="p-5 flex items-center justify-between bg-white">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${isActive ? 'bg-purple-100 text-purple-600' : 'bg-stone-100 text-stone-500'}`}>
            <Icon size={24} />
          </div>
          <div>
            <h3 className={`font-bold text-lg ${isActive ? 'text-purple-900' : 'text-stone-700'}`}>
              {/* 如果是自定义服务且已配置，显示数据库中存储的名字(通常带后缀)；否则显示默认名字 */}
              {config?.name || provider.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isActive ? 'bg-green-100 text-green-700' : hasConfig ? 'bg-stone-100 text-stone-500' : 'bg-red-50 text-red-400'}`}>
                {isActive ? '已激活' : hasConfig ? '未激活' : '未配置'}
              </span>
              {testResult && (
                 <span className={`text-xs flex items-center gap-1 ${testResult.success ? 'text-green-600' : 'text-red-500'}`}>
                   {testResult.success ? <CheckCircle2 size={12}/> : <XCircle size={12}/>}
                   {testResult.success ? '连接正常' : '连接失败'}
                 </span>
              )}
            </div>
          </div>
        </div>

        {/* 右侧操作区 */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 mr-2">
             <span className={`text-xs font-medium ${isActive ? 'text-purple-600' : 'text-stone-400'}`}>
               {isActive ? 'ON' : 'OFF'}
             </span>
             <button 
               onClick={handleToggleActive}
               disabled={loading || !hasConfig}
               className={`w-11 h-6 rounded-full transition-colors relative ${isActive ? 'bg-purple-600' : 'bg-stone-200'} ${!hasConfig ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
             >
               <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0'}`} />
             </button>
          </div>

          <div className="h-6 w-px bg-stone-200 mx-1" />

          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-2 rounded-lg hover:bg-stone-100 transition text-stone-500 ${isExpanded ? 'bg-stone-100 text-stone-800' : ''}`}
            title="编辑配置"
          >
            <Edit2 size={18} />
          </button>

          {hasConfig && (
            <button 
              onClick={handleTest}
              className="p-2 rounded-lg hover:bg-stone-100 transition text-stone-500 hover:text-blue-600"
              title="测试连接"
            >
              <Activity size={18} />
            </button>
          )}

          {hasConfig && (
            <button 
              onClick={handleDelete}
              className="p-2 rounded-lg hover:bg-red-50 transition text-stone-400 hover:text-red-500"
              title="清除配置"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      {/* === 展开编辑区 === */}
      <div className={`bg-stone-50/50 border-t border-stone-100 transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-6 space-y-4">
          
          {/* === Note 展示区域 === */}
          {provider.note && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 text-blue-700 rounded-lg text-xs mb-2">
              <Info size={16} className="mt-0.5 shrink-0" />
              <span>{provider.note}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* === 自定义服务名称输入 === */}
            {provider.id === 'custom' && (
               <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-stone-500 uppercase">自定义服务名称</label>
                <div className="flex items-center gap-2">
                  <input 
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    placeholder="例如: My Local LLM"
                    className="flex-1 px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-200"
                  />
                  <span className="text-xs text-stone-400 whitespace-nowrap">(自定义服务)</span>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-500 uppercase">Base URL (接口地址)</label>
              <input 
                value={formData.baseUrl}
                onChange={e => setFormData({...formData, baseUrl: e.target.value})}
                placeholder="例如: https://api.moonshot.cn/v1"
                className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-200"
              />
            </div>
            
            {type === 'ai' ? (
               <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-500 uppercase">Model Name (模型名称)</label>
                <input 
                  value={formData.modelName}
                  onChange={e => setFormData({...formData, modelName: e.target.value})}
                  placeholder="例如: moonshot-v1-8k"
                  className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>
            ) : null}
          </div>

          <div className="space-y-1.5">
             <label className="text-xs font-bold text-stone-500 uppercase">
               {type === 'ai' ? 'API Key (密钥)' : 'Access Key'}
             </label>
             <div className="relative">
                <input 
                  type="password"
                  value={type === 'ai' ? formData.apiKey : formData.accessKey}
                  onChange={e => type === 'ai' ? setFormData({...formData, apiKey: e.target.value}) : setFormData({...formData, accessKey: e.target.value})}
                  placeholder={hasConfig ? "已隐藏 (输入新密钥以覆盖)" : "请输入密钥"}
                  className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-200 font-mono"
                />
             </div>
          </div>

          {type === 'image' && (
             <div className="space-y-1.5">
               <label className="text-xs font-bold text-stone-500 uppercase">Secret Key</label>
               <input 
                 type="password"
                 value={formData.secretKey}
                 onChange={e => setFormData({...formData, secretKey: e.target.value})}
                 placeholder={hasConfig ? "已隐藏 (输入新密钥以覆盖)" : "请输入密钥"}
                 className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-200 font-mono"
               />
             </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-stone-400">
               {testResult?.message && (
                 <span className={testResult.success ? 'text-green-600' : 'text-red-500'}>
                   测试结果: {testResult.message}
                 </span>
               )}
            </div>
            <div className="flex gap-3">
              <button 
                 onClick={handleSave} 
                 disabled={loading}
                 className="px-6 py-2 bg-stone-900 text-white rounded-xl font-bold text-sm hover:bg-stone-800 transition flex items-center gap-2"
              >
                {loading && <Loader2 className="animate-spin" size={14} />}
                保存配置
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// === 主页面 ===

export default function SettingsPage() {
  const [aiConfigs, setAiConfigs] = useState<Record<string, any>>({});
  const [imgConfigs, setImgConfigs] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    const aiPromises = AI_PROVIDERS.map(p => getSystemConfig(p.id).then(c => ({ id: p.id, config: c })));
    const imgPromises = IMG_PROVIDERS.map(p => getImageConfig(p.id).then(c => ({ id: p.id, config: c })));
    
    const [aiRes, imgRes] = await Promise.all([Promise.all(aiPromises), Promise.all(imgPromises)]);
    
    const nextAiConfigs: any = {};
    aiRes.forEach(item => nextAiConfigs[item.id] = item.config);
    
    const nextImgConfigs: any = {};
    imgRes.forEach(item => nextImgConfigs[item.id] = item.config);
    
    setAiConfigs(nextAiConfigs);
    setImgConfigs(nextImgConfigs);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-stone-400 gap-3">
        <Loader2 className="animate-spin" size={32} />
        <p>正在加载系统配置...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div className="space-y-2">
        <h1 className="text-3xl font-serif font-bold text-stone-800">系统服务配置</h1>
        <p className="text-stone-500">管理 AI 内容生成模型与图库来源，同一类型服务仅允许激活一个。</p>
      </div>

      <section className="space-y-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="text-purple-600" size={20} />
          <h2 className="text-xl font-bold text-stone-800">AI 服务商 (文本生成)</h2>
        </div>
        
        <div className="grid grid-cols-1 gap-5">
          {AI_PROVIDERS.map(provider => (
            <ProviderCard 
              key={provider.id}
              type="ai"
              provider={provider}
              config={aiConfigs[provider.id]}
              isActive={aiConfigs[provider.id]?.isActive === true}
              onRefresh={refreshData}
            />
          ))}
        </div>
      </section>

      <div className="h-px bg-stone-100" />

      <section className="space-y-5">
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon className="text-blue-600" size={20} />
          <h2 className="text-xl font-bold text-stone-800">图库来源 (图片搜索)</h2>
        </div>
        
        <div className="grid grid-cols-1 gap-5">
          {IMG_PROVIDERS.map(provider => (
            <ProviderCard 
              key={provider.id}
              type="image"
              provider={provider}
              config={imgConfigs[provider.id]}
              isActive={imgConfigs[provider.id]?.isActive === true}
              onRefresh={refreshData}
            />
          ))}
        </div>
      </section>
    </div>
  );
}