import { type FC } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import Modal from '../../ui/Modal';
import { useAppSettings } from '../../../hooks/useStore';
import type {
  NsfwStrategy,
  NsfwTier,
  NsfwTierFlags,
} from '../../../features/nsfw';
import type { PiiSettings } from '../../../features/pii';
import { trackEvent } from '../../../features/analytics';

interface RedactSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const RedactSettings: FC<RedactSettingsProps> = ({ isOpen, onClose }) => {
  const {
    dateFormat,
    setDateFormat,
    aggressiveRedaction,
    toggleAggressiveRedaction,
    pii,
    togglePii,
    nsfw,
    toggleNsfw,
    toggleNsfwTier,
    setNsfwStrategy,
    setNsfwExtraWords,
    setNsfwAllowList,
    analytics,
    setAnalyticsConsent,
  } = useAppSettings();

  const handleAggressive = () => {
    trackEvent(aggressiveRedaction ? 'feature/aggressive-off' : 'feature/aggressive-on');
    toggleAggressiveRedaction();
  };

  const handleTogglePii = (key: keyof PiiSettings) => {
    if (!pii[key]) {
      if (key === 'email') trackEvent('feature/pii-email-on');
      else if (key === 'url') trackEvent('feature/pii-url-on');
      else if (key === 'phone') trackEvent('feature/pii-phone-on');
    }
    togglePii(key);
  };

  const handleToggleNsfw = () => {
    trackEvent(nsfw.enabled ? 'feature/nsfw-off' : 'feature/nsfw-on');
    toggleNsfw();
  };

  const handleToggleNsfwTier = (tier: NsfwTier) => {
    if (!nsfw.tiers[tier]) {
      if (tier === 'general') trackEvent('feature/nsfw-tier-general');
      else if (tier === 'slurs') trackEvent('feature/nsfw-tier-slurs');
      else if (tier === 'violence') trackEvent('feature/nsfw-tier-violence');
    }
    toggleNsfwTier(tier);
  };

  const handleSetNsfwStrategy = (strategy: NsfwStrategy) => {
    if (strategy !== nsfw.strategy) {
      trackEvent(strategy === 'mask' ? 'feature/nsfw-strategy-mask' : 'feature/nsfw-strategy-soften');
    }
    setNsfwStrategy(strategy);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Redaction Settings"
      icon={<SettingsIcon size={15} />}
    >
      <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
        <DateFormatSection
          dateFormat={dateFormat}
          setDateFormat={setDateFormat}
        />
        <AggressiveSection
          checked={aggressiveRedaction}
          onChange={handleAggressive}
        />
        <PiiSection pii={pii} togglePii={handleTogglePii} />
        <NsfwSection
          enabled={nsfw.enabled}
          tiers={nsfw.tiers}
          strategy={nsfw.strategy}
          extraWords={nsfw.extraWords}
          allowList={nsfw.allowList}
          onToggleEnabled={handleToggleNsfw}
          onToggleTier={handleToggleNsfwTier}
          onSetStrategy={handleSetNsfwStrategy}
          onSetExtraWords={setNsfwExtraWords}
          onSetAllowList={setNsfwAllowList}
        />
        <AnalyticsSection
          enabled={analytics.enabled}
          onChange={setAnalyticsConsent}
        />
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="btn-gradient flex items-center gap-2 py-2 text-sm"
        >
          Done
        </button>
      </div>
    </Modal>
  );
};

const DateFormatSection: FC<{
  dateFormat: string;
  setDateFormat: (s: string) => void;
}> = ({ dateFormat, setDateFormat }) => (
  <section>
    <SectionTitle title="Date Format" />
    <input
      id="settings-date-format"
      type="text"
      value={dateFormat}
      onChange={(e) => setDateFormat(e.target.value)}
      className="input-base w-full"
      placeholder="dd/MM/yyyy"
    />
    <Hint>Use d, M, y, H, m, s tokens. Example: dd/MM/yyyy or MM/dd/yy</Hint>
  </section>
);

const AggressiveSection: FC<{
  checked: boolean;
  onChange: () => void;
}> = ({ checked, onChange }) => (
  <section>
    <SectionTitle title="Aggressive Redaction" />
    <Checkbox
      id="settings-aggressive"
      checked={checked}
      onChange={onChange}
      label="Redact name parts inside messages"
      hint='Also redacts name parts (e.g. "Bob" from "Bob the Builder").'
    />
  </section>
);

const PiiSection: FC<{
  pii: PiiSettings;
  togglePii: (key: keyof PiiSettings) => void;
}> = ({ pii, togglePii }) => (
  <section>
    <SectionTitle title="Also Redact" />
    <Hint className="mb-2">
      Mask additional patterns found anywhere in messages.
    </Hint>
    <div className="space-y-2">
      <PiiToggle
        id="settings-pii-email"
        label="Email addresses"
        placeholder="[EMAIL]"
        checked={pii.email}
        onChange={() => togglePii('email')}
      />
      <PiiToggle
        id="settings-pii-url"
        label="URLs"
        placeholder="[LINK]"
        checked={pii.url}
        onChange={() => togglePii('url')}
      />
      <PiiToggle
        id="settings-pii-phone"
        label="Phone numbers"
        placeholder="[PHONE]"
        checked={pii.phone}
        onChange={() => togglePii('phone')}
      />
    </div>
  </section>
);

const NsfwSection: FC<{
  enabled: boolean;
  tiers: NsfwTierFlags;
  strategy: NsfwStrategy;
  extraWords: string[];
  allowList: string[];
  onToggleEnabled: () => void;
  onToggleTier: (tier: NsfwTier) => void;
  onSetStrategy: (s: NsfwStrategy) => void;
  onSetExtraWords: (words: string[]) => void;
  onSetAllowList: (words: string[]) => void;
}> = ({
  enabled,
  tiers,
  strategy,
  extraWords,
  allowList,
  onToggleEnabled,
  onToggleTier,
  onSetStrategy,
  onSetExtraWords,
  onSetAllowList,
}) => (
  <section>
    <SectionTitle title="NSFW Filter" />
    <Checkbox
      id="settings-nsfw-enabled"
      checked={enabled}
      onChange={onToggleEnabled}
      label="Enable content filter"
      hint="Mask sexual, profane, slur, and violent terms so downstream AIs accept the chat. Heuristic — review preview before sharing."
    />

    {enabled && (
      <div className="mt-3 space-y-3 pl-7">
        <div className="grid grid-cols-2 gap-2">
          <Checkbox
            id="settings-nsfw-general"
            checked={tiers.general}
            onChange={() => onToggleTier('general')}
            label="General (profanity + sexual)"
            compact
          />
          <Checkbox
            id="settings-nsfw-slurs"
            checked={tiers.slurs}
            onChange={() => onToggleTier('slurs')}
            label="Slurs"
            compact
          />
          <Checkbox
            id="settings-nsfw-violence"
            checked={tiers.violence}
            onChange={() => onToggleTier('violence')}
            label="Graphic violence"
            compact
          />
        </div>

        <div>
          <p className="text-text-muted mb-1.5 text-xs font-medium">Strategy</p>
          <div className="flex gap-3">
            <RadioOption
              name="settings-nsfw-strategy"
              value="mask"
              current={strategy}
              label="Mask ([REDACTED])"
              onChange={onSetStrategy}
            />
            <RadioOption
              name="settings-nsfw-strategy"
              value="soften"
              current={strategy}
              label="Soften (per-tier)"
              onChange={onSetStrategy}
            />
          </div>
        </div>

        <WordsField
          id="settings-nsfw-extra"
          label="Additional words to redact"
          placeholder="comma- or newline-separated"
          value={extraWords}
          onChange={onSetExtraWords}
        />
        <WordsField
          id="settings-nsfw-allow"
          label="Allowlist (do not redact)"
          placeholder="e.g. Scunthorpe"
          value={allowList}
          onChange={onSetAllowList}
        />
      </div>
    )}
  </section>
);

const AnalyticsSection: FC<{
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}> = ({ enabled, onChange }) => (
  <section>
    <SectionTitle title="Anonymous Usage Stats" />
    <Checkbox
      id="settings-analytics"
      checked={enabled}
      onChange={() => onChange(!enabled)}
      label="Share anonymous usage stats"
      hint="Page visits + feature toggles via GoatCounter (cookieless). Never your chat data, names, or anything personal. Opt-in only."
    />
  </section>
);

// ─── Shared sub-components ──────────────────────────────────────────────────

const SectionTitle: FC<{ title: string }> = ({ title }) => (
  <h4 className="text-text mb-2 text-sm font-semibold">{title}</h4>
);

const Hint: FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <p className={`text-text-muted mt-1.5 text-xs ${className}`}>{children}</p>
);

interface CheckboxProps {
  id: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  hint?: string;
  compact?: boolean;
}

const Checkbox: FC<CheckboxProps> = ({
  id,
  checked,
  onChange,
  label,
  hint,
  compact,
}) => (
  <div className={compact ? 'flex items-center gap-2' : 'flex items-start gap-3'}>
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className={`accent-primary h-4 w-4 cursor-pointer rounded ${compact ? '' : 'mt-0.5'}`}
    />
    <div>
      <label
        htmlFor={id}
        className="text-text block cursor-pointer text-sm font-medium"
      >
        {label}
      </label>
      {hint && <p className="text-text-muted mt-0.5 text-xs">{hint}</p>}
    </div>
  </div>
);

interface PiiToggleProps {
  id: string;
  label: string;
  placeholder: string;
  checked: boolean;
  onChange: () => void;
}

const PiiToggle: FC<PiiToggleProps> = ({
  id,
  label,
  placeholder,
  checked,
  onChange,
}) => (
  <label htmlFor={id} className="flex cursor-pointer items-center gap-3">
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="accent-primary h-4 w-4 cursor-pointer rounded"
    />
    <span className="text-text text-sm">{label}</span>
    <span
      className="text-primary ml-auto rounded-full px-2 py-0.5 font-mono text-xs"
      style={{ background: 'var(--tint-primary)' }}
    >
      {placeholder}
    </span>
  </label>
);

interface RadioOptionProps {
  name: string;
  value: NsfwStrategy;
  current: NsfwStrategy;
  label: string;
  onChange: (value: NsfwStrategy) => void;
}

const RadioOption: FC<RadioOptionProps> = ({
  name,
  value,
  current,
  label,
  onChange,
}) => (
  <label className="flex cursor-pointer items-center gap-2">
    <input
      type="radio"
      name={name}
      value={value}
      checked={current === value}
      onChange={() => onChange(value)}
      className="accent-primary h-4 w-4 cursor-pointer"
    />
    <span className="text-text text-sm">{label}</span>
  </label>
);

interface WordsFieldProps {
  id: string;
  label: string;
  placeholder: string;
  value: string[];
  onChange: (words: string[]) => void;
}

const WordsField: FC<WordsFieldProps> = ({
  id,
  label,
  placeholder,
  value,
  onChange,
}) => (
  <div>
    <label
      htmlFor={id}
      className="text-text-muted mb-1.5 block text-xs font-medium"
    >
      {label}
    </label>
    <textarea
      id={id}
      rows={2}
      className="input-base w-full resize-none"
      placeholder={placeholder}
      value={value.join(', ')}
      onChange={(e) =>
        onChange(
          e.target.value
            .split(/[,\n]/)
            .map((w) => w.trim())
            .filter(Boolean),
        )
      }
    />
  </div>
);

export default RedactSettings;
