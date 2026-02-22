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
  initial: { opacity: 0, x: 48, scale: 0.94 },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
  exit: { opacity: 0, x: 48, scale: 0.94, transition: { duration: 0.2 } },
};

const config = {
  success: {
    icon: <CheckCircle className="h-4 w-4" style={{ color: '#10B981' }} />,
    accent: '#10B981',
    label: 'Success',
  },
  error: {
    icon: <AlertCircle className="h-4 w-4" style={{ color: '#EF4444' }} />,
    accent: '#EF4444',
    label: 'Error',
  },
  info: {
    icon: <Info className="h-4 w-4" style={{ color: '#6366F1' }} />,
    accent: '#6366F1',
    label: 'Info',
  },
};

const Toast: FC<ToastProps> = ({ toast, remove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      remove(toast.id);
    }, toast.duration);
    return () => clearTimeout(timer);
  }, [toast, remove]);

  const { icon, accent } = config[toast.type];

  return (
    <motion.div
      layout
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="mb-2.5 flex w-full max-w-sm items-center overflow-hidden rounded-xl shadow-lg"
      style={{
        backgroundColor: 'var(--color-card)',
        border: `1px solid ${accent}30`,
        borderLeft: `3px solid ${accent}`,
      }}
      role="alert"
    >
      <div className="flex flex-1 items-center gap-3 p-4">
        <div className="shrink-0">{icon}</div>
        <p className="text-text flex-1 text-sm leading-snug font-medium">
          {toast.message}
        </p>
        <button
          type="button"
          className="text-text-muted -my-1 -mr-1 ml-2 shrink-0 rounded-lg p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
          onClick={() => remove(toast.id)}
          aria-label="Close"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
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
