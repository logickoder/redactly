import React, { type FC, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import type { ToastMessage } from '../context/ToastContext';

interface ToastProps {
  toast: ToastMessage;
  remove: (id: string) => void;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  remove: (id: string) => void;
}

const toastVariants = {
  initial: { opacity: 0, y: -20, scale: 0.9 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.9, transition: { duration: 0.2 } },
};

const Toast: FC<ToastProps> = ({ toast, remove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      remove(toast.id);
    }, toast.duration);
    return () => clearTimeout(timer);
  }, [toast, remove]);
  const icons = {
    success: (
      <CheckCircle className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
    ),
    error: <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />,
    info: <Info className="h-5 w-5 text-blue-600 dark:text-blue-500" />,
  };
  const bgColors = {
    success:
      'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  };
  return (
    <motion.div
      layout
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`mb-3 flex w-full max-w-sm items-center rounded-lg border p-4 shadow-lg backdrop-blur-sm ${bgColors[toast.type]} `}
      role="alert"
    >
      <div className="shrink-0">{icons[toast.type]}</div>
      <div className="ml-3 flex-1 text-sm font-medium text-slate-900 dark:text-slate-100">
        {toast.message}
      </div>
      <button
        type="button"
        className="-mx-1.5 -my-1.5 ml-auto inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg p-1.5 text-slate-500 transition-colors hover:text-slate-900 focus:ring-2 focus:ring-slate-300 dark:text-slate-400 dark:hover:text-slate-100 dark:focus:ring-slate-600"
        onClick={() => remove(toast.id)}
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
};

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  remove,
}) => {
  return (
    <div className="pointer-events-none fixed top-4 right-4 z-50 flex w-full max-w-sm flex-col items-end">
      <div className="pointer-events-auto w-full">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <Toast key={toast.id} toast={toast} remove={remove} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Toast;
