'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/src/components/LanguageContext';
import { useAuth } from '@/src/components/AuthContext';
import TopNavBar from '@/src/components/TopNavBar';
import { Transaction } from '@/src/libs/calendarData';
import { redeemTokensAction } from '../actions';
import { BalanceController } from './BalanceController';
import { toast } from 'sonner';
import { useConfirm } from '@/src/components/ConfirmDialog';
import { useRealtimeSync } from '@/src/hooks/useRealtimeSync';
import BalanceSkeleton from '@/src/components/skeletons/BalanceSkeleton';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';

import BalanceHeader from './BalanceHeader';
import BalanceCard from './BalanceCard';
import HowItWorksCard from './HowItWorksCard';
import TransactionHistoryTable from './TransactionHistoryTable';

interface BalanceClientProps {
  initialTokens: number;
  initialTransactions: Transaction[];
}

export default function BalanceClient({ initialTokens, initialTransactions }: BalanceClientProps) {
  const { t, language } = useTranslation();
  const { user, refreshUser } = useAuth();
  const confirm = useConfirm();
  const [, setTick] = useState(0);

  const [controller] = useState(() => new BalanceController(
    initialTokens,
    initialTransactions,
    () => setTick((tick) => tick + 1),
    user?.id || ''
  ));

  useEffect(() => {
    if (user?.id) {
      controller.setUserId(user.id);
      controller.loadState(user.id);
    } else {
      controller.loadState();
    }
  }, [controller, user?.id]);

  useRealtimeSync(() => controller.loadState(user?.id));

  const handleRedeem = async () => {
    if (!user) {
      toast.warning(
        language === 'th' ? 'กรุณาเข้าสู่ระบบ' : 'Authentication Required',
        { description: language === 'th' ? 'กรุณาเข้าสู่ระบบเพื่อทำรายการแลกเปลี่ยนโทเค็น' : 'Please sign in to redeem tokens.' }
      );
      return;
    }

    const ok = await confirm({
      title: language === 'th' ? 'แลกเปลี่ยนโทเค็น?' : 'Redeem Tokens?',
      text: language === 'th'
        ? 'ต้องการแลกเปลี่ยน 1 โทเค็นเพื่อทบยอด/ถอนเงินใช่หรือไม่?'
        : 'Do you want to redeem 1 token for rollover/payout?',
      confirmText: language === 'th' ? 'ยืนยัน' : 'Confirm',
      cancelText: t('cancel') || 'Cancel',
    });

    if (ok) {
      try {
        const message = await controller.redeemTokens(1, redeemTokensAction);
        if (refreshUser) await refreshUser();
        await controller.loadState(user.id);
        toast.success(language === 'th' ? 'ดำเนินการสำเร็จ' : 'Success', { description: message });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        toast.error(language === 'th' ? 'ล้มเหลว' : 'Failed', { description: message });
      }
    }
  };

  const displayTokens = user?.role === 'ADMIN' ? '---' : (user ? Math.floor(user.tokensBalance) : controller.getTokens());

  if (controller.isLoading() && controller.getTransactions().length === 0) {
    return <BalanceSkeleton />;
  }

  return (
    <ErrorBoundary>
    <div className="grow flex flex-col min-h-screen lg:ml-64 bg-background">
      <TopNavBar placeholder={t('searchTransactions')} />

      <main className="flex-1 p-6 lg:p-12 pb-24 lg:pb-12 overflow-y-auto custom-scrollbar animate-fade-in">
        <div className="max-w-[1280px] mx-auto space-y-8">
          {/* Header */}
          <BalanceHeader />

          {/* Cards Grid */}
          <div className="grid grid-cols-12 gap-6">
            <BalanceCard tokens={displayTokens} onRedeem={handleRedeem} />
            <HowItWorksCard />
          </div>

          {/* History */}
          <TransactionHistoryTable transactions={controller.getTransactions()} />
        </div>
      </main>
    </div>
    </ErrorBoundary>
  );
}
