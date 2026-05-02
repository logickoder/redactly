import { type FC, useState } from 'react';
import { Save } from 'lucide-react';
import Modal from './Modal';

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Save Conversation"
      icon={<Save size={15} />}
    >
      <div className="mb-6">
        <label
          htmlFor="save-chat-name"
          className="text-text mb-1.5 block text-sm font-medium"
        >
          Conversation Name
        </label>
        <input
          id="save-chat-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-base w-full"
          placeholder="Enter a name..."
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
          }}
        />
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        <p className="text-text-muted mt-2 text-xs">
          This will be saved locally to your History.
        </p>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="text-text-muted rounded-xl px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="btn-gradient flex items-center gap-2 py-2 text-sm"
        >
          <Save size={14} />
          Save
        </button>
      </div>
    </Modal>
  );
};

export default SaveChatModal;
