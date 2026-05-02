import { type FC, type ReactNode, useId, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: ReactNode;
  children: ReactNode;
}

const Modal: FC<ModalProps> = ({ isOpen, onClose, title, icon, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useFocusTrap(isOpen, ref, onClose);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
          role="presentation"
        >
          <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.93, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="card-base w-full max-w-md overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <div
              className="h-1 w-full"
              style={{
                backgroundImage: 'linear-gradient(90deg, #6366F1, #8B5CF6)',
              }}
            />

            <div className="p-6">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{
                      backgroundImage:
                        'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))',
                    }}
                  >
                    <span className="text-primary">{icon}</span>
                  </div>
                  <h3 id={titleId} className="text-text text-base font-semibold">
                    {title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="text-text-muted rounded-lg p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>

              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
