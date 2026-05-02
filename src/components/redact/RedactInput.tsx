import { type FC, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Pencil, RefreshCw, Settings } from 'lucide-react';
import { useVirtualizedContent } from '../../hooks/useVirtualizedContent.tsx';
import type { PiiSettings } from '../../features/pii';

interface RedactInputProps {
  content: string;
  setContent: (content: string) => void;
  handleParse: (content: string) => void;
  step: number;
  setStep: (step: number) => void;
  dateFormat: string;
  setDateFormat: (format: string) => void;
  aggressiveRedaction: boolean;
  toggleAggressiveRedaction: () => void;
  pii: PiiSettings;
  togglePii: (key: keyof PiiSettings) => void;
  isParsing: boolean;
  isFromHistory: boolean;
}

const RedactInput: FC<RedactInputProps> = ({
  content,
  setContent,
  handleParse,
  step,
  setStep,
  dateFormat,
  setDateFormat,
  aggressiveRedaction,
  toggleAggressiveRedaction,
  pii,
  togglePii,
  isParsing,
  isFromHistory,
}) => {
  const [showSettings, setShowSettings] = useState(false);

  const { ref, virtualizer, virtualItems, lines, totalSize } =
    useVirtualizedContent(content);

  const canEdit = step > 0 && !isFromHistory;

  return (
    <motion.div
      className={`card-base p-6 transition-opacity ${step !== 0 ? 'opacity-75' : ''}`}
      layout
    >
      <div className="mb-4 flex items-center justify-between">
        <label
          htmlFor="chat-content"
          className="text-text block text-base font-semibold"
        >
          Original Chat Content
        </label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`rounded-lg p-2 transition-all ${showSettings ? 'text-primary bg-primary/10' : 'text-text-muted hover:text-primary hover:bg-primary/10'}`}
            title="Settings"
          >
            <Settings size={16} />
          </button>
          {canEdit && (
            <button
              onClick={() => setStep(0)}
              className="text-primary hover:bg-primary/10 flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            >
              <Pencil size={11} />
              Edit
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div
              className="mb-4 space-y-4 rounded-xl border p-4"
              style={{
                background: 'rgba(99,102,241,0.05)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div>
                <label className="text-text mb-2 block text-sm font-medium">
                  Date Format
                </label>
                <input
                  type="text"
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="input-base w-full"
                  placeholder="dd/MM/yyyy"
                />
                <p className="text-text-muted mt-1.5 text-xs">
                  Use d, M, y, H, m, s tokens. Example: dd/MM/yyyy or MM/dd/yy
                </p>
              </div>

              <div className="flex items-start gap-3">
                <input
                  id="aggressive-redaction"
                  type="checkbox"
                  checked={aggressiveRedaction}
                  onChange={toggleAggressiveRedaction}
                  className="accent-primary mt-0.5 h-4 w-4 cursor-pointer rounded"
                />
                <div>
                  <label
                    htmlFor="aggressive-redaction"
                    className="text-text block cursor-pointer text-sm font-medium"
                  >
                    Aggressive Redaction
                  </label>
                  <p className="text-text-muted mt-0.5 text-xs">
                    Also redacts name parts (e.g. "Bob" from "Bob the Builder")
                    found inside messages.
                  </p>
                </div>
              </div>

              <div>
                <p className="text-text mb-2 block text-sm font-medium">
                  Also Redact
                </p>
                <p className="text-text-muted mb-2 text-xs">
                  Mask additional patterns found anywhere in messages.
                </p>
                <div className="space-y-2">
                  <PiiToggle
                    id="pii-email"
                    label="Email addresses"
                    placeholder="[EMAIL]"
                    checked={pii.email}
                    onChange={() => togglePii('email')}
                  />
                  <PiiToggle
                    id="pii-url"
                    label="URLs"
                    placeholder="[LINK]"
                    checked={pii.url}
                    onChange={() => togglePii('url')}
                  />
                  <PiiToggle
                    id="pii-phone"
                    label="Phone numbers"
                    placeholder="[PHONE]"
                    checked={pii.phone}
                    onChange={() => togglePii('phone')}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {step === 0 ? (
        <textarea
          id="chat-content"
          className="input-base h-64 w-full resize-none font-mono leading-relaxed"
          style={{ borderRadius: '0.75rem' }}
          placeholder="Paste your WhatsApp chat export here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      ) : (
        <div className="relative">
          <div
            ref={ref}
            className="h-64 w-full overflow-auto rounded-xl border p-4 font-mono text-sm"
            style={{
              background: 'var(--color-background)',
              color: 'var(--color-text)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div
              style={{
                height: `${totalSize}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualItems.map((virtualRow) => (
                <div
                  key={virtualRow.index}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                    padding: '1px 0',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {lines[virtualRow.index]}
                </div>
              ))}
            </div>
          </div>
          {canEdit && (
            <button
              onClick={() => setStep(0)}
              className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-xl bg-black/0 opacity-0 transition-all hover:bg-black/10 hover:opacity-100 dark:hover:bg-black/30"
              title="Click to edit content"
            >
              <span className="flex items-center gap-2 rounded-lg bg-white/90 px-4 py-2 text-sm font-medium text-gray-800 shadow-md dark:bg-gray-800/90 dark:text-gray-100">
                <Pencil size={14} />
                Click to edit
              </span>
            </button>
          )}
        </div>
      )}

      {step === 0 && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => handleParse(content)}
            disabled={!content.trim() || isParsing}
            className="btn-gradient flex items-center gap-2"
          >
            <RefreshCw size={16} className={isParsing ? 'animate-spin' : ''} />
            {isParsing ? 'Parsing...' : 'Parse Chat'}
          </button>
        </div>
      )}
    </motion.div>
  );
};

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
      style={{ background: 'rgba(99,102,241,0.1)' }}
    >
      {placeholder}
    </span>
  </label>
);

export default RedactInput;
