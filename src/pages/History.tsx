import { type FC, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { type SavedChat, useAppStore } from '../store/useAppStore';
import { ArrowRight, Clock, FileText, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4
    }
  }
};

const History: FC = () => {
  const navigate = useNavigate();
  const { savedChats, deleteChat } = useAppStore();

  const handleLoadChat = (chat: SavedChat) => {
    navigate('/redact', { state: { savedChat: chat } });
  };

  return (
    <motion.div
      className="max-w-7xl mx-auto p-4 sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-3xl font-bold mb-8 text-text">History</h1>
      {savedChats.length === 0 ? (
        <motion.div
          className="text-center py-20 bg-card rounded-2xl border border-gray-200 dark:border-gray-800"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Clock size={48} className="mx-auto text-text-muted mb-4" />
          <h3 className="text-xl font-medium text-text mb-2">No saved chats</h3>
          <p className="text-text-muted mb-6">Chats you save will appear here for quick access.</p>
          <Link
            to="/"
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start New Redaction
          </Link>
        </motion.div>
      ) : (
        <motion.div
          className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {savedChats.map((chat) => (
            <SavedChatItem
              key={chat.id}
              chat={chat}
              onLoad={handleLoadChat}
              onDelete={deleteChat}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

const SavedChatItem: FC<{
  chat: SavedChat;
  onLoad: (chat: SavedChat) => void;
  onDelete: (id: string) => void;
}> = ({ chat, onLoad, onDelete }) => {
  const saved = useMemo(() => {
    return new Date(chat.date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [chat.date]);

  return (
    <motion.div
      className="bg-card p-5 rounded-xl border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all flex flex-col h-full group relative overflow-hidden"
      variants={itemVariants}
      layout
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
            <FileText size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-text truncate" title={chat.title}>
              {chat.title}
            </h3>
            <p className="text-xs text-text-muted">{saved}</p>
          </div>
        </div>
      </div>

      <div className="grow mb-4">
        <div className="text-xs text-text-muted font-mono bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg h-32 overflow-hidden relative">
          {chat.content}
          <div className="absolute bottom-0 left-0 w-full h-12 bg-linear-to-t from-gray-50 dark:from-gray-800/50 to-transparent"></div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-auto">
        <button
          onClick={() => onLoad(chat)}
          className="flex-1 flex items-center justify-center px-3 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Open
          <ArrowRight size={14} className="ml-1.5" />
        </button>
        <button
          onClick={() => onDelete(chat.id)}
          className="p-2 text-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          title="Delete"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </motion.div>
  );
};

export default History;
