'use client';

import { createFlower, updateFlower, generateFlowerContent } from '@/app/actions/admin';
import { Flower } from '@prisma/client';
import { Save, Loader2, Sparkles, Image as ImageIcon, Eye, X, Plus } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

interface FlowerFormProps {
  flower?: Flower;
  onSuccess?: () => void;
}

export default function FlowerForm({ flower, onSuccess }: FlowerFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const imageUrlRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(flower?.imageUrl || '');

  useEffect(() => {
    if (flower?.imageUrl) setPreviewUrl(flower.imageUrl);
  }, [flower]);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      if (flower) {
        await updateFlower(flower.id, formData);
      } else {
        await createFlower(formData);
        formRef.current?.reset();
        setPreviewUrl('');
      }
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      alert('操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleAIGenerate = async () => {
    const form = formRef.current;
    if (!form) return;
    
    const formData = new FormData(form);
    const name = formData.get('name') as string;

    if (!name) {
      alert('请先输入花名');
      return;
    }

    setAiLoading(true);
    try {
      const data = await generateFlowerContent(name);
      
      // 自动填充字段
      const engInput = form.elements.namedItem('englishName') as HTMLInputElement;
      const langInput = form.elements.namedItem('language') as HTMLInputElement;
      const habitInput = form.elements.namedItem('habit') as HTMLInputElement;

      if (engInput && data.englishName) engInput.value = data.englishName;
      if (langInput) langInput.value = data.language || '';
      if (habitInput) habitInput.value = data.habit || '';

    } catch (error: any) {
      console.error(error);
      alert(error.message || 'AI 生成失败');
    } finally {
      setAiLoading(false);
    }
  };

  const handlePreviewImage = () => {
    if (imageUrlRef.current) {
      const url = imageUrlRef.current.value;
      if (url) setPreviewUrl(url);
      else alert("请先输入图片链接");
    }
  };

  const handleClear = (name: string) => {
    if (formRef.current) {
      const input = formRef.current.elements.namedItem(name) as HTMLInputElement;
      if (input) {
        input.value = '';
        input.focus();
        if (name === 'imageUrl') setPreviewUrl('');
      }
    }
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64 && imageUrlRef.current) {
        imageUrlRef.current.value = base64;
        setPreviewUrl(base64);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <form 
      ref={formRef}
      action={handleSubmit}
      className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* === 左列：花名 + 图片预览 === */}
        <div className="space-y-5">
          
          {/* 1. 花名 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-600 block">花名</label>
            <div className="flex rounded-lg shadow-sm">
              <div className="relative flex-1 min-w-0 group">
                <input 
                  name="name" 
                  required 
                  defaultValue={flower?.name} 
                  className="block w-full px-3 py-2 rounded-l-lg border border-stone-300 text-sm outline-none focus:ring-2 focus:ring-stone-400 focus:border-stone-400 transition pr-8"
                  placeholder="例如：红牡丹" 
                />
                <button 
                  type="button" 
                  onClick={() => handleClear('name')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                  title="清空"
                >
                  <X size={14} />
                </button>
              </div>
              <button 
                type="button" 
                onClick={handleAIGenerate}
                disabled={aiLoading || loading}
                className="inline-flex items-center px-3 py-2 border border-l-0 border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-r-lg text-xs font-medium transition whitespace-nowrap"
                title="自动生成信息"
              >
                {aiLoading ? <Loader2 className="animate-spin w-4 h-4 mr-1"/> : <Sparkles className="w-4 h-4 mr-1"/>}
                AI 生成
              </button>
            </div>
          </div>

          {/* 2. 图片预览窗 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-600 block">效果预览</label>
            <div className="w-full aspect-[4/3] bg-stone-100 border-2 border-dashed border-stone-300 rounded-xl overflow-hidden flex items-center justify-center relative group">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-full h-full object-cover animate-in fade-in duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    setPreviewUrl('');
                  }}
                />
              ) : (
                <div className="text-stone-400 flex flex-col items-center gap-2">
                  <ImageIcon size={32} strokeWidth={1.5} />
                  <span className="text-xs">暂无图片</span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* === 右列：英文名/花语 + 链接 + 习性 === */}
        <div className="space-y-5">
          
          {/* 1. 组合行：英文名 + 花语 (各占 50%) */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* 英文名 (新增) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-600 block">英文名</label>
              <div className="relative group">
                <input 
                  name="englishName" 
                  // 英文名非必填
                  defaultValue={flower?.englishName} 
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-stone-400 transition pr-8 font-serif italic"
                  placeholder="Peony" 
                />
                <button 
                  type="button" 
                  onClick={() => handleClear('englishName')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* 花语 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-600 block">花语</label>
              <div className="relative group">
                <input 
                  name="language" 
                  required 
                  defaultValue={flower?.language} 
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-stone-400 transition pr-8"
                  placeholder="雍容华贵" 
                />
                <button 
                  type="button" 
                  onClick={() => handleClear('language')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* 2. 图片链接 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-600 block">图片链接</label>
            <div className="flex gap-2 items-center">
              <div className="relative flex-1 group">
                <input 
                  name="imageUrl" 
                  ref={imageUrlRef}
                  required 
                  defaultValue={flower?.imageUrl} 
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-stone-400 transition pr-8"
                  placeholder="https://..." 
                />
                <button 
                  type="button" 
                  onClick={() => handleClear('imageUrl')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                >
                  <X size={14} />
                </button>
              </div>

              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={handleUploadClick}
                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-stone-100 border border-stone-200 text-stone-600 hover:bg-stone-200 hover:scale-105 active:scale-95 transition shadow-sm"
                title="上传本地图片"
              >
                <Plus size={18} />
              </button>

              <button
                type="button"
                onClick={handlePreviewImage}
                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-stone-100 border border-stone-200 text-stone-600 hover:bg-stone-200 hover:scale-105 active:scale-95 transition shadow-sm"
                title="预览图片链接"
              >
                <Eye size={18} /> 
              </button>
            </div>
          </div>

          {/* 3. 习性标签 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-600 block">习性标签</label>
            <div className="relative group">
              <input 
                name="habit" 
                required 
                defaultValue={flower?.habit} 
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-stone-400 transition pr-8"
                placeholder="例如：喜阳、耐寒" 
              />
              <button 
                type="button" 
                onClick={() => handleClear('habit')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
              >
                <X size={14} />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 底部按钮区 */}
      <div className="pt-4 flex justify-end border-t border-stone-100">
        <button 
          type="submit" 
          disabled={loading || aiLoading}
          className="flex items-center gap-2 px-8 py-2.5 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 active:scale-95 transition disabled:opacity-70 shadow-lg shadow-stone-200"
        >
          {loading ? <Loader2 className="animate-spin w-4 h-4"/> : <Save className="w-4 h-4"/>}
          {flower ? '保存修改' : '立即录入'}
        </button>
      </div>
    </form>
  );
}