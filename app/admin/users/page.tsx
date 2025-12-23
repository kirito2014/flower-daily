import { getUsers } from '@/app/actions/user';
import { getRoles } from '@/app/actions/role';
import UserListClient from './UserListClient';

export default async function UsersPage() {
  const users = await getUsers();
  const roles = await getRoles(); // 获取角色列表传给客户端

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif text-stone-800">用户管理</h2>
        <p className="text-stone-500 text-sm mt-1">管理后台访问权限，重置或修改用户密码</p>
      </div>
      <UserListClient users={users} roles={roles} />
    </div>
  );
}