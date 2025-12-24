'use client';

import { useState } from 'react';
import { Search, X, Loader2, Download } from 'lucide-react';
import { searchUnsplashImages } from '@/app/actions/image';

interface UnsplashImage {
  id: string;
  thumb: string;
  full: string;
  photographer: string;
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

  // 初始搜索 (如果打开时有默认词，可选自动搜索，这里为了节省API额度设为手动)
  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const images = await searchUnsplashImages(query);
      setResults(images);
    } catch (error) {
      console.error(error);
      alert('搜索失败，请确保已在设置中配置 Unsplash API Key');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white w-[90%] max-w-4xl h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-white">
          <h3 className="text-xl font-serif font-bold text-stone-800 flex items-center gap-2">
            <Search size={20} className="text-stone-400" />
            Unsplash 图片搜索
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition"><X size={20} /></button>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-stone-50 border-b border-stone-100 flex gap-2">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="输入英文关键词 (如: Red Rose)"
            className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-stone-200 font-medium"
          />
          <button 
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2.5 bg-black text-white rounded-xl hover:bg-stone-800 transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : '搜索'}
          </button>
        </div>

        {/* Results Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-stone-50/50">
          {loading ? (
            <div className="h-full flex items-center justify-center text-stone-400">
              <Loader2 className="animate-spin mb-2" /> 正在寻找灵感...
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.map((img) => (
                <div 
                  key={img.id} 
                  className="group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition bg-stone-200"
                  onClick={() => {
                    onSelect(img.full, img.photographer);
                    onClose();
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.thumb} alt="Unsplash" className="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    Photo by {img.photographer}
                  </div>
                  <div className="absolute top-2 right-2 bg-white/90 text-stone-800 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                    <Download size={14} />
                  </div>
                </div>
              ))}
            </div>
          ) : hasSearched ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-400">
              <p>未找到相关图片</p>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-stone-400">
              <Search size={48} className="mb-4 opacity-20" />
              <p>输入关键词开始搜索</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}