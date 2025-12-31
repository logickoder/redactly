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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-slate-800"
          >
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Save Conversation
                </h3>
                <button
                  onClick={onClose}
                  className="text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Conversation Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  placeholder="Enter a name..."
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') onClose();
                  }}
                />
                {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  This will be saved to your local history.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  <Save size={16} className="mr-2" />
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
