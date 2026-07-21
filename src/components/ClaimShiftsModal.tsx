'use client';

import { useState } from 'react';
import { useTranslation } from '@/src/components/LanguageContext';
import { claimShiftMutation } from '@/src/libs/calendarData';

interface ClaimShiftsModalProps {
  isOpen: boolean;
  onClose: () => void;
  unclaimedShifts: { date: string; type: 'WEEKEND_WORK' | 'HOLIDAY_WORK'; title: string; dayName: string }[];
  onClaimSuccess: () => void;
}

export default function ClaimShiftsModal({
  isOpen,
  onClose,
  unclaimedShifts,
  onClaimSuccess,
}: ClaimShiftsModalProps) {
  const { t } = useTranslation();
  const [claimingDates, setClaimingDates] = useState<Record<string, boolean>>({});
  const [isClaimingAll, setIsClaimingAll] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClaimSingle = async (shift: { date: string; type: string; title: string }) => {
    setClaimingDates((prev) => ({ ...prev, [shift.date]: true }));
    setErrorMsg(null);
    try {
      await claimShiftMutation(shift.date, shift.type, `Claimed ${shift.title}`);
      onClaimSuccess();
    } catch (err: any) {
      console.error('Failed to claim shift:', err);
      setErrorMsg(err.message || 'Failed to claim shift');
    } finally {
      setClaimingDates((prev) => ({ ...prev, [shift.date]: false }));
    }
  };

  const handleClaimAll = async () => {
    if (unclaimedShifts.length === 0) return;
    setIsClaimingAll(true);
    setErrorMsg(null);
    try {
      await Promise.all(
        unclaimedShifts.map((shift) =>
          claimShiftMutation(shift.date, shift.type, `Claimed ${shift.title}`)
        )
      );
      onClaimSuccess();
    } catch (err: any) {
      console.error('Failed to claim all shifts:', err);
      setErrorMsg(err.message || 'Failed to claim all shifts');
    } finally {
      setIsClaimingAll(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-zinc-100 flex flex-col max-h-[85vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-100">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500 font-bold">military_tech</span>
              {t('unclaimedShiftsModalTitle')}
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              {t('unclaimedShiftsModalSubtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-all"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Action Header */}
        {unclaimedShifts.length > 0 && (
          <div className="flex items-center justify-between py-3 px-4 bg-amber-500/10 rounded-2xl my-4 border border-amber-500/20">
            <span className="text-xs font-semibold text-amber-900">
              {t('unclaimedShiftsCount').replace('{count}', unclaimedShifts.length.toString())}
            </span>
            <button
              onClick={handleClaimAll}
              disabled={isClaimingAll}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {isClaimingAll ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                  <span>{t('claiming')}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">bolt</span>
                  <span>{t('claimAll').replace('{count}', unclaimedShifts.length.toString())}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 mb-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* List of unclaimed shifts */}
        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar py-2">
          {unclaimedShifts.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center text-zinc-400">
              <span className="material-symbols-outlined text-5xl mb-2 text-emerald-500">task_alt</span>
              <p className="text-sm font-semibold text-zinc-700">{t('noUnclaimedShifts')}</p>
            </div>
          ) : (
            unclaimedShifts.map((shift) => {
              const isClaimingThis = claimingDates[shift.date] || isClaimingAll;
              return (
                <div
                  key={shift.date}
                  className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-200/80 rounded-2xl hover:border-amber-300 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 font-bold text-xs">
                      {shift.type === 'HOLIDAY_WORK' ? '🎉' : '📅'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-zinc-900">{shift.date}</span>
                        <span className="text-xs text-zinc-500 font-medium">({shift.dayName})</span>
                      </div>
                      <p className="text-xs text-zinc-500 font-medium mt-0.5">{shift.title}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleClaimSingle(shift)}
                    disabled={isClaimingThis}
                    className="px-3.5 py-1.5 bg-white border border-amber-500/40 text-amber-700 hover:bg-amber-500 hover:text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                  >
                    {isClaimingThis ? (
                      <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm font-bold">add_circle</span>
                        <span>{t('claimShift')} (+1)</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-zinc-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
