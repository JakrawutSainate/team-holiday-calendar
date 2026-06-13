'use client';

import TopNavBar from '@/src/components/TopNavBar';

export default function BalancePage() {
  const transactions = [
    {
      date: 'Oct 24, 2026',
      type: 'EARN',
      description: 'Weekend Coverage (Sat-Sun)',
      status: 'Approved',
      amount: '+1',
    },
    {
      date: 'Oct 12, 2026',
      type: 'SPEND',
      description: 'Friday Long Weekend Request',
      status: 'Approved',
      amount: '-3',
    },
    {
      date: 'Oct 01, 2026',
      type: 'EARN',
      description: 'Weekend Coverage (Sun)',
      status: 'Approved',
      amount: '+1',
    },
    {
      date: 'Sep 28, 2026',
      type: 'EARN',
      description: 'Overtime Bonus',
      status: 'Pending',
      amount: '+1',
    },
  ];

  return (
    <div className="flex-grow flex flex-col min-h-screen">
      <TopNavBar placeholder="Search transactions..." />

      <main className="flex-1 p-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-[1280px] mx-auto">
          {/* Page Header */}
          <section className="mb-12">
            <p className="font-label-caps text-xs text-on-surface-variant mb-2 uppercase tracking-wider font-bold">
              ACCOUNT OVERVIEW
            </p>
            <h2 className="text-4xl font-bold tracking-tight text-primary">Token Balance</h2>
          </section>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-12 gap-6 mb-12">
            {/* Token Wallet Card (Large) */}
            <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 flex flex-col justify-between min-h-[320px] transition-all hover:border-outline">
              <div className="flex justify-between items-start">
                <div>
                  <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full font-label-caps text-[10px] font-bold">
                    ACTIVE BALANCE
                  </span>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-8xl font-bold leading-none tracking-tighter text-primary">3</span>
                    <span className="text-xl font-bold text-secondary">Tokens</span>
                  </div>
                </div>
                <div className="w-32 h-32 opacity-10 text-primary">
                  <span className="material-symbols-outlined text-[128px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    account_balance_wallet
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-8 border-t border-outline-variant/30">
                <p className="text-sm text-secondary max-w-xs">
                  Your tokens are ready for use. You can book a Friday off for 3 tokens.
                </p>
                <button className="px-6 py-3 bg-primary text-on-primary rounded-full font-label-caps text-xs font-bold hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 cursor-pointer">
                  Request Leave <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>

            {/* How it Works Card */}
            <div className="col-span-12 lg:col-span-4 bg-primary text-on-primary rounded-2xl p-8 flex flex-col justify-between transition-all hover:scale-[1.01]">
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <span className="material-symbols-outlined text-on-primary/60">info</span>
                  <h3 className="font-label-caps text-xs tracking-widest font-bold">HOW IT WORKS</h3>
                </div>
                <div className="space-y-4 py-2">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full border border-on-primary/20 flex items-center justify-center shrink-0 text-xs font-bold">
                      01
                    </div>
                    <div>
                      <p className="text-base font-bold mb-1">Earn Daily</p>
                      <p className="text-xs text-on-primary/70">Work a weekend shift to automatically earn 1 Token.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full border border-on-primary/20 flex items-center justify-center shrink-0 text-xs font-bold">
                      02
                    </div>
                    <div>
                      <p className="text-base font-bold mb-1">Redeem Leave</p>
                      <p className="text-xs text-on-primary/70">Redeem 3 Tokens to claim a Friday/Monday leave.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 p-3 bg-on-primary/10 rounded-xl border border-on-primary/10">
                <p className="text-xs italic opacity-85">"Balance resets annually on Jan 1st."</p>
              </div>
            </div>
          </div>

          {/* Transaction History Table */}
          <div className="col-span-12 bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden">
            <div className="px-8 py-4 border-b border-outline-variant flex items-center justify-between">
              <h3 className="font-label-caps text-xs text-primary font-bold tracking-wider">TRANSACTION HISTORY</h3>
              <button className="text-xs font-label-caps text-secondary hover:text-primary transition-colors cursor-pointer font-bold tracking-wider">
                EXPORT AS PDF
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low/50">
                    <th className="px-8 py-4 font-label-caps text-[10px] text-secondary tracking-widest">DATE</th>
                    <th className="px-8 py-4 font-label-caps text-[10px] text-secondary tracking-widest">TYPE</th>
                    <th className="px-8 py-4 font-label-caps text-[10px] text-secondary tracking-widest">DESCRIPTION</th>
                    <th className="px-8 py-4 font-label-caps text-[10px] text-secondary tracking-widest">STATUS</th>
                    <th className="px-8 py-4 font-label-caps text-[10px] text-secondary text-right tracking-widest">AMOUNT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {transactions.map((tx, idx) => {
                    const isEarn = tx.type === 'EARN';
                    const isPending = tx.status === 'Pending';
                    return (
                      <tr
                        key={idx}
                        className="transition-all duration-200 ease-out hover:translate-x-1 hover:bg-surface-container-low/30 group cursor-pointer"
                      >
                        <td className="px-8 py-4 text-sm font-medium text-on-surface">{tx.date}</td>
                        <td className="px-8 py-4">
                          <span
                            className={`px-2.5 py-0.5 text-[9px] font-bold rounded-full border ${
                              isEarn
                                ? 'bg-[#f0fdf4] text-[#166534] border-[#bbf7d0]'
                                : 'bg-[#fffbeb] text-[#92400e] border-[#fde68a]'
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="px-8 py-4 text-sm text-on-surface">{tx.description}</td>
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-on-primary-container">
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${
                                isPending ? 'bg-amber-500 animate-pulse' : 'bg-green-600'
                              }`}
                            ></div>
                            {tx.status}
                          </div>
                        </td>
                        <td
                          className={`px-8 py-4 text-sm font-bold text-right ${
                            isEarn ? 'text-primary' : 'text-error'
                          }`}
                        >
                          {tx.amount}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-8 py-4 bg-surface-container-lowest border-t border-outline-variant/30 flex justify-center">
              <button className="font-label-caps text-[10px] text-secondary hover:text-primary tracking-widest transition-colors font-bold cursor-pointer">
                VIEW FULL ARCHIVE
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
