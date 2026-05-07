import { useState } from 'react';
import Button from '../atoms/Button';

const MODAL_CLOSE_MS = 200;

export default function LoanActionModal({ loan, onDeny, onClose }) {
  const [reason, setReason] = useState('');
  const [closing, setClosing] = useState(false);

  const requestClose = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => onClose(), MODAL_CLOSE_MS);
  };

  const handleDeny = async () => {
    await onDeny(loan.id, reason);
    requestClose();
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/30 ${closing ? 'motion-fade-out' : 'motion-fade'}`}
        onClick={requestClose}
      />
      <div className={`fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl ${closing ? 'animate-page-out' : 'animate-page-in'}`}>
        <h2 className="font-serif text-card-title text-text">Deny Loan Request</h2>
        <p className="mt-1 text-sm text-text-secondary">
          {loan.borrower}'s request for "{loan.bookTitle}"
        </p>
        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-medium text-text-secondary">Reason (optional)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-text focus:border-brand focus:outline-none"
            placeholder="e.g., Book reserved for another member..."
          />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={requestClose}>Cancel</Button>
          <Button variant="danger" onClick={handleDeny}>Deny</Button>
        </div>
      </div>
    </>
  );
}
