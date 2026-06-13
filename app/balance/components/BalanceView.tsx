'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/src/components/LanguageContext';
import TopNavBar from '@/src/components/TopNavBar';
import { HolidayHQManager, Transaction } from '@/src/libs/models/HolidayHQManager';
import { redeemTokensAction } from '../actions';

export default function BalanceView() {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const manager = new HolidayHQManager();
    setTransactions(manager.getTransactions());
  }, []);

  const handleRedeem = async () => {
    const res = await redeemTokensAction({ tokensToRedeem: 3, reason: 'Redeemed Friday leave' });
    if (res.success) alert('Leave requested successfully via Tokens!');
    else alert(`Redeem failed: ${res.error}`);
  };

  return (
    <div className="flex-grow flex flex-col min-h-screen ml-64">
      <TopNavBar placeholder={t('searchTransactions')} />

      <main className="flex-1 p-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-[1280px] mx-auto space-y-12">
          {/* Header */}
          <section>
            <p className="font-label-caps text-xs text-on-surface-variant mb-2 uppercase tracking-wider font-bold">
              {t('accountOverview')}
            </p>
            <h2 className="text-4xl font-bold tracking-tight text-primary">{t('tokenBalance')}</h2>
          </section>

          {/* Cards Grid */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-8 bg-white border border-outline-variant rounded-2xl p-8 flex flex-col justify-between min-h-[280px] shadow-sm">
              <div>
                <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full font-label-caps text-[10px] font-bold">
                  {t('activeBalance')}
                </span>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-8xl font-bold leading-none tracking-tighter text-primary">3</span>
                  <span className="text-xl font-bold text-secondary">{t('tokens')}</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-6 border-t border-outline-variant/30">
                <p className="text-sm text-secondary">{t('readyForUse')}</p>
                <button onClick={handleRedeem} className="px-6 py-3 bg-primary text-on-primary rounded-full font-label-caps text-xs font-bold hover:opacity-90 active:scale-95 transition-all cursor-pointer">
                  {t('requestLeave')}
                </button>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-4 bg-white border border-outline-variant text-on-surface rounded-2xl p-8 flex flex-col justify-between shadow-sm">
              <div className="space-y-4">
                <h3 className="font-label-caps text-xs tracking-widest font-bold text-primary">{t('howItWorks')}</h3>
                <div className="space-y-2 text-sm text-secondary">
                  <p><strong>01</strong> {t('earnDaily')}: {t('earnDailyDesc')}</p>
                  <p><strong>02</strong> {t('redeemLeave')}: {t('redeemLeaveDesc')}</p>
                </div>
              </div>
              <div className="mt-6 p-3 bg-surface-container rounded-xl text-xs border border-outline-variant text-secondary">
                <p className="italic">"{t('balanceResets')}"</p>
              </div>
            </div>
          </div>

          {/* History */}
          <div className="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
            <div className="px-8 py-4 border-b border-outline-variant flex items-center justify-between">
              <h3 className="font-label-caps text-xs text-primary font-bold tracking-wider">{t('transactionHistory')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low/50 border-b border-outline-variant">
                    <th className="px-8 py-4 font-label-caps text-[10px] text-secondary tracking-widest">{t('tableDate')}</th>
                    <th className="px-8 py-4 font-label-caps text-[10px] text-secondary tracking-widest">{t('tableType')}</th>
                    <th className="px-8 py-4 font-label-caps text-[10px] text-secondary tracking-widest">{t('tableDesc')}</th>
                    <th className="px-8 py-4 font-label-caps text-[10px] text-secondary tracking-widest">{t('tableStatus')}</th>
                    <th className="px-8 py-4 font-label-caps text-[10px] text-secondary text-right tracking-widest">{t('tableAmount')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {transactions.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-surface-container-low/30 text-sm">
                      <td className="px-8 py-4">{tx.date}</td>
                      <td className="px-8 py-4 font-semibold text-primary">{tx.type}</td>
                      <td className="px-8 py-4">{tx.description}</td>
                      <td className="px-8 py-4">{tx.status}</td>
                      <td className="px-8 py-4 text-right font-bold">{tx.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
