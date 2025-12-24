'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { X, Upload, FileSpreadsheet, Check, AlertCircle, Loader2, Sparkles, Trash2, Download, Search, Eye } from 'lucide-react';
import { generateFlowerContent, batchCreateFlowers } from '@/app/actions/admin';
import UnsplashSearchModal from '@/components/UnsplashSearchModal';

interface ImportData {
  id: string;
  name: string;
  imageUrl: string;
  englishName: string;
  alias: string;
  photographer: string;
  language: string;
  habit: string;
  selected: boolean;
  status?: 'pending' | 'loading' | 'success' | 'error';
}

interface BatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BatchImportModal({ isOpen, onClose, onSuccess }: BatchImportModalProps) {
  const [data, setData] = useState<ImportData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Unsplash 相关
  const [showUnsplash, setShowUnsplash] = useState(false);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { '花名(必填)': '红玫瑰', '图片链接(必填)': 'http...', '英文名': 'Red Rose', '别名': '刺玫花', '花语': '热烈的爱', '习性': '喜阳', '拍摄者': 'Unknown' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "导入模板");
    XLSX.writeFile(wb, "花卉导入模板.xlsx");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 });

      if (jsonData.length > 1) {
        const parsed: ImportData[] = jsonData.slice(1).map((row: any, index) => ({
          id: `row-${index}-${Date.now()}`,
          name: row[0] || '',
          imageUrl: row[1] || '',
          englishName: row[2] || '',
          alias: row[3] || '',
          language: row[4] || '',
          habit: row[5] || '',
          photographer: row[6] || '',
          selected: true,
          status: 'pending'
        }));
        setData(parsed);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const updateCell = (id: string, field: keyof ImportData, value: string) => {
    setData(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const toggleSelect = (id: string) => {
    setData(prev => prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item));
  };

  const toggleSelectAll = () => {
    const allSelected = data.every(i => i.selected);
    setData(prev => prev.map(item => ({ ...item, selected: !allSelected })));
  };

  const handleDeleteSelected = () => {
    if (confirm('确定移除选中的行吗？')) {
      setData(prev => prev.filter(item => !item.selected));
    }
  };

  const handleAIFill = async () => {
    const targets = data.filter(item => item.selected && item.name);
    if (targets.length === 0) return alert('请先勾选数据行');

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

  const handleImport = async () => {
    const targets = data.filter(item => item.selected);
    if (targets.some(t => !t.name || !t.imageUrl)) return alert('存在必填项缺失');
    if (targets.length === 0) return;

    setIsProcessing(true);
    try {
      await batchCreateFlowers(targets);
      onSuccess();
      onClose();
      setData([]);
    } catch (error) {
      alert('导入失败');
    } finally {
      setIsProcessing(false);
    }
  };

  const openSearch = (id: string) => {
    setActiveRowId(id);
    setShowUnsplash(true);
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
              <FileSpreadsheet className="text-green-600" />
              批量导入花卉
            </h2>
            <p className="text-stone-500 text-xs mt-1">支持 .xlsx 格式，批量录入后可自动识别补充信息</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors"><X className="text-stone-500" /></button>
        </div>

        <div className="flex-1 overflow-auto p-8 bg-stone-50/30">
          {data.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-6 border-2 border-dashed border-stone-200 rounded-2xl bg-white/40">
              <Upload size={48} className="text-blue-500" />
              <div className="text-center space-y-2">
                <h3 className="text-lg font-bold text-stone-700">上传 Excel 文件</h3>
                <p className="text-stone-400 text-sm">请使用标准模板</p>
              </div>
              <div className="flex gap-4 mt-4">
                <button onClick={handleDownloadTemplate} className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-600 shadow-sm font-medium"><Download size={18} />下载模板</button>
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white shadow-lg font-medium"><FileSpreadsheet size={18} />选择文件</button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pb-20">
              <div className="flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm border border-stone-100 sticky top-0 z-10">
                <div className="flex items-center gap-4 px-2">
                   <span className="text-sm font-bold text-stone-700">已加载 {data.length} 条</span>
                   <span className="text-xs text-stone-400">选中 {data.filter(i=>i.selected).length} 条</span>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleDeleteSelected} className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"><Trash2 size={14} /> 移除选中</button>
                  <button onClick={handleAIFill} disabled={isProcessing} className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition disabled:opacity-50">{isProcessing ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />} AI 自动补全</button>
                </div>
              </div>

              {/* 核心修复：overflow-visible */}
              <div className="bg-white rounded-2xl border border-stone-200 overflow-visible shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-stone-50 text-stone-500 font-medium sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="p-4 w-12 text-center"><input type="checkbox" onChange={toggleSelectAll} className="rounded border-stone-300" /></th>
                      <th className="p-4 w-[10%]">花名*</th>
                      <th className="p-4 w-[25%]">图片链接 / 搜索 / 预览</th>
                      <th className="p-4 w-[12%]">英文名</th>
                      <th className="p-4 w-[12%]">别名</th>
                      <th className="p-4 w-[15%]">花语</th>
                      <th className="p-4 w-[10%]">拍摄者</th>
                      <th className="p-4 w-10">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {data.map((row) => (
                      <tr key={row.id} className={`hover:bg-stone-50/50 transition relative ${!row.selected ? 'opacity-50 grayscale' : ''}`}>
                        <td className="p-4 text-center"><input type="checkbox" checked={row.selected} onChange={() => toggleSelect(row.id)} className="rounded border-stone-300" /></td>
                        <td className="p-2"><input value={row.name} onChange={(e) => updateCell(row.id, 'name', e.target.value)} className={`w-full px-2 py-1 bg-stone-50 border rounded ${!row.name ? 'bg-red-50 border-red-300' : 'border-transparent'}`} /></td>
                        
                        {/* 图片编辑列：带搜索和预览 */}
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
                             <div className="relative group/preview">
                               <button className="p-1.5 bg-stone-100 rounded-lg hover:bg-purple-100 hover:text-purple-600 transition cursor-help">
                                 <Eye size={14} />
                               </button>
                               {/* 预览悬浮窗：z-[9999] */}
                               {row.imageUrl && (
                                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 h-48 bg-white shadow-2xl rounded-xl border border-stone-200 p-1 hidden group-hover/preview:block z-[9999] animate-in fade-in zoom-in-95 pointer-events-none">
                                   {/* eslint-disable-next-line @next/next/no-img-element */}
                                   <img src={row.imageUrl} alt="preview" className="w-full h-full object-cover rounded-lg bg-stone-100" />
                                 </div>
                               )}
                             </div>
                          </div>
                        </td>

                        <td className="p-2"><input value={row.englishName} onChange={(e) => updateCell(row.id, 'englishName', e.target.value)} className="w-full px-2 py-1 bg-transparent border-transparent hover:border-stone-200 border rounded" /></td>
                        <td className="p-2"><input value={row.alias} onChange={(e) => updateCell(row.id, 'alias', e.target.value)} className="w-full px-2 py-1 bg-transparent border-transparent hover:border-stone-200 border rounded text-xs" /></td>
                        <td className="p-2"><input value={row.language} onChange={(e) => updateCell(row.id, 'language', e.target.value)} className="w-full px-2 py-1 bg-transparent border-transparent hover:border-stone-200 border rounded" /></td>
                        <td className="p-2"><input value={row.photographer} onChange={(e) => updateCell(row.id, 'photographer', e.target.value)} className="w-full px-2 py-1 bg-transparent border-transparent hover:border-stone-200 border rounded text-xs" /></td>
                        <td className="p-4 text-center">{row.status === 'loading' && <Loader2 className="animate-spin text-purple-500" size={16} />}{row.status === 'success' && <Check className="text-green-500" size={16} />}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-stone-100 bg-white/80 backdrop-blur-xl flex justify-end gap-4 z-20 relative">
           <button onClick={() => fileInputRef.current?.click()} className="text-stone-500 hover:text-stone-800 text-sm font-medium flex items-center gap-2"><Upload size={16} /> 重新上传</button>
           <div className="flex gap-4">
             <button onClick={onClose} className="px-6 py-2.5 rounded-xl border border-stone-200 text-stone-600 font-medium">取消</button>
             <button onClick={handleImport} disabled={data.length === 0 || isProcessing} className="px-8 py-2.5 rounded-xl bg-stone-900 text-white font-medium flex items-center gap-2 disabled:opacity-50"><Check size={18} /> 确认导入</button>
           </div>
        </div>
        <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleFileChange} />
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
    </div>
  );
}