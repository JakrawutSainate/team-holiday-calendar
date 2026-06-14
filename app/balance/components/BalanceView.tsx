'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/src/components/LanguageContext';
import TopNavBar from '@/src/components/TopNavBar';
import { HolidayHQManager, Transaction } from '@/src/libs/models/HolidayHQManager';
import { redeemTokensAction } from '../actions';

export default function BalanceView() {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tokens, setTokens] = useState(3);

  useEffect(() => {
    const manager = new HolidayHQManager();
    
    // Load transactions from localStorage or fallback
    const savedTx = localStorage.getItem('holidayhq_transactions');
    if (savedTx) {
      setTransactions(JSON.parse(savedTx));
    } else {
      const fallbackTx = manager.getTransactions();
      setTransactions(fallbackTx);
      localStorage.setItem('holidayhq_transactions', JSON.stringify(fallbackTx));
    }

    // Load tokens from localStorage
    const savedTokens = localStorage.getItem('holidayhq_tokens');
    if (savedTokens) {
      setTokens(parseFloat(savedTokens));
    } else {
      localStorage.setItem('holidayhq_tokens', '3');
    }
  }, []);

  const handleRedeem = async () => {
    if (tokens < 3) {
      alert(`Redeem failed: Insufficient tokens. You have ${tokens} tokens but you need at least 3 tokens to request leave.`);
      return;
    }

    const res = await redeemTokensAction({ tokensToRedeem: 3, reason: 'Redeemed Friday leave' });
    if (res.success) {
      const newTokens = tokens - 3;
      setTokens(newTokens);
      localStorage.setItem('holidayhq_tokens', newTokens.toString());

      // Prepend to transaction list
      const newTx: Transaction = {
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        type: 'SPEND',
        description: 'Redeemed Friday leave (Takahashi S.)',
        status: 'Approved',
        amount: '-3'
      };
      const updatedTx = [newTx, ...transactions];
      setTransactions(updatedTx);
      localStorage.setItem('holidayhq_transactions', JSON.stringify(updatedTx));

      alert('Leave requested successfully via Tokens!');
    } else {
      alert(`Redeem failed: ${res.error}`);
    }
  };

  return (
    <div className="grow flex flex-col min-h-screen lg:ml-64 bg-[#fcfcfc]">
      <TopNavBar placeholder={t('searchTransactions')} />

      <main className="flex-1 p-6 lg:p-12 pb-24 lg:pb-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-[1280px] mx-auto space-y-8">
          {/* Header */}
          <section className="space-y-2">
            <p className="text-sm text-zinc-500 font-medium">
              {t('accountOverview')}
            </p>
            <h2 className="text-4xl font-bold tracking-tight text-zinc-900">{t('tokenBalance')}</h2>
          </section>

          {/* Cards Grid */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-8 bg-white border border-zinc-100/80 rounded-2xl p-8 flex flex-col justify-between min-h-[300px] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <div>
                <span className="px-3.5 py-1.5 bg-zinc-50 text-zinc-800 border border-zinc-100 rounded-full text-sm font-semibold">
                  {t('activeBalance')}
                </span>
                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className="text-8xl font-bold leading-none tracking-tighter text-zinc-900">{tokens}</span>
                  <span className="text-lg font-semibold text-zinc-500">{t('tokens')}</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-6 border-t border-zinc-100/80">
                <p className="text-base text-zinc-500">{t('readyForUse')}</p>
                <button onClick={handleRedeem} className="px-7 py-3.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 active:scale-98 transition-all cursor-pointer shadow-sm">
                  {t('requestLeave')}
                </button>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-4 bg-white border border-zinc-100/80 rounded-2xl p-8 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-zinc-900">{t('howItWorks')}</h3>
                <div className="space-y-3 text-base text-zinc-600">
                  <p className="leading-relaxed"><strong>01</strong> {t('earnDaily')}: {t('earnDailyDesc')}</p>
                  <p className="leading-relaxed"><strong>02</strong> {t('redeemLeave')}: {t('redeemLeaveDesc')}</p>
                </div>
              </div>
              <div className="mt-6 p-4 bg-zinc-50/50 rounded-xl text-sm border border-zinc-100/60 text-zinc-500">
                <p className="italic">"{t('balanceResets')}"</p>
              </div>
            </div>
          </div>

          {/* History */}
          <div className="bg-white border border-zinc-100/80 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="px-8 py-5 border-b border-zinc-100">
              <h3 className="text-base font-semibold text-zinc-900">{t('transactionHistory')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/50 border-b border-zinc-100">
                    <th className="px-8 py-4 text-sm font-medium text-zinc-400">{t('tableDate')}</th>
                    <th className="px-8 py-4 text-sm font-medium text-zinc-400">{t('tableType')}</th>
                    <th className="px-8 py-4 text-sm font-medium text-zinc-400">{t('tableDesc')}</th>
                    <th className="px-8 py-4 text-sm font-medium text-zinc-400">{t('tableStatus')}</th>
                    <th className="px-8 py-4 text-sm font-medium text-zinc-400 text-right">{t('tableAmount')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {transactions.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/30 text-base text-zinc-800 transition-colors">
                      <td className="px-8 py-4.5">{tx.date}</td>
                      <td className="px-8 py-4.5 font-semibold text-zinc-900">{tx.type}</td>
                      <td className="px-8 py-4.5 text-zinc-600">{tx.description}</td>
                      <td className="px-8 py-4.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          tx.status === 'Approved' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-8 py-4.5 text-right font-bold text-zinc-900">{tx.amount}</td>
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
