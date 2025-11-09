'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'error' | 'success' | 'info';
  onClose: () => void;
}

export function Toast({ message, type = 'error', onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor =
    type === 'error'
      ? 'bg-destructive text-destructive-foreground'
      : type === 'success'
      ? 'bg-green-600 text-white'
      : 'bg-blue-600 text-white';

  return (
    <div
      className={`fixed bottom-4 right-4 ${bgColor} px-4 py-3 rounded-md shadow-lg z-50 flex items-center gap-2`}
      role="alert"
      aria-live="assertive"
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-white hover:text-gray-200"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type?: 'error' | 'success' | 'info' } | null>(null);

  const showToast = (message: string, type?: 'error' | 'success' | 'info') => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  return {
    toast,
    showToast,
    hideToast,
  };
}
