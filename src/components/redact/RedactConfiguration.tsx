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
  iconBg = 'var(--tint-primary-strong)',
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
            <label
              htmlFor="redact-start-date"
              className="text-text-muted mb-1.5 block text-xs font-medium"
            >
              Start Date
            </label>
            <input
              id="redact-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-base w-full"
            />
          </div>
          <div>
            <label
              htmlFor="redact-end-date"
              className="text-text-muted mb-1.5 block text-xs font-medium"
            >
              End Date
            </label>
            <input
              id="redact-end-date"
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
          iconBg="var(--tint-secondary-strong)"
          iconColor="text-secondary"
          trailing={
            <div className="flex items-center gap-2">
              <span
                className="text-primary rounded-full px-2 py-0.5 text-xs font-semibold"
                style={{ background: 'var(--tint-primary)' }}
              >
                {participants.length}
              </span>
              {aggressiveRedaction && (
                <button
                  type="button"
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
              className="flex flex-col gap-1.5 rounded-xl p-2.5 transition-colors sm:flex-row sm:items-center sm:gap-2"
              style={{ background: 'var(--tint-primary-faint)' }}
            >
              <div
                className="text-text truncate text-sm font-medium sm:w-1/3"
                title={participant}
              >
                {participant}
              </div>
              <ArrowRight
                size={12}
                className="text-text-muted hidden shrink-0 sm:block"
              />
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
                  type="button"
                  onClick={() =>
                    saveAliasToMap(participant, aliases[participant])
                  }
                  aria-label={`Save alias for ${participant}`}
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
