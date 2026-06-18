'use client';

import { useEffect, useState, useRef } from 'react';
import { useTranslation } from '@/src/components/LanguageContext';
import TopNavBar from '@/src/components/TopNavBar';
import { Transaction } from '@/src/libs/calendarData';
import { redeemTokensAction } from '../actions';
import { BalanceController } from './BalanceController';

import BalanceHeader from './BalanceHeader';
import BalanceCard from './BalanceCard';
import HowItWorksCard from './HowItWorksCard';
import TransactionHistoryTable from './TransactionHistoryTable';

interface BalanceClientProps {
  initialTokens: number;
  initialTransactions: Transaction[];
}

export default function BalanceClient({ initialTokens, initialTransactions }: BalanceClientProps) {
  const { t } = useTranslation();
  const [, setTick] = useState(0);

  const [controller] = useState(() => new BalanceController(
    initialTokens,
    initialTransactions,
    () => setTick((tick) => tick + 1)
  ));

  useEffect(() => {
    controller.loadState();
  }, [controller]);

  const handleRedeem = async () => {
    try {
      const message = await controller.redeemTokens(1, redeemTokensAction);
      alert(message);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert(`Redeem failed: ${message}`);
    }
  };

  return (
    <div className="grow flex flex-col min-h-screen lg:ml-64 bg-background">
      <TopNavBar placeholder={t('searchTransactions')} />

      <main className="flex-1 p-6 lg:p-12 pb-24 lg:pb-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-[1280px] mx-auto space-y-8">
          {/* Header */}
          <BalanceHeader />

          {/* Cards Grid */}
          <div className="grid grid-cols-12 gap-6">
            <BalanceCard tokens={controller.getTokens()} onRedeem={handleRedeem} />
            <HowItWorksCard />
          </div>

          {/* History */}
          <TransactionHistoryTable transactions={controller.getTransactions()} />
        </div>
      </main>
    </div>
  );
}
