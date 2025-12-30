import { type FC, useEffect, useMemo, useState } from 'react';
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
  User
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { AnimatePresence, motion } from 'framer-motion';

const Redact: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { dateFormat, setDateFormat, nameMap, updateNameMap, saveChat } = useAppStore();

  const [content, setContent] = useState<string>('');
  const [parsedMessages, setParsedMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<string[]>([]);
  const [aliases, setAliases] = useState<Record<string, string>>({});
  const [step, setStep] = useState<number>(1); // 1: Input, 2: Configure, 3: Export
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [aggressiveRedaction, setAggressiveRedaction] = useState<boolean>(false);

  // Date filtering
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

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
      setStep(2);
    }
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

  const handleAliasChange = (original: string, newAlias: string) => {
    setAliases((prev) => ({ ...prev, [original]: newAlias }));
  };

  const saveAliasToMap = (original: string, alias: string) => {
    updateNameMap(original, alias);
  };

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
          redactedLine = redactedLine.replace(new RegExp(escapedName, 'gi'), aliasName);

          if (aggressiveRedaction) {
            // Split name into parts (words)
            const parts = name.split(/\s+/).filter((p) => p.length > 2); // Only redact parts longer than 2 chars to avoid replacing common short words
            parts.forEach((part) => {
              const escapedPart = part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              // Replace whole words only to avoid replacing parts of other words
              // \b matches word boundary
              redactedLine = redactedLine.replace(
                new RegExp(`\\b${escapedPart}\\b`, 'gi'),
                aliasName
              );
            });
          }
        });

        return redactedLine;
      })
      .join('\n');
  }, [parsedMessages, aliases, startDate, endDate, aggressiveRedaction]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(redactedContent);
    // Could add a toast here
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
      originalContent: content
    });
    navigate('/history');
  };

  return (
    <motion.div
      className="max-w-7xl mx-auto p-4 sm:p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-text">Redact Chat</h1>
        <div className="flex items-center space-x-2 text-sm">
          <span
            className={`px-3 py-1 rounded-full transition-colors duration-300 ${step === 1 ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-800 text-text-muted'}`}
          >
            1. Input
          </span>
          <ArrowRight size={16} className="text-text-muted" />
          <span
            className={`px-3 py-1 rounded-full transition-colors duration-300 ${step === 2 ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-800 text-text-muted'}`}
          >
            2. Configure
          </span>
          <ArrowRight size={16} className="text-text-muted" />
          <span
            className={`px-3 py-1 rounded-full transition-colors duration-300 ${step === 3 ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-800 text-text-muted'}`}
          >
            3. Export
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Input & Configuration */}
        <div className="space-y-6">
          {/* Step 1: Input */}
          <motion.div
            className={`bg-card rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 ${step !== 1 ? 'opacity-80' : ''}`}
            layout
          >
            <div className="flex justify-between items-center mb-4">
              <label htmlFor="chat-content" className="block text-lg font-semibold text-text">
                Original Chat Content
              </label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 text-text-muted hover:text-primary transition-colors"
                  title="Settings"
                >
                  <Settings size={18} />
                </button>
                {step > 1 && (
                  <button
                    onClick={() => setStep(1)}
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
                  <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        Date Format
                      </label>
                      <input
                        type="text"
                        value={dateFormat}
                        onChange={(e) => setDateFormat(e.target.value)}
                        className="w-full p-2 bg-background border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-text focus:ring-2 focus:ring-primary focus:outline-none"
                        placeholder="dd/MM/yyyy"
                      />
                      <p className="text-xs text-text-muted mt-1">
                        Use d, M, y, H, m, s tokens. Example: dd/MM/yyyy or MM/dd/yy
                      </p>
                    </div>

                    <div className="flex items-center">
                      <input
                        id="aggressive-redaction"
                        type="checkbox"
                        checked={aggressiveRedaction}
                        onChange={(e) => setAggressiveRedaction(e.target.checked)}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <label
                        htmlFor="aggressive-redaction"
                        className="ml-2 block text-sm text-text"
                      >
                        Aggressive Redaction (Redact name parts within messages)
                      </label>
                    </div>
                    <p className="text-xs text-text-muted pl-6">
                      If checked, parts of the name (e.g., "Ebuka" from "King Ebuka") found in the
                      message text will also be replaced with the alias.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <textarea
              id="chat-content"
              disabled={step !== 1}
              className="w-full h-64 p-4 bg-background border border-gray-200 dark:border-gray-700 rounded-xl text-text font-mono text-sm resize-none focus:ring-2 focus:ring-primary focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Paste your WhatsApp chat export here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            {step === 1 && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => handleParse(content)}
                  disabled={!content.trim()}
                  className="bg-primary hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <RefreshCw size={18} className="mr-2" />
                  Parse Chat
                </button>
              </div>
            )}
          </motion.div>

          {/* Step 2: Configuration */}
          <AnimatePresence>
            {step >= 2 && (
              <motion.div
                className="bg-card rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <h2 className="text-lg font-semibold text-text mb-4">Configuration</h2>

                {/* Date Range */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-text-muted mb-3 flex items-center">
                    <Calendar size={16} className="mr-2" /> Date Range
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-text-muted mb-1">Start Date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full p-2 bg-background border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-text focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted mb-1">End Date</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full p-2 bg-background border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-text focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Participants */}
                <div>
                  <h3 className="text-sm font-medium text-text-muted mb-3 flex items-center">
                    <User size={16} className="mr-2" /> Participants ({participants.length})
                  </h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {participants.map((participant) => (
                      <div key={participant} className="flex items-center space-x-3">
                        <div className="w-1/3 text-sm text-text truncate" title={participant}>
                          {participant}
                        </div>
                        <ArrowRight size={14} className="text-text-muted" />
                        <div className="grow flex space-x-2">
                          <input
                            type="text"
                            value={aliases[participant] || ''}
                            onChange={(e) => handleAliasChange(participant, e.target.value)}
                            className="w-full p-2 bg-background border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-text focus:ring-2 focus:ring-primary focus:outline-none"
                            placeholder="Alias"
                          />
                          <button
                            onClick={() => saveAliasToMap(participant, aliases[participant])}
                            className="p-2 text-text-muted hover:text-primary transition-colors"
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
            className={`bg-card rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 h-full flex flex-col ${step < 2 ? 'opacity-50' : ''}`}
            layout
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-text">Redacted Preview</h2>
              <div className="text-xs text-text-muted">{redactedContent.length} chars</div>
            </div>

            <div className="grow bg-background border border-gray-200 dark:border-gray-700 rounded-xl p-4 font-mono text-sm text-text overflow-auto h-125 whitespace-pre-wrap mb-4">
              {step >= 2 ? redactedContent : 'Complete step 1 to see preview...'}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <button
                onClick={copyToClipboard}
                disabled={step < 2}
                className="flex items-center justify-center px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-text hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <Copy size={18} className="mr-2" />
                Copy Text
              </button>
              <button
                onClick={downloadFile}
                disabled={step < 2}
                className="flex items-center justify-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Download size={18} className="mr-2" />
                Download .txt
              </button>
            </div>

            <button
              onClick={handleSaveToHistory}
              disabled={step < 2}
              className="w-full flex items-center justify-center px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors disabled:opacity-50"
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
