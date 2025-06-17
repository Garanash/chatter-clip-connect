
import React from 'react';
import { CSpinner } from '@coreui/react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'border' | 'grow';
  className?: string;
}

export const Spinner = ({ size = 'md', variant = 'border', className = '' }: SpinnerProps) => {
  const getSize = () => {
    switch (size) {
      case 'sm': return { width: '1.5rem', height: '1.5rem' };
      case 'lg': return { width: '3rem', height: '3rem' };
      default: return { width: '2rem', height: '2rem' };
    }
  };

  return (
    <CSpinner 
      variant={variant} 
      style={getSize()} 
      className={className}
    />
  );
};

export const LoadingSpinner = ({ message = 'Загрузка...' }: { message?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <Spinner size="lg" />
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  );
};
