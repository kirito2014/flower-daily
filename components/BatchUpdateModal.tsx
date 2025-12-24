'use client';

import { useState, useEffect } from 'react';
import { Flower } from '@prisma/client';
import { X, Check, Loader2, Sparkles, Trash2, Save, RefreshCw } from 'lucide-react';
import { generateFlowerContent, batchUpdateFlowers, deleteFlower, getFlowers } from '@/app/actions/admin';

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

  // 每次打开时加载最新数据
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setIsLoadingData(true);
    try {
      const flowers = await getFlowers();
      // 初始化数据，处理可能的 null 值
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

  // 批量删除
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

  // AI 批量更新
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
          // 仅填充空值或增强现有值
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

  // 批量保存
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/30 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white/95 w-[95%] max-w-7xl h-[85vh] rounded-3xl shadow-2xl border border-white/50 flex flex-col overflow-hidden">
        
        <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-white/50 backdrop-blur-xl">
          <div>
            <h2 className="text-2xl font-serif font-bold text-stone-800 flex items-center gap-2">
              <RefreshCw className="text-purple-600" />
              批量更新存量数据
            </h2>
            <p className="text-stone-500 text-xs mt-1">勾选数据进行 AI 修复、补充别名或批量删除</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors"><X className="text-stone-500" /></button>
        </div>

        <div className="flex-1 overflow-auto p-8 bg-stone-50/30">
          {isLoadingData ? (
            <div className="h-full flex items-center justify-center gap-2 text-stone-400">
               <Loader2 className="animate-spin" /> 加载数据中...
            </div>
          ) : (
            <div className="space-y-4">
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

              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-stone-50 text-stone-500 font-medium">
                    <tr>
                      <th className="p-4 w-12 text-center"><input type="checkbox" onChange={toggleSelectAll} className="rounded border-stone-300 text-blue-600" /></th>
                      <th className="p-4 w-[10%]">花名</th>
                      <th className="p-4 w-[12%]">英文名</th>
                      <th className="p-4 w-[15%]">别名</th>
                      <th className="p-4 w-[20%]">花语</th>
                      <th className="p-4 w-[15%]">习性</th>
                      <th className="p-4 w-[10%]">拍摄者</th>
                      <th className="p-4 w-10">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {data.map((row) => (
                      <tr key={row.id} className={`hover:bg-stone-50/50 transition ${!row.selected ? 'opacity-80' : 'bg-blue-50/30'}`}>
                        <td className="p-4 text-center"><input type="checkbox" checked={row.selected} onChange={() => toggleSelect(row.id)} className="rounded border-stone-300 text-blue-600" /></td>
                        <td className="p-2 font-medium text-stone-700">{row.name}</td>
                        <td className="p-2"><input value={row.englishName || ''} onChange={(e) => updateCell(row.id, 'englishName', e.target.value)} className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-stone-200 rounded focus:bg-white transition italic" /></td>
                        <td className="p-2"><input value={row.alias || ''} onChange={(e) => updateCell(row.id, 'alias', e.target.value)} className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-stone-200 rounded focus:bg-white transition text-xs" /></td>
                        <td className="p-2"><input value={row.language || ''} onChange={(e) => updateCell(row.id, 'language', e.target.value)} className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-stone-200 rounded focus:bg-white transition" /></td>
                        <td className="p-2"><input value={row.habit || ''} onChange={(e) => updateCell(row.id, 'habit', e.target.value)} className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-stone-200 rounded focus:bg-white transition" /></td>
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

        <div className="p-6 border-t border-stone-100 bg-white/80 backdrop-blur-xl flex justify-end gap-4">
             <button onClick={onClose} className="px-6 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 transition font-medium">取消</button>
             <button onClick={handleSave} disabled={isProcessing} className="px-8 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-xl hover:scale-105 active:scale-95 transition font-medium flex items-center gap-2 disabled:opacity-50">{isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 保存更新</button>
        </div>
      </div>
    </div>
  );
}