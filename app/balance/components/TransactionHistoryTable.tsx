'use client';

import { useTranslation } from '@/src/components/LanguageContext';
import { Transaction } from '@/src/libs/models/HolidayHQManager';

interface TransactionHistoryTableProps {
  transactions: Transaction[];
}

export default function TransactionHistoryTable({ transactions }: TransactionHistoryTableProps) {
  const { t } = useTranslation();

  return (
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
  );
}
