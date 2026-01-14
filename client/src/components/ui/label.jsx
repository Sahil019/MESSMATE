import React from 'react';

export const Label = React.forwardRef(({ className = '', ...props }, ref) => {
  const baseClasses = 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70';

  return (
    <label
      ref={ref}
      className={`${baseClasses} ${className}`}
      {...props}
    />
  );
});

Label.displayName = 'Label';
