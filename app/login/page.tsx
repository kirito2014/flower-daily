'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/app/actions/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Lock, User, ArrowRight, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<any>({ success: false });
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const result = await login(null, formData);
    
    setLoading(false);
    setState(result);

    if (result.success) {
      router.push('/admin/flowers');
    }
  };

  const isChangeMode = state?.requireChange;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl border border-stone-200 p-8 relative overflow-hidden">
            {/* 顶部装饰 */}
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${isChangeMode ? 'from-orange-400 to-red-500' : 'from-stone-200 via-stone-400 to-stone-200'}`}></div>

            <div className="mb-8 flex flex-col items-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${isChangeMode ? 'bg-orange-100 text-orange-600' : 'bg-stone-100 text-stone-600'}`}>
                    {isChangeMode ? <ShieldAlert size={28} /> : <Lock size={24} />}
                </div>
                <h1 className="text-2xl font-serif font-bold text-stone-800">
                  {isChangeMode ? '安全设置' : '管理员登录'}
                </h1>
                <p className="text-stone-500 text-sm mt-1">
                  {isChangeMode ? '首次登录，请设置强密码' : 'Flower Daily Admin Panel'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* 错误提示 */}
                <AnimatePresence>
                  {state?.error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-red-50 text-red-600 text-xs p-3 rounded-lg flex items-center gap-2"
                    >
                      <ShieldAlert size={14} />
                      {state.error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 用户名 (修改密码模式下只读) */}
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                  <input 
                    type="text" 
                    name="username"
                    placeholder="用户名"
                    defaultValue="admin"
                    readOnly={isChangeMode}
                    required
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none transition-all ${isChangeMode ? 'bg-stone-100 text-stone-500' : 'bg-white focus:border-stone-400 focus:ring-2 focus:ring-stone-100'}`}
                  />
                </div>

                {/* 旧密码 */}
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                  <input 
                    type="password" 
                    name="password"
                    placeholder={isChangeMode ? "当前默认密码" : "密码"}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-100 transition-all"
                  />
                </div>

                {/* === 新密码输入框 (仅首次登录显示) === */}
                <AnimatePresence>
                  {isChangeMode && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" size={18} />
                        <input 
                          type="password" 
                          name="newPassword"
                          placeholder="新密码 (>8位, 大小写+特殊字符)"
                          required
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-orange-200 bg-orange-50 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all placeholder:text-orange-300 text-orange-800"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button 
                  type="submit" 
                  disabled={loading}
                  className={`w-full py-3 text-white rounded-xl font-medium active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 ${isChangeMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-stone-900 hover:bg-stone-800'}`}
                >
                  {loading ? (
                    <Loader2 className="animate-spin w-5 h-5" />
                  ) : (
                    <>
                      <span>{isChangeMode ? '确认修改并登录' : '登录'}</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
            </form>
        </div>
      </motion.div>
    </div>
  );
}