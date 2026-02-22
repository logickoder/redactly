import { type FC, Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { type Message, parseChat } from '../utils/chatParser';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAppSettings } from '../hooks/useStore';
import * as chatStorage from '../utils/chatStorage';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import RedactInput from '../components/redact/RedactInput';
import RedactConfiguration from '../components/redact/RedactConfiguration';
import RedactPreview from '../components/redact/RedactPreview';
import SaveChatModal from '../components/SaveChatModal';

const Redact: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { dateFormat, setDateFormat, nameMap, updateNameMap } =
    useAppSettings();
  const toast = useToast();

  const [content, setContent] = useState<string>('');
  const [parsedMessages, setParsedMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<string[]>([]);
  const [aliases, setAliases] = useState<Record<string, string>>({});
  const [debouncedAliases, setDebouncedAliases] = useState<
    Record<string, string>
  >({});
  const [step, setStep] = useState<number>(0);
  const [aggressiveRedaction, setAggressiveRedaction] =
    useState<boolean>(false);
  const [isParsing, setIsParsing] = useState<boolean>(false);

  const aliasDebounceTimer = useRef<number | null>(null);

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [defaultChatName, setDefaultChatName] = useState('');

  const hasInitialized = useRef(false);

  const redactedContent = useMemo(() => {
    if (parsedMessages.length === 0) return '';

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);

    return parsedMessages
      .filter((msg) => {
        if (!msg.date) return true;
        if (start && msg.date < start) return false;
        return !(end && msg.date > end);
      })
      .map((msg) => {
        let redactedLine = msg.originalString;

        Object.entries(debouncedAliases).forEach(([name, aliasName]) => {
          const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          redactedLine = redactedLine.replace(
            new RegExp(escapedName, 'gi'),
            aliasName,
          );

          if (aggressiveRedaction) {
            const parts = name.split(/\s+/).filter((p) => p.length > 2);
            parts.forEach((part) => {
              const escapedPart = part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
  }, [
    parsedMessages,
    debouncedAliases,
    startDate,
    endDate,
    aggressiveRedaction,
  ]);

  const steps = useMemo(() => ['Input', 'Configure', 'Export'], []);

  const handleParse = async (text: string) => {
    setIsParsing(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 50));

      const result = parseChat(text, dateFormat);
      setParsedMessages(result.messages);
      setParticipants(result.participants);

      const newAliases: Record<string, string> = {};
      result.participants.forEach((p, index) => {
        if (nameMap[p]) {
          newAliases[p] = nameMap[p];
        } else {
          newAliases[p] = `User ${String.fromCharCode(65 + index)}`;
        }
      });
      setAliases(newAliases);

      if (result.messages.length > 0) {
        const first = result.messages[0].date;
        const last = result.messages[result.messages.length - 1].date;
        if (first) setStartDate(first.toISOString().split('T')[0]);
        if (last) setEndDate(last.toISOString().split('T')[0]);
      }

      if (result.messages.length > 0) {
        setStep(1);
        toast.show(
          `Chat parsed successfully! ${result.messages.length} messages found.`,
          'success',
        );
      } else {
        toast.show('No messages found. Please check the format.', 'error');
      }
    } catch (error) {
      console.error('Parsing error:', error);
      toast.show('Error parsing chat. Please check the format.', 'error');
    } finally {
      setIsParsing(false);
    }
  };

  const handleAliasChange = (original: string, newAlias: string) => {
    setAliases((prev) => ({ ...prev, [original]: newAlias }));
  };

  useEffect(() => {
    if (aliasDebounceTimer.current) {
      clearTimeout(aliasDebounceTimer.current);
    }

    aliasDebounceTimer.current = setTimeout(() => {
      setDebouncedAliases(aliases);
    }, 1000);

    return () => {
      if (aliasDebounceTimer.current) {
        clearTimeout(aliasDebounceTimer.current);
      }
    };
  }, [aliases]);

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

  const handleSaveConfirm = async (name: string) => {
    let finalName = name;
    let counter = 1;

    const existingPreviews = await chatStorage.getAllChatPreviews();
    while (existingPreviews.some((chat) => chat.title === finalName)) {
      finalName = `${name} (${counter})`;
      counter++;
    }

    try {
      await chatStorage.saveChat({
        id: crypto.randomUUID(),
        title: finalName,
        date: new Date().toISOString(),
        content: redactedContent,
        originalContent: content,
      });

      toast.show('Chat saved successfully!', 'success');
      navigate('/history');
    } catch (error) {
      console.error('Error saving chat:', error);
      toast.show('Failed to save chat', 'error');
    }
  };

  useEffect(() => {
    if (hasInitialized.current) return;

    if (location.state?.fileContent) {
      setContent(location.state.fileContent);
      handleParse(location.state.fileContent);
      hasInitialized.current = true;
    } else if (location.state?.savedChat) {
      const saved = location.state.savedChat;
      setContent(saved.originalContent || '');
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
      transition={{ duration: 0.4 }}
    >
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-text hidden text-3xl font-bold sm:block">
          Redact Chat
        </h1>

        {/* Step pills */}
        <div className="flex grow items-center justify-center gap-2 text-sm sm:grow-0 sm:justify-start">
          {steps.map((s, index) => (
            <Fragment key={s}>
              <div className="flex items-center gap-1.5">
                {step > index ? (
                  <CheckCircle2 size={14} className="text-primary shrink-0" />
                ) : (
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      step === index
                        ? 'text-white'
                        : 'text-text-muted bg-gray-200 dark:bg-white/10'
                    }`}
                    style={
                      step === index
                        ? {
                            backgroundImage:
                              'linear-gradient(135deg, #6366F1, #8B5CF6)',
                          }
                        : {}
                    }
                  >
                    {index + 1}
                  </span>
                )}
                <span
                  className={`font-medium transition-colors ${
                    step === index
                      ? 'text-primary'
                      : step > index
                        ? 'text-primary/70'
                        : 'text-text-muted'
                  }`}
                >
                  {s}
                </span>
              </div>
              {index < steps.length - 1 && (
                <ArrowRight size={14} className="text-text-muted shrink-0" />
              )}
            </Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
            isParsing={isParsing}
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
