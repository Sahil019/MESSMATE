import React from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export const Toaster = ({ toasts, dismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  const getIcon = (variant) => {
    switch (variant) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'destructive':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStyles = (variant) => {
    switch (variant) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'destructive':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`max-w-sm w-full p-4 rounded-lg border shadow-lg transition-all duration-300 ${getStyles(toast.variant)}`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getIcon(toast.variant)}
            </div>
            <div className="ml-3 w-0 flex-1">
              {toast.title && (
                <p className="text-sm font-medium">
                  {toast.title}
                </p>
              )}
              {toast.description && (
                <p className="mt-1 text-sm opacity-90">
                  {toast.description}
                </p>
              )}
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                onClick={() => dismiss(toast.id)}
                className="inline-flex opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
