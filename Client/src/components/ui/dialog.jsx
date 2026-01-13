import React, { useEffect } from 'react';

export const Dialog = ({ open, onOpenChange, children }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      {/* Dialog content will be rendered by DialogContent */}
      {children}
    </div>
  );
};

export const DialogContent = ({ className = '', children, ...props }) => {
  return (
    <div
      className={`relative z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const DialogHeader = ({ className = '', children, ...props }) => {
  return (
    <div
      className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const DialogTitle = ({ className = '', children, ...props }) => {
  return (
    <h3
      className={`text-lg font-semibold leading-none tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
};
