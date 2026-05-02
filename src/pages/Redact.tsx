import { type FC, Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { type Message } from '../features/chat';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAppSettings } from '../hooks/useStore';
import { useRedactWorker } from '../hooks/useRedactWorker';
import { trackEvent } from '../features/analytics';
import * as chatStorage from '../features/chat';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import RedactInput from '../components/redact/RedactInput';
import RedactConfiguration from '../components/redact/RedactConfiguration';
import RedactPreview from '../components/redact/RedactPreview';
import SaveChatModal from '../components/redact/SaveChatModal';
import AddParticipantModal from '../components/redact/AddParticipantModal';
import RedactSettings from '../components/redact/settings/RedactSettings';

const Redact: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    dateFormat,
    nameMap,
    updateNameMap,
    aggressiveRedaction,
    pii,
    nsfw,
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const aliasDebounceTimer = useRef<number | null>(null);
  const hasInitialized = useRef(false);

  const worker = useRedactWorker();

  const [redactedContent, setRedactedContent] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    if (parsedMessages.length === 0) {
      setRedactedContent('');
      return;
    }
    worker
      .redact(parsedMessages, {
        aliases: debouncedAliases,
        aggressiveRedaction,
        startDate,
        endDate,
        pii,
        nsfw,
      })
      .then((out) => {
        if (!cancelled) setRedactedContent(out);
      })
      .catch((err) => {
        console.error('Redaction failed:', err);
      });
    return () => {
      cancelled = true;
    };
    // worker reference is stable across renders; redaction inputs cover the meaningful deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    parsedMessages,
    debouncedAliases,
    startDate,
    endDate,
    aggressiveRedaction,
    pii,
    nsfw,
  ]);

  const steps = useMemo(() => ['Input', 'Configure', 'Export'], []);

  const nextAliasLabel = useMemo(() => {
    return `User ${String.fromCharCode(65 + participants.length)}`;
  }, [participants.length]);

  const handleParse = async (text: string) => {
    setIsParsing(true);
    try {
      const result = await worker.parse(text, dateFormat);
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
        trackEvent('parse/success');
      } else {
        toast.show('No messages found. Please check the format.', 'error');
        trackEvent('parse/fail');
      }
    } catch {
      toast.show('Error parsing chat. Please check the format.', 'error');
      trackEvent('parse/fail');
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
    trackEvent('export/copy');
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
    trackEvent('export/download');
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
      trackEvent('history/save');
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
                              'var(--gradient-primary)',
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
            onOpenSettings={() => setIsSettingsOpen(true)}
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

      <RedactSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </motion.div>
  );
};

export default Redact;
