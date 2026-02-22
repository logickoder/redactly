import { type FC } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, Save, User, UserPlus } from 'lucide-react';

interface RedactConfigurationProps {
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  participants: string[];
  aliases: Record<string, string>;
  handleAliasChange: (original: string, alias: string) => void;
  saveAliasToMap: (original: string, alias: string) => void;
  aggressiveRedaction: boolean;
  onAddParticipant: () => void;
}

const SectionHeader: FC<{
  icon: React.ReactNode;
  label: string;
  iconColor?: string;
  iconBg?: string;
  trailing?: React.ReactNode;
}> = ({
  icon,
  label,
  iconColor = 'text-primary',
  iconBg = 'rgba(99,102,241,0.12)',
  trailing,
}) => (
  <h3 className="text-text-muted mb-3 flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
    <span
      className="flex h-5 w-5 items-center justify-center rounded-md"
      style={{ background: iconBg }}
    >
      <span className={iconColor}>{icon}</span>
    </span>
    {label}
    {trailing && <span className="ml-auto">{trailing}</span>}
  </h3>
);

const RedactConfiguration: FC<RedactConfigurationProps> = ({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  participants,
  aliases,
  handleAliasChange,
  saveAliasToMap,
  aggressiveRedaction,
  onAddParticipant,
}) => {
  return (
    <motion.div
      className="card-base p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="text-text mb-5 text-base font-semibold">Configuration</h2>

      <div className="mb-6">
        <SectionHeader icon={<Calendar size={12} />} label="Date Range" />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-text-muted mb-1.5 block text-xs font-medium">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-base w-full"
            />
          </div>
          <div>
            <label className="text-text-muted mb-1.5 block text-xs font-medium">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-base w-full"
            />
          </div>
        </div>
      </div>

      <div>
        <SectionHeader
          icon={<User size={12} />}
          label="Participants"
          iconBg="rgba(139,92,246,0.12)"
          iconColor="text-secondary"
          trailing={
            <div className="flex items-center gap-2">
              <span
                className="text-primary rounded-full px-2 py-0.5 text-xs font-semibold"
                style={{ background: 'rgba(99,102,241,0.1)' }}
              >
                {participants.length}
              </span>
              {aggressiveRedaction && (
                <button
                  onClick={onAddParticipant}
                  className="text-primary hover:bg-primary/10 flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors"
                  title="Add participant manually"
                >
                  <UserPlus size={12} />
                  Add
                </button>
              )}
            </div>
          }
        />
        <div className="max-h-60 space-y-2.5 overflow-y-auto pr-1">
          {participants.map((participant) => (
            <div
              key={participant}
              className="flex items-center gap-2 rounded-xl p-2.5 transition-colors"
              style={{ background: 'rgba(99,102,241,0.04)' }}
            >
              <div
                className="text-text w-1/3 truncate text-sm font-medium"
                title={participant}
              >
                {participant}
              </div>
              <ArrowRight size={12} className="text-text-muted shrink-0" />
              <div className="flex grow gap-2">
                <input
                  type="text"
                  value={aliases[participant] || ''}
                  onChange={(e) =>
                    handleAliasChange(participant, e.target.value)
                  }
                  className="input-base grow"
                  placeholder="Alias"
                />
                <button
                  onClick={() =>
                    saveAliasToMap(participant, aliases[participant])
                  }
                  className="text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg p-2 transition-all"
                  title="Save alias for future chats"
                >
                  <Save size={14} />
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
