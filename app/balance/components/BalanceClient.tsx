'use client';

import { useEffect, useState, useRef } from 'react';
import { useTranslation } from '@/src/components/LanguageContext';
import TopNavBar from '@/src/components/TopNavBar';
import { Transaction } from '@/src/libs/models/HolidayHQManager';
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

  // Maintain instance of controller inside ref to persist across renders
  const controllerRef = useRef<BalanceController | null>(null);

  if (!controllerRef.current) {
    controllerRef.current = new BalanceController(
      initialTokens,
      initialTransactions,
      () => setTick((tick) => tick + 1)
    );
  }

  const controller = controllerRef.current;

  useEffect(() => {
    controller.loadState();
  }, [controller]);

  const handleRedeem = async () => {
    try {
      const message = await controller.redeem(redeemTokensAction);
      alert(message);
    } catch (err: any) {
      alert(`Redeem failed: ${err.message}`);
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
