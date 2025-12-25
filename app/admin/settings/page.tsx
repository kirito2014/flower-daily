'use client';

import { useState, useEffect } from 'react';
import { saveSystemConfig, testAIConnection, getSystemConfig } from '@/app/actions/admin';
import { saveImageConfig, getImageConfig, testImageConnection } from '@/app/actions/image';
import { Loader2, CheckCircle2, AlertCircle, Server, Key, Bot, Image as ImageIcon, Sparkles, Zap, Plug, Wifi, Pencil, Lock, Link as LinkIcon, Shield } from 'lucide-react';

// === AI 提供商定义 ===
const AI_PROVIDERS = [
  { id: 'deepseek', name: 'DeepSeek (深度求索)', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat', note: '性价比极高' },
  { id: 'moonshot', name: 'Moonshot (Kimi)', baseUrl: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k', note: '中文能力强' },
  { id: 'aliyun', name: 'Aliyun (通义千问)', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-turbo', note: '需申请 DashScope' },
  { id: 'openai', name: 'OpenAI (官方)', baseUrl: 'https://api.openai.com/v1', model: 'gpt-3.5-turbo', note: '需科学上网' },
  { id: 'custom', name: '自定义服务', baseUrl: '', model: '', note: '手动填写' },
];

// === 图片服务提供商定义 ===
const IMG_PROVIDERS = [
  { id: 'unsplash', name: 'Unsplash (官方)', provider: 'unsplash', note: '全球最大的免费图库' },
  { id: 'local', name: '本地存储 (Local)', provider: 'local', note: '仅保存到服务器本地' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'ai' | 'image'>('ai');
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // === 状态管理 ===
  const [activeAiId, setActiveAiId] = useState<string>('deepseek');
  const [activeImgId, setActiveImgId] = useState<string>('unsplash');

  const [isEditing, setIsEditing] = useState<boolean>(true);

  // 配置缓存
  const [aiConfigs, setAiConfigs] = useState<Record<string, any>>({});
  const [imgConfigs, setImgConfigs] = useState<Record<string, any>>({});
  
  const [connectedAiIds, setConnectedAiIds] = useState<Set<string>>(new Set());
  const [connectedImgIds, setConnectedImgIds] = useState<Set<string>>(new Set());

  // 表单状态
  const [aiForm, setAiForm] = useState({ apiKey: '', baseUrl: '', model: '' });
  // 更新图片表单结构
  const [imgForm, setImgForm] = useState({ accessKey: '', secretKey: '', baseUrl: '', redirectUri: '' });

  // === 初始化加载 ===
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const aiMap: Record<string, any> = {};
        await Promise.all(AI_PROVIDERS.map(async (p) => {
          const conf = await getSystemConfig(p.id); 
          if (conf) {
            aiMap[p.id] = { ...conf, model: conf.modelName || '', baseUrl: conf.baseUrl || '' };
          }
        }));
        setAiConfigs(aiMap);

        const imgMap: Record<string, any> = {};
        await Promise.all(IMG_PROVIDERS.map(async (p) => {
          const conf = await getImageConfig(p.id);
          if (conf) {
             imgMap[p.id] = { 
               ...conf, 
               baseUrl: conf.baseUrl || '', 
               redirectUri: conf.redirectUri || '' 
             };
          }
        }));
        setImgConfigs(imgMap);

        // 恢复默认选中项 AI
        const initialAiId = 'deepseek';
        if (aiMap[initialAiId]) {
           setAiForm({
             apiKey: '',
             baseUrl: aiMap[initialAiId].baseUrl,
             model: aiMap[initialAiId].model
           });
           setIsEditing(false);
        } else {
           const def = AI_PROVIDERS.find(p => p.id === initialAiId);
           setAiForm({ apiKey: '', baseUrl: def?.baseUrl || '', model: def?.model || '' });
           setIsEditing(true);
        }

        // 恢复默认选中项 Image
        if (imgMap['unsplash']) {
           setImgForm({ 
             accessKey: '', 
             secretKey: '', 
             baseUrl: imgMap['unsplash'].baseUrl || '',
             redirectUri: imgMap['unsplash'].redirectUri || ''
           });
        } else {
           setImgForm({ accessKey: '', secretKey: '', baseUrl: 'https://api.unsplash.com', redirectUri: '' });
        }

      } catch (error) {
        console.error('Failed to load configs', error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // === 切换服务商 ===
  const handleSwitchAI = (providerId: string) => {
    setActiveAiId(providerId);
    setTestResult(null);
    const savedConfig = aiConfigs[providerId];
    const providerDef = AI_PROVIDERS.find(p => p.id === providerId);
    
    if (savedConfig) {
      setIsEditing(false);
      setAiForm({
        apiKey: '', 
        baseUrl: savedConfig.baseUrl || providerDef?.baseUrl || '',
        model: savedConfig.model || providerDef?.model || '' 
      });
    } else {
      setIsEditing(true);
      setAiForm({ apiKey: '', baseUrl: providerDef?.baseUrl || '', model: providerDef?.model || '' });
    }
  };

  const handleSwitchImg = (providerId: string) => {
    setActiveImgId(providerId);
    setTestResult(null);
    const savedConfig = imgConfigs[providerId];
    
    if (savedConfig) {
      setIsEditing(false);
      setImgForm({ 
        accessKey: '', 
        secretKey: '', 
        baseUrl: savedConfig.baseUrl || 'https://api.unsplash.com',
        redirectUri: savedConfig.redirectUri || ''
      });
    } else {
      setIsEditing(providerId !== 'local');
      setImgForm({ accessKey: '', secretKey: '', baseUrl: 'https://api.unsplash.com', redirectUri: '' });
    }
  };

  const handleEnableEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsEditing(true);
    setTestResult(null);
  };

  // === 保存配置 ===
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing) return;

    setLoading(true);
    setTestResult(null);
    try {
      if (activeTab === 'ai') {
        const formData = new FormData();
        formData.append('key', activeAiId); 
        formData.append('apiKey', aiForm.apiKey);
        formData.append('baseUrl', aiForm.baseUrl);
        formData.append('modelName', aiForm.model); 
        await saveSystemConfig(formData);
        
        setAiConfigs(prev => ({ 
          ...prev, 
          [activeAiId]: { ...prev[activeAiId], baseUrl: aiForm.baseUrl, model: aiForm.model, isActive: true } 
        }));
        setAiForm(prev => ({ ...prev, apiKey: '' }));
        setIsEditing(false);
        alert(`已保存并启用 ${AI_PROVIDERS.find(p => p.id === activeAiId)?.name}`);
      } else {
        const formData = new FormData();
        formData.append('key', activeImgId);
        if (activeImgId !== 'local') {
             formData.append('accessKey', imgForm.accessKey);
             formData.append('secretKey', imgForm.secretKey); // 新增
             formData.append('baseUrl', imgForm.baseUrl);
             formData.append('redirectUri', imgForm.redirectUri); // 新增
        }
        await saveImageConfig(formData);

        setImgConfigs(prev => ({ 
            ...prev, 
            [activeImgId]: { 
               ...prev[activeImgId], 
               isActive: true,
               baseUrl: imgForm.baseUrl,
               redirectUri: imgForm.redirectUri
            } 
        }));
        setImgForm(prev => ({ ...prev, accessKey: '', secretKey: '' }));
        setIsEditing(false);
        alert('图片配置已保存');
      }
    } catch (err: any) {
      console.error(err);
      alert(`保存失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setLoading(true);
    setTestResult(null);
    try {
      let res;
      if (activeTab === 'ai') {
        res = await testAIConnection(activeAiId); 
        if (res.success) setConnectedAiIds(prev => new Set(prev).add(activeAiId));
      } else {
        try {
            res = await testImageConnection(activeImgId);
            if (res.success) setConnectedImgIds(prev => new Set(prev).add(activeImgId));
        } catch (fetchError: any) {
            console.error("Test connection failed:", fetchError);
            res = { 
                success: false, 
                message: activeImgId === 'unsplash' 
                    ? '连接 Unsplash 失败。如果您在中国大陆，可能是网络问题，请检查 Base URL。' 
                    : `连接测试失败: ${fetchError.message}`
            };
        }
      }
      setTestResult(res);
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || '连接测试发生系统错误' });
    } finally {
      setLoading(false);
    }
  };

  // 未激活卡片组件 (保持不变)
  const InactiveCard = ({ title, note, isConfigured, isConnected, onActivate }: any) => (
    <div className="w-full h-24 bg-white border border-stone-200 rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all group animate-in slide-in-from-bottom-2 duration-300">
       <div className="flex flex-col">
          <h3 className="text-stone-700 font-bold text-base flex items-center gap-2">
             {title}
             <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full font-normal">{note}</span>
          </h3>
          <div className="mt-1 flex items-center gap-2">
             {isConfigured ? (
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="text-xs text-stone-600 font-medium">已配置</span></div>
             ) : (
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-stone-300"></div><span className="text-xs text-stone-400">未配置</span></div>
             )}
             {isConfigured && (isConnected ? (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 rounded-full border border-green-100"><Wifi size={10} className="text-green-600" /><span className="text-[10px] text-green-600 font-bold">已连接</span></div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-stone-50 rounded-full border border-stone-100"><Wifi size={10} className="text-stone-400" /><span className="text-[10px] text-stone-400">未连接</span></div>
                )
             )}
          </div>
       </div>
       <button onClick={onActivate} type="button" className="px-4 py-2 rounded-lg border border-stone-200 text-stone-600 text-sm font-bold hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-all active:scale-95 flex items-center gap-1">
         <Zap size={14} /> 切换
       </button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      <div>
        <h1 className="text-3xl font-serif font-bold text-stone-800 flex items-center gap-3">
          <Server className="text-stone-400" /> 系统配置
        </h1>
        <p className="text-stone-500 mt-2 ml-1">管理 AI 模型接口与图片存储服务的连接参数。</p>
      </div>

      <div className="flex p-1 bg-stone-200/50 rounded-2xl w-fit">
        <button onClick={() => setActiveTab('ai')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'ai' ? 'bg-white text-purple-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
          <Bot size={18} /> AI 服务配置
        </button>
        <button onClick={() => setActiveTab('image')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'image' ? 'bg-white text-pink-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
          <ImageIcon size={18} /> 图片服务配置
        </button>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        {/* === AI 区域 (保持不变) === */}
        {activeTab === 'ai' && (
          <div className="space-y-4">
            {AI_PROVIDERS.filter(p => p.id === activeAiId).map(provider => {
              const isConfigured = !!aiConfigs[provider.id];
              const isConnected = connectedAiIds.has(provider.id);
              return (
                <div key={provider.id} className="bg-white rounded-3xl p-8 border border-purple-100 shadow-xl shadow-purple-500/5 relative overflow-hidden animate-in zoom-in-95 duration-300">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Bot size={120} /></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                       <div className="flex items-center gap-3">
                         <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600"><Sparkles size={24} /></div>
                         <div>
                           <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                             {provider.name}
                             {isConfigured && <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-xs border border-blue-100 font-medium flex items-center gap-1"><CheckCircle2 size={10} /> 已配置</span>}
                             {isConnected && <span className="px-2 py-0.5 rounded-md bg-green-50 text-green-600 text-xs border border-green-100 font-medium flex items-center gap-1"><Wifi size={10} /> 已连接</span>}
                           </h2>
                           <p className="text-stone-400 text-sm mt-0.5">{provider.note}</p>
                         </div>
                       </div>
                       <div className="flex gap-2">
                         <button type="button" onClick={handleTest} disabled={loading || !isConfigured} className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl text-sm font-bold transition flex items-center gap-2 disabled:opacity-50">
                           {loading ? <Loader2 className="animate-spin" size={16} /> : <Plug size={16} />} 测试连通性
                         </button>
                       </div>
                    </div>
                    <div className="grid gap-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-stone-500 uppercase flex items-center gap-1"><Server size={14} /> Base URL</label>
                          <input type="text" required disabled={!isEditing} value={aiForm.baseUrl} onChange={e => setAiForm({ ...aiForm, baseUrl: e.target.value })} className={`w-full px-4 py-3 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition font-mono text-sm ${!isEditing ? 'bg-stone-100 text-stone-500 cursor-not-allowed' : 'bg-stone-50'}`} placeholder="https://api.example.com/v1" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-stone-500 uppercase flex items-center gap-1"><Bot size={14} /> Model Name</label>
                          <input type="text" required disabled={!isEditing} value={aiForm.model} onChange={e => setAiForm({ ...aiForm, model: e.target.value })} className={`w-full px-4 py-3 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition font-mono text-sm ${!isEditing ? 'bg-stone-100 text-stone-500 cursor-not-allowed' : 'bg-stone-50'}`} placeholder="e.g. gpt-3.5-turbo" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-stone-500 uppercase flex items-center gap-1"><Key size={14} /> API Key</label>
                        <div className="relative">
                          <input type="password" required={isEditing && !isConfigured} disabled={!isEditing} value={aiForm.apiKey} onChange={e => setAiForm({ ...aiForm, apiKey: e.target.value })} className={`w-full pl-10 pr-4 py-3 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition font-mono text-sm tracking-widest ${!isEditing ? 'bg-stone-100 text-stone-500 cursor-not-allowed placeholder-stone-500' : 'bg-stone-50'}`} placeholder={!isEditing ? "********" : (isConfigured ? "已配置 (留空保持不变)" : "sk-...")} />
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"><Key size={16} /></div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-stone-100 flex items-center justify-end gap-4">
                       {testResult && <div className={`flex items-center gap-2 text-sm font-medium ${testResult.success ? 'text-green-600' : 'text-red-500'}`}>{testResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}{testResult.message}</div>}
                       {isEditing ? (
                           <button type="submit" disabled={loading} className="px-8 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold shadow-lg shadow-stone-200 transition active:scale-95 flex items-center gap-2">
                             {loading && <Loader2 className="animate-spin" size={18} />} 保存并启用
                           </button>
                       ) : (
                           <button type="button" onClick={handleEnableEdit} disabled={loading} className="px-8 py-3 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl font-bold shadow-sm transition active:scale-95 flex items-center gap-2">
                             <Pencil size={16} /> 修改配置
                           </button>
                       )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="flex flex-col gap-3">
               {AI_PROVIDERS.filter(p => p.id !== activeAiId).map(provider => (
                 <InactiveCard key={provider.id} title={provider.name} note={provider.note} isConfigured={!!aiConfigs[provider.id]} isConnected={connectedAiIds.has(provider.id)} onActivate={() => handleSwitchAI(provider.id)} />
               ))}
            </div>
          </div>
        )}

        {/* === 图片区域 === */}
        {activeTab === 'image' && (
           <div className="space-y-4">
             {IMG_PROVIDERS.filter(p => p.id === activeImgId).map(provider => {
                const isConfigured = !!imgConfigs[provider.id] || provider.id === 'local';
                const isConnected = connectedImgIds.has(provider.id) || provider.id === 'local';

                return (
                  <div key={provider.id} className="bg-white rounded-3xl p-8 border border-pink-100 shadow-xl shadow-pink-500/5 relative overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><ImageIcon size={120} /></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center text-pink-600"><ImageIcon size={24} /></div>
                          <div>
                            <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                              {provider.name}
                              {isConfigured && <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-xs border border-blue-100 font-medium flex items-center gap-1"><CheckCircle2 size={10} /> 已配置</span>}
                              {isConnected && provider.id !== 'local' && <span className="px-2 py-0.5 rounded-md bg-green-50 text-green-600 text-xs border border-green-100 font-medium flex items-center gap-1"><Wifi size={10} /> 已连接</span>}
                            </h2>
                            <p className="text-stone-400 text-sm mt-0.5">{provider.note}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                        {provider.id !== 'local' && <button type="button" onClick={handleTest} disabled={loading || !isConfigured} className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl text-sm font-bold transition flex items-center gap-2 disabled:opacity-50">{loading ? <Loader2 className="animate-spin" size={16} /> : <Plug size={16} />} 测试连接</button>}
                      </div>
                      </div>

                      {provider.id === 'local' ? (
                        <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200 text-center text-stone-500"><p>本地存储模式无需配置 Key，图片将直接保存在服务器硬盘中。</p></div>
                      ) : (
                        <div className="space-y-4">
                            {/* Base URL */}
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-stone-500 uppercase flex items-center gap-1"><Server size={14} /> Base URL (代理地址)</label>
                              <input type="text" disabled={!isEditing} value={imgForm.baseUrl} onChange={e => setImgForm({ ...imgForm, baseUrl: e.target.value })} className={`w-full px-4 py-3 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400 transition font-mono text-sm ${!isEditing ? 'bg-stone-100 text-stone-500 cursor-not-allowed' : 'bg-stone-50'}`} placeholder="https://api.unsplash.com" />
                            </div>

                            {/* Redirect URI */}
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-stone-500 uppercase flex items-center gap-1"><LinkIcon size={14} /> Redirect URI (源图片跳转地址)</label>
                              <input type="text" disabled={!isEditing} value={imgForm.redirectUri} onChange={e => setImgForm({ ...imgForm, redirectUri: e.target.value })} className={`w-full px-4 py-3 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400 transition font-mono text-sm ${!isEditing ? 'bg-stone-100 text-stone-500 cursor-not-allowed' : 'bg-stone-50'}`} placeholder="e.g. https://your-site.com/gallery" />
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Access Key */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-stone-500 uppercase flex items-center gap-1"><Key size={14} /> Access Key</label>
                                    <input type="password" required={isEditing && !isConfigured} disabled={!isEditing} value={imgForm.accessKey} onChange={e => setImgForm({ ...imgForm, accessKey: e.target.value })} className={`w-full px-4 py-3 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400 transition font-mono text-sm ${!isEditing ? 'bg-stone-100 text-stone-500 cursor-not-allowed placeholder-stone-500' : 'bg-stone-50'}`} placeholder={!isEditing ? "********" : (isConfigured ? "已配置 (留空保持不变)" : "Unsplash Access Key")} />
                                </div>
                                {/* Secret Key */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-stone-500 uppercase flex items-center gap-1"><Shield size={14} /> Secret Key</label>
                                    <input type="password" required={isEditing && !isConfigured} disabled={!isEditing} value={imgForm.secretKey} onChange={e => setImgForm({ ...imgForm, secretKey: e.target.value })} className={`w-full px-4 py-3 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400 transition font-mono text-sm ${!isEditing ? 'bg-stone-100 text-stone-500 cursor-not-allowed placeholder-stone-500' : 'bg-stone-50'}`} placeholder={!isEditing ? "********" : (isConfigured ? "已配置 (留空保持不变)" : "Unsplash Secret Key")} />
                                </div>
                            </div>
                        </div>
                      )}

                      <div className="mt-8 pt-6 border-t border-stone-100 flex items-center justify-end gap-4">
                        {testResult && <div className={`flex items-center gap-2 text-sm font-medium ${testResult.success ? 'text-green-600' : 'text-red-500'}`}>{testResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}{testResult.message}</div>}
                        {provider.id !== 'local' ? (
                            isEditing ? (
                                <button type="submit" disabled={loading} className="px-8 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold shadow-lg shadow-pink-200 transition active:scale-95 flex items-center gap-2">
                                  {loading && <Loader2 className="animate-spin" size={18} />} 保存并启用
                                </button>
                            ) : (
                                <button type="button" onClick={handleEnableEdit} disabled={loading} className="px-8 py-3 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl font-bold shadow-sm transition active:scale-95 flex items-center gap-2">
                                  <Pencil size={16} /> 修改配置
                                </button>
                            )
                        ) : (<div className="text-sm text-stone-400 italic">无需额外配置，自动激活</div>)}
                      </div>
                    </div>
                  </div>
                );
             })}
             <div className="flex flex-col gap-3">
               {IMG_PROVIDERS.filter(p => p.id !== activeImgId).map(provider => (
                 <InactiveCard key={provider.id} title={provider.name} note={provider.note} isConfigured={!!imgConfigs[provider.id] || provider.id === 'local'} isConnected={connectedImgIds.has(provider.id) || provider.id === 'local'} onActivate={() => handleSwitchImg(provider.id)} />
               ))}
             </div>
           </div>
        )}
      </form>
    </div>
  );
}