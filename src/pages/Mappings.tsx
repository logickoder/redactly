import { type FC, useCallback, useMemo, useState } from 'react';
import { useAppSettings } from '../hooks/useStore';
import { Edit2, Save, Search, Trash2, Users, X } from 'lucide-react';
import { motion } from 'framer-motion';

const Mappings: FC = () => {
  const { nameMap, updateNameMap, deleteNameMapping } = useAppSettings();

  const [searchTerm, setSearchTerm] = useState('');
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const mappings = useMemo(() => {
    const entries = Object.entries(nameMap);
    const query = searchTerm.toLowerCase().trim();

    if (!query) {
      return entries;
    }

    return entries.filter(
      ([name, alias]) =>
        name.toLowerCase().includes(query) ||
        alias.toLowerCase().includes(query),
    );
  }, [nameMap, searchTerm]);

  const hasMappings = useMemo(() => Object.keys(nameMap).length > 0, [nameMap]);

  const startEditing = useCallback((name: string, alias: string) => {
    setEditingName(name);
    setEditValue(alias);
  }, []);

  const saveEdit = () => {
    if (editingName && editValue.trim()) {
      updateNameMap(editingName, editValue.trim());
      setEditingName(null);
      setEditValue('');
    }
  };

  const cancelEdit = useCallback(() => {
    setEditingName(null);
    setEditValue('');
  }, []);

  return (
    <motion.div
      className="mx-auto max-w-5xl p-4 sm:p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-8">
        <h1 className="text-text text-3xl font-bold">Saved Name Mappings</h1>
        <div
          className="mt-2 h-1 w-16 rounded-full"
          style={{
            backgroundImage: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
          }}
        />
      </div>

      <div className="relative mb-6">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
          <Search className="text-text-muted h-4 w-4" />
        </div>
        <input
          type="text"
          className="input-base block w-full pl-10"
          style={{ borderRadius: '0.75rem' }}
          placeholder="Search names or aliases..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {hasMappings ? (
        <motion.div
          className="card-base overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr style={{ background: 'rgba(99,102,241,0.06)' }}>
                  <th
                    scope="col"
                    className="text-text-muted px-6 py-3.5 text-left text-xs font-semibold tracking-wider uppercase"
                  >
                    Original Name
                  </th>
                  <th
                    scope="col"
                    className="text-text-muted px-6 py-3.5 text-left text-xs font-semibold tracking-wider uppercase"
                  >
                    Alias
                  </th>
                  <th
                    scope="col"
                    className="text-text-muted px-6 py-3.5 text-right text-xs font-semibold tracking-wider uppercase"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody
                className="divide-y"
                style={{ borderColor: 'var(--color-border)' }}
              >
                {mappings.map(([name, alias]) => (
                  <tr
                    key={name}
                    className="transition-colors"
                    style={
                      {
                        '--hover-bg': 'rgba(99,102,241,0.04)',
                      } as React.CSSProperties
                    }
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        'rgba(99,102,241,0.04)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = '')
                    }
                  >
                    <td className="text-text px-6 py-4 text-sm font-medium whitespace-nowrap">
                      {name}
                    </td>
                    <td className="text-text-muted px-6 py-4 text-sm whitespace-nowrap">
                      {editingName === name ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="input-base w-full"
                          autoFocus
                        />
                      ) : (
                        <span
                          className="text-primary rounded-full px-2.5 py-1 text-xs font-semibold"
                          style={{ background: 'rgba(99,102,241,0.1)' }}
                        >
                          {alias}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                      {editingName === name ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={saveEdit}
                            className="text-primary hover:bg-primary/10 rounded-lg p-1.5 transition-colors"
                            title="Save"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Cancel"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => startEditing(name, alias)}
                            className="text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg p-1.5 transition-all"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => deleteNameMapping(name)}
                            className="text-text-muted rounded-lg p-1.5 transition-all hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {mappings.length === 0 && searchTerm && (
            <div className="text-text-muted p-8 text-center text-sm">
              No mappings found matching "{searchTerm}"
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div
          className="card-base py-20 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
        >
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{
              backgroundImage:
                'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(99,102,241,0.12))',
            }}
          >
            <Users size={32} style={{ color: '#8B5CF6' }} />
          </div>
          <h3 className="text-text mb-2 text-xl font-semibold">
            No saved mappings yet
          </h3>
          <p className="text-text-muted text-sm">
            Save aliases while redacting chats to see them here.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Mappings;
