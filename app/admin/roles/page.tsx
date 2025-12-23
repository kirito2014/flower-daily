'use client';

import { useState, useEffect } from 'react';
import { getRoles, createRole, updateRole, deleteRole } from '@/app/actions/role';
import { Plus, Trash2, Pencil, Shield, Check } from 'lucide-react';
import { formatDate } from '@/lib/utils';

// 定义系统菜单
const ALL_MENUS = [
  { code: 'flowers', label: '花卉管理' },
  { code: 'users', label: '用户管理' },
  { code: 'roles', label: '角色管理' },
  { code: 'settings', label: '系统配置' },
];

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    const data = await getRoles();
    setRoles(data);
  };

  const handleSubmit = async (formData: FormData) => {
    try {
      if (editingRole) {
        await updateRole(editingRole.id, formData);
      } else {
        await createRole(formData);
      }
      setIsModalOpen(false);
      setEditingRole(null);
      loadRoles();
    } catch (e) {
      alert('操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除该角色吗？')) return;
    try {
      await deleteRole(id);
      loadRoles();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-serif text-stone-800">角色管理</h2>
          <p className="text-stone-500 text-sm mt-1">配置系统角色及菜单访问权限</p>
        </div>
        <button 
          onClick={() => { setEditingRole(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-sm hover:bg-stone-800"
        >
          <Plus size={16} /> 新增角色
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map(role => {
          const perms = JSON.parse(role.permissions || '[]');
          return (
            <div key={role.id} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-800">{role.name}</h3>
                    <p className="text-xs text-stone-400 font-mono">{role.code}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingRole(role); setIsModalOpen(true); }} className="p-2 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Pencil size={16}/></button>
                  <button onClick={() => handleDelete(role.id)} className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={16}/></button>
                </div>
              </div>
              
              <p className="text-sm text-stone-500 mb-4 h-10 line-clamp-2">{role.description || '暂无描述'}</p>
              
              <div className="border-t border-stone-100 pt-4">
                <p className="text-xs font-medium text-stone-400 mb-2">菜单权限 ({perms.length})</p>
                <div className="flex flex-wrap gap-2">
                  {perms.map((p: string) => (
                    <span key={p} className="px-2 py-1 bg-stone-100 text-stone-600 text-[10px] rounded-md border border-stone-200">
                      {ALL_MENUS.find(m => m.code === p)?.label || p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 新增/编辑 弹窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form action={handleSubmit} className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-stone-800">{editingRole ? '编辑角色' : '新增角色'}</h3>
            
            <div className="space-y-3">
              <input name="name" required placeholder="角色名称 (如：运营专员)" defaultValue={editingRole?.name} className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-stone-200" />
              <input name="code" required placeholder="角色代号 (如：operator)" defaultValue={editingRole?.code} className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-stone-200" />
              <textarea name="description" placeholder="角色描述..." defaultValue={editingRole?.description} className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-stone-200 h-20 resize-none" />
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-600">菜单权限</label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_MENUS.map(menu => {
                    const defaultChecked = editingRole ? JSON.parse(editingRole.permissions || '[]').includes(menu.code) : false;
                    return (
                      <label key={menu.code} className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-stone-50">
                        <input type="checkbox" name="permissions" value={menu.code} defaultChecked={defaultChecked} className="rounded text-stone-900 focus:ring-stone-500" />
                        <span className="text-sm text-stone-700">{menu.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-stone-500 hover:bg-stone-100 rounded-lg text-sm">取消</button>
              <button type="submit" className="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm hover:bg-stone-800">保存</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}