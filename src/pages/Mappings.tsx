import { type FC, useCallback, useMemo, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Edit2, Save, Search, Trash2, Users, X } from 'lucide-react';

const Mappings: FC = () => {
  const { nameMap, updateNameMap, deleteNameMapping } = useAppStore();

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
      ([name, alias]) => name.toLowerCase().includes(query) || alias.toLowerCase().includes(query)
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
    <div className="max-w-5xl mx-auto p-4 sm:p-8">
      <h1 className="text-3xl font-bold mb-8 text-text">Saved Name Mappings</h1>

      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-text-muted" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg leading-5 bg-background text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm transition-colors"
          placeholder="Search names or aliases..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {hasMappings ? (
        <div className="bg-card rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider"
                  >
                    Original Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider"
                  >
                    Alias
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-gray-200 dark:divide-gray-700">
                {mappings.map(([name, alias]) => (
                  <tr
                    key={name}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text">
                      {name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                      {editingName === name ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full p-1 bg-background border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        alias
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
            <div className="p-8 text-center text-text-muted">
              No mappings found matching "{searchTerm}"
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 bg-card rounded-2xl border border-gray-200 dark:border-gray-800">
          <Users size={48} className="mx-auto text-text-muted mb-4" />
          <h3 className="text-xl font-medium text-text mb-2">No saved mappings</h3>
          <p className="text-text-muted">Save aliases while redacting chats to see them here.</p>
        </div>
      )}
    </div>
  );
};

export default Mappings;
