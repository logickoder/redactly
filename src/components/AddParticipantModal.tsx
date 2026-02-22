import { type FC, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, UserPlus, X } from 'lucide-react';

interface AddParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, alias: string, save: boolean) => void;
  nameMap: Record<string, string>;
  existingParticipants: string[];
  nextAliasLabel: string;
}

const AddParticipantModal: FC<AddParticipantModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  nameMap,
  existingParticipants,
  nextAliasLabel,
}) => {
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [alias, setAlias] = useState(nextAliasLabel);
  const [saveMapping, setSaveMapping] = useState(false);
  const [error, setError] = useState('');

  const savedSuggestions = useMemo(() => {
    const query = search.toLowerCase().trim();
    return Object.entries(nameMap).filter(
      ([n]) =>
        !existingParticipants.includes(n) &&
        (!query || n.toLowerCase().includes(query)),
    );
  }, [nameMap, search, existingParticipants]);

  const selectSaved = (savedName: string, savedAlias: string) => {
    setName(savedName);
    setAlias(savedAlias);
    setSaveMapping(false);
    setSearch('');
  };

  const handleAdd = () => {
    const trimmedName = name.trim();
    const trimmedAlias = alias.trim();
    if (!trimmedName) {
      setError('Participant name is required');
      return;
    }
    if (!trimmedAlias) {
      setError('Alias is required');
      return;
    }
    if (existingParticipants.includes(trimmedName)) {
      setError('This participant has already been added');
      return;
    }
    onAdd(trimmedName, trimmedAlias, saveMapping);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="card-base w-full max-w-md overflow-hidden"
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
                    <UserPlus size={15} className="text-primary" />
                  </div>
                  <h3 className="text-text text-base font-semibold">
                    Add Participant
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="text-text-muted rounded-lg p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                {Object.keys(nameMap).length > 0 && (
                  <div>
                    <label className="text-text mb-1.5 block text-xs font-semibold tracking-wider uppercase">
                      From Saved Mappings
                    </label>
                    <div className="relative mb-2">
                      <Search
                        size={14}
                        className="text-text-muted pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
                      />
                      <input
                        className="input-base w-full"
                        style={{ paddingLeft: '2.25rem' }}
                        placeholder="Search saved names…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    {savedSuggestions.length > 0 ? (
                      <div
                        className="max-h-32 overflow-y-auto rounded-xl border"
                        style={{ borderColor: 'var(--color-border)' }}
                      >
                        {savedSuggestions.map(([n, a]) => (
                          <button
                            key={n}
                            className="hover:bg-primary/5 flex w-full items-center justify-between px-3 py-2 text-sm transition-colors"
                            onClick={() => selectSaved(n, a)}
                          >
                            <span className="text-text font-medium">{n}</span>
                            <span
                              className="text-primary rounded-full px-2 py-0.5 text-xs font-semibold"
                              style={{ background: 'rgba(99,102,241,0.1)' }}
                            >
                              {a}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      search && (
                        <p className="text-text-muted text-xs">
                          No saved participants match "{search}"
                        </p>
                      )
                    )}
                  </div>
                )}

                <div>
                  <label className="text-text mb-1.5 block text-xs font-semibold tracking-wider uppercase">
                    {Object.keys(nameMap).length > 0
                      ? 'Or Enter Manually'
                      : 'Participant Name'}
                  </label>
                  <input
                    className="input-base w-full"
                    placeholder="Name as it appears in the chat…"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError('');
                    }}
                  />
                </div>

                <div>
                  <label className="text-text mb-1.5 block text-xs font-semibold tracking-wider uppercase">
                    Alias
                  </label>
                  <input
                    className="input-base w-full"
                    placeholder="e.g. User D"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                  />
                </div>

                {error && <p className="text-xs text-red-500">{error}</p>}

                <label className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={saveMapping}
                    onChange={(e) => setSaveMapping(e.target.checked)}
                    className="accent-primary h-4 w-4 cursor-pointer rounded"
                  />
                  <span className="text-text text-sm">
                    Save alias to my mappings
                  </span>
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="text-text-muted rounded-xl px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  className="btn-gradient flex items-center gap-2 py-2 text-sm"
                >
                  <UserPlus size={14} />
                  Add Participant
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddParticipantModal;
