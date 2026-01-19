import React from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: 'right' | 'top' | 'bottom';
}

export const Tooltip: React.FC<TooltipProps> = ({ text, children, position = 'right' }) => {
  return (
    <div className="group relative flex items-center">
      {children}
      <div className={`absolute ${position === 'right' ? 'left-full ml-2' : 'bottom-full mb-2'} scale-0 transition-all rounded bg-black p-2 text-xs text-white group-hover:scale-100 whitespace-nowrap z-50 shadow-lg font-semibold`}>
        {text}
        {/* Triangle */}
        <div className={`absolute ${position === 'right' ? 'left-0 -ml-1 top-1/2 -translate-y-1/2 border-r-black border-r-4 border-y-4 border-y-transparent' : 'bottom-0 left-1/2 -translate-x-1/2 border-t-black border-t-4 border-x-4 border-x-transparent'} `}></div>
      </div>
    </div>
  );
};