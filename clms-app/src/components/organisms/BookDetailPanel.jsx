import { useEffect, useState } from 'react';
import Icon from '../atoms/Icon';
import Button from '../atoms/Button';
import Badge from '../atoms/Badge';
import { useToast } from '../../context/ToastContext';
import { enrichBook, deleteBook } from '../../services/booksService';

const SUBJECT_OPTIONS = [
  'Administrative Law', 'Banking & Finance', 'Commercial', 'Constitutional', 'Contract',
  'Corporations', 'Criminal', 'Employment', 'Environmental', 'Equity', 'Evidence',
  'Family', 'Human Rights', 'Immigration', 'Indigenous', 'Insurance',
  'Intellectual Property', 'Property', 'Tort',
];

const JURISDICTION_OPTIONS = [
  'Federal', 'ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA', 'NZ', 'International',
];

const RESOURCE_TYPE_OPTIONS = [
  'Monograph', 'Looseleaf', 'Commentary', 'Casebook', 'Textbook', 'Practice Guide', 'Journal', 'Dictionary',
];

export default function BookDetailPanel({ book, onClose, onSaved }) {
  const { addToast } = useToast();

  const [subject, setSubject] = useState('');
  const [jurisdictions, setJurisdictions] = useState([]);
  const [resourceType, setResourceType] = useState('');
  const [tags, setTags] = useState([]);
  const [notes, setNotes] = useState('');
  const [newTag, setNewTag] = useState('');

  // Initialize from book enrichment
  useEffect(() => {
    if (book?.enrichment) {
      setSubject(book.enrichment.subject || '');
      setJurisdictions(book.enrichment.jurisdiction || []);
      setResourceType(book.enrichment.resourceType || '');
      setTags(book.enrichment.tags || []);
      setNotes(book.enrichment.notes || '');
    } else {
      setSubject('');
      setJurisdictions([]);
      setResourceType('');
      setTags([]);
      setNotes('');
    }
  }, [book]);

  const handleSave = async () => {
    // TODO(api): Replace with PATCH /api/books/:id/enrichment — save enrichment
    await enrichBook(book.id, { subject: subject || null, jurisdiction: jurisdictions, resourceType: resourceType || null, tags, notes });
    addToast({ message: `${book.title} enriched`, type: 'success' });
    onSaved?.();
    onClose();
  };

  const handleDelete = async () => {
    // TODO(api): Replace with DELETE /api/books/:id — remove book
    await deleteBook(book.id);
    addToast({ message: `${book.title} removed`, type: 'info' });
    onSaved?.();
    onClose();
  };

  const toggleJurisdiction = (j) => {
    setJurisdictions((prev) =>
      prev.includes(j) ? prev.filter((x) => x !== j) : [...prev, j]
    );
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags((prev) => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (t) => setTags((prev) => prev.filter((x) => x !== t));

  const isEnriched = subject || jurisdictions.length > 0 || resourceType || tags.length > 0;

  if (!book) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 h-screen w-[400px] animate-slide-in-panel overflow-y-auto bg-white shadow-xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="font-serif text-card-title text-text">{book.title}</h2>
              <p className="mt-0.5 text-xs text-text-secondary">
                {book.author} · {book.edition} Ed
              </p>
              <p className="mt-0.5 text-xs text-text-muted">
                {book.publisher} · ISBN {book.isbn}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-slate-100 hover:text-text"
            >
              <Icon name="solar:close-circle-linear" size={20} />
            </button>
          </div>

          <hr className="my-4 border-border/40" />

          {/* RDA Enrichment */}
          <h3 className="text-sm font-semibold text-text">RDA Enrichment</h3>

          <div className="mt-4 space-y-4">
            {/* Subject */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-text focus:border-brand focus:outline-none"
              >
                <option value="">Select subject...</option>
                {SUBJECT_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Jurisdiction (multi-select chips) */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Jurisdiction</label>
              <div className="flex flex-wrap gap-1.5">
                {JURISDICTION_OPTIONS.map((j) => (
                  <button
                    key={j}
                    type="button"
                    onClick={() => toggleJurisdiction(j)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-200 ${
                      jurisdictions.includes(j)
                        ? 'bg-brand text-white'
                        : 'bg-slate-100 text-text-secondary hover:bg-slate-200'
                    }`}
                  >
                    {j}
                    {jurisdictions.includes(j) && (
                      <span className="ml-1">×</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Resource Type */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Resource Type</label>
              <select
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
                className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-text focus:border-brand focus:outline-none"
              >
                <option value="">Select type...</option>
                {RESOURCE_TYPE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Tags</label>
              <div className="flex flex-wrap items-center gap-1.5">
                {tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-600">
                    {t}
                    <button type="button" onClick={() => removeTag(t)} className="hover:text-blue-800">×</button>
                  </span>
                ))}
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTag()}
                    placeholder="Add tag..."
                    className="w-20 rounded-lg border border-border bg-white px-2 py-1 text-[11px] focus:border-brand focus:outline-none"
                  />
                  <button type="button" onClick={addTag} className="rounded p-0.5 text-text-muted hover:text-brand">
                    <Icon name="solar:add-circle-linear" size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-text focus:border-brand focus:outline-none"
                placeholder="Optional notes..."
              />
            </div>
          </div>

          <hr className="my-4 border-border/40" />

          {/* Status info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary">Status:</span>
              <Badge variant={book.status === 'available' ? 'status' : 'default'}>
                {book.status === 'available' ? 'Available' : 'On Loan'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary">Location:</span>
              <span className="text-xs text-text">{book.location}, Floor {book.floor}</span>
            </div>
          </div>

          <hr className="my-4 border-border/40" />

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="primary" onClick={handleSave} className="flex-1 justify-center">
              Save
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
