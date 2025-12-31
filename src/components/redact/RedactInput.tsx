import { type FC, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCw, Settings } from 'lucide-react';

interface RedactInputProps {
  content: string;
  setContent: (content: string) => void;
  handleParse: (content: string) => void;
  step: number;
  setStep: (step: number) => void;
  dateFormat: string;
  setDateFormat: (format: string) => void;
  aggressiveRedaction: boolean;
  setAggressiveRedaction: (aggressive: boolean) => void;
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
  setAggressiveRedaction,
}) => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <motion.div
      className={`bg-card rounded-2xl border border-gray-200 p-6 shadow-sm dark:border-gray-800 ${step !== 1 ? 'opacity-80' : ''}`}
      layout
    >
      <div className="mb-4 flex items-center justify-between">
        <label
          htmlFor="chat-content"
          className="text-text block text-lg font-semibold"
        >
          Original Chat Content
        </label>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-text-muted hover:text-primary p-2 transition-colors"
            title="Settings"
          >
            <Settings size={18} />
          </button>
          {step > 1 && (
            <button
              onClick={() => setStep(0)}
              className="text-primary text-sm hover:underline"
            >
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
            <div className="mb-4 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <div>
                <label className="text-text mb-2 block text-sm font-medium">
                  Date Format
                </label>
                <input
                  type="text"
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="bg-background text-text focus:ring-primary w-full rounded-lg border border-gray-200 p-2 text-sm focus:ring-2 focus:outline-none dark:border-gray-700"
                  placeholder="dd/MM/yyyy"
                />
                <p className="text-text-muted mt-1 text-xs">
                  Use d, M, y, H, m, s tokens. Example: dd/MM/yyyy or MM/dd/yy
                </p>
              </div>

              <div className="flex items-center">
                <input
                  id="aggressive-redaction"
                  type="checkbox"
                  checked={aggressiveRedaction}
                  onChange={(e) => setAggressiveRedaction(e.target.checked)}
                  className="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300"
                />
                <label
                  htmlFor="aggressive-redaction"
                  className="text-text ml-2 block text-sm"
                >
                  Aggressive Redaction (Redact name parts within messages)
                </label>
              </div>
              <p className="text-text-muted pl-6 text-xs">
                If checked, parts of the name (e.g., "Ebuka" from "King Ebuka")
                found in the message text will also be replaced with the alias.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <textarea
        id="chat-content"
        disabled={step !== 0}
        className="bg-background text-text focus:ring-primary h-64 w-full resize-none rounded-xl border border-gray-200 p-4 font-mono text-sm transition-all focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700"
        placeholder="Paste your WhatsApp chat export here..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      {step === 0 && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => handleParse(content)}
            disabled={!content.trim()}
            className="bg-primary flex items-center rounded-lg px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={18} className="mr-2" />
            Parse Chat
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default RedactInput;
