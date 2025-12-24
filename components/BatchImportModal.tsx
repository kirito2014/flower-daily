'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { X, Upload, FileSpreadsheet, Check, AlertCircle, Loader2, Sparkles, Trash2, Download } from 'lucide-react';
import { generateFlowerContent, batchCreateFlowers } from '@/app/actions/admin';

interface ImportData {
  id: string; // 临时ID用于前端操作
  name: string;
  imageUrl: string;
  englishName: string;
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

  // 1. 下载模板
  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { '花名(必填)': '红玫瑰', '图片链接(必填)': 'https://example.com/rose.jpg', '英文名': 'Red Rose', '花语': '热烈的爱', '习性': '喜阳' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "导入模板");
    XLSX.writeFile(wb, "花卉导入模板.xlsx");
  };

  // 2. 解析 Excel
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

      // 解析数据 (假设第一行是表头)
      if (jsonData.length > 1) {
        const parsed: ImportData[] = jsonData.slice(1).map((row: any, index) => ({
          id: `row-${index}-${Date.now()}`,
          name: row[0] || '',
          imageUrl: row[1] || '',
          englishName: row[2] || '',
          language: row[3] || '',
          habit: row[4] || '',
          selected: true, // 默认选中
          status: 'pending'
        }));
        setData(parsed);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // 重置 input
  };

  // 3. 更新单元格数据
  const updateCell = (id: string, field: keyof ImportData, value: string) => {
    setData(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  // 4. 切换选中状态
  const toggleSelect = (id: string) => {
    setData(prev => prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item));
  };

  const toggleSelectAll = () => {
    const allSelected = data.every(i => i.selected);
    setData(prev => prev.map(item => ({ ...item, selected: !allSelected })));
  };

  // 5. 删除选中
  const handleDeleteSelected = () => {
    if (confirm('确定移除选中的行吗？')) {
      setData(prev => prev.filter(item => !item.selected));
    }
  };

  // 6. AI 智能补全
  const handleAIFill = async () => {
    const targets = data.filter(item => item.selected && item.name && (!item.englishName || !item.language || !item.habit));
    if (targets.length === 0) {
      alert('请先勾选需要补全且已有花名的数据行');
      return;
    }

    setIsProcessing(true);
    
    // 为了不阻塞，一个接一个处理，或者使用 Promise.all 并发 (这里限制并发防止超限)
    for (const item of targets) {
      // 设置状态为 loading
      setData(prev => prev.map(p => p.id === item.id ? { ...p, status: 'loading' } : p));
      
      try {
        const aiData = await generateFlowerContent(item.name);
        setData(prev => prev.map(p => p.id === item.id ? {
          ...p,
          englishName: p.englishName || aiData.englishName || '',
          language: p.language || aiData.language || '',
          habit: p.habit || aiData.habit || '',
          status: 'success'
        } : p));
      } catch (error) {
        console.error(error);
        setData(prev => prev.map(p => p.id === item.id ? { ...p, status: 'error' } : p));
      }
    }
    setIsProcessing(false);
  };

  // 7. 提交保存
  const handleImport = async () => {
    const targets = data.filter(item => item.selected);
    
    // 校验必填项
    const invalid = targets.some(t => !t.name || !t.imageUrl);
    if (invalid) {
      alert('存在未填写的必填项（花名或图片链接），请检查标红的输入框。');
      return;
    }

    if (targets.length === 0) return;

    setIsProcessing(true);
    try {
      await batchCreateFlowers(targets);
      onSuccess();
      onClose();
      setData([]);
    } catch (error) {
      alert('导入失败，请重试');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/30 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white/90 w-[95%] max-w-6xl h-[85vh] rounded-3xl shadow-2xl border border-white/50 flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-white/50 backdrop-blur-xl">
          <div>
            <h2 className="text-2xl font-serif font-bold text-stone-800 flex items-center gap-2">
              <FileSpreadsheet className="text-green-600" />
              批量导入花卉
            </h2>
            <p className="text-stone-500 text-xs mt-1">支持 .xlsx 格式，批量录入后可自动识别补充信息</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
            <X className="text-stone-500" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8 bg-stone-50/30">
          
          {/* Empty State / Toolbar */}
          {data.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-6 border-2 border-dashed border-stone-200 rounded-2xl bg-white/40">
              <div className="p-6 bg-blue-50 text-blue-500 rounded-full mb-2">
                <Upload size={48} />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-bold text-stone-700">上传 Excel 文件</h3>
                <p className="text-stone-400 text-sm">请使用标准模板，包含花名、图片链接等列</p>
              </div>
              
              <div className="flex gap-4 mt-4">
                <button 
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 hover:border-stone-300 transition shadow-sm font-medium"
                >
                  <Download size={18} />
                  下载模板
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 hover:scale-105 transition active:scale-95 font-medium"
                >
                  <FileSpreadsheet size={18} />
                  选择文件
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Data Toolbar */}
              <div className="flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm border border-stone-100 sticky top-0 z-10">
                <div className="flex items-center gap-4 px-2">
                  <span className="text-sm font-bold text-stone-700">已加载 {data.length} 条数据</span>
                  <span className="text-xs text-stone-400">选中 {data.filter(i=>i.selected).length} 条</span>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={handleDeleteSelected}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
                  >
                    <Trash2 size={14} /> 移除选中
                  </button>
                  <button 
                    onClick={handleAIFill}
                    disabled={isProcessing}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                    AI 自动补全
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-stone-50 text-stone-500 font-medium">
                    <tr>
                      <th className="p-4 w-12 text-center">
                        <input type="checkbox" onChange={toggleSelectAll} className="rounded border-stone-300 text-blue-600 focus:ring-blue-200" />
                      </th>
                      <th className="p-4 w-[15%]">花名 <span className="text-red-500">*</span></th>
                      <th className="p-4 w-[25%]">图片链接 <span className="text-red-500">*</span></th>
                      <th className="p-4 w-[15%]">英文名</th>
                      <th className="p-4 w-[20%]">花语</th>
                      <th className="p-4 w-[15%]">习性</th>
                      <th className="p-4 w-10">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {data.map((row) => (
                      <tr key={row.id} className={`hover:bg-stone-50/50 transition group ${!row.selected ? 'opacity-50 grayscale' : ''}`}>
                        <td className="p-4 text-center">
                          <input 
                            type="checkbox" 
                            checked={row.selected} 
                            onChange={() => toggleSelect(row.id)}
                            className="rounded border-stone-300 text-blue-600 focus:ring-blue-200" 
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            value={row.name} 
                            onChange={(e) => updateCell(row.id, 'name', e.target.value)}
                            className={`w-full px-3 py-2 bg-stone-50 border rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition ${!row.name ? 'border-red-300 bg-red-50' : 'border-transparent'}`}
                            placeholder="必填"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            value={row.imageUrl} 
                            onChange={(e) => updateCell(row.id, 'imageUrl', e.target.value)}
                            className={`w-full px-3 py-2 bg-stone-50 border rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition font-mono text-xs ${!row.imageUrl ? 'border-red-300 bg-red-50' : 'border-transparent'}`}
                            placeholder="必填URL"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            value={row.englishName} 
                            onChange={(e) => updateCell(row.id, 'englishName', e.target.value)}
                            className="w-full px-3 py-2 bg-stone-50 border border-transparent rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition font-serif italic"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            value={row.language} 
                            onChange={(e) => updateCell(row.id, 'language', e.target.value)}
                            className="w-full px-3 py-2 bg-stone-50 border border-transparent rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            value={row.habit} 
                            onChange={(e) => updateCell(row.id, 'habit', e.target.value)}
                            className="w-full px-3 py-2 bg-stone-50 border border-transparent rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
                          />
                        </td>
                        <td className="p-4 text-center">
                           {row.status === 'loading' && <Loader2 className="animate-spin text-purple-500" size={16} />}
                           {row.status === 'success' && <Check className="text-green-500" size={16} />}
                           {row.status === 'error' && <AlertCircle className="text-red-500" size={16} />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-stone-100 bg-white/80 backdrop-blur-xl flex justify-between items-center">
           <button 
             onClick={() => fileInputRef.current?.click()} 
             className="text-stone-500 hover:text-stone-800 text-sm font-medium flex items-center gap-2 transition"
           >
             <Upload size={16} /> 重新上传文件
           </button>

           <div className="flex gap-4">
             <button 
               onClick={onClose}
               className="px-6 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 transition font-medium"
             >
               取消
             </button>
             <button 
               onClick={handleImport}
               disabled={data.length === 0 || isProcessing}
               className="px-8 py-2.5 rounded-xl bg-stone-900 text-white hover:bg-stone-800 shadow-xl shadow-stone-200 hover:scale-105 active:scale-95 transition font-medium flex items-center gap-2 disabled:opacity-50 disabled:scale-100"
             >
               {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
               确认批量录入
             </button>
           </div>
        </div>

        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".xlsx, .xls" 
          onChange={handleFileChange} 
        />
      </div>
    </div>
  );
}