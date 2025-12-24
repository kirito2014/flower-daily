'use client';

import { useState, useEffect } from 'react';
import { Flower } from '@prisma/client';
import { X, Check, Loader2, Sparkles, Trash2, Save, RefreshCw, Search, Eye } from 'lucide-react';
import { generateFlowerContent, batchUpdateFlowers, deleteFlower, getFlowers } from '@/app/actions/admin';
import UnsplashSearchModal from '@/components/UnsplashSearchModal';

interface UpdateData extends Flower {
  selected: boolean;
  status?: 'pending' | 'loading' | 'success' | 'error';
}

interface BatchUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BatchUpdateModal({ isOpen, onClose, onSuccess }: BatchUpdateModalProps) {
  const [data, setData] = useState<UpdateData[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Unsplash 相关状态
  const [showUnsplash, setShowUnsplash] = useState(false);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);

  // === 核心修复：悬浮预览状态 (坐标 + URL) ===
  const [preview, setPreview] = useState<{ x: number, y: number, url: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setIsLoadingData(true);
    try {
      const flowers = await getFlowers();
      setData(flowers.map(f => ({ 
        ...f, 
        englishName: f.englishName || '',
        alias: f.alias || '',
        photographer: f.photographer || '',
        selected: false, 
        status: 'pending' 
      })));
    } catch (e) {
      alert('加载数据失败');
    } finally {
      setIsLoadingData(false);
    }
  };

  const updateCell = (id: string, field: keyof UpdateData, value: string) => {
    setData(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const toggleSelect = (id: string) => {
    setData(prev => prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item));
  };

  const toggleSelectAll = () => {
    const allSelected = data.every(i => i.selected);
    setData(prev => prev.map(item => ({ ...item, selected: !allSelected })));
  };

  const handleDeleteSelected = async () => {
    const selectedIds = data.filter(i => i.selected).map(i => i.id);
    if (selectedIds.length === 0) return;
    
    if (confirm(`确定永久删除选中的 ${selectedIds.length} 条数据吗？`)) {
      setIsProcessing(true);
      try {
        for (const id of selectedIds) {
          await deleteFlower(id);
        }
        setData(prev => prev.filter(i => !i.selected));
        onSuccess(); 
      } catch (e) {
        alert('删除过程中出错');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleAIFill = async () => {
    const targets = data.filter(item => item.selected);
    if (targets.length === 0) return alert('请先勾选需要更新的数据行');

    setIsProcessing(true);
    for (const item of targets) {
      setData(prev => prev.map(p => p.id === item.id ? { ...p, status: 'loading' } : p));
      try {
        const aiData = await generateFlowerContent(item.name);
        setData(prev => prev.map(p => p.id === item.id ? {
          ...p,
          englishName: p.englishName || aiData.englishName || '',
          language: p.language || aiData.language || '',
          habit: p.habit || aiData.habit || '',
          alias: p.alias || aiData.alias || '',
          status: 'success'
        } : p));
      } catch (error) {
        setData(prev => prev.map(p => p.id === item.id ? { ...p, status: 'error' } : p));
      }
    }
    setIsProcessing(false);
  };

  const handleSave = async () => {
    const targets = data.filter(item => item.selected);
    if (targets.length === 0) return alert('请勾选要保存的行');

    setIsProcessing(true);
    try {
      await batchUpdateFlowers(targets);
      onSuccess();
      onClose();
    } catch (error) {
      alert('保存失败');
    } finally {
      setIsProcessing(false);
    }
  };

  const openSearch = (id: string) => {
    setActiveRowId(id);
    setShowUnsplash(true);
  };

  // 处理预览悬浮
  const handleMouseEnterPreview = (e: React.MouseEvent, url: string) => {
    if (!url) return;
    const rect = e.currentTarget.getBoundingClientRect();
    // 设置预览图显示在图标上方
    setPreview({
      x: rect.left + rect.width / 2, // 水平居中
      y: rect.top, // 图标顶部
      url
    });
  };

  const activeRow = data.find(item => item.id === activeRowId);
  const searchInitialQuery = activeRow ? (activeRow.englishName || activeRow.name) : '';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/30 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white/95 w-[95%] max-w-[90rem] h-[90vh] rounded-3xl shadow-2xl border border-white/50 flex flex-col overflow-hidden relative">
        
        <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-white/50 backdrop-blur-xl z-20 relative">
          <div>
            <h2 className="text-2xl font-serif font-bold text-stone-800 flex items-center gap-2">
              <RefreshCw className="text-purple-600" />
              批量更新存量数据
            </h2>
            <p className="text-stone-500 text-xs mt-1">支持图片搜索、悬浮预览、AI 修复等操作</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors"><X className="text-stone-500" /></button>
        </div>

        <div className="flex-1 overflow-auto p-8 bg-stone-50/30">
          {isLoadingData ? (
            <div className="h-full flex items-center justify-center gap-2 text-stone-400">
               <Loader2 className="animate-spin" /> 加载数据中...
            </div>
          ) : (
            <div className="space-y-4 pb-20">
              <div className="flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm border border-stone-100 sticky top-0 z-10">
                <div className="flex items-center gap-4 px-2">
                  <span className="text-sm font-bold text-stone-700">共 {data.length} 条</span>
                  <span className="text-xs text-stone-400">选中 {data.filter(i=>i.selected).length} 条</span>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleDeleteSelected} disabled={isProcessing} className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition disabled:opacity-50"><Trash2 size={14} /> 删除选中</button>
                  <button onClick={handleAIFill} disabled={isProcessing} className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition disabled:opacity-50">{isProcessing ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />} AI 智能更新</button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 overflow-visible shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-stone-50 text-stone-500 font-medium sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="p-4 w-12 text-center"><input type="checkbox" onChange={toggleSelectAll} className="rounded border-stone-300 text-blue-600" /></th>
                      <th className="p-4 w-[10%]">花名</th>
                      <th className="p-4 w-[25%]">图片 / 搜索 / 预览</th>
                      <th className="p-4 w-[12%]">英文名</th>
                      <th className="p-4 w-[12%]">别名</th>
                      <th className="p-4 w-[15%]">花语</th>
                      <th className="p-4 w-[10%]">拍摄者</th>
                      <th className="p-4 w-10">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {data.map((row) => (
                      <tr key={row.id} className={`hover:bg-stone-50/50 transition relative ${!row.selected ? 'opacity-90' : 'bg-blue-50/30'}`}>
                        <td className="p-4 text-center"><input type="checkbox" checked={row.selected} onChange={() => toggleSelect(row.id)} className="rounded border-stone-300 text-blue-600" /></td>
                        <td className="p-2 font-medium text-stone-700">{row.name}</td>
                        
                        {/* 图片编辑列 */}
                        <td className="p-2 relative">
                          <div className="flex gap-2 items-center">
                             <input 
                               value={row.imageUrl} 
                               onChange={(e) => updateCell(row.id, 'imageUrl', e.target.value)} 
                               className={`flex-1 w-full px-2 py-1 bg-stone-50 border rounded text-xs font-mono truncate ${!row.imageUrl ? 'bg-red-50 border-red-300' : 'border-stone-200'}`} 
                             />
                             <button 
                               onClick={() => openSearch(row.id)}
                               className="p-1.5 bg-stone-100 rounded-lg hover:bg-blue-100 hover:text-blue-600 transition"
                               title="搜索替换"
                             >
                               <Search size={14} />
                             </button>
                             {/* 预览按钮：鼠标进入触发顶层预览 */}
                             <button 
                               className="p-1.5 bg-stone-100 rounded-lg hover:bg-purple-100 hover:text-purple-600 transition cursor-help"
                               onMouseEnter={(e) => handleMouseEnterPreview(e, row.imageUrl)}
                               onMouseLeave={() => setPreview(null)}
                             >
                               <Eye size={14} />
                             </button>
                          </div>
                        </td>

                        <td className="p-2"><input value={row.englishName || ''} onChange={(e) => updateCell(row.id, 'englishName', e.target.value)} className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-stone-200 rounded focus:bg-white transition italic" /></td>
                        <td className="p-2"><input value={row.alias || ''} onChange={(e) => updateCell(row.id, 'alias', e.target.value)} className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-stone-200 rounded focus:bg-white transition text-xs" /></td>
                        <td className="p-2"><input value={row.language || ''} onChange={(e) => updateCell(row.id, 'language', e.target.value)} className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-stone-200 rounded focus:bg-white transition" /></td>
                        <td className="p-2"><input value={row.photographer || ''} onChange={(e) => updateCell(row.id, 'photographer', e.target.value)} className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-stone-200 rounded focus:bg-white transition text-xs" /></td>
                        <td className="p-4 text-center">{row.status === 'loading' && <Loader2 className="animate-spin text-purple-500" size={16} />}{row.status === 'success' && <Check className="text-green-500" size={16} />}{row.status === 'error' && <X className="text-red-500" size={16} />}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-stone-100 bg-white/80 backdrop-blur-xl flex justify-end gap-4 z-20 relative">
             <button onClick={onClose} className="px-6 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 transition font-medium">取消</button>
             <button onClick={handleSave} disabled={isProcessing} className="px-8 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-xl hover:scale-105 active:scale-95 transition font-medium flex items-center gap-2 disabled:opacity-50">{isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 保存更新</button>
        </div>
      </div>

      {showUnsplash && (
        <UnsplashSearchModal 
          isOpen={true} 
          onClose={() => setShowUnsplash(false)} 
          initialQuery={searchInitialQuery}
          onSelect={(url, user) => {
            if (activeRowId) {
              setData(prev => prev.map(item => item.id === activeRowId ? { 
                ...item, 
                imageUrl: url,
                photographer: user
              } : item));
            }
          }}
        />
      )}

      {/* === 核心修复：全局 Fixed 预览层 (在所有遮挡层之上) === */}
      {preview && (
        <div 
          className="fixed z-[9999] pointer-events-none animate-in fade-in zoom-in-95 duration-200 shadow-2xl rounded-xl border-2 border-white bg-white"
          style={{
            left: preview.x,
            top: preview.y,
            transform: 'translate(-50%, -100%) translateY(-10px)', // 居中并向上偏移
            width: '280px',
            height: '210px'
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={preview.url} 
            alt="preview" 
            className="w-full h-full object-cover rounded-lg bg-stone-100" 
          />
          {/* 小三角 */}
          <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-white transform rotate-45 shadow-sm"></div>
        </div>
      )}
    </div>
  );
}