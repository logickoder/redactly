import { type FC } from 'react';
import { motion } from 'framer-motion';
import { Copy, Download, Save } from 'lucide-react';
import { useVirtualizedContent } from '../../hooks/useVirtualizedContent.tsx';

interface RedactPreviewProps {
  redactedContent: string;
  step: number;
  onCopy: () => void;
  onDownload: () => void;
  onSave: () => void;
  showSave: boolean;
}

const RedactPreview: FC<RedactPreviewProps> = ({
  redactedContent,
  step,
  onCopy,
  onDownload,
  onSave,
  showSave,
}) => {
  const { ref, virtualizer, virtualItems, lines, totalSize } =
    useVirtualizedContent(redactedContent);

  return (
    <motion.div
      className={`card-base flex h-full flex-col p-6 transition-opacity ${step < 1 ? 'opacity-50' : ''}`}
      layout
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-text text-base font-semibold">Redacted Preview</h2>
        {redactedContent.length > 0 && (
          <div
            className="text-primary inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-xs font-medium sm:self-auto"
            style={{ background: 'rgba(99,102,241,0.1)' }}
          >
            <span>{lines.length.toLocaleString()} lines</span>
            <span className="text-primary/40">·</span>
            <span>{redactedContent.length.toLocaleString()} chars</span>
          </div>
        )}
      </div>

      <div
        ref={ref}
        className="mb-4 h-125 grow overflow-auto rounded-xl border p-4 font-mono text-sm leading-relaxed"
        style={{
          background: 'var(--color-background)',
          color: 'var(--color-text)',
          borderColor: 'var(--color-border)',
        }}
      >
        {step >= 1 ? (
          lines.length > 0 ? (
            <div
              style={{
                height: `${totalSize}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualItems.map((virtualRow) => (
                <div
                  key={virtualRow.index}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                    padding: '1px 0',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {lines[virtualRow.index]}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-text-muted flex h-full items-center justify-center text-sm">
              No content to display
            </div>
          )
        ) : (
          <div className="text-text-muted flex h-full items-center justify-center text-sm">
            Complete step 1 to see preview…
          </div>
        )}
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <button
          onClick={onCopy}
          disabled={step < 1}
          className="text-text hover:bg-primary/8 hover:text-primary flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-40"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <Copy size={16} />
          Copy Text
        </button>
        <button
          onClick={onDownload}
          disabled={step < 1}
          className="btn-gradient flex items-center justify-center gap-2 text-sm"
        >
          <Download size={16} />
          Download .txt
        </button>
      </div>

      {showSave && (
        <button
          onClick={onSave}
          disabled={step < 1}
          className="text-primary hover:bg-primary/10 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-40"
          style={{ borderColor: 'var(--color-primary)' }}
        >
          <Save size={16} />
          Save to History
        </button>
      )}
    </motion.div>
  );
};

export default RedactPreview;
