'use client';

import { useState } from 'react';
import { createFlower, updateFlower, generateFlowerContent } from '@/app/actions/admin';
import { Flower } from '@prisma/client';
import { Loader2, Sparkles, Search, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import UnsplashSearchModal from '@/components/UnsplashSearchModal';

interface FlowerFormProps {
  flower?: Flower;
  onSuccess: () => void;
}

export default function FlowerForm({ flower, onSuccess }: FlowerFormProps) {
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showUnsplash, setShowUnsplash] = useState(false);
  
  // 状态管理
  const [name, setName] = useState(flower?.name || '');
  const [englishName, setEnglishName] = useState(flower?.englishName || '');
  const [alias, setAlias] = useState(flower?.alias || '');
  const [imageUrl, setImageUrl] = useState(flower?.imageUrl || '');
  const [sourceUrl, setSourceUrl] = useState(flower?.sourceUrl || ''); 
  // @ts-ignore: 假设 flower 包含 pgsourceUrl
  const [pgsourceUrl, setPgsourceUrl] = useState(flower?.pgsourceUrl || ''); // === 新增：摄影师链接状态 ===
  const [photographer, setPhotographer] = useState(flower?.photographer || '');
  const [language, setLanguage] = useState(flower?.language || '');
  const [habit, setHabit] = useState(flower?.habit || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('englishName', englishName);
    formData.append('alias', alias);
    formData.append('imageUrl', imageUrl);
    formData.append('sourceUrl', sourceUrl); 
    formData.append('pgsourceUrl', pgsourceUrl); // === 新增：提交摄影师链接 ===
    formData.append('photographer', photographer);
    formData.append('language', language);
    formData.append('habit', habit);

    try {
      if (flower) {
        await updateFlower(flower.id, formData);
      } else {
        await createFlower(formData);
        // 重置表单
        setName(''); setEnglishName(''); setAlias(''); 
        setImageUrl(''); setSourceUrl(''); setPgsourceUrl(''); setPhotographer(''); 
        setLanguage(''); setHabit('');
      }
      onSuccess();
    } catch (error) {
      console.error(error);
      alert('操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!name) return alert('请先填写花名');
    setAiLoading(true);
    try {
      const data = await generateFlowerContent(name);
      if (data.englishName) setEnglishName(data.englishName);
      if (data.language) setLanguage(data.language);
      if (data.habit) setHabit(data.habit);
      if (data.alias) setAlias(data.alias);
    } catch (error) {
      console.error(error);
      alert('AI 生成失败，请检查配置');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* 花名 + AI */}
        <div className="flex gap-3 items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">花卉名称</label>
            <input 
              name="name" 
              required 
              placeholder="例如：红玫瑰" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-stone-200 transition text-stone-800 font-medium"
            />
          </div>
          <button
            type="button"
            onClick={handleAIGenerate}
            disabled={aiLoading || !name}
            className="mb-[1px] px-5 py-2.5 bg-purple-50 text-purple-600 border border-purple-100 rounded-xl hover:bg-purple-100 hover:border-purple-200 transition disabled:opacity-50 flex items-center gap-2 font-bold h-[46px]"
          >
            {aiLoading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            <span className="hidden sm:inline">AI 补全</span>
          </button>
        </div>

        {/* 英文名 + 别名 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">英文名称</label>
            <input 
              name="englishName" 
              placeholder="e.g. Red Rose" 
              value={englishName}
              onChange={e => setEnglishName(e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-stone-200 transition font-serif italic text-stone-700"
            />
          </div>
          <div className="space-y-1.5">
             <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">别名 (用、分隔)</label>
             <input 
               name="alias"
               placeholder="e.g. 刺玫花、徘徊花" 
               value={alias}
               onChange={e => setAlias(e.target.value)}
               className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-stone-200 transition text-sm text-stone-600"
             />
          </div>
        </div>

        {/* 图片链接 + Unsplash + 拍摄者 */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">图片来源</label>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex gap-2">
                    <div className="relative flex-1">
                        <input 
                        name="imageUrl" 
                        required 
                        placeholder="https://images.unsplash.com/..." 
                        value={imageUrl}
                        onChange={e => setImageUrl(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-stone-200 transition font-mono text-xs text-stone-600"
                        />
                        <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowUnsplash(true)}
                        className="px-3 py-2 bg-stone-100 border border-stone-200 text-stone-600 rounded-xl hover:bg-white hover:border-stone-300 hover:shadow-sm transition flex items-center justify-center"
                        title="在 Unsplash 搜索图片"
                    >
                        <Search size={18} />
                    </button>
                </div>
                
                <div className="w-full sm:w-1/3 relative">
                    <input 
                        name="photographer"
                        placeholder="拍摄者 (可选)" 
                        value={photographer}
                        onChange={e => setPhotographer(e.target.value)}
                        className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-stone-200 transition text-xs text-stone-600"
                    />
                </div>
            </div>
            {/* Source URL 显示 (只读/可选编辑) */}
            <div className="relative">
                <input 
                    name="sourceUrl"
                    placeholder="图片源链接 (Unsplash 页面地址)" 
                    value={sourceUrl}
                    onChange={e => setSourceUrl(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-200 transition font-mono text-[10px] text-stone-400"
                />
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={12} />
            </div>
            <div className="relative">
                <input 
                    name="pgsourceUrl"
                    placeholder="摄影师个人界面链接" 
                    value={pgsourceUrl}
                    onChange={e => setPgsourceUrl(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-200 transition font-mono text-[10px] text-stone-400"
                />
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={12} />
            </div>
          </div>
        </div>

        {/* 花语 */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">花语</label>
          <input 
            name="language" 
            required 
            placeholder="用一句话描述它的寓意" 
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-stone-200 transition text-stone-700"
          />
        </div>

        {/* 习性 */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">生长习性</label>
          <input 
            name="habit" 
            required 
            placeholder="简短描述，例如：喜阳、耐旱" 
            value={habit}
            onChange={e => setHabit(e.target.value)}
            className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-stone-200 transition text-stone-700"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full mt-2 py-3 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg shadow-stone-200 hover:shadow-xl"
        >
          {loading && <Loader2 className="animate-spin" size={18} />}
          {flower ? '保存修改' : '确认录入'}
        </button>
      </form>

      {/* Unsplash 弹窗 */}
      <UnsplashSearchModal 
        isOpen={showUnsplash}
        onClose={() => setShowUnsplash(false)}
        initialQuery={englishName || name || ''} 
        onSelect={(url, user, source, pgsource) => {
          setImageUrl(url);
          setPhotographer(user);
          setSourceUrl(source);
          setPgsourceUrl(pgsource); // === 新增：保存摄影师链接 ===
        }}
      />
    </>
  );
}