'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/components/AuthContext';
import { useTranslation } from '@/src/components/LanguageContext';
import Swal from 'sweetalert2';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { language } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      Swal.fire({
        title: language === 'th' ? 'กรุณากรอกข้อมูลให้ครบถ้วน' : 'Incomplete Form',
        text: language === 'th' ? 'กรุณากรอกอีเมลและรหัสผ่าน' : 'Please enter email and password.',
        icon: 'error',
        confirmButtonColor: '#09090b',
      });
      return;
    }

    setLoading(true);
    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      Swal.fire({
        title: language === 'th' ? 'เข้าสู่ระบบสำเร็จ' : 'Welcome back!',
        text: language === 'th' ? 'กำลังนำคุณไปที่หน้าปฏิทิน...' : 'Redirecting to your calendar...',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
      setTimeout(() => {
        router.push('/calendar');
      }, 1000);
    } else {
      Swal.fire({
        title: language === 'th' ? 'ข้อมูลไม่ถูกต้อง' : 'Login Failed',
        text: res.error || (language === 'th' ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' : 'Invalid email or password.'),
        icon: 'error',
        confirmButtonColor: '#09090b',
      });
    }
  };

  const fillCredentials = (testEmail: string) => {
    setEmail(testEmail);
    setPassword('password123');
  };

  const testAccounts = [
    { name: 'Takahashi S.', email: 'takahashi.s@holidayhq.com', role: 'Lead & Admin' },
    { name: 'Alex Rivera', email: 'alex.rivera@holidayhq.com', role: 'Admin' },
    { name: 'Sarah Chen', email: 'sarah.chen@holidayhq.com', role: 'Member' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-50 px-4 py-12 relative overflow-hidden">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-zinc-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-8">
        {/* Header Logo */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tighter bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
            HolidayHQ
          </h1>
          <p className="mt-2 text-zinc-400 text-sm">
            {language === 'th' ? 'ระบบการจัดการวันลาและสิทธิ์กะเวรของคุณ' : 'Manage your leaves, shifts, and token balances'}
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 p-8 rounded-3xl shadow-2xl space-y-6">
          <h2 className="text-xl font-bold tracking-tight text-zinc-100">
            {language === 'th' ? 'เข้าสู่ระบบบัญชีของคุณ' : 'Sign in to your account'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                {language === 'th' ? 'ที่อยู่อีเมล' : 'Email Address'}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@holidayhq.com"
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-zinc-500 rounded-xl text-sm outline-none transition-all placeholder-zinc-700 text-zinc-100 shadow-inner"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                {language === 'th' ? 'รหัสผ่าน' : 'Password'}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-zinc-500 rounded-xl text-sm outline-none transition-all placeholder-zinc-700 text-zinc-100 shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-zinc-100 hover:bg-zinc-200 disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-600 font-bold rounded-xl text-sm transition-all shadow-md active:scale-[0.98] cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  <span>{language === 'th' ? 'กำลังลงทะเบียนเข้าสู่ระบบ...' : 'Signing In...'}</span>
                </div>
              ) : (
                <span>{language === 'th' ? 'ลงชื่อเข้าใช้' : 'Sign In'}</span>
              )}
            </button>
          </form>

          {/* Quick-test accounts seeder */}
          <div className="pt-6 border-t border-zinc-800/80 space-y-3">
            <p className="text-xs font-semibold text-zinc-500">
              {language === 'th' ? 'บัญชีทดสอบด่วน (คลิกเพื่อเลือก):' : 'Quick Demo Accounts (click to autofill):'}
            </p>
            <div className="grid grid-cols-1 gap-2">
              {testAccounts.map((account) => (
                <button
                  key={account.email}
                  onClick={() => fillCredentials(account.email)}
                  type="button"
                  className="flex items-center justify-between px-3 py-2 bg-zinc-950/40 hover:bg-zinc-950 border border-zinc-800/50 hover:border-zinc-700 rounded-xl text-xs text-left text-zinc-300 hover:text-zinc-50 transition-all cursor-pointer"
                >
                  <div>
                    <span className="font-bold">{account.name}</span>
                    <span className="text-[10px] text-zinc-500 block">{account.email}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-[10px] font-bold rounded-md text-zinc-400 capitalize">
                    {account.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <button
            onClick={() => router.push('/calendar')}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
          >
            ← {language === 'th' ? 'กลับไปที่ปฏิทิน' : 'Back to Calendar View'}
          </button>
        </div>
      </div>
    </div>
  );
}
