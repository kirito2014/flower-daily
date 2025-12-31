'use client';

import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Edit2, Loader2, Info } from 'lucide-react';
import { 
  getSystemConfigs, 
  upsertSystemConfig, 
  deleteSystemConfig, 
  SystemConfigData 
} from '@/app/actions/systemConfig';

export default function OtherConfigPage() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<SystemConfigData>({
    configKey: '',
    configName: '',
    configValue: '',
    description: ''
  });

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    const res = await getSystemConfigs();
    if (res.success) {
      setConfigs(res.data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 自动去除首尾空格，防止 Key 输入错误
    const cleanData = {
      ...formData,
      configKey: formData.configKey.trim(),
      configValue: formData.configValue.trim()
    };

    if (!cleanData.configKey || !cleanData.configValue) {
      alert('Key 和 Value 不能为空');
      return;
    }
    
    const res = await upsertSystemConfig(cleanData);
    if (res.success) {
      setIsEditing(false);
      resetForm();
      loadConfigs();
    } else {
      alert(res.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定删除此配置吗？删除后系统将使用默认值。')) {
      await deleteSystemConfig(id);
      loadConfigs();
    }
  };

  const handleEdit = (conf: any) => {
    setFormData(conf);
    setIsEditing(true);
  };

  const resetForm = () => {
    setFormData({ configKey: '', configName: '', configValue: '', description: '' });
  };

  // ✅ 优化：拆分模板，确保用户不会漏填配置
  const fillTemplate = (type: 'search_url' | 'search_name' | 'mode') => {
    setIsEditing(false);
    if (type === 'search_url') {
      setFormData({
        configKey: 'search_engine_url',
        configName: '搜索引擎URL',
        configValue: 'https://zh.wikipedia.org/wiki/', // 示例改用维基，方便你测试
        description: '跳转前缀，如 https://baike.baidu.com/item/'
      });
    } else if (type === 'search_name') {
      setFormData({
        configKey: 'search_engine_name',
        configName: '搜索引擎名称',
        configValue: '维基百科',
        description: '按钮上显示的文字'
      });
    } else if (type === 'mode') {
      setFormData({
        configKey: 'main_display_mode',
        configName: '主页显示模式',
        configValue: '1',
        description: '1=画廊模式, 2=卡片模式'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-stone-800">其他配置</h1>
        <p className="text-stone-500 text-sm mt-1">管理系统的动态参数，如主页模式和搜索引擎。</p>
      </div>

      {/* 编辑/新增卡片 */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="font-bold text-stone-700 flex items-center gap-2">
            {isEditing ? <Edit2 size={18}/> : <Plus size={18}/>}
            {isEditing ? '修改配置' : '新增配置'}
          </h2>
          <div className="flex flex-wrap gap-2">
             {!isEditing && (
               <>
                 <button onClick={() => fillTemplate('search_url')} className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded transition border border-blue-100">
                   模板: 搜索引擎URL
                 </button>
                 <button onClick={() => fillTemplate('search_name')} className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded transition border border-blue-100">
                   模板: 搜索引擎名称
                 </button>
                 <button onClick={() => fillTemplate('mode')} className="text-xs bg-purple-50 text-purple-600 hover:bg-purple-100 px-3 py-1.5 rounded transition border border-purple-100">
                   模板: 显示模式
                 </button>
               </>
             )}
             {isEditing && (
                <button onClick={() => { setIsEditing(false); resetForm(); }} className="text-xs text-stone-500 hover:underline">
                  取消编辑
                </button>
             )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-stone-500 mb-1">英文 Key (唯一) *</label>
            <input 
              type="text" 
              value={formData.configKey}
              onChange={e => setFormData({...formData, configKey: e.target.value})}
              placeholder="e.g. search_engine_url"
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-stone-200 focus:outline-none"
              disabled={isEditing} 
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-stone-500 mb-1">中文名称 *</label>
            <input 
              type="text" 
              value={formData.configName}
              onChange={e => setFormData({...formData, configName: e.target.value})}
              placeholder="e.g. 搜索引擎地址"
              className="w-full p-2.5 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-stone-200 focus:outline-none"
            />
          </div>
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-stone-500 mb-1">配置值 Value *</label>
            <input 
              type="text" 
              value={formData.configValue}
              onChange={e => setFormData({...formData, configValue: e.target.value})}
              placeholder="e.g. https://..."
              className="w-full p-2.5 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-stone-200 focus:outline-none"
            />
          </div>
          <div className="md:col-span-2 flex items-end">
            <button type="submit" className="w-full p-2.5 bg-stone-800 text-white rounded-lg text-sm hover:bg-stone-700 transition flex justify-center items-center gap-2">
              <Save size={16} /> 保存
            </button>
          </div>
          <div className="md:col-span-12">
            <label className="block text-xs font-bold text-stone-500 mb-1">备注 (选填)</label>
            <input 
              type="text" 
              value={formData.description || ''}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="描述该配置的作用..."
              className="w-full p-2.5 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-stone-200 focus:outline-none"
            />
          </div>
        </form>
      </div>

      {/* 配置列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-stone-50 text-stone-600 font-medium border-b border-stone-200">
            <tr>
              <th className="p-4 w-1/4">配置项 (中文/英文)</th>
              <th className="p-4 w-1/3">配置值</th>
              <th className="p-4">备注</th>
              <th className="p-4 text-right w-24">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loading ? (
              <tr><td colSpan={4} className="p-8 text-center text-stone-400"><Loader2 className="animate-spin inline mr-2"/>加载中...</td></tr>
            ) : configs.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-stone-400">暂无配置，请添加</td></tr>
            ) : (
              configs.map((conf) => (
                <tr key={conf.id} className="hover:bg-stone-50/50 group transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-stone-800">{conf.configName}</div>
                    <div className="text-xs text-stone-400 font-mono mt-0.5">{conf.configKey}</div>
                  </td>
                  <td className="p-4 font-mono text-stone-600 break-all">{conf.configValue}</td>
                  <td className="p-4 text-stone-500">{conf.description}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(conf)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="编辑">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(conf.id)} className="p-2 text-red-600 hover:bg-red-50 rounded" title="删除">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-orange-50/50 border border-orange-100 p-4 rounded-xl flex gap-3 text-xs text-orange-800">
         <Info className="shrink-0 mt-0.5" size={16} />
         <div>
           <p className="font-bold mb-1">配置说明:</p>
           <ul className="list-disc list-inside space-y-1 opacity-80">
             <li><span className="font-mono bg-orange-100 px-1 rounded">search_engine_url</span> : 搜索前缀 (如 <code>https://zh.wikipedia.org/wiki/</code>)</li>
             <li><span className="font-mono bg-orange-100 px-1 rounded">search_engine_name</span> : 按钮文字 (如 <code>维基百科</code>) <span className="text-red-500 font-bold">* 必须配置此项才能生效</span></li>
             <li><span className="font-mono bg-orange-100 px-1 rounded">main_display_mode</span> : <code>1</code> 为画廊模式，<code>2</code> 为卡片模式</li>
           </ul>
         </div>
      </div>
    </div>
  );
}