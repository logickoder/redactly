import { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as chatStorage from '../features/chat';
import { type ChatPreview } from '../features/chat';
import { trackEvent } from '../features/analytics';
import { ArrowRight, Clock, FileText, Trash2 } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import PageHeader from '../components/ui/PageHeader';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

const History: FC = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [isPending, setIsPending] = useState(true);

  const handleLoadChat = useCallback(
    async (preview: ChatPreview) => {
      const fullChat = await chatStorage.loadFullChat(preview.id);
      if (fullChat) {
        trackEvent('history/load');
        navigate('/redact', { state: { savedChat: fullChat } });
      }
    },
    [navigate],
  );

  const handleDeleteChat = useCallback(async (id: string) => {
    try {
      await chatStorage.deleteChat(id);
      setChats((prev) => prev.filter((c) => c.id !== id));
      trackEvent('history/delete');
    } catch {
      console.error('Failed to delete chat');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    chatStorage
      .getAllChatPreviews()
      .then((previews) => {
        if (!cancelled) {
          setChats(previews);
          setIsPending(false);
        }
      })
      .catch(() => setIsPending(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <motion.div
      className="mx-auto max-w-7xl p-4 sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <PageHeader
        title="History"
        subtitle="Your saved redacted conversations"
      />

      {isPending ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
            <p className="text-text-muted text-sm">Loading chats…</p>
          </div>
        </div>
      ) : chats.length === 0 ? (
        <motion.div
          className="card-base py-20 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{
              backgroundImage:
                'var(--gradient-primary-tint-soft)',
            }}
          >
            <Clock size={32} className="text-primary" />
          </div>
          <h3 className="text-text mb-2 text-xl font-semibold">
            No saved chats yet
          </h3>
          <p className="text-text-muted mb-6 text-sm">
            Chats you save will appear here for quick access.
          </p>
          <Link
            to="/"
            className="btn-gradient inline-flex items-center gap-2 text-sm"
          >
            Start New Redaction
            <ArrowRight size={14} />
          </Link>
        </motion.div>
      ) : (
        <motion.div
          className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {chats.map((chat) => (
            <SavedChatItem
              key={chat.id}
              chat={chat}
              onLoad={handleLoadChat}
              onDelete={handleDeleteChat}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

const SavedChatItem: FC<{
  chat: ChatPreview;
  onLoad: (chat: ChatPreview) => void;
  onDelete: (id: string) => void;
}> = ({ chat, onLoad, onDelete }) => {
  const saved = useMemo(
    () =>
      new Date(chat.date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    [chat.date],
  );

  return (
    <motion.div
      className="card-base group relative flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
      variants={itemVariants}
      whileHover={{ boxShadow: '0 8px 30px rgba(99,102,241,0.18)' }}
    >
      <div
        className="h-1 w-full shrink-0"
        style={{ backgroundImage: 'var(--gradient-primary-h)' }}
      />

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <FileText size={16} className="text-primary shrink-0" />
            <h3 className="text-text truncate text-base font-semibold">
              {chat.title}
            </h3>
          </div>
          <div className="text-text-muted flex shrink-0 items-center gap-1 text-xs">
            <Clock size={11} />
            {saved}
          </div>
        </div>

        <div className="relative mb-4 grow">
          <div
            className="h-24 overflow-hidden rounded-lg border p-3 font-mono text-xs"
            style={{
              background: 'var(--color-background)',
              color: 'var(--color-text-muted)',
              borderColor: 'var(--color-border)',
            }}
          >
            {chat.preview}
          </div>
          <div
            className="absolute bottom-0 left-0 h-10 w-full rounded-b-lg"
            style={{
              background:
                'linear-gradient(to top, var(--color-background), transparent)',
            }}
          />
        </div>

        <div className="mt-auto flex items-center gap-2">
          <button
            onClick={() => onLoad(chat)}
            className="btn-gradient flex flex-1 items-center justify-center gap-2 py-2 text-sm"
          >
            Open
            <ArrowRight size={13} />
          </button>
          <button
            onClick={() => onDelete(chat.id)}
            className="text-text-muted rounded-lg p-2 transition-all hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default History;
