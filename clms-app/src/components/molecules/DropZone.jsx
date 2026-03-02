import { useRef, useCallback } from 'react';
import Icon from '../atoms/Icon';

export default function DropZone({ icon, label, hint, accept, onFile, compact = false, className = '' }) {
  const fileInputRef = useRef(null);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => fileInputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
      }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border-strong bg-slate-50 text-center transition-colors hover:border-brand hover:bg-slate-100 ${compact ? 'px-4 py-4' : 'px-6 py-10'} ${className}`}
    >
      <Icon name={icon} size={compact ? 20 : 28} className="text-text-muted" />
      <p className={`font-medium text-text-secondary ${compact ? 'text-xs' : 'text-sm'}`}>{label}</p>
      {hint && <p className="text-xs text-text-muted">{hint}</p>}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          if (e.target.files[0]) onFile(e.target.files[0]);
        }}
      />
    </div>
  );
}
