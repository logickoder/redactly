import { type FC, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Save, X } from 'lucide-react';

interface SaveChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  defaultName: string;
}

const SaveChatModal: FC<SaveChatModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultName,
}) => {
  const [name, setName] = useState(defaultName);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(defaultName);
      setError('');
    }
  }, [isOpen, defaultName]);

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Name cannot be empty');
      return;
    }

    onSave(trimmedName);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ background: 'rgba(0,0,0,0.5)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="card-base w-full max-w-md overflow-hidden"
          >
            {/* Gradient header bar */}
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
                    <Save size={15} className="text-primary" />
                  </div>
                  <h3 className="text-text text-base font-semibold">
                    Save Conversation
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="text-text-muted rounded-lg p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mb-6">
                <label className="text-text mb-1.5 block text-sm font-medium">
                  Conversation Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-base w-full"
                  placeholder="Enter a name..."
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') onClose();
                  }}
                />
                {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
                <p className="text-text-muted mt-2 text-xs">
                  This will be saved locally to your History.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="text-text-muted rounded-xl px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="btn-gradient flex items-center gap-2 py-2 text-sm"
                >
                  <Save size={14} />
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SaveChatModal;
