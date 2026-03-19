import { useRef } from 'react';
import Icon from '../atoms/Icon';
import Button from '../atoms/Button';
import { useToast } from '../../context/ToastContext';
import { generateAGLCHtml, generateAGLCPlainText } from '../../utils/aglcFormatter';

/**
 * In-app AGLC export preview modal with Download PDF, Copy Text, and Share actions.
 * @param {{ list: object, onClose: () => void }} props
 */
export default function ExportPreviewModal({ list, onClose }) {
  const iframeRef = useRef(null);
  const { addToast } = useToast();
  const html = generateAGLCHtml(list);

  const handleDownloadPdf = () => {
    iframeRef.current?.contentWindow?.print();
  };

  const handleCopyText = async () => {
    const text = generateAGLCPlainText(list);
    try {
      await navigator.clipboard.writeText(text);
      addToast({ message: 'Copied to clipboard', type: 'success' });
    } catch {
      addToast({ message: 'Failed to copy', type: 'error' });
    }
  };

  const handleShare = async () => {
    const text = generateAGLCPlainText(list);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `List of Authorities - ${list.name}`,
          text,
        });
      } catch {
        // User cancelled share — no-op
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(text);
        addToast({ message: 'Link copied to clipboard (share not supported)', type: 'info' });
      } catch {
        addToast({ message: 'Failed to copy', type: 'error' });
      }
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-4 z-50 flex flex-col overflow-hidden rounded-2xl bg-slate-100 shadow-xl md:inset-8 lg:inset-16">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 bg-white px-6 py-4">
          <div>
            <h2 className="font-serif text-card-title text-text">Export Preview</h2>
            <p className="mt-0.5 text-xs text-text-secondary">{list.name} · {list.caseRef}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-text-muted hover:bg-slate-100">
            <Icon name="solar:close-circle-linear" size={20} />
          </button>
        </div>

        {/* Preview area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-3xl rounded-xl bg-white shadow-sm ring-1 ring-black/5">
            <iframe
              ref={iframeRef}
              srcDoc={html}
              title="AGLC Preview"
              className="h-full min-h-[60vh] w-full rounded-xl"
              sandbox="allow-same-origin"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t border-border/60 bg-white px-6 py-4">
          <Button size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={handleShare}>
              <Icon name="solar:share-linear" size={16} />
              Share
            </Button>
            <Button size="sm" variant="secondary" onClick={handleCopyText}>
              <Icon name="solar:copy-linear" size={16} />
              Copy Text
            </Button>
            <Button size="sm" variant="primary" onClick={handleDownloadPdf}>
              <Icon name="solar:printer-linear" size={16} />
              Download PDF
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
