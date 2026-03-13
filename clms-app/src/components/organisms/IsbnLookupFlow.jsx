import { useState, useCallback, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Icon from '../atoms/Icon';
import { MOCK_ISBN_RESULTS, getMockBooksForPaste } from '../../mocks/isbnResults';
import { startPolling } from '../../services/scanSync';

// TODO(api): POST /api/scan/session — create a scan session, returns session ID + QR URL
// TODO(api): WebSocket /api/scan/session/:id — real-time book arrivals from connected phones
// TODO(api): POST /api/scan/session/:id/consolidate — merge duplicate entries

const MOCK_DEVICES = ['Sean\'s iPhone', 'Alex\'s Galaxy', 'Jamie\'s Pixel'];
const DEFAULT_SCAN_URL = 'https://clms-app.vercel.app';

export default function IsbnLookupFlow({ mode, addedBooks, onAddBooks, onRemoveBook, onEditBook, onPhaseChange }) {
  // Scan mode state
  const [scanPhase, setScanPhase] = useState('qr'); // qr | connecting | connected | receiving
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [receivingBooks, setReceivingBooks] = useState([]); // books with device + arrivedAt metadata
  const receivingTimerRef = useRef(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', author: '', isbn: '' });
  const [consolidatingIsbns, setConsolidatingIsbns] = useState(new Set());
  const sessionIdRef = useRef(`scan-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`);
  const onAddBooksRef = useRef(onAddBooks);

  // Paste mode state
  const [pastePhase, setPastePhase] = useState('idle'); // idle | looking-up | results | added
  const [pasteText, setPasteText] = useState('');
  const [pasteResults, setPasteResults] = useState([]);

  const updatePhase = useCallback((phase) => {
    onPhaseChange?.(phase);
  }, [onPhaseChange]);

  const scanPhaseRef = useRef(scanPhase);
  useEffect(() => { scanPhaseRef.current = scanPhase; }, [scanPhase]);
  useEffect(() => { onAddBooksRef.current = onAddBooks; }, [onAddBooks]);

  // Cleanup receiving timer on unmount
  useEffect(() => {
    return () => {
      if (receivingTimerRef.current) clearInterval(receivingTimerRef.current);
    };
  }, []);

  // --- Poll for books arriving from ScanPage (cross-device API sync) ---
  useEffect(() => {
    if (mode !== 'scan') return;

    const stopPolling = startPolling((payload) => {
      const {
        newBooks = [],
        connectedDevices: deviceList = [],
        connectedCount = 0,
        hasBookDelta = false,
      } = payload || {};

      if (connectedCount > 0) {
        const names = deviceList.map((device) => device?.name).filter(Boolean);
        setConnectedDevices(names.length > 0 ? names : ['Phone scanner']);
        if (scanPhaseRef.current === 'qr') {
          setScanPhase('connected');
          updatePhase('scanning');
        }
      }

      if (!hasBookDelta || newBooks.length === 0) return;

      if (scanPhaseRef.current !== 'receiving') {
        setScanPhase('receiving');
      }

      const fallbackDevice = deviceList[0]?.name || 'Phone scanner';
      const entries = newBooks.map((book) => ({
        ...book,
        device: book.deviceName || fallbackDevice,
        arrivedAt: book.syncedAt || Date.now(),
      }));
      setReceivingBooks((prev) => [...prev, ...entries]);
      onAddBooksRef.current(newBooks.map(({ title, author, isbn }) => ({ title, author, isbn })));
      updatePhase('idle');
    }, 1500, sessionIdRef.current);

    return stopPolling;
  }, [mode, updatePhase]);

  // --- Duplicate detection ---
  const getDuplicates = useCallback(() => {
    const isbnCount = {};
    addedBooks.forEach((book) => {
      isbnCount[book.isbn] = (isbnCount[book.isbn] || 0) + 1;
    });
    return Object.entries(isbnCount)
      .filter(([, count]) => count > 1)
      .map(([isbn, count]) => {
        const book = addedBooks.find((b) => b.isbn === isbn);
        return { isbn, title: book.title, count };
      });
  }, [addedBooks]);

  const handleConsolidate = useCallback(() => {
    // TODO(api): POST /api/scan/session/:id/consolidate — deduplicate scanned books
    // 1. Mark duplicate ISBNs for animation
    const dupIsbns = new Set(getDuplicates().map((d) => d.isbn));
    setConsolidatingIsbns(dupIsbns);

    // 2. After animation completes, actually remove duplicates
    setTimeout(() => {
      const seen = new Set();
      const deduped = addedBooks.filter((book) => {
        if (seen.has(book.isbn)) return false;
        seen.add(book.isbn);
        return true;
      });
      onAddBooks(deduped, true);
      setConsolidatingIsbns(new Set());
    }, 500);
  }, [addedBooks, onAddBooks, getDuplicates]);

  // --- Edit / Delete handlers ---
  const handleStartEdit = useCallback((index) => {
    const book = addedBooks[index];
    setEditForm({ title: book.title, author: book.author, isbn: book.isbn });
    setEditingIndex(index);
  }, [addedBooks]);

  const handleSaveEdit = useCallback(() => {
    if (editingIndex === null) return;
    onEditBook?.(editingIndex, editForm);
    setEditingIndex(null);
  }, [editingIndex, editForm, onEditBook]);

  const handleCancelEdit = useCallback(() => {
    setEditingIndex(null);
  }, []);

  // --- Scan mode: simulate connection ---
  const handleSimulateConnection = useCallback(() => {
    setScanPhase('connecting');
    updatePhase('scanning');

    // Build sequence with guaranteed duplicates for consolidate demo
    const sequence = [
      MOCK_ISBN_RESULTS[0], // Principles of Administrative Law — Sean's iPhone
      MOCK_ISBN_RESULTS[1], // Evidence Law in Queensland — Alex's Galaxy
      MOCK_ISBN_RESULTS[2], // Contract Law in Australia — Sean's iPhone
      MOCK_ISBN_RESULTS[0], // DUPLICATE — Alex's Galaxy (same book scanned on different device)
      MOCK_ISBN_RESULTS[3], // Australian Constitutional Law — Sean's iPhone
      MOCK_ISBN_RESULTS[1], // DUPLICATE — Sean's iPhone
    ];

    setTimeout(() => {
      setConnectedDevices([MOCK_DEVICES[0]]);
      setScanPhase('connected');

      setTimeout(() => {
        setScanPhase('receiving');

        // Add a second device after 3s
        setTimeout(() => {
          setConnectedDevices((prev) => [...prev, MOCK_DEVICES[1]]);
        }, 3000);

        let received = 0;

        receivingTimerRef.current = setInterval(() => {
          if (received >= sequence.length) {
            clearInterval(receivingTimerRef.current);
            receivingTimerRef.current = null;
            setTimeout(() => updatePhase('idle'), 600);
            return;
          }

          const book = sequence[received];
          const device = MOCK_DEVICES[received % 2];
          const entry = { ...book, device, arrivedAt: Date.now() };

          setReceivingBooks((prev) => [...prev, entry]);
          onAddBooks([book]);
          received++;
        }, 1800);
      }, 1000);
    }, 2000);
  }, [updatePhase, onAddBooks]);

  // --- Paste mode handlers ---
  const handleLookup = useCallback(() => {
    const lines = pasteText.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    setPastePhase('looking-up');
    updatePhase('looking-up');
    setTimeout(() => {
      const books = getMockBooksForPaste(lines.length);
      setPasteResults(books);
      setPastePhase('results');
      updatePhase('results');
    }, 1000);
  }, [pasteText, updatePhase]);

  const handleAddPasteResults = useCallback(() => {
    const existingIsbns = new Set(addedBooks.map((b) => b.isbn));
    const newOnly = pasteResults.filter((b) => !existingIsbns.has(b.isbn));
    if (newOnly.length > 0) onAddBooks(newOnly);
    setPastePhase('added');
    setPasteText('');
    setPasteResults([]);
    updatePhase('idle');
  }, [pasteResults, addedBooks, onAddBooks, updatePhase]);

  const handlePasteReset = useCallback(() => {
    setPastePhase('idle');
    updatePhase('idle');
  }, [updatePhase]);

  const duplicates = getDuplicates();
  const scanBaseUrl = (import.meta.env.VITE_SCAN_URL || DEFAULT_SCAN_URL).replace(/\/$/, '');
  const sessionUrl = `${scanBaseUrl}/scan?session=${encodeURIComponent(sessionIdRef.current)}`;

  // --- Scan mode UI ---
  if (mode === 'scan') {
    return (
      <div className="space-y-4">
        {/* QR Phase */}
        {scanPhase === 'qr' && (
          <div className="motion-fade flex flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 py-8">
            <QRCodeSVG
              value={sessionUrl}
              size={180}
              level="M"
              includeMargin={false}
              bgColor="transparent"
              fgColor="#1e293b"
            />
            <div className="text-center">
              <p className="text-sm font-medium text-text-secondary">Scan this code with your phone</p>
              <p className="mt-1 text-xs text-text-muted">Multiple phones can connect at the same time</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
              <span className="text-xs text-text-muted">Waiting for scans...</span>
            </div>
            <button
              type="button"
              onClick={handleSimulateConnection}
              className="text-xs font-medium text-brand hover:text-brand-hover"
            >
              Simulate a connection
            </button>
          </div>
        )}

        {/* Connecting */}
        {scanPhase === 'connecting' && (
          <div className="motion-fade flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-brand/30 bg-brand/5 py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            <p className="text-sm font-medium text-brand">Connecting to your phone...</p>
          </div>
        )}

        {/* Connected flash */}
        {scanPhase === 'connected' && (
          <div className="motion-fade flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-emerald-300 bg-emerald-50 py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <Icon name="solar:check-circle-bold" size={28} className="text-emerald-600" />
            </div>
            <p className="text-sm font-semibold text-emerald-700">Connected!</p>
            <p className="text-xs text-emerald-600">{connectedDevices[0]}</p>
          </div>
        )}

        {/* Receiving — mini QR + connection bar */}
        {scanPhase === 'receiving' && (
          <div className="motion-fade space-y-3">
            <div className="flex items-center gap-4 rounded-xl border border-border bg-white px-4 py-3">
              <QRCodeSVG value={sessionUrl} size={48} level="L" bgColor="transparent" fgColor="#1e293b" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
                  <span className="text-xs font-medium text-emerald-700">
                    {connectedDevices.length} device{connectedDevices.length !== 1 ? 's' : ''} connected
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-text-muted">{connectedDevices.join(', ')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Scanned books list with edit/delete */}
        <ScannedBooksList
          books={addedBooks}
          duplicates={duplicates}
          consolidatingIsbns={consolidatingIsbns}
          editingIndex={editingIndex}
          editForm={editForm}
          onEditForm={setEditForm}
          onStartEdit={handleStartEdit}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={handleCancelEdit}
          onRemove={onRemoveBook}
          onConsolidate={handleConsolidate}
          receivingBooks={receivingBooks}
        />
      </div>
    );
  }

  // --- Paste mode UI ---
  return (
    <div className="space-y-4">
      {pastePhase === 'idle' && (
        <div className="motion-fade space-y-3">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={"978-0-123456-78-9\n978-0-987654-32-1"}
            rows={4}
            className="w-full rounded-xl border border-border bg-white px-4 py-3 font-mono text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
          />
          <button
            type="button"
            onClick={handleLookup}
            disabled={!pasteText.trim()}
            className="w-full rounded-xl border border-brand bg-white px-4 py-2.5 text-sm font-medium text-brand transition-colors hover:bg-orange-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Look up
          </button>
        </div>
      )}

      {pastePhase === 'looking-up' && (
        <div className="motion-fade flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-slate-50 py-10">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <p className="text-sm font-medium text-text-secondary">
            Looking up {pasteText.split('\n').filter((l) => l.trim()).length} ISBNs...
          </p>
        </div>
      )}

      {pastePhase === 'results' && (
        <div className="motion-fade space-y-3">
          {(() => {
            const existingIsbns = new Set(addedBooks.map((b) => b.isbn));
            const dupCount = pasteResults.filter((b) => existingIsbns.has(b.isbn)).length;
            return (
              <>
                <div className="space-y-2">
                  {pasteResults.map((book, i) => {
                    const isDup = existingIsbns.has(book.isbn);
                    return (
                      <div key={`${book.isbn}-${i}`} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${isDup ? 'border-amber-200 bg-amber-50' : 'border-border bg-white'}`}>
                        <Icon name={isDup ? 'solar:copy-linear' : 'solar:check-circle-bold'} size={18} className={`shrink-0 ${isDup ? 'text-amber-500' : 'text-emerald-500'}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium text-text">{book.title}</p>
                            {isDup && (
                              <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                                DUP
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-secondary">{book.author}</p>
                        </div>
                        <p className="shrink-0 text-xs text-text-muted font-mono">{book.isbn}</p>
                      </div>
                    );
                  })}
                </div>
                {dupCount > 0 && dupCount < pasteResults.length && (
                  <p className="text-xs text-amber-600">
                    {dupCount} already in your list and won't be added again.
                  </p>
                )}
                {dupCount === pasteResults.length ? (
                  <div className="space-y-3">
                    <p className="text-sm text-amber-700">
                      All {dupCount} book{dupCount !== 1 ? 's are' : ' is'} already in your list.
                    </p>
                    <button
                      type="button"
                      onClick={handlePasteReset}
                      className="w-full rounded-xl border border-brand bg-white px-4 py-2.5 text-sm font-medium text-brand transition-colors hover:bg-orange-50"
                    >
                      Try different ISBNs
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleAddPasteResults}
                    className="w-full rounded-xl border border-brand bg-white px-4 py-2.5 text-sm font-medium text-brand transition-colors hover:bg-orange-50"
                  >
                    Add {pasteResults.length - dupCount} new book{pasteResults.length - dupCount !== 1 ? 's' : ''} to library
                  </button>
                )}
              </>
            );
          })()}
        </div>
      )}

      {pastePhase === 'added' && (
        <div className="motion-fade space-y-3">
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-5">
            <Icon name="solar:check-circle-bold" size={22} className="mt-0.5 shrink-0 text-emerald-600" />
            <div>
              <p className="text-sm font-medium text-emerald-800">
                {addedBooks.length} book{addedBooks.length !== 1 ? 's' : ''} added via ISBN
              </p>
              <p className="mt-0.5 text-xs text-emerald-600">
                You can paste more ISBNs or continue to the next step.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handlePasteReset}
            className="w-full rounded-xl border border-brand bg-white px-4 py-2.5 text-sm font-medium text-brand transition-colors hover:bg-orange-50"
          >
            Paste more ISBNs
          </button>
        </div>
      )}

      {/* Scanned books with edit/delete (paste mode too) */}
      {addedBooks.length > 0 && (
        <ScannedBooksList
          books={addedBooks}
          duplicates={duplicates}
          consolidatingIsbns={consolidatingIsbns}
          editingIndex={editingIndex}
          editForm={editForm}
          onEditForm={setEditForm}
          onStartEdit={handleStartEdit}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={handleCancelEdit}
          onRemove={onRemoveBook}
          onConsolidate={handleConsolidate}
        />
      )}
    </div>
  );
}

// ─── Scanned Books List with orange icon, edit, delete, consolidate ───

function ScannedBooksList({
  books,
  duplicates,
  consolidatingIsbns,
  editingIndex,
  editForm,
  onEditForm,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onRemove,
  onConsolidate,
  receivingBooks,
}) {
  if (books.length === 0) return null;

  const isConsolidating = consolidatingIsbns.size > 0;

  // Find which books are duplicates for badge
  const isbnCount = {};
  books.forEach((b) => {
    isbnCount[b.isbn] = (isbnCount[b.isbn] || 0) + 1;
  });

  // Track first occurrence of each ISBN for consolidate animation
  const firstOccurrence = {};
  books.forEach((book, i) => {
    if (firstOccurrence[book.isbn] === undefined) firstOccurrence[book.isbn] = i;
  });

  return (
    <div className="motion-fade space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
          Scanned ({books.length})
        </p>
      </div>

      {/* Consolidate banner */}
      {duplicates.length > 0 && (
        <div
          className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 transition-all duration-300"
          style={isConsolidating ? { opacity: 0, maxHeight: 0, padding: 0, marginBottom: 0, overflow: 'hidden' } : {}}
        >
          <Icon name="solar:copy-linear" size={20} className="shrink-0 text-amber-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-amber-800">
              {duplicates.length} duplicate{duplicates.length !== 1 ? 's' : ''} detected
            </p>
            <p className="mt-0.5 text-xs text-amber-600">
              {duplicates.map((d) => `"${d.title}" (x${d.count})`).join(', ')}
            </p>
          </div>
          <button
            type="button"
            onClick={onConsolidate}
            disabled={isConsolidating}
            className="shrink-0 rounded-full border border-brand bg-white px-5 py-2 text-sm font-medium text-brand transition-colors hover:bg-orange-50 disabled:opacity-50"
          >
            Consolidate
          </button>
        </div>
      )}

      {/* Book items */}
      <div className="space-y-2">
        {books.map((book, i) => {
          const isDup = isbnCount[book.isbn] > 1;
          const isEditing = editingIndex === i;
          const receiveInfo = receivingBooks?.find((rb) => rb.isbn === book.isbn && rb.arrivedAt);

          // Consolidate animation states
          const isBeingRemoved = consolidatingIsbns.has(book.isbn) && firstOccurrence[book.isbn] !== i;
          const isBeingKept = consolidatingIsbns.has(book.isbn) && firstOccurrence[book.isbn] === i;

          if (isEditing) {
            return (
              <div key={`edit-${i}`} className="motion-fade rounded-xl border-2 border-brand/40 bg-brand/5 p-3 space-y-2">
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => onEditForm({ ...editForm, title: e.target.value })}
                  className="w-full rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-text focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  placeholder="Title"
                />
                <input
                  type="text"
                  value={editForm.author}
                  onChange={(e) => onEditForm({ ...editForm, author: e.target.value })}
                  className="w-full rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-text focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  placeholder="Author"
                />
                <input
                  type="text"
                  value={editForm.isbn}
                  onChange={(e) => onEditForm({ ...editForm, isbn: e.target.value })}
                  className="w-full rounded-lg border border-border bg-white px-3 py-1.5 font-mono text-xs text-text focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  placeholder="ISBN"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={onCancelEdit}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onSaveEdit}
                    className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-hover"
                  >
                    Save
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={`${book.isbn}-${i}`}
              className={`group flex items-start gap-3 rounded-xl border bg-white px-3 py-3 transition-all duration-400 ease-in-out ${
                isBeingKept
                  ? 'border-emerald-300 ring-2 ring-emerald-200 shadow-md'
                  : isBeingRemoved
                    ? 'border-border'
                    : 'motion-fade border-border hover:border-slate-300 hover:shadow-sm'
              }`}
              style={isBeingRemoved ? {
                maxHeight: 0,
                opacity: 0,
                transform: 'scaleY(0.6) translateY(-8px)',
                padding: 0,
                marginBottom: 0,
                overflow: 'hidden',
                borderWidth: 0,
              } : undefined}
            >
              {/* Book icon — green flash when kept */}
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-300 ${
                isBeingKept ? 'bg-emerald-100' : 'bg-orange-50'
              }`}>
                <Icon
                  name={isBeingKept ? 'solar:check-circle-bold' : 'solar:book-2-linear'}
                  size={18}
                  className={`transition-colors duration-300 ${isBeingKept ? 'text-emerald-600' : 'text-brand'}`}
                />
              </div>

              {/* Book info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <p className="truncate text-sm font-medium text-text">{book.title}</p>
                  {isDup && !isConsolidating && (
                    <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                      DUP
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-text-secondary">{book.author}</p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="font-mono text-xs text-text-muted">{book.isbn}</p>
                  {receiveInfo?.device && (
                    <>
                      <span className="text-text-muted">·</span>
                      <p className="text-xs text-text-muted">{receiveInfo.device}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Edit / Delete actions — hide during consolidation */}
              {!isConsolidating && (
                <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => onStartEdit(i)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-slate-100 hover:text-text-secondary"
                    title="Edit"
                  >
                    <Icon name="solar:pen-linear" size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove?.(i)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-red-50 hover:text-red-500"
                    title="Remove"
                  >
                    <Icon name="solar:trash-bin-minimalistic-linear" size={14} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
