import { type FC } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, Save, User } from 'lucide-react';

interface RedactConfigurationProps {
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  participants: string[];
  aliases: Record<string, string>;
  handleAliasChange: (original: string, alias: string) => void;
  saveAliasToMap: (original: string, alias: string) => void;
}

const RedactConfiguration: FC<RedactConfigurationProps> = ({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  participants,
  aliases,
  handleAliasChange,
  saveAliasToMap,
}) => {
  return (
    <motion.div
      className="bg-card rounded-2xl border border-gray-200 p-6 shadow-sm dark:border-gray-800"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="text-text mb-4 text-lg font-semibold">Configuration</h2>

      {/* Date Range */}
      <div className="mb-6">
        <h3 className="text-text-muted mb-3 flex items-center text-sm font-medium">
          <Calendar size={16} className="mr-2" /> Date Range
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-text-muted mb-1 block text-xs">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-background text-text focus:ring-primary w-full rounded-lg border border-gray-200 p-2 text-sm focus:ring-2 focus:outline-none dark:border-gray-700"
            />
          </div>
          <div>
            <label className="text-text-muted mb-1 block text-xs">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-background text-text focus:ring-primary w-full rounded-lg border border-gray-200 p-2 text-sm focus:ring-2 focus:outline-none dark:border-gray-700"
            />
          </div>
        </div>
      </div>

      {/* Participants */}
      <div>
        <h3 className="text-text-muted mb-3 flex items-center text-sm font-medium">
          <User size={16} className="mr-2" /> Participants (
          {participants.length})
        </h3>
        <div className="max-h-60 space-y-3 overflow-y-auto pr-2">
          {participants.map((participant) => (
            <div key={participant} className="flex items-center space-x-3">
              <div
                className="text-text w-1/3 truncate text-sm"
                title={participant}
              >
                {participant}
              </div>
              <ArrowRight size={14} className="text-text-muted" />
              <div className="flex grow space-x-2">
                <input
                  type="text"
                  value={aliases[participant] || ''}
                  onChange={(e) =>
                    handleAliasChange(participant, e.target.value)
                  }
                  className="bg-background text-text focus:ring-primary w-full rounded-lg border border-gray-200 p-2 text-sm focus:ring-2 focus:outline-none dark:border-gray-700"
                  placeholder="Alias"
                />
                <button
                  onClick={() =>
                    saveAliasToMap(participant, aliases[participant])
                  }
                  className="text-text-muted hover:text-primary p-2 transition-colors"
                  title="Save alias for future chats"
                >
                  <Save size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default RedactConfiguration;
