import React from 'react';

interface LoadingProps {
  message?: string;
  size?: 'small' | 'large';
}

export const Loading: React.FC<LoadingProps> = ({ message, size = 'large' }) => {
  const spinnerSize = size === 'large' ? 'h-12 w-12' : 'h-6 w-6';

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-6">
      <div
        className={`${spinnerSize} border-4 border-blue-600 border-t-transparent rounded-full animate-spin`}
      ></div>
      {message && (
        <p className="mt-4 text-base text-center text-slate-600">
          {message}
        </p>
      )}
    </div>
  );
};
