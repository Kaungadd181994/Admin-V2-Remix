import React from 'react';
import { useData } from '../context/DataContext';

export const Toaster = () => {
  const { toasts } = useData();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-[100]">
      {toasts.map((t) => (
        <div key={t.id} className={`bg-panel-2 border p-3 text-[12.5px] min-w-[260px] shadow-[0_8px_20px_rgba(16,22,46,.12)] animate-toast-in ${t.kind === 'ok' ? 'border-success' : t.kind === 'warn' ? 'border-warning' : 'border-critical'}`}>
          <strong className="block text-[12px] mb-0.5">{t.title}</strong>
          {t.message}
        </div>
      ))}
    </div>
  );
};
