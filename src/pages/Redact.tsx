import { type FC, Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { type Message, parseChat } from '../features/chat';
import { redactMessages } from '../features/redaction';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAppSettings } from '../hooks/useStore';
import * as chatStorage from '../features/chat';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import RedactInput from '../components/redact/RedactInput';
import RedactConfiguration from '../components/redact/RedactConfiguration';
import RedactPreview from '../components/redact/RedactPreview';
import SaveChatModal from '../components/SaveChatModal';
import AddParticipantModal from '../components/AddParticipantModal';

const Redact: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    dateFormat,
    setDateFormat,
    nameMap,
    updateNameMap,
    aggressiveRedaction,
    toggleAggressiveRedaction,
    pii,
    togglePii,
  } = useAppSettings();
  const toast = useToast();

  const isFromHistory = Boolean(location.state?.savedChat);

  const [content, setContent] = useState<string>('');
  const [parsedMessages, setParsedMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<string[]>([]);
  const [aliases, setAliases] = useState<Record<string, string>>({});
  const [debouncedAliases, setDebouncedAliases] = useState<
    Record<string, string>
  >({});
  const [step, setStep] = useState<number>(0);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [defaultChatName, setDefaultChatName] = useState('');
  const [isAddParticipantOpen, setIsAddParticipantOpen] = useState(false);

  const aliasDebounceTimer = useRef<number | null>(null);
  const hasInitialized = useRef(false);

  const redactedContent = useMemo(
    () =>
      redactMessages(parsedMessages, {
        aliases: debouncedAliases,
        aggressiveRedaction,
        startDate,
        endDate,
        pii,
      }),
    [
      parsedMessages,
      debouncedAliases,
      startDate,
      endDate,
      aggressiveRedaction,
      pii,
    ],
  );

  const steps = useMemo(() => ['Input', 'Configure', 'Export'], []);

  const nextAliasLabel = useMemo(() => {
    return `User ${String.fromCharCode(65 + participants.length)}`;
  }, [participants.length]);

  const handleParse = async (text: string) => {
    setIsParsing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 50));
      const result = parseChat(text, dateFormat);
      setParsedMessages(result.messages);
      setParticipants(result.participants);

      const newAliases: Record<string, string> = {};
      result.participants.forEach((p, index) => {
        newAliases[p] = nameMap[p] ?? `User ${String.fromCharCode(65 + index)}`;
      });
      setAliases(newAliases);

      if (result.messages.length > 0) {
        const first = result.messages[0].date;
        const last = result.messages[result.messages.length - 1].date;
        if (first) setStartDate(first.toISOString().split('T')[0]);
        if (last) setEndDate(last.toISOString().split('T')[0]);
        setStep(1);
        toast.show(`Parsed ${result.messages.length} messages.`, 'success');
      } else {
        toast.show('No messages found. Please check the format.', 'error');
      }
    } catch {
      toast.show('Error parsing chat. Please check the format.', 'error');
    } finally {
      setIsParsing(false);
    }
  };

  const handleAliasChange = (original: string, newAlias: string) => {
    setAliases((prev) => ({ ...prev, [original]: newAlias }));
  };

  const saveAliasToMap = (original: string, alias: string) => {
    updateNameMap(original, alias);
    toast.show(`Alias for "${original}" saved!`, 'success');
  };

  const addParticipant = (name: string, alias: string, save: boolean) => {
    setParticipants((prev) => [...prev, name]);
    setAliases((prev) => ({ ...prev, [name]: alias }));
    if (save) updateNameMap(name, alias);
    toast.show(`"${name}" added as participant.`, 'success');
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(redactedContent);
    toast.show('Copied to clipboard!', 'success');
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
    toast.show('File downloaded!', 'success');
  };

  const handleSaveClick = () => {
    let name = participants.join(', ');
    if (name.length > 50) name = name.substring(0, 47) + '...';
    if (!name) name = `Chat ${new Date().toLocaleDateString()}`;
    setDefaultChatName(name);
    setIsSaveModalOpen(true);
  };

  const handleSaveConfirm = async (name: string) => {
    let finalName = name;
    let counter = 1;
    const existing = await chatStorage.getAllChatPreviews();
    while (existing.some((c) => c.title === finalName)) {
      finalName = `${name} (${counter++})`;
    }
    try {
      await chatStorage.saveChat({
        id: crypto.randomUUID(),
        title: finalName,
        date: new Date().toISOString(),
        content: redactedContent,
        originalContent: content,
      });
      toast.show('Chat saved!', 'success');
      navigate('/history');
    } catch {
      toast.show('Failed to save chat', 'error');
    }
  };

  useEffect(() => {
    if (aliasDebounceTimer.current) clearTimeout(aliasDebounceTimer.current);
    aliasDebounceTimer.current = setTimeout(
      () => setDebouncedAliases(aliases),
      1000,
    );
    return () => {
      if (aliasDebounceTimer.current) clearTimeout(aliasDebounceTimer.current);
    };
  }, [aliases]);

  useEffect(() => {
    if (hasInitialized.current) return;
    if (location.state?.fileContent) {
      setContent(location.state.fileContent);
      void handleParse(location.state.fileContent);
      hasInitialized.current = true;
    } else if (location.state?.savedChat) {
      const saved = location.state.savedChat;
      setContent(saved.originalContent || '');
      if (saved.originalContent) void handleParse(saved.originalContent);
      hasInitialized.current = true;
    }
    // handleParse intentionally omitted — bootstrapping should run once per route entry
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  return (
    <motion.div
      className="mx-auto max-w-7xl p-4 sm:p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-text hidden text-3xl font-bold sm:block">
          {isFromHistory ? 'Saved Chat' : 'Redact Chat'}
        </h1>

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
            toggleAggressiveRedaction={toggleAggressiveRedaction}
            pii={pii}
            togglePii={togglePii}
            isParsing={isParsing}
            isFromHistory={isFromHistory}
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
                aggressiveRedaction={aggressiveRedaction}
                onAddParticipant={() => setIsAddParticipantOpen(true)}
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
            showSave={!isFromHistory}
          />
        </div>
      </div>

      <SaveChatModal
        key={`save-chat-${isSaveModalOpen}`}
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveConfirm}
        defaultName={defaultChatName}
      />

      <AddParticipantModal
        key={`add-participant-${isAddParticipantOpen}-${participants.length}`}
        isOpen={isAddParticipantOpen}
        onClose={() => setIsAddParticipantOpen(false)}
        onAdd={addParticipant}
        nameMap={nameMap}
        existingParticipants={participants}
        nextAliasLabel={nextAliasLabel}
      />
    </motion.div>
  );
};

export default Redact;
