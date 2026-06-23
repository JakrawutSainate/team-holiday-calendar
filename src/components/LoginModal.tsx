'use client';

import React, { useState } from 'react';
import { Modal, Button } from '@heroui/react';
import { useAuth } from './AuthContext';
import { useTranslation } from './LanguageContext';
import { toast } from 'sonner';

export default function LoginModal() {
  const { isLoginOpen, closeLogin, login } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t('incompleteForm'), { description: t('enterEmailPass') });
      return;
    }

    setLoading(true);
    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      toast.success(t('loginSuccess'), { description: t('signedInSuccess') });
      setEmail('');
      setPassword('');
      closeLogin();
    } else {
      toast.error(t('loginFailed'), { description: res.error || t('invalidEmailPass') });
    }
  };

  const fillCredentials = (testEmail: string) => {
    setEmail(testEmail);
    setPassword('123456789aB');
  };

  const testAccounts = [
    { name: 'Admin', email: 'admin', role: 'Admin' },
    { name: 'Big', email: 'usr_big', role: 'Member' },
    { name: 'V', email: 'usr_v', role: 'Member' },
    { name: 'earth', email: 'usr_earth', role: 'Member' },
  ];

  if (!isLoginOpen) return null;

  return (
    <Modal isOpen={isLoginOpen} onOpenChange={(open) => !open && closeLogin()}>
      <Modal.Backdrop className="fixed inset-0 w-screen h-screen bg-zinc-950/40 backdrop-blur-md z-40" />
      <Modal.Container className="fixed inset-0 w-screen h-screen flex items-center justify-center p-4 z-50">
        <Modal.Dialog className="w-full max-w-lg bg-white border border-zinc-100 p-10 rounded-3xl shadow-2xl relative text-zinc-900 overflow-hidden outline-none">
          {/* Close Button */}
          <Modal.CloseTrigger onPress={closeLogin} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-all p-2 rounded-full cursor-pointer">
            <span className="material-symbols-outlined text-xl leading-none">close</span>
          </Modal.CloseTrigger>

          {/* Clean Light-mode Decorative Background Blur */}
          <div className="absolute top-[-20%] left-[-15%] w-[350px] h-[350px] rounded-full bg-zinc-100 blur-[80px] pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 space-y-8">
            <div className="text-center">
              <h3 className="text-4xl font-extrabold tracking-tighter text-zinc-950">
                HolidayHQ
              </h3>
              <p className="mt-2 text-zinc-500 text-sm">
                {t('loginSub')}
              </p>
            </div>

            <div className="space-y-6">
              <h4 className="text-xl font-bold tracking-tight text-zinc-900 border-b border-zinc-100 pb-3">
                {t('signInToAccount')}
              </h4>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                    {t('emailAddress')}
                  </label>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin, usr_big, usr_v, usr_earth"
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 focus:border-zinc-950 rounded-xl text-sm outline-none transition-all placeholder-zinc-400 text-zinc-900 shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                    {t('password')}
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 focus:border-zinc-950 rounded-xl text-sm outline-none transition-all placeholder-zinc-400 text-zinc-900 shadow-inner"
                  />
                </div>

                <Button
                  type="submit"
                  isDisabled={loading}
                  className="w-full py-4 mt-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl text-sm transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{t('signingIn')}</span>
                    </div>
                  ) : (
                    <span>{t('login')}</span>
                  )}
                </Button>
              </form>

              {/* Demo Accounts */}
              <div className="pt-6 border-t border-zinc-100 space-y-3">
                <p className="text-xs font-semibold text-zinc-500">
                  {t('quickDemoAccounts')}
                </p>
                <div className="grid grid-cols-1 gap-2.5">
                  {testAccounts.map((account) => (
                    <button
                      key={account.email}
                      onClick={() => fillCredentials(account.email)}
                      type="button"
                      className="flex items-center justify-between px-4 py-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/60 hover:border-zinc-300 rounded-xl text-xs text-left text-zinc-700 hover:text-zinc-900 transition-all cursor-pointer"
                    >
                      <div>
                        <span className="font-bold block">{account.name}</span>
                        <span className="text-[10px] text-zinc-500 block mt-0.5">{account.email}</span>
                      </div>
                      <span className="px-2 py-1 bg-zinc-100 border border-zinc-200/80 text-[10px] font-bold rounded text-zinc-600 capitalize">
                        {account.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Modal.Dialog>
      </Modal.Container>
    </Modal>
  );
}
