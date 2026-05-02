import { type FC, useId, useMemo, useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import Modal from '../ui/Modal';

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
  const searchId = useId();
  const nameId = useId();
  const aliasId = useId();
  const saveMappingId = useId();

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Participant"
      icon={<UserPlus size={15} />}
    >
      <div className="space-y-4">
        {Object.keys(nameMap).length > 0 && (
          <div>
            <label
              htmlFor={searchId}
              className="text-text mb-1.5 block text-xs font-semibold tracking-wider uppercase"
            >
              From Saved Mappings
            </label>
            <div className="relative mb-2">
              <Search
                size={14}
                className="text-text-muted pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
              />
              <input
                id={searchId}
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
                    type="button"
                    className="hover:bg-primary/5 flex w-full items-center justify-between px-3 py-2 text-sm transition-colors"
                    onClick={() => selectSaved(n, a)}
                  >
                    <span className="text-text font-medium">{n}</span>
                    <span
                      className="text-primary rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{ background: 'var(--tint-primary)' }}
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
          <label
            htmlFor={nameId}
            className="text-text mb-1.5 block text-xs font-semibold tracking-wider uppercase"
          >
            {Object.keys(nameMap).length > 0
              ? 'Or Enter Manually'
              : 'Participant Name'}
          </label>
          <input
            id={nameId}
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
          <label
            htmlFor={aliasId}
            className="text-text mb-1.5 block text-xs font-semibold tracking-wider uppercase"
          >
            Alias
          </label>
          <input
            id={aliasId}
            className="input-base w-full"
            placeholder="e.g. User D"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <label
          htmlFor={saveMappingId}
          className="flex cursor-pointer items-center gap-2.5"
        >
          <input
            id={saveMappingId}
            type="checkbox"
            checked={saveMapping}
            onChange={(e) => setSaveMapping(e.target.checked)}
            className="accent-primary h-4 w-4 cursor-pointer rounded"
          />
          <span className="text-text text-sm">Save alias to my mappings</span>
        </label>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="text-text-muted rounded-xl px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleAdd}
          className="btn-gradient flex items-center gap-2 py-2 text-sm"
        >
          <UserPlus size={14} />
          Add Participant
        </button>
      </div>
    </Modal>
  );
};

export default AddParticipantModal;
