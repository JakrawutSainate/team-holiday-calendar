'use client';

import { createContext, useContext, useRef, useState, useCallback, ReactNode } from 'react';

interface ConfirmOptions {
  title: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
}

interface ConfirmContextType {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ title: '' });
  const resolveRef = useRef<(v: boolean) => void>(() => {});

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setOpen(true);
    return new Promise((res) => {
      resolveRef.current = res;
    });
  }, []);

  const handleConfirm = () => { setOpen(false); resolveRef.current(true); };
  const handleCancel = () => { setOpen(false); resolveRef.current(false); };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {open && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm" onClick={handleCancel} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-zinc-100 max-w-sm w-full p-8 space-y-5 animate-fade-in">
            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-zinc-900">{options.title}</h3>
              {options.text && (
                <p className="text-sm text-zinc-500 leading-relaxed">{options.text}</p>
              )}
            </div>
            <div className="flex gap-3 justify-end pt-1">
              <button
                onClick={handleCancel}
                className="px-4 py-2.5 border border-zinc-200 text-zinc-600 rounded-xl text-sm font-semibold hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                {options.cancelText ?? 'Cancel'}
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer text-white ${
                  options.variant === 'danger'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-zinc-900 hover:bg-zinc-800'
                }`}
              >
                {options.confirmText ?? 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be inside ConfirmProvider');
  return ctx.confirm;
}
