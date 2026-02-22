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
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-text mb-8 text-3xl font-bold">Saved Name Mappings</h1>

      <div className="relative mb-6">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="text-text-muted h-5 w-5" />
        </div>
        <input
          type="text"
          className="bg-background text-text placeholder-text-muted focus:ring-primary block w-full rounded-lg border border-gray-200 py-2 pr-3 pl-10 leading-5 transition-colors focus:ring-2 focus:outline-none sm:text-sm dark:border-gray-700"
          placeholder="Search names or aliases..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {hasMappings ? (
        <motion.div
          className="bg-card overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th
                    scope="col"
                    className="text-text-muted px-6 py-3 text-left text-xs font-medium tracking-wider uppercase"
                  >
                    Original Name
                  </th>
                  <th
                    scope="col"
                    className="text-text-muted px-6 py-3 text-left text-xs font-medium tracking-wider uppercase"
                  >
                    Alias
                  </th>
                  <th
                    scope="col"
                    className="text-text-muted px-6 py-3 text-right text-xs font-medium tracking-wider uppercase"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-gray-200 dark:divide-gray-700">
                {mappings.map(([name, alias]) => (
                  <tr
                    key={name}
                    className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
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
                          className="bg-background focus:ring-primary w-full rounded border border-gray-300 p-1 focus:ring-2 focus:outline-none dark:border-gray-600"
                          autoFocus
                        />
                      ) : (
                        alias
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                      {editingName === name ? (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={saveEdit}
                            className="text-green-600 hover:text-green-900 dark:hover:text-green-400"
                            title="Save"
                          >
                            <Save size={18} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                            title="Cancel"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => startEditing(name, alias)}
                            className="text-primary hover:text-blue-900 dark:hover:text-blue-400"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => deleteNameMapping(name)}
                            className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                            title="Delete"
                          >
                            <Trash2 size={18} />
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
            <div className="text-text-muted p-8 text-center">
              No mappings found matching "{searchTerm}"
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div
          className="bg-card rounded-2xl border border-gray-200 py-20 text-center dark:border-gray-800"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Users size={48} className="text-text-muted mx-auto mb-4" />
          <h3 className="text-text mb-2 text-xl font-medium">
            No saved mappings
          </h3>
          <p className="text-text-muted">
            Save aliases while redacting chats to see them here.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Mappings;
