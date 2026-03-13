import { useState } from 'react';
import Icon from '../atoms/Icon';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import { useToast } from '../../context/ToastContext';
import { addBook } from '../../services/booksService';

export default function AddBookFlow({ onClose, onAdded, prefill = null }) {
  const { addToast } = useToast();
  const [isbn, setIsbn] = useState(prefill?.isbn || '');
  const [loading, setLoading] = useState(false);
  const [looked, setLooked] = useState(Boolean(prefill));
  const [form, setForm] = useState({
    title: prefill?.title || '',
    author: prefill?.author || '',
    edition: prefill?.edition || '',
    publisher: prefill?.publisher || '',
    location: prefill?.location || 'Owen Dixon East',
    floor: prefill?.floor || '3',
  });

  const handleLookup = async () => {
    if (!isbn.trim()) return;
    setLoading(true);
    // TODO(api): Replace with GET /api/isbn/:isbn — ISBN lookup
    await new Promise((r) => setTimeout(r, 500));
    // Mock auto-fill based on common ISBNs or generate from ISBN
    setForm({
      title: 'Looked Up Title',
      author: 'Auto Author',
      edition: '1st',
      publisher: 'Publisher',
      location: 'Owen Dixon East',
      floor: '3',
    });
    setLoading(false);
    setLooked(true);
  };

  const handleSave = async () => {
    // TODO(api): Replace with POST /api/books — add to catalogue
    const savedBook = await addBook({ ...form, isbn, practiceArea: 'General', jurisdiction: 'Federal' });
    addToast({ message: `${form.title} added to catalogue`, type: 'success' });
    await onAdded?.(savedBook);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg text-text">Add Book</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-text-muted hover:bg-slate-100">
            <Icon name="solar:close-circle-linear" size={20} />
          </button>
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-medium text-text-secondary">ISBN</label>
          <div className="flex gap-2">
            <Input
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              placeholder="978-0-409-343953"
              className="flex-1"
            />
            <Button onClick={handleLookup} disabled={loading}>
              {loading ? 'Looking up...' : 'Look up'}
            </Button>
          </div>
        </div>

        {loading && (
          <div className="mt-4 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        )}

        {looked && !loading && (
          <div className="mt-4 space-y-3">
            {[
              ['Title', 'title'],
              ['Author', 'author'],
              ['Edition', 'edition'],
              ['Publisher', 'publisher'],
              ['Location', 'location'],
              ['Floor', 'floor'],
            ].map(([label, key]) => (
              <div key={key}>
                <label className="mb-1 block text-xs font-medium text-text-secondary">{label}</label>
                <Input
                  value={form[key]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                />
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
              <Button variant="primary" onClick={handleSave}>Save to Catalogue</Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
