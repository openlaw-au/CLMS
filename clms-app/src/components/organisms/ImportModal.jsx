import Icon from '../atoms/Icon';
import CsvImportFlow from './CsvImportFlow';

export default function ImportModal({ onClose, onImported }) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed inset-4 z-50 flex flex-col overflow-hidden rounded-2xl bg-white shadow-xl md:inset-8 lg:inset-16">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <h2 className="font-serif text-lg text-text">Import CSV</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-text-muted hover:bg-slate-100">
            <Icon name="solar:close-circle-linear" size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <CsvImportFlow onComplete={() => { onImported?.(); onClose(); }} />
        </div>
      </div>
    </>
  );
}
