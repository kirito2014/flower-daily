'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/app/actions/auth';
import { motion } from 'framer-motion';
import { Loader2, Lock, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError(false);

    const result = await login(formData);

    if (result.success) {
      router.push('/admin/flowers'); // 登录成功跳转后台
    } else {
      setLoading(false);
      setError(true); // 触发错误动效
      // 2秒后重置错误状态
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl border border-stone-200 p-8 text-center relative overflow-hidden">
            
            {/* 顶部装饰条 */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-stone-200 via-stone-400 to-stone-200"></div>

            <div className="mb-8 flex justify-center">
                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center text-stone-600">
                    <Lock size={24} />
                </div>
            </div>

            <h1 className="text-2xl font-serif font-bold text-stone-800 mb-2">管理员登录</h1>
            <p className="text-stone-500 text-sm mb-8">Flower Daily Admin Panel</p>

            <form action={handleSubmit} className="space-y-4">
                <motion.div
                    animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
                    transition={{ duration: 0.4 }}
                >
                    <input 
                        type="password" 
                        name="password"
                        placeholder="请输入访问密码"
                        required
                        className={`w-full px-4 py-3 rounded-xl border outline-none transition-all duration-300 ${error ? 'border-red-300 bg-red-50 focus:ring-red-200' : 'border-stone-200 focus:border-stone-400 focus:ring-2 focus:ring-stone-100'}`}
                    />
                </motion.div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-3 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                    {loading ? (
                        <Loader2 className="animate-spin w-5 h-5" />
                    ) : (
                        <>
                            <span>进入后台</span>
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>
            
            {error && (
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-500 text-xs mt-4"
                >
                    密码错误，无权访问
                </motion.p>
            )}
        </div>
      </motion.div>
    </div>
  );
}