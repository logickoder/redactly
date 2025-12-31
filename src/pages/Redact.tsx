import { type FC, Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { type Message, parseChat } from '../utils/chatParser';
import { ArrowRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import RedactInput from '../components/redact/RedactInput';
import RedactConfiguration from '../components/redact/RedactConfiguration';
import RedactPreview from '../components/redact/RedactPreview';
import SaveChatModal from '../components/SaveChatModal';

const Redact: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    dateFormat,
    setDateFormat,
    nameMap,
    updateNameMap,
    saveChat,
    savedChats,
  } = useAppStore();
  const toast = useToast();

  const [content, setContent] = useState<string>('');
  const [parsedMessages, setParsedMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<string[]>([]);
  const [aliases, setAliases] = useState<Record<string, string>>({});
  const [step, setStep] = useState<number>(0);
  const [aggressiveRedaction, setAggressiveRedaction] =
    useState<boolean>(false);

  // Date filtering
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Save Modal State
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [defaultChatName, setDefaultChatName] = useState('');

  const hasInitialized = useRef(false);

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
      toast.show('Chat parsed successfully!', 'success');
    } else {
      toast.show('No messages found. Please check the format.', 'error');
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
    toast.show('File downloaded successfully!', 'success');
  };

  const handleSaveClick = () => {
    // Generate default name
    let name = participants.join(', ');
    if (name.length > 50) {
      name = name.substring(0, 47) + '...';
    }
    if (!name) {
      name = `Chat ${new Date().toLocaleDateString()}`;
    }

    setDefaultChatName(name);
    setIsSaveModalOpen(true);
  };

  const handleSaveConfirm = (name: string) => {
    let finalName = name;
    let counter = 1;

    // Check for duplicates and append (n) if needed
    while (savedChats.some((chat) => chat.title === finalName)) {
      finalName = `${name} (${counter})`;
      counter++;
    }

    saveChat({
      id: crypto.randomUUID(),
      title: finalName,
      date: new Date().toISOString(),
      content: redactedContent,
      originalContent: content,
    });

    toast.show('Chat saved successfully!', 'success');
    navigate('/history');
  };

  useEffect(() => {
    if (hasInitialized.current) return;

    if (location.state?.fileContent) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setContent(location.state.fileContent);
      handleParse(location.state.fileContent);
      hasInitialized.current = true;
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
      hasInitialized.current = true;
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
        <div className="space-y-6">
          <RedactInput
            content={content}
            setContent={setContent}
            handleParse={handleParse}
            step={step}
            setStep={setStep}
            dateFormat={dateFormat}
            setDateFormat={setDateFormat}
            aggressiveRedaction={aggressiveRedaction}
            setAggressiveRedaction={setAggressiveRedaction}
          />

          <AnimatePresence>
            {step >= 1 && (
              <RedactConfiguration
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                participants={participants}
                aliases={aliases}
                handleAliasChange={handleAliasChange}
                saveAliasToMap={saveAliasToMap}
              />
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-6">
          <RedactPreview
            redactedContent={redactedContent}
            step={step}
            onCopy={copyToClipboard}
            onDownload={downloadFile}
            onSave={handleSaveClick}
          />
        </div>
      </div>

      <SaveChatModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveConfirm}
        defaultName={defaultChatName}
      />
    </motion.div>
  );
};

export default Redact;
