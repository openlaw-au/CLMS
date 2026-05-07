import { useState } from 'react';
import Button from '../atoms/Button';

const MODAL_CLOSE_MS = 200;

export default function ConfirmModal({
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'danger',
  onConfirm,
  onClose,
}) {
  const [closing, setClosing] = useState(false);

  const requestClose = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => onClose?.(), MODAL_CLOSE_MS);
  };

  const handleConfirm = async () => {
    await onConfirm?.();
    requestClose();
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/30 ${closing ? 'motion-fade-out' : 'motion-fade'}`}
        onClick={requestClose}
      />
      <div
        className={`fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl ${closing ? 'animate-page-out' : 'animate-page-in'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-serif text-card-title text-text">{title}</h2>
        {body && <p className="mt-1 text-sm text-text-secondary">{body}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={requestClose}>{cancelLabel}</Button>
          <Button variant={confirmVariant} onClick={handleConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </>
  );
}
