import { type FC, Fragment, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { type Message, parseChat } from '../utils/chatParser';
import {
  ArrowRight,
  Calendar,
  Copy,
  Download,
  RefreshCw,
  Save,
  Settings,
  User,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '../context/ToastContext.tsx';

const Redact: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { dateFormat, setDateFormat, nameMap, updateNameMap, saveChat } =
    useAppStore();
  const toast = useToast();

  const [content, setContent] = useState<string>('');
  const [parsedMessages, setParsedMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<string[]>([]);
  const [aliases, setAliases] = useState<Record<string, string>>({});
  const [step, setStep] = useState<number>(0);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [aggressiveRedaction, setAggressiveRedaction] =
    useState<boolean>(false);

  // Date filtering
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const redactedContent = useMemo(() => {
    if (parsedMessages.length === 0) return '';

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    // Adjust end date to include the full day
    if (end) end.setHours(23, 59, 59, 999);

    return parsedMessages
      .filter((msg) => {
        if (!msg.date) return true; // Keep messages with unknown dates? Or drop? Let's keep.
        if (start && msg.date < start) return false;
        return !(end && msg.date > end);
      })
      .map((msg) => {
        let redactedLine = msg.originalString;

        // Apply all aliases to the line
        Object.entries(aliases).forEach(([name, aliasName]) => {
          // Escape special regex characters in name
          const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          // Use a global regex to replace all occurrences
          redactedLine = redactedLine.replace(
            new RegExp(escapedName, 'gi'),
            aliasName,
          );

          if (aggressiveRedaction) {
            // Split name into parts (words)
            const parts = name.split(/\s+/).filter((p) => p.length > 2); // Only redact parts longer than 2 chars to avoid replacing common short words
            parts.forEach((part) => {
              const escapedPart = part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              // Replace whole words only to avoid replacing parts of other words
              // \b matches word boundary
              redactedLine = redactedLine.replace(
                new RegExp(`\\b${escapedPart}\\b`, 'gi'),
                aliasName,
              );
            });
          }
        });

        return redactedLine;
      })
      .join('\n');
  }, [parsedMessages, aliases, startDate, endDate, aggressiveRedaction]);

  const steps = useMemo(() => ['Input', 'Configure', 'Export'], []);

  const handleParse = (text: string) => {
    const result = parseChat(text, dateFormat);
    setParsedMessages(result.messages);
    setParticipants(result.participants);

    // Generate aliases, preferring stored ones
    const newAliases: Record<string, string> = {};
    result.participants.forEach((p, index) => {
      if (nameMap[p]) {
        newAliases[p] = nameMap[p];
      } else {
        newAliases[p] = `User ${String.fromCharCode(65 + index)}`; // User A, User B...
      }
    });
    setAliases(newAliases);

    // Set default date range
    if (result.messages.length > 0) {
      const first = result.messages[0].date;
      const last = result.messages[result.messages.length - 1].date;
      if (first) setStartDate(first.toISOString().split('T')[0]);
      if (last) setEndDate(last.toISOString().split('T')[0]);
    }

    if (result.messages.length > 0) {
      setStep(1);
    }
  };

  const handleAliasChange = (original: string, newAlias: string) => {
    setAliases((prev) => ({ ...prev, [original]: newAlias }));
  };

  const saveAliasToMap = (original: string, alias: string) => {
    updateNameMap(original, alias);
    toast.show(`Alias for "${original}" saved!`, 'success');
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(redactedContent);
    toast.show('Redacted content copied to clipboard!', 'success');
  };

  const downloadFile = () => {
    const blob = new Blob([redactedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'redacted-chat.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveToHistory = () => {
    const title = `Chat ${new Date().toLocaleDateString()} (${participants.length} participants)`;
    saveChat({
      id: crypto.randomUUID(),
      title,
      date: new Date().toISOString(),
      content: redactedContent,
      originalContent: content,
    });
    navigate('/history');
  };

  useEffect(() => {
    if (location.state?.fileContent) {
      setContent(location.state.fileContent);
      handleParse(location.state.fileContent);
    } else if (location.state?.savedChat) {
      // Load from history
      const saved = location.state.savedChat;
      setContent(saved.originalContent || '');
      // We might want to just set the redacted content directly if we don't have original
      // But for now let's assume we re-parse or just show the result.
      // If we have original content, let's re-parse it to allow editing.
      if (saved.originalContent) {
        handleParse(saved.originalContent);
      }
    }
  }, [location.state]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      className="mx-auto max-w-7xl p-4 sm:p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-text hidden text-3xl font-bold sm:block">
          Redact Chat
        </h1>
        <div className="flex grow items-center justify-center space-x-2 text-sm sm:grow-0 sm:justify-start">
          {steps.map((s, index) => (
            <Fragment key={s}>
              <span
                className={`rounded-full px-3 py-1 transition-colors duration-300 ${step === index ? 'bg-primary text-white' : 'text-text-muted bg-gray-200 dark:bg-gray-800'}`}
              >
                {index + 1}. {s}
              </span>
              {index < steps.length - 1 && (
                <ArrowRight size={16} className="text-text-muted" />
              )}
            </Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left Column: Input & Configuration */}
        <div className="space-y-6">
          {/* Step 1: Input */}
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
                        Use d, M, y, H, m, s tokens. Example: dd/MM/yyyy or
                        MM/dd/yy
                      </p>
                    </div>

                    <div className="flex items-center">
                      <input
                        id="aggressive-redaction"
                        type="checkbox"
                        checked={aggressiveRedaction}
                        onChange={(e) =>
                          setAggressiveRedaction(e.target.checked)
                        }
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
                      If checked, parts of the name (e.g., "Ebuka" from "King
                      Ebuka") found in the message text will also be replaced
                      with the alias.
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

          {/* Step 2: Configuration */}
          <AnimatePresence>
            {step >= 1 && (
              <motion.div
                className="bg-card rounded-2xl border border-gray-200 p-6 shadow-sm dark:border-gray-800"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <h2 className="text-text mb-4 text-lg font-semibold">
                  Configuration
                </h2>

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
                      <div
                        key={participant}
                        className="flex items-center space-x-3"
                      >
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
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Preview & Export */}
        <div className="space-y-6">
          <motion.div
            className={`bg-card flex h-full flex-col rounded-2xl border border-gray-200 p-6 shadow-sm dark:border-gray-800 ${step < 1 ? 'opacity-50' : ''}`}
            layout
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-text text-lg font-semibold">
                Redacted Preview
              </h2>
              <div className="text-text-muted text-xs">
                {redactedContent.length} chars
              </div>
            </div>

            <div className="bg-background text-text mb-4 h-125 grow overflow-auto rounded-xl border border-gray-200 p-4 font-mono text-sm whitespace-pre-wrap dark:border-gray-700">
              {step >= 1
                ? redactedContent
                : 'Complete step 1 to see preview...'}
            </div>

            <div className="mb-4 grid grid-cols-2 gap-4">
              <button
                onClick={copyToClipboard}
                disabled={step < 1}
                className="text-text flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <Copy size={18} className="mr-2" />
                Copy Text
              </button>
              <button
                onClick={downloadFile}
                disabled={step < 1}
                className="bg-primary flex items-center justify-center rounded-lg px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                <Download size={18} className="mr-2" />
                Download .txt
              </button>
            </div>

            <button
              onClick={handleSaveToHistory}
              disabled={step < 1}
              className="border-primary text-primary hover:bg-primary/10 flex w-full items-center justify-center rounded-lg border px-4 py-2 transition-colors disabled:opacity-50"
            >
              <Save size={18} className="mr-2" />
              Save to History
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Redact;
