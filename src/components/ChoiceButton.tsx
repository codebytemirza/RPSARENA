import { motion } from 'motion/react';
import React, { ReactNode } from 'react';

export function ChoiceButton({
  icon,
  label,
  onClick,
  disabled,
  active
}: {
  key?: React.Key;
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled: boolean;
  active?: boolean;
}) {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        w-[100px] h-[100px] rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all
        ${active 
          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
          : disabled 
            ? 'opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600' 
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:border-indigo-600 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer shadow-sm hover:shadow-md'
        }
      `}
    >
      <div className="[&>svg]:w-8 [&>svg]:h-8">
        {icon}
      </div>
      <span className="text-[0.7rem] font-semibold tracking-wider uppercase">{label}</span>
    </motion.button>
  );
}
