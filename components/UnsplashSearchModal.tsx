'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom'; // === 引入 createPortal ===
import { Search, X, Loader2, Download } from 'lucide-react';
import { searchUnsplashImages } from '@/app/actions/image';

interface UnsplashImage {
  id: string;
  thumb: string;
  full: string;
  photographer: string;
  downloadLocation?: string;
}

interface UnsplashSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, photographer: string) => void;
  initialQuery?: string;
}

export default function UnsplashSearchModal({ isOpen, onClose, onSelect, initialQuery = '' }: UnsplashSearchModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<UnsplashImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // === 新增：组件挂载状态，防止服务端渲染 (SSR) 时找不到 document ===
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 核心修复：当 initialQuery 变化或弹窗打开时，同步更新搜索框内容
  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
    }
  }, [isOpen, initialQuery]);

  const handleSearch = async (overrideQuery?: string) => {
    const q = overrideQuery || query;
    if (!q.trim()) return;
    
    setLoading(true);
    setHasSearched(true);
    try {
      const images = await searchUnsplashImages(q);
      setResults(images);
    } catch (error) {
      console.error(error);
      alert('搜索失败，请确保已在设置中配置 Unsplash API Key');
    } finally {
      setLoading(false);
    }
  };

  // 如果未挂载或未打开，不渲染任何内容
  if (!isOpen || !mounted) return null;

  // === 核心修复：使用 createPortal 将模态框渲染到 body 层级 ===
  // 这样可以无视父组件的 overflow:hidden 或 transform 限制，实现真正的全屏覆盖
  return createPortal(
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
      {/* 修改：宽度调整为 max-w-7xl，高度 h-[90vh]，提供更大的视野 */}
      <div className="bg-white w-[95%] max-w-7xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-stone-200">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-stone-100 flex justify-between items-center bg-white">
          <h3 className="text-xl font-serif font-bold text-stone-800 flex items-center gap-2">
            <Search size={22} className="text-purple-600" />
            Unsplash 图库
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition"><X size={22} /></button>
        </div>

        {/* Search Bar */}
        <div className="p-6 bg-stone-50 border-b border-stone-100 flex gap-3">
          <div className="relative flex-1">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="输入英文关键词 (如: Red Rose)"
              className="w-full pl-5 pr-4 py-3 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition text-lg"
              autoFocus
            />
          </div>
          <button 
            onClick={() => handleSearch()}
            disabled={loading}
            className="px-8 py-3 bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition disabled:opacity-50 font-bold text-base flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : '搜索图片'}
          </button>
        </div>

        {/* Results Grid */}
        <div className="flex-1 overflow-y-auto p-8 bg-stone-50/50">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-400 gap-3">
              <Loader2 className="animate-spin w-8 h-8 text-purple-500" /> 
              <p>正在连接 Unsplash...</p>
            </div>
          ) : results.length > 0 ? (
            // 修改：Grid 布局调整，大屏显示 5 列
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {results.map((img) => (
                <div 
                  key={img.id} 
                  className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-stone-200"
                  onClick={() => {
                    onSelect(img.full, img.photographer);
                    onClose();
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.thumb} alt="Unsplash" className="w-full h-full object-cover" />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  
                  {/* Info Tag */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                    <p className="text-xs font-medium truncate">@{img.photographer}</p>
                  </div>
                  
                  {/* Select Icon */}
                  <div className="absolute top-3 right-3 bg-white text-stone-900 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-lg">
                    <Download size={16} />
                  </div>
                </div>
              ))}
            </div>
          ) : hasSearched ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-400">
              <p className="text-lg">未找到相关图片，试着换个关键词？</p>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-stone-300 select-none">
              <Search size={64} className="mb-4 opacity-20" />
              <p className="text-lg font-medium">输入英文关键词开始探索</p>
              <p className="text-sm mt-2 opacity-60">例如: "White Lily", "Spring Garden"</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body // 渲染目标节点
  );
}