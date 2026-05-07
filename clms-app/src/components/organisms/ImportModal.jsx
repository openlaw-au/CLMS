import { useState } from 'react';
import Icon from '../atoms/Icon';
import CsvImportFlow from './CsvImportFlow';

const MODAL_CLOSE_MS = 200;

export default function ImportModal({ onClose, onImported }) {
  const [closing, setClosing] = useState(false);

  const requestClose = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => onClose(), MODAL_CLOSE_MS);
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/30 ${closing ? 'motion-fade-out' : 'motion-fade'}`}
        onClick={requestClose}
      />
      <div className={`fixed inset-4 z-50 flex flex-col overflow-hidden rounded-2xl bg-white shadow-xl md:inset-8 lg:inset-16 ${closing ? 'animate-page-out' : 'animate-page-in'}`}>
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <h2 className="font-serif text-card-title text-text">Import CSV</h2>
          <button
            type="button"
            onClick={requestClose}
            className="rounded-full p-1.5 text-text-muted transition-colors duration-150 hover:bg-slate-100 hover:text-text"
          >
            <Icon name="solar:close-linear" size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <CsvImportFlow onComplete={() => { onImported?.(); requestClose(); }} />
        </div>
      </div>
    </>
  );
}
