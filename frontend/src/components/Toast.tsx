import React from 'react';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'info' | 'error';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  if (!message) return null;

  const iconName = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';
  const iconColor = type === 'success' ? 'text-tertiary-fixed' : type === 'error' ? 'text-error-container' : 'text-primary-fixed';

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-inverse-surface text-inverse-on-surface shadow-2xl font-label-md text-label-md border border-inverse-on-surface/10 animate-in fade-in slide-in-from-bottom-3 duration-200">
      <span className={`material-symbols-outlined text-[18px] ${iconColor}`}>
        {iconName}
      </span>
      <span className="max-w-md truncate">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-inverse-on-surface/60 hover:text-inverse-on-surface"
      >
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  );
};
