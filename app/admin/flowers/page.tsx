'use client';

import { useState, useEffect, useMemo } from 'react';
import { getFlowers, deleteFlower } from '@/app/actions/admin';
import FlowerForm from '@/components/FlowerForm';
import AdminFlowerCard from '@/components/AdminFlowerCard';
import { Flower } from '@prisma/client';
import { Search, Filter, ArrowUpDown, Loader2, SortAsc, Calendar, Clock } from 'lucide-react';

export default function AdminFlowersPage() {
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [searchText, setSearchText] = useState('');
  const [filterText, setFilterText] = useState('');
  const [sortKey, setSortKey] = useState('created_desc');

  const loadFlowers = async () => {
    try {
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

  const handleDelete = async (id: string) => {
    try {
      await deleteFlower(id);
      setFlowers(prev => prev.filter(f => f.id !== id));
    } catch (error) {
      alert('删除失败');
    }
  };

  const processedFlowers = useMemo(() => {
    let res = [...flowers];

    // 1. 搜索：支持中文名 OR 英文名
    if (searchText.trim()) {
      const lowerSearch = searchText.toLowerCase();
      res = res.filter(f => 
        f.name.toLowerCase().includes(lowerSearch) || 
        // 兼容旧数据 englishName 可能为 null 的情况 (虽然 schema 设了 default)
        (f.englishName || '').toLowerCase().includes(lowerSearch)
      );
    }

    // 2. 筛选
    if (filterText.trim()) {
      const lowerFilter = filterText.toLowerCase();
      res = res.filter(f => 
        f.language.toLowerCase().includes(lowerFilter) || 
        f.habit.toLowerCase().includes(lowerFilter)
      );
    }

    // 3. 排序
    res.sort((a, b) => {
      switch (sortKey) {
        case 'created_desc': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'created_asc': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'updated_desc': return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'name_asc': return a.name.localeCompare(b.name, 'zh-CN');
        default: return 0;
      }
    });

    return res;
  }, [flowers, searchText, filterText, sortKey]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-serif font-bold text-stone-800">花卉管理</h2>
        <p className="text-stone-500 text-sm mt-1">录入新的花卉信息，或管理已有的花卉卡片。</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
        <h3 className="text-sm font-bold text-stone-800 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-stone-800 rounded-full"></span>
          新花卉录入
        </h3>
        <FlowerForm onSuccess={loadFlowers} />
      </div>

      <div className="h-px bg-stone-200" />

      <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center bg-stone-50 p-4 rounded-xl border border-stone-200/60 sticky top-20 z-10 backdrop-blur-md bg-stone-50/90">
        <div className="flex flex-1 gap-3 flex-col sm:flex-row">
          <div className="relative group flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-blue-500 transition-colors" size={16} />
            <input 
              type="text"
              placeholder="搜索花名 (中/英)..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition shadow-sm"
            />
          </div>
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