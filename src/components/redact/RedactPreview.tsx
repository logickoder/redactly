import { type FC } from 'react';
import { motion } from 'framer-motion';
import { Copy, Download, Save } from 'lucide-react';

interface RedactPreviewProps {
  redactedContent: string;
  step: number;
  onCopy: () => void;
  onDownload: () => void;
  onSave: () => void;
}

const RedactPreview: FC<RedactPreviewProps> = ({
  redactedContent,
  step,
  onCopy,
  onDownload,
  onSave,
}) => {
  return (
    <motion.div
      className={`bg-card flex h-full flex-col rounded-2xl border border-gray-200 p-6 shadow-sm dark:border-gray-800 ${step < 1 ? 'opacity-50' : ''}`}
      layout
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-text text-lg font-semibold">Redacted Preview</h2>
        <div className="text-text-muted text-xs">
          {redactedContent.length} chars
        </div>
      </div>

      <div className="bg-background text-text mb-4 h-125 grow overflow-auto rounded-xl border border-gray-200 p-4 font-mono text-sm whitespace-pre-wrap dark:border-gray-700">
        {step >= 1 ? redactedContent : 'Complete step 1 to see preview...'}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <button
          onClick={onCopy}
          disabled={step < 1}
          className="text-text flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          <Copy size={18} className="mr-2" />
          Copy Text
        </button>
        <button
          onClick={onDownload}
          disabled={step < 1}
          className="bg-primary flex items-center justify-center rounded-lg px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          <Download size={18} className="mr-2" />
          Download .txt
        </button>
      </div>

      <button
        onClick={onSave}
        disabled={step < 1}
        className="border-primary text-primary hover:bg-primary/10 flex w-full items-center justify-center rounded-lg border px-4 py-2 transition-colors disabled:opacity-50"
      >
        <Save size={18} className="mr-2" />
        Save to History
      </button>
    </motion.div>
  );
};

export default RedactPreview;
