import { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as chatStorage from '../utils/chatStorage';
import { type ChatPreview } from '../utils/chatStorage';
import { ArrowRight, Clock, FileText, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
    },
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
        navigate('/redact', { state: { savedChat: fullChat } });
      }
    },
    [navigate],
  );

  const handleDeleteChat = useCallback(async (id: string) => {
    try {
      await chatStorage.deleteChat(id);
      setChats((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error('Failed to delete chat:', error);
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
      .catch((err) => {
        console.error('Failed to load chat previews:', err);
        setIsPending(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <motion.div
      className="mx-auto max-w-7xl p-4 sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-text mb-8 text-3xl font-bold">History</h1>
      {isPending ? (
        <div className="text-text-muted py-20 text-center">Loading chats…</div>
      ) : chats.length === 0 ? (
        <motion.div
          className="bg-card rounded-2xl border border-gray-200 py-20 text-center dark:border-gray-800"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Clock size={48} className="text-text-muted mx-auto mb-4" />
          <h3 className="text-text mb-2 text-xl font-medium">No saved chats</h3>
          <p className="text-text-muted mb-6">
            Chats you save will appear here for quick access.
          </p>
          <Link
            to="/#upload-section"
            className="bg-primary rounded-lg px-6 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Start New Redaction
          </Link>
        </motion.div>
      ) : (
        <motion.div
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
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
  const saved = useMemo(() => {
    return new Date(chat.date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [chat.date]);

  return (
    <motion.div
      className="bg-card group relative overflow-hidden rounded-xl border border-gray-200 p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-800 dark:hover:border-blue-700"
      variants={itemVariants}
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <FileText size={18} className="text-primary" />
          <h3 className="text-text text-lg font-semibold">{chat.title}</h3>
        </div>
        <div className="text-text-muted flex items-center text-xs">
          <Clock size={12} className="mr-1" />
          {saved}
        </div>
      </div>

      <div className="relative mb-4">
        <div className="bg-background text-text-muted max-h-32 overflow-hidden rounded-lg border border-gray-200 p-3 font-mono text-xs dark:border-gray-700">
          {chat.preview}
          <div className="absolute bottom-0 left-0 h-12 w-full bg-linear-to-t from-gray-50 to-transparent dark:from-gray-800/50"></div>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2">
        <button
          onClick={() => onLoad(chat)}
          className="bg-primary flex flex-1 items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Open
          <ArrowRight size={14} className="ml-1.5" />
        </button>
        <button
          onClick={() => onDelete(chat.id)}
          className="text-text-muted rounded-lg p-2 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
          title="Delete"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </motion.div>
  );
};

export default History;
