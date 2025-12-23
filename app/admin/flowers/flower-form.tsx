'use client';

import { useState } from 'react';
import { generateFlowerContent, createFlower } from '@/app/actions/admin';
import { Sparkles, Loader2, Save } from 'lucide-react';

export default function FlowerForm() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiData, setAiData] = useState({ language: '', habit: '' });

  // 调用 AI 填充
  const handleAIFill = async () => {
    if (!name) return alert('请先输入花名');
    setLoading(true);
    try {
      const data = await generateFlowerContent(name);
      setAiData(data);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form action={async (formData) => {
        await createFlower(formData);
        // 重置表单
        setName('');
        setAiData({ language: '', habit: '' });
    }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* 左侧：输入与 AI 触发 */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">花卉名称</label>
          <div className="flex gap-2">
            <input 
              name="name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 px-4 py-2 border border-stone-300 rounded-lg outline-none focus:ring-2 focus:ring-stone-500"
              placeholder="如：牡丹"
              required
            />
            <button 
              type="button" 
              onClick={handleAIFill}
              disabled={loading || !name}
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin w-4 h-4"/> : <Sparkles className="w-4 h-4" />}
              AI 填充
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">图片链接</label>
          <input 
            name="imageUrl" 
            placeholder="https://..."
            required
            className="w-full px-4 py-2 border border-stone-300 rounded-lg outline-none focus:ring-2 focus:ring-stone-500"
          />
          <p className="text-xs text-stone-400 mt-1">推荐使用 Unsplash 或 Pinterest 的高清图链接</p>
        </div>
      </div>

      {/* 右侧：AI 生成结果区 */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">花语 (AI)</label>
          <textarea 
            name="language" 
            value={aiData.language}
            onChange={(e) => setAiData({...aiData, language: e.target.value})}
            className="w-full px-4 py-2 border border-stone-300 rounded-lg outline-none focus:ring-2 focus:ring-stone-500 h-20 resize-none bg-stone-50"
            placeholder="等待 AI 生成..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">习性 (AI)</label>
          <input 
            name="habit" 
            value={aiData.habit}
            onChange={(e) => setAiData({...aiData, habit: e.target.value})}
            className="w-full px-4 py-2 border border-stone-300 rounded-lg outline-none focus:ring-2 focus:ring-stone-500 bg-stone-50"
            placeholder="等待 AI 生成..."
            required
          />
        </div>

        <button 
          type="submit" 
          className="w-full py-3 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition flex items-center justify-center gap-2"
        >
          <Save size={18} />
          录入数据库
        </button>
      </div>
    </form>
  );
}