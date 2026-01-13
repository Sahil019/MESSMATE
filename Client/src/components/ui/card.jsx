import React from 'react';

export const Card = ({ children, className = '', ...props }) => {
  return (
    <div className={`bg-card border border-border rounded-lg shadow-sm ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div className={`p-6 pb-0 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardTitle = ({ children, className = '', ...props }) => {
  return (
    <h3 className={`text-lg font-semibold ${className}`} {...props}>
      {children}
    </h3>
  );
};

export const CardContent = ({ children, className = '', ...props }) => {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardDescription = ({ children, className = '', ...props }) => {
  return (
    <p className={`text-sm text-gray-600 dark:text-gray-300 ${className}`} {...props}>
      {children}
    </p>
  );
};
