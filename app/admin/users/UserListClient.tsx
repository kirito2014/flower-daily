'use client';

import { resetUserPassword, updateUserPassword, createUser, deleteUser, toggleUserStatus, updateUser } from '@/app/actions/user';
import { useState } from 'react';
import { RefreshCw, KeyRound, Save, X, Plus, Trash2, Check, Power, UserCog } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function UserListClient({ users, roles }: { users: any[], roles: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // 新增/编辑用户
  const [editingUserRole, setEditingUserRole] = useState<string | null>(null); // 编辑中的用户ID (用于修改角色)
  
  const handleToggleStatus = async (user: any) => {
    if (user.username === 'admin') return alert('超级管理员不可禁用');
    if (!confirm(`确定要${user.isActive ? '禁用' : '启用'}该用户吗？`)) return;
    await toggleUserStatus(user.id, user.isActive);
  };

  const handleDelete = async (user: any) => {
    if (user.username === 'admin') return alert('超级管理员不可删除');
    if (!confirm('确定删除该用户吗？此操作不可恢复。')) return;
    await deleteUser(user.id);
  };

  const handleCreate = async (formData: FormData) => {
    try {
      await createUser(formData);
      setIsModalOpen(false);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRoleUpdate = async (e: React.FormEvent<HTMLFormElement>, id: string) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await updateUser(id, formData);
    setEditingUserRole(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-sm hover:bg-stone-800 shadow-sm">
          <Plus size={16} /> 新增用户
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 border-b border-stone-200 text-stone-500">
            <tr>
              <th className="px-6 py-4 font-medium">用户名</th>
              <th className="px-6 py-4 font-medium">角色</th>
              <th className="px-6 py-4 font-medium">状态</th>
              <th className="px-6 py-4 font-medium">最后登录</th>
              <th className="px-6 py-4 font-medium">创建时间</th>
              <th className="px-6 py-4 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-stone-50/50 transition">
                <td className="px-6 py-4 font-medium text-stone-800">{user.username}</td>
                
                {/* 角色列：支持点击修改 */}
                <td className="px-6 py-4">
                  {editingUserRole === user.id ? (
                    <form onSubmit={(e) => handleRoleUpdate(e, user.id)} className="flex items-center gap-2">
                       <select name="roleId" defaultValue={user.roleId || ''} className="px-2 py-1 border rounded text-xs outline-none">
                         <option value="">无角色</option>
                         {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                       </select>
                       <button className="text-blue-600"><Save size={14}/></button>
                       <button type="button" onClick={() => setEditingUserRole(null)} className="text-stone-400"><X size={14}/></button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => user.username !== 'admin' && setEditingUserRole(user.id)}>
                      {user.username === 'admin' ? (
                        <span className="text-purple-600 font-bold text-xs">超级管理员</span>
                      ) : (
                        <span className={`text-xs ${user.role ? 'text-stone-600' : 'text-stone-400'}`}>
                          {user.role?.name || '未分配'}
                        </span>
                      )}
                      {user.username !== 'admin' && <UserCog size={12} className="opacity-0 group-hover:opacity-100 text-stone-400"/>}
                    </div>
                  )}
                </td>

                <td className="px-6 py-4">
                   <button 
                     onClick={() => handleToggleStatus(user)}
                     disabled={user.username === 'admin'}
                     className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition ${
                       user.username === 'admin' ? 'bg-purple-50 text-purple-600 opacity-100' :
                       user.isActive ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700' : 'bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700'
                     }`}
                   >
                     {user.username === 'admin' ? <Check size={10} /> : <Power size={10} />}
                     {user.isActive ? '正常' : '已禁用'}
                   </button>
                </td>
                <td className="px-6 py-4 text-stone-400 font-mono text-xs">{formatDate(user.lastLogin)}</td>
                <td className="px-6 py-4 text-stone-400 font-mono text-xs">{formatDate(user.createdAt)}</td>
                
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                   {user.username !== 'admin' && (
                     <>
                        <button 
                          onClick={() => { if(confirm('重置密码为 admin123?')) resetUserPassword(user.id) }}
                          className="p-1.5 text-stone-400 hover:bg-stone-100 rounded-lg transition" title="重置密码"
                        >
                          <RefreshCw size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(user)}
                          className="p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition" title="删除用户"
                        >
                          <Trash2 size={14} />
                        </button>
                     </>
                   )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 新增用户弹窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form action={handleCreate} className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-stone-800">新增用户</h3>
            <div className="space-y-3">
              <input name="username" required placeholder="用户名" className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-stone-200" />
              <input name="password" required type="password" placeholder="初始密码" className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-stone-200" />
              <select name="roleId" className="w-full px-3 py-2 border rounded-lg text-sm outline-none bg-white">
                <option value="">请选择角色...</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-stone-500 hover:bg-stone-100 rounded-lg text-sm">取消</button>
              <button type="submit" className="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm hover:bg-stone-800">创建</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}