'use client';

import { useState, useEffect, useMemo } from 'react';
import { getFlowers, deleteFlower } from '@/app/actions/admin';
import FlowerForm from '@/components/FlowerForm';
import AdminFlowerCard from '@/components/AdminFlowerCard';
import { Flower } from '@prisma/client';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Loader2, 
  SortAsc, 
  Calendar, 
  Clock 
} from 'lucide-react';

export default function AdminFlowersPage() {
  // === 1. 数据状态 ===
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null); // 当前正在编辑的卡片ID

  // === 2. 筛选/排序状态 ===
  const [searchText, setSearchText] = useState(''); // 花名搜索
  const [filterText, setFilterText] = useState(''); // 任意中文筛选 (花语/习性)
  const [sortKey, setSortKey] = useState('created_desc'); // 排序规则

  // === 3. 数据加载 ===
  const loadFlowers = async () => {
    try {
      // 如果不是首次加载，不显示全屏 loading，体验更好
      if (flowers.length === 0) setLoading(true);
      const data = await getFlowers();
      setFlowers(data);
    } catch (error) {
      console.error('Failed to load flowers', error);
      alert('加载花卉数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlowers();
  }, []);

  // === 4. 处理删除 ===
  const handleDelete = async (id: string) => {
    try {
      await deleteFlower(id);
      // 乐观更新：直接在本地移除，不必等待重新拉取
      setFlowers(prev => prev.filter(f => f.id !== id));
    } catch (error) {
      alert('删除失败');
    }
  };

  // === 5. 核心：计算过滤和排序后的列表 ===
  const processedFlowers = useMemo(() => {
    let res = [...flowers];

    // A. 搜索 (Search) - 仅匹配花名
    if (searchText.trim()) {
      const lowerSearch = searchText.toLowerCase();
      res = res.filter(f => f.name.toLowerCase().includes(lowerSearch));
    }

    // B. 筛选 (Filter) - 匹配 花语 OR 习性
    if (filterText.trim()) {
      const lowerFilter = filterText.toLowerCase();
      res = res.filter(f => 
        f.language.toLowerCase().includes(lowerFilter) || 
        f.habit.toLowerCase().includes(lowerFilter)
      );
    }

    // C. 排序 (Sort)
    res.sort((a, b) => {
      switch (sortKey) {
        case 'created_desc': // 添加时间 (新->旧)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'created_asc': // 添加时间 (旧->新)
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'updated_desc': // 修改时间 (近->远)
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'name_asc': // 中文名称 (A->Z)
          return a.name.localeCompare(b.name, 'zh-CN');
        default:
          return 0;
      }
    });

    return res;
  }, [flowers, searchText, filterText, sortKey]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* === 顶部：页面标题与说明 === */}
      <div>
        <h2 className="text-2xl font-serif font-bold text-stone-800">花卉管理</h2>
        <p className="text-stone-500 text-sm mt-1">
          录入新的花卉信息，或管理已有的花卉卡片。
        </p>
      </div>

      {/* === 录入区域：折叠式或常驻的录入表单 === */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
        <h3 className="text-sm font-bold text-stone-800 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-stone-800 rounded-full"></span>
          新花卉录入
        </h3>
        <FlowerForm onSuccess={loadFlowers} />
      </div>

      {/* === 分隔线 === */}
      <div className="h-px bg-stone-200" />

      {/* === 工具栏：搜索 / 筛选 / 排序 === */}
      <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center bg-stone-50 p-4 rounded-xl border border-stone-200/60 sticky top-20 z-10 backdrop-blur-md bg-stone-50/90">
        
        {/* 左侧：搜索与筛选输入框 */}
        <div className="flex flex-1 gap-3 flex-col sm:flex-row">
          
          {/* 1. 搜索花名 */}
          <div className="relative group flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-blue-500 transition-colors" size={16} />
            <input 
              type="text"
              placeholder="搜索花名..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition shadow-sm"
            />
          </div>

          {/* 2. 筛选属性 */}
          <div className="relative group flex-1">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-purple-500 transition-colors" size={16} />
            <input 
              type="text"
              placeholder="筛选花语或习性..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-400 transition shadow-sm"
            />
          </div>

        </div>

        {/* 右侧：排序下拉选 */}
        <div className="relative min-w-[180px]">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none">
             {sortKey.includes('name') ? <SortAsc size={16}/> : (sortKey.includes('updated') ? <Clock size={16}/> : <Calendar size={16}/>)}
          </div>
          <select 
            value={sortKey} 
            onChange={(e) => setSortKey(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 bg-white border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-stone-200 cursor-pointer appearance-none shadow-sm text-stone-700 font-medium"
          >
            <option value="created_desc">按添加时间 (最新)</option>
            <option value="created_asc">按添加时间 (最早)</option>
            <option value="updated_desc">按修改时间 (最近)</option>
            <option value="name_asc">按名称排序 (A-Z)</option>
          </select>
          <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={14} />
        </div>
      </div>

      {/* === 内容区域：卡片列表 === */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-stone-400 gap-3">
          <Loader2 className="animate-spin" size={32} />
          <p className="text-sm">正在加载花圃...</p>
        </div>
      ) : processedFlowers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {processedFlowers.map((flower) => (
            <AdminFlowerCard 
              key={flower.id} 
              flower={flower} 
              onDelete={handleDelete}
              // 互斥编辑逻辑：只有当 editingId === flower.id 时才处于编辑模式
              isEditing={editingId === flower.id}
              onToggleEdit={() => setEditingId(current => current === flower.id ? null : flower.id)}
              onCloseEdit={() => setEditingId(null)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
          <p className="text-stone-400 text-sm">
            {(searchText || filterText) ? '没有找到匹配的花卉，换个关键词试试？' : '暂无花卉数据，快去录入第一朵花吧！'}
          </p>
        </div>
      )}
    </div>
  );
}