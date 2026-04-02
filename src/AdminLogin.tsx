import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ArrowRight, ShieldCheck, AlertTriangle, Loader2, Sparkles } from 'lucide-react';
import { api } from './api';

export default function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const success = await api.login(password);
      if (success) { sessionStorage.setItem('admin_auth', 'true'); onLogin(); }
      else { setError('كلمة المرور غير صحيحة'); }
    } catch { setError('حدث خطأ في الاتصال بالخادم'); }
    finally { setLoading(false); }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#050505] flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.15, 0.08] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] md:w-[700px] md:h-[700px] bg-emerald-600 blur-[180px] rounded-full" />
        <motion.div animate={{ scale: [1.2, 1, 1.2], opacity: [0.05, 0.1, 0.05] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-[10%] right-[10%] w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-teal-700 blur-[150px] rounded-full" />
        <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.03, 0.08, 0.03] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[10%] left-[10%] w-[300px] h-[300px] bg-cyan-700 blur-[120px] rounded-full" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[420px]"
      >
        {/* Glass Card */}
        <div className="bg-white/[0.04] backdrop-blur-3xl border border-white/[0.08] rounded-[28px] p-7 md:p-10 shadow-[0_32px_128px_-16px_rgba(16,185,129,0.08)]">
          {/* Logo / Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: "spring", bounce: 0.4, duration: 1 }}
            className="relative w-[72px] h-[72px] md:w-[88px] md:h-[88px] mx-auto mb-7"
          >
            <div className="absolute inset-0 rounded-[20px] md:rounded-[24px] bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl shadow-emerald-500/30" />
            <div className="absolute inset-[2px] rounded-[18px] md:rounded-[22px] bg-gradient-to-br from-emerald-500/90 to-teal-600/90 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-white drop-shadow-lg" />
            </div>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute -inset-2 rounded-[26px] border border-dashed border-emerald-500/20" />
          </motion.div>

          {/* Title */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-center mb-8">
            <h1 className="text-[26px] md:text-3xl font-extrabold text-white mb-2.5 tracking-tight">لوحة التحكم</h1>
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400/60" />
              <p className="text-zinc-400 text-[13px] md:text-sm font-medium">أدخل كلمة المرور للوصول إلى الإدارة</p>
              <Sparkles className="w-3.5 h-3.5 text-emerald-400/60" />
            </div>
          </motion.div>

          {/* Form */}
          <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-xl" />
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-zinc-500 group-focus-within:text-emerald-400 transition-colors duration-300" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.06] border border-white/[0.08] group-focus-within:border-emerald-500/40 rounded-2xl pr-12 pl-5 py-4 text-white placeholder:text-zinc-600 focus:outline-none transition-all duration-300 text-base font-medium"
                  autoFocus
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  className="flex items-center gap-2.5 text-red-300 text-[13px] bg-red-500/[0.08] border border-red-500/15 rounded-2xl px-4 py-3.5 font-medium"
                >
                  <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full relative overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-4 rounded-2xl transition-all duration-500 shadow-xl shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2.5 text-[15px] active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-0 hover:opacity-100 transition-opacity duration-500" />
              <span className="relative z-10 flex items-center gap-2.5">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ArrowRight className="w-5 h-5 rotate-180" /> تسجيل الدخول</>}
              </span>
            </button>
          </motion.form>

          {/* Footer */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-7 pt-5 border-t border-white/[0.05] text-center">
            <a href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-emerald-400 text-xs transition-all duration-300 font-medium group">
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              العودة إلى المعرض
            </a>
          </motion.div>
        </div>

        {/* Bottom decorative text */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="text-center mt-6 text-[11px] text-zinc-600 font-medium">
          محمي بتشفير آمن • Turso Database
        </motion.p>
      </motion.div>
    </div>
  );
}
