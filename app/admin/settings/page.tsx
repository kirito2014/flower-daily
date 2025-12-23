'use client';

import { useState, useEffect } from 'react';
import { saveSystemConfig, testAIConnection, getSystemConfig, deleteSystemConfig } from '@/app/actions/admin';
import { Loader2, CheckCircle2, AlertCircle, Server, Key, Bot, Trash2, Edit2, Play, Power, X } from 'lucide-react';

// 预设服务商 (用于反向推断名称)
const PROVIDERS = [
  { 
    name: 'DeepSeek (深度求索)', 
    baseUrl: 'https://api.deepseek.com', 
    model: 'deepseek-chat',
    note: '性价比极高，推荐使用' 
  },
  { 
    name: 'Moonshot (Kimi/月之暗面)', 
    baseUrl: 'https://api.moonshot.cn/v1', 
    model: 'moonshot-v1-8k',
    note: '中文语境理解能力强' 
  },
  { 
    name: 'Aliyun (通义千问)', 
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', 
    model: 'qwen-turbo',
    note: '需申请 DashScope API' 
  },
  { 
    name: 'OpenAI (官方)', 
    baseUrl: 'https://api.openai.com/v1', 
    model: 'gpt-3.5-turbo',
    note: '需科学上网' 
  },
  { 
    name: '自定义', 
    baseUrl: '', 
    model: '',
    note: '手动填写参数' 
  },
];

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<{success?: boolean; message?: string} | null>(null);
  
  // 当前数据库中的配置
  const [savedConfig, setSavedConfig] = useState<{baseUrl: string, modelName: string, apiKey: string} | null>(null);
  
  // 表单状态
  const [formData, setFormData] = useState({ baseUrl: '', apiKey: '', modelName: '' });

  // 初始化加载
  const refreshConfig = async () => {
    const config = await getSystemConfig();
    if (config) {
      // @ts-ignore
      setSavedConfig(config);
    } else {
      setSavedConfig(null);
    }
  };

  useEffect(() => { refreshConfig(); }, []);

  // 辅助函数：根据 URL 获取服务商名称
  const getProviderName = (url: string) => {
    const match = PROVIDERS.find(p => url.includes(p.baseUrl) && p.baseUrl !== '');
    return match ? match.name : '自定义服务商';
  };

  // 1. 删除配置
  const handleDelete = async () => {
    if(!confirm('确定要删除当前 AI 配置吗？删除后将无法使用 AI 填充功能。')) return;
    setLoading(true);
    await deleteSystemConfig();
    setSavedConfig(null);
    setFormData({ baseUrl: '', apiKey: '', modelName: '' }); // 清空表单
    setTestStatus(null);
    setLoading(false);
  };

  // 2. 修改配置 (回填表单)
  const handleEdit = () => {
    if (savedConfig) {
      setFormData({
        baseUrl: savedConfig.baseUrl,
        modelName: savedConfig.modelName,
        apiKey: savedConfig.apiKey || '',
      });
      // 滚动到表单区域
      document.getElementById('config-form')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 3. 测试连接 (基于已保存的配置)
  const handleTest = async () => {
    setLoading(true);
    setTestStatus(null);
    const result = await testAIConnection();
    setTestStatus(result);
    setLoading(false);
  };

  // 4. 下拉选择预设
  const handleProviderSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const p = PROVIDERS[e.target.value as any];
    if (p) {
      setFormData(prev => ({ ...prev, baseUrl: p.baseUrl, modelName: p.model }));
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      
      {/* ================= 顶部：当前状态仪表盘 ================= */}
      <section className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden relative">
        <div className="bg-stone-50 px-6 py-4 border-b border-stone-100 flex justify-between items-center">
          <div className="flex items-center gap-2 text-stone-700 font-medium">
            <Power size={18} className={savedConfig ? "text-green-500" : "text-stone-300"} />
            系统状态：{savedConfig ? '已接管' : '未配置'}
          </div>
          {/* 右上角删除按钮 (仅配置后显示) */}
          {savedConfig && (
            <button 
              onClick={handleDelete}
              title="删除配置"
              className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="p-8">
          {savedConfig ? (
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              {/* 左侧：信息展示 */}
              <div>
                <h1 className="text-3xl font-serif font-bold text-stone-900 mb-4 flex items-center gap-3">
                  {getProviderName(savedConfig.baseUrl)}
                  <span className="text-xs font-sans font-normal bg-green-100 text-green-700 px-2 py-1 rounded-full border border-green-200">Running</span>
                </h1>
                <div className="space-y-2 text-sm text-stone-500 font-mono">
                  <p className="flex items-center gap-2">
                    <span className="w-20 text-stone-400">Base URL:</span> 
                    <span className="bg-stone-100 px-2 py-0.5 rounded">{savedConfig.baseUrl}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-20 text-stone-400">Model:</span> 
                    <span className="bg-stone-100 px-2 py-0.5 rounded">{savedConfig.modelName}</span>
                  </p>
                </div>
              </div>

              {/* 右侧：操作按钮组 */}
              <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto">
                <button 
                  onClick={handleTest}
                  disabled={loading}
                  className="flex-1 md:w-32 py-2 px-4 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? <Loader2 className="animate-spin w-4 h-4"/> : <Play size={16} fill="currentColor" />}
                  运行测试
                </button>
                <button 
                  onClick={handleEdit}
                  className="flex-1 md:w-32 py-2 px-4 border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-50 transition flex items-center justify-center gap-2 text-sm"
                >
                  <Edit2 size={16} />
                  修改配置
                </button>
              </div>
            </div>
          ) : (
            // 未配置时的占位符
            <div className="text-center py-8 text-stone-400">
              <Bot size={48} className="mx-auto mb-4 opacity-20" />
              <p>暂无 AI 服务，请在下方填写配置。</p>
            </div>
          )}

          {/* 测试结果反馈栏 */}
          {testStatus && (
            <div className={`mt-6 p-4 rounded-xl flex items-start gap-3 border animate-in slide-in-from-top-2 ${testStatus.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
              {testStatus.success ? <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0"/> : <AlertCircle className="w-5 h-5 mt-0.5 shrink-0"/>}
              <div>
                <p className="font-bold text-sm">{testStatus.success ? '测试通过' : '测试失败'}</p>
                <p className="text-sm mt-1 opacity-90">{testStatus.message}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ================= 底部：修改/新增表单 ================= */}
      <section id="config-form" className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200">
        <h3 className="text-xl font-serif mb-6 text-stone-800 flex items-center gap-2">
          <Edit2 size={20} className="text-stone-400" />
          {savedConfig ? '编辑配置参数' : '新增配置参数'}
        </h3>

        <form 
          action={async (data) => {
            try {
              await saveSystemConfig(data);
              alert('保存成功');
              refreshConfig(); // 刷新顶部卡片
              setFormData({ baseUrl: '', apiKey: '', modelName: '' }); // 选填：保存后是否清空表单？保留可能更好体验，这里看你喜好
            } catch (e: any) {
              alert(e.message);
            }
          }} 
          className="space-y-6"
        >
          {/* 快速填充 */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">快速预设</label>
            <select 
              onChange={handleProviderSelect}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg outline-none focus:ring-1 focus:ring-stone-400 bg-white text-sm"
              defaultValue=""
            >
              <option value="" disabled>选择服务商以自动填充...</option>
              {PROVIDERS.map((p, i) => (
                <option key={p.name} value={i}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-full md:col-span-1">
              <label className="block text-sm font-medium text-stone-700 mb-2">Base URL</label>
              <input 
                name="baseUrl" 
                value={formData.baseUrl}
                onChange={e => setFormData({...formData, baseUrl: e.target.value})}
                required
                className="w-full px-4 py-2 border border-stone-300 rounded-lg outline-none focus:ring-2 focus:ring-stone-500 font-mono text-sm"
              />
            </div>
            <div className="col-span-full md:col-span-1">
              <label className="block text-sm font-medium text-stone-700 mb-2">Model Name</label>
              <input 
                name="modelName" 
                value={formData.modelName}
                onChange={e => setFormData({...formData, modelName: e.target.value})}
                required
                className="w-full px-4 py-2 border border-stone-300 rounded-lg outline-none focus:ring-2 focus:ring-stone-500 font-mono text-sm"
              />
            </div>
            <div className="col-span-full">
              <label className="block text-sm font-medium text-stone-700 mb-2">API Key</label>
              <input 
                name="apiKey" 
                type="password"
                value={formData.apiKey}
                onChange={e => setFormData({...formData, apiKey: e.target.value})}
                required
                placeholder="sk-..."
                className="w-full px-4 py-2 border border-stone-300 rounded-lg outline-none focus:ring-2 focus:ring-stone-500 font-mono text-sm"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100 flex justify-end">
            <button 
              type="submit" 
              className="px-8 py-3 bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition font-medium shadow-lg shadow-stone-200"
            >
              {savedConfig ? '更新配置' : '保存配置'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}