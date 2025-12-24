'use client';

import { useState, useEffect } from 'react';
import { saveSystemConfig, testAIConnection, getSystemConfig, deleteSystemConfig } from '@/app/actions/admin';
import { saveImageConfig, getImageConfig, testImageConnection } from '@/app/actions/image';
import { Loader2, CheckCircle2, AlertCircle, Server, Key, Bot, Trash2, Edit2, Play, Power, X, Image as ImageIcon, Sparkles } from 'lucide-react';

// AI 预设
const AI_PROVIDERS = [
  { name: 'DeepSeek (深度求索)', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat', note: '性价比极高' },
  { name: 'Moonshot (Kimi)', baseUrl: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k', note: '中文能力强' },
  { name: 'Aliyun (通义千问)', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-turbo', note: '需申请 DashScope' },
  { name: 'OpenAI (官方)', baseUrl: 'https://api.openai.com/v1', model: 'gpt-3.5-turbo', note: '需科学上网' },
  { name: '自定义', baseUrl: '', model: '', note: '手动填写' },
];

// 图片服务预设
const IMG_PROVIDERS = [
  { name: 'Unsplash (官方)', provider: 'unsplash', note: '需申请 Access Key' },
  // 未来可扩展 Pexels 等
];

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  
  // === 数据状态 ===
  const [savedAI, setSavedAI] = useState<{baseUrl: string, modelName: string, apiKey: string} | null>(null);
  const [savedImg, setSavedImg] = useState<{accessKey: string, provider: string} | null>(null);
  
  // === 表单状态 ===
  const [activeTab, setActiveTab] = useState<'ai' | 'image'>('ai');
  const [aiForm, setAiForm] = useState({ baseUrl: '', apiKey: '', modelName: '' });
  const [imgForm, setImgForm] = useState({ accessKey: '', provider: 'unsplash' });

  // === 测试结果 ===
  const [aiTestResult, setAiTestResult] = useState<{success?: boolean; message?: string} | null>(null);
  const [imgTestResult, setImgTestResult] = useState<{success?: boolean; message?: string} | null>(null);

  // 初始化加载
  const refreshConfig = async () => {
    // 并行加载
    const [ai, img] = await Promise.all([getSystemConfig(), getImageConfig()]);
    // @ts-ignore
    setSavedAI(ai || null);
    // @ts-ignore
    setSavedImg(img || null);
  };

  useEffect(() => { refreshConfig(); }, []);

  // 辅助：获取服务商名称
  const getAIProviderName = (url: string) => {
    const match = AI_PROVIDERS.find(p => url.includes(p.baseUrl) && p.baseUrl !== '');
    return match ? match.name : '自定义 AI';
  };

  // === 操作处理 ===

  // 删除配置
  const handleDeleteAI = async () => {
    if(!confirm('确定删除 AI 配置？')) return;
    await deleteSystemConfig();
    setSavedAI(null);
    setAiForm({ baseUrl: '', apiKey: '', modelName: '' });
  };

  // 填充表单以编辑
  const handleEditAI = () => {
    if (savedAI) {
      setActiveTab('ai');
      setAiForm({ ...savedAI, apiKey: savedAI.apiKey || '' });
      document.getElementById('config-form')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleEditImg = () => {
    if (savedImg) {
      setActiveTab('image');
      setImgForm({ ...savedImg, accessKey: savedImg.accessKey || '' });
      document.getElementById('config-form')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 测试连接
  const handleTestAI = async () => {
    setLoading(true);
    setAiTestResult(null);
    const res = await testAIConnection();
    setAiTestResult(res);
    setLoading(false);
  };

  const handleTestImg = async () => {
    setLoading(true);
    setImgTestResult(null);
    const res = await testImageConnection();
    setImgTestResult(res);
    setLoading(false);
  };

  // 保存逻辑
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      if (activeTab === 'ai') {
        formData.append('baseUrl', aiForm.baseUrl);
        formData.append('apiKey', aiForm.apiKey);
        formData.append('modelName', aiForm.modelName);
        await saveSystemConfig(formData);
      } else {
        formData.append('accessKey', imgForm.accessKey);
        await saveImageConfig(formData);
      }
      alert('配置保存成功！');
      refreshConfig();
    } catch (error: any) {
      alert(`保存失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      
      {/* 标题区 */}
      <div>
        <h2 className="text-2xl font-serif font-bold text-stone-800">服务集成中心</h2>
        <p className="text-stone-500 text-sm mt-1">配置 AI 智能生成与 Unsplash 图片服务，赋能花卉管理系统。</p>
      </div>

      {/* ================= 顶部：双卡片仪表盘 ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* === 卡片 1: AI 服务 === */}
        <div className={`bg-white rounded-3xl shadow-sm border overflow-hidden relative transition-all ${savedAI ? 'border-green-200/50' : 'border-stone-200'}`}>
          <div className="bg-stone-50/80 px-6 py-4 border-b border-stone-100 flex justify-between items-center backdrop-blur-sm">
            <div className="flex items-center gap-2 text-stone-700 font-bold">
              <Bot size={18} className={savedAI ? "text-green-600" : "text-stone-400"} />
              AI 文本生成
            </div>
            {savedAI && (
              <div className="flex gap-2">
                 <button onClick={handleEditAI} className="p-1.5 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition" title="编辑配置"><Edit2 size={16} /></button>
                 <button onClick={handleDeleteAI} className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-full transition" title="删除配置"><Trash2 size={16} /></button>
              </div>
            )}
          </div>
          
          <div className="p-6">
            {savedAI ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <h3 className="font-bold text-lg text-stone-800">{getAIProviderName(savedAI.baseUrl)}</h3>
                   <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium border border-green-200">已连接</span>
                </div>
                <div className="text-xs text-stone-500 space-y-1 font-mono bg-stone-50 p-3 rounded-xl border border-stone-100">
                   <p>MODEL: {savedAI.modelName}</p>
                   <p className="truncate" title={savedAI.baseUrl}>HOST : {savedAI.baseUrl}</p>
                </div>
                <button 
                  onClick={handleTestAI}
                  disabled={loading}
                  className="w-full py-2 border border-stone-200 rounded-xl text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin w-3 h-3"/> : <Play size={14} />} 连通性测试
                </button>
                {/* AI 测试结果 */}
                {aiTestResult && (
                  <div className={`text-xs p-2 rounded-lg flex items-center gap-2 ${aiTestResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {aiTestResult.success ? <CheckCircle2 size={12}/> : <AlertCircle size={12}/>}
                    {aiTestResult.message}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-stone-400">
                <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3">
                   <Power size={20} className="text-stone-300" />
                </div>
                <p className="text-sm">未配置 AI 服务</p>
                <button onClick={() => { setActiveTab('ai'); document.getElementById('config-form')?.scrollIntoView({behavior:'smooth'}); }} className="text-xs text-blue-500 hover:underline mt-2">立即配置</button>
              </div>
            )}
          </div>
        </div>

        {/* === 卡片 2: 图片服务 === */}
        <div className={`bg-white rounded-3xl shadow-sm border overflow-hidden relative transition-all ${savedImg ? 'border-purple-200/50' : 'border-stone-200'}`}>
          <div className="bg-stone-50/80 px-6 py-4 border-b border-stone-100 flex justify-between items-center backdrop-blur-sm">
            <div className="flex items-center gap-2 text-stone-700 font-bold">
              <ImageIcon size={18} className={savedImg ? "text-purple-600" : "text-stone-400"} />
              图片搜索服务
            </div>
            {savedImg && (
              <button onClick={handleEditImg} className="p-1.5 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition" title="编辑配置"><Edit2 size={16} /></button>
            )}
          </div>
          
          <div className="p-6">
            {savedImg ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <h3 className="font-bold text-lg text-stone-800">Unsplash</h3>
                   <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium border border-purple-200">已就绪</span>
                </div>
                <div className="text-xs text-stone-500 space-y-1 font-mono bg-stone-50 p-3 rounded-xl border border-stone-100">
                   <p>PROVIDER: {savedImg.provider || 'unsplash'}</p>
                   <p>KEY: ••••••••••••••••</p>
                </div>
                <button 
                  onClick={handleTestImg}
                  disabled={loading}
                  className="w-full py-2 border border-stone-200 rounded-xl text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin w-3 h-3"/> : <Play size={14} />} 连通性测试
                </button>
                {/* 图片 测试结果 */}
                {imgTestResult && (
                  <div className={`text-xs p-2 rounded-lg flex items-center gap-2 ${imgTestResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {imgTestResult.success ? <CheckCircle2 size={12}/> : <AlertCircle size={12}/>}
                    {imgTestResult.message}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-stone-400">
                <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3">
                   <ImageIcon size={20} className="text-stone-300" />
                </div>
                <p className="text-sm">未配置 Unsplash</p>
                <button onClick={() => { setActiveTab('image'); document.getElementById('config-form')?.scrollIntoView({behavior:'smooth'}); }} className="text-xs text-purple-500 hover:underline mt-2">立即配置</button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ================= 底部：统一配置表单 ================= */}
      <section id="config-form" className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden scroll-mt-24">
        
        {/* Tab 切换栏 */}
        <div className="flex border-b border-stone-100">
          <button 
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'ai' ? 'bg-white text-stone-900 border-b-2 border-stone-900' : 'bg-stone-50 text-stone-500 hover:bg-stone-100'}`}
          >
            <Sparkles size={16} className={activeTab === 'ai' ? 'text-green-500' : ''}/>
            配置 AI 参数
          </button>
          <button 
            onClick={() => setActiveTab('image')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'image' ? 'bg-white text-stone-900 border-b-2 border-stone-900' : 'bg-stone-50 text-stone-500 hover:bg-stone-100'}`}
          >
            <ImageIcon size={16} className={activeTab === 'image' ? 'text-purple-500' : ''} />
            配置图片服务
          </button>
        </div>

        <form onSubmit={handleSave} className="p-8">
          
          {/* === AI 表单内容 === */}
          {activeTab === 'ai' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
              
              {/* 快速填充 */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">快速选择服务商</label>
                <div className="flex flex-wrap gap-2">
                  {AI_PROVIDERS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => setAiForm(prev => ({ ...prev, baseUrl: p.baseUrl, modelName: p.model }))}
                      className="px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs hover:border-stone-400 hover:shadow-sm transition active:scale-95 text-stone-600"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700">API Base URL</label>
                  <div className="relative">
                    <Server size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input 
                      required
                      value={aiForm.baseUrl}
                      onChange={e => setAiForm({...aiForm, baseUrl: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 border border-stone-300 rounded-xl outline-none focus:ring-2 focus:ring-stone-500 font-mono text-sm"
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700">Model Name</label>
                  <div className="relative">
                    <Bot size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input 
                      required
                      value={aiForm.modelName}
                      onChange={e => setAiForm({...aiForm, modelName: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 border border-stone-300 rounded-xl outline-none focus:ring-2 focus:ring-stone-500 font-mono text-sm"
                      placeholder="gpt-3.5-turbo"
                    />
                  </div>
                </div>
                <div className="space-y-2 col-span-full">
                  <label className="text-sm font-medium text-stone-700">API Key</label>
                  <div className="relative">
                    <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input 
                      type="password"
                      required
                      value={aiForm.apiKey}
                      onChange={e => setAiForm({...aiForm, apiKey: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 border border-stone-300 rounded-xl outline-none focus:ring-2 focus:ring-stone-500 font-mono text-sm"
                      placeholder="sk-..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* === 图片表单内容 === */}
          {activeTab === 'image' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
              
              {/* 服务商选择 */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">选择图库服务商</label>
                <div className="flex gap-2">
                  {IMG_PROVIDERS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => setImgForm(prev => ({ ...prev, provider: p.provider }))}
                      className={`px-4 py-2 rounded-lg text-sm border transition flex items-center gap-2 ${imgForm.provider === p.provider ? 'bg-white border-purple-500 text-purple-700 shadow-sm ring-1 ring-purple-100' : 'bg-transparent border-stone-200 text-stone-600 hover:bg-white'}`}
                    >
                      <ImageIcon size={14} />
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                   <label className="text-sm font-medium text-stone-700">Access Key (Client ID)</label>
                   <div className="relative">
                     <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                     <input 
                       type="password"
                       required
                       value={imgForm.accessKey}
                       onChange={e => setImgForm({...imgForm, accessKey: e.target.value})}
                       className="w-full pl-10 pr-4 py-2.5 border border-stone-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                       placeholder="从 Unsplash Developers 获取..."
                     />
                   </div>
                   <p className="text-xs text-stone-400 ml-1">
                     请前往 <a href="https://unsplash.com/developers" target="_blank" className="underline hover:text-purple-600">Unsplash Developers</a> 申请应用并获取 Access Key。
                   </p>
                </div>
              </div>
            </div>
          )}

          {/* 保存按钮 */}
          <div className="pt-8 border-t border-stone-100 mt-8 flex justify-end">
            <button 
              type="submit" 
              disabled={loading}
              className={`px-8 py-3 rounded-xl text-white font-bold shadow-lg transition active:scale-95 flex items-center gap-2 ${activeTab === 'ai' ? 'bg-stone-900 hover:bg-stone-800' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-200'}`}
            >
              {loading && <Loader2 className="animate-spin" size={18} />}
              保存{activeTab === 'ai' ? ' AI ' : '图片'}配置
            </button>
          </div>

        </form>
      </section>
    </div>
  );
}