import { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import Icon from '../atoms/Icon';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import { useToast } from '../../context/ToastContext';
import { addBook } from '../../services/booksService';

const MODAL_CLOSE_MS = 200;
const READER_ID = 'addbook-barcode-reader';
const SUPPORTED_FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.CODABAR,
];
const METADATA_FIELDS = [
  ['Title', 'title'],
  ['Author', 'author'],
  ['Edition', 'edition'],
  ['Publisher', 'publisher'],
];

function MethodCard({ icon, label, desc, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-start gap-3 rounded-2xl border border-border/70 bg-slate-50 px-4 py-4 text-left transition-colors hover:border-brand/30 hover:bg-brand-soft/40"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-brand shadow-sm ring-1 ring-border/60">
        <Icon name={icon} size={20} />
      </span>
      <div>
        <p className="text-sm font-semibold text-text">{label}</p>
        <p className="mt-1 text-xs leading-relaxed text-text-muted">{desc}</p>
      </div>
    </button>
  );
}

function MetadataFields({ form, isbn, setForm, setIsbn, showIsbnField = false }) {
  return (
    <div className="space-y-3">
      {showIsbnField && (
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">ISBN (optional)</label>
          <Input value={isbn} onChange={(event) => setIsbn(event.target.value)} placeholder="978-0-409-343953" />
        </div>
      )}
      {METADATA_FIELDS.map(([label, key]) => (
        <div key={key}>
          <label className="mb-1 block text-xs font-medium text-text-secondary">{label}</label>
          <Input
            value={form[key]}
            onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
          />
        </div>
      ))}
    </div>
  );
}

function ScannerPreview() {
  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-slate-950">
        <div className="relative aspect-[4/3]">
          <div id={READER_ID} className="absolute inset-0" />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-32 w-56">
              <div className="absolute left-0 top-0 h-7 w-7 rounded-tl-lg border-l-[3px] border-t-[3px] border-brand/80" />
              <div className="absolute right-0 top-0 h-7 w-7 rounded-tr-lg border-r-[3px] border-t-[3px] border-brand/80" />
              <div className="absolute bottom-0 left-0 h-7 w-7 rounded-bl-lg border-b-[3px] border-l-[3px] border-brand/80" />
              <div className="absolute bottom-0 right-0 h-7 w-7 rounded-br-lg border-b-[3px] border-r-[3px] border-brand/80" />
              <div
                className="absolute left-3 right-3 h-0.5 rounded-full bg-brand/60"
                style={{ animation: 'scan-line 2s ease-in-out infinite' }}
              />
            </div>
            <p className="absolute bottom-5 rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur-sm">
              Point at a barcode
            </p>
          </div>
        </div>
      </div>
      <p className="text-xs text-text-muted">Once a barcode is detected, CLMS will look up the ISBN and open the review form.</p>
    </div>
  );
}

function ScannerFallback({ errorMsg, onChooseIsbn, onChooseManual }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-slate-50 px-5 py-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
        <Icon name="solar:camera-broken-linear" size={24} />
      </div>
      <p className="mt-4 text-sm font-semibold text-text">Camera unavailable — use ISBN or Manual entry instead.</p>
      <p className="mt-1 text-xs leading-relaxed text-text-muted">{errorMsg}</p>
      <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
        <Button variant="secondary" size="sm" onClick={onChooseIsbn}>Use ISBN</Button>
        <Button variant="secondary" size="sm" onClick={onChooseManual}>Use Manual</Button>
      </div>
    </div>
  );
}

function ScanMethodBody({ onDecoded, onChooseIsbn, onChooseManual }) {
  const [errorMsg, setErrorMsg] = useState('');
  const scannerRef = useRef(null);
  const handledRef = useRef(false);
  const lastBarcodeRef = useRef('');
  const lastBarcodeTimeRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const startScanner = async () => {
      try {
        // TODO(api): Revisit this direct webcam flow if phone-pair scanning diverges from ScanPage.
        const scanner = new Html5Qrcode(READER_ID, { formatsToSupport: SUPPORTED_FORMATS, verbose: false });
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 15, disableFlip: false },
          (decodedText) => {
            if (handledRef.current) return;
            const now = Date.now();
            if (decodedText === lastBarcodeRef.current && now - lastBarcodeTimeRef.current < 3000) return;
            lastBarcodeRef.current = decodedText;
            lastBarcodeTimeRef.current = now;
            handledRef.current = true;
            try { scannerRef.current?.pause(); } catch { /* noop */ }
            onDecoded(decodedText);
          },
          () => {},
        );
        if (!cancelled) setErrorMsg('');
      } catch (error) {
        if (!cancelled) setErrorMsg(error?.message || 'Camera unavailable.');
      }
    };

    const timer = setTimeout(startScanner, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      const scanner = scannerRef.current;
      scannerRef.current = null;
      handledRef.current = false;
      if (scanner) scanner.stop().catch(() => {});
    };
  }, [onDecoded]);

  return errorMsg
    ? <ScannerFallback errorMsg={errorMsg} onChooseIsbn={onChooseIsbn} onChooseManual={onChooseManual} />
    : <ScannerPreview />;
}

export default function AddBookFlow({ onClose, onAdded, prefill = null }) {
  const { addToast } = useToast();
  const hasPrefill = Boolean(prefill);
  const [method, setMethod] = useState(prefill ? 'isbn' : null);
  const [isbn, setIsbn] = useState(prefill?.isbn || '');
  const [loading, setLoading] = useState(false);
  const [looked, setLooked] = useState(Boolean(prefill));
  const [closing, setClosing] = useState(false);
  const [form, setForm] = useState({
    title: prefill?.title || '',
    author: prefill?.author || '',
    edition: prefill?.edition || '',
    publisher: prefill?.publisher || '',
  });

  const requestClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => onClose(), MODAL_CLOSE_MS);
  }, [closing, onClose]);

  const handleLookup = useCallback(async (nextIsbn = isbn) => {
    const normalizedIsbn = nextIsbn.trim();
    if (!normalizedIsbn) return;

    setMethod('isbn');
    setIsbn(normalizedIsbn);
    setLooked(false);
    setLoading(true);

    // TODO(api): Replace with GET /api/isbn/:isbn — ISBN lookup
    await new Promise((resolve) => setTimeout(resolve, 500));

    setForm({
      title: 'Looked Up Title',
      author: 'Auto Author',
      edition: '1st',
      publisher: 'Publisher',
    });
    setLoading(false);
    setLooked(true);
  }, [isbn]);

  const handleScanDecoded = useCallback(async (decodedText) => {
    await handleLookup(decodedText);
  }, [handleLookup]);

  const handleSave = async () => {
    // TODO(api): Replace with POST /api/books — add to catalogue
    const savedBook = await addBook({ ...form, isbn, practiceArea: 'General', jurisdiction: 'Federal' });
    addToast({ message: `${form.title} added to library`, type: 'success' });
    await onAdded?.(savedBook);
    requestClose();
  };

  const renderMethodBody = () => {
    if (method === null) {
      return (
        <div className="mt-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <MethodCard
              icon="solar:document-text-linear"
              label="ISBN"
              desc="Look up metadata from an ISBN."
              onClick={() => setMethod('isbn')}
            />
            <MethodCard
              icon="solar:qr-code-linear"
              label="Scan"
              desc="Use this device camera to read a barcode."
              onClick={() => setMethod('scan')}
            />
            <MethodCard
              icon="solar:pen-linear"
              label="Manual"
              desc="Type the book details yourself."
              onClick={() => setMethod('manual')}
            />
          </div>
        </div>
      );
    }

    if (method === 'scan') {
      return (
        <div className="mt-5">
          <ScanMethodBody
            onDecoded={handleScanDecoded}
            onChooseIsbn={() => setMethod('isbn')}
            onChooseManual={() => setMethod('manual')}
          />
          {!hasPrefill && (
            <button
              type="button"
              onClick={() => setMethod(null)}
              className="mt-3 text-xs font-medium text-text-muted transition-colors hover:text-brand"
            >
              Change method
            </button>
          )}
        </div>
      );
    }

    if (method === 'manual') {
      return (
        <div className="mt-5 space-y-4">
          <MetadataFields
            form={form}
            isbn={isbn}
            setForm={setForm}
            setIsbn={setIsbn}
            showIsbnField
          />
          {!hasPrefill && (
            <button
              type="button"
              onClick={() => setMethod(null)}
              className="text-xs font-medium text-text-muted transition-colors hover:text-brand"
            >
              Change method
            </button>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="primary" onClick={handleSave}>Save to Library</Button>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="mt-5">
          <label className="mb-1.5 block text-xs font-medium text-text-secondary">ISBN</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={isbn}
              onChange={(event) => setIsbn(event.target.value)}
              placeholder="978-0-409-343953"
              className="flex-1"
            />
            <Button variant="secondary" onClick={() => handleLookup()} disabled={loading}>
              {loading ? 'Looking up...' : 'Look up'}
            </Button>
          </div>
          {!hasPrefill && (
            <button
              type="button"
              onClick={() => setMethod(null)}
              className="mt-2 text-xs font-medium text-text-muted transition-colors hover:text-brand"
            >
              Change method
            </button>
          )}
        </div>

        {loading && (
          <div className="mt-4 space-y-2">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-10 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        )}

        {looked && !loading && (
          <div className="mt-4 space-y-4">
            <MetadataFields form={form} isbn={isbn} setForm={setForm} setIsbn={setIsbn} />
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="primary" onClick={handleSave}>Save to Library</Button>
            </div>
          </div>
        )}
      </>
    );
  };

  const modalWidthClassName = method === 'scan' ? 'max-w-2xl' : method === null ? 'max-w-xl' : 'max-w-lg';

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/30 ${closing ? 'motion-fade-out' : 'motion-fade'}`}
        onClick={requestClose}
      />
      <div className={`fixed left-1/2 top-1/2 z-50 max-h-[calc(100vh-1.5rem)] w-[calc(100%-1.5rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl ${modalWidthClassName} ${closing ? 'animate-page-out' : 'animate-page-in'}`}>
        <button
          type="button"
          onClick={requestClose}
          className="absolute right-3 top-3 rounded-full p-1.5 text-text-muted transition-colors duration-150 hover:bg-slate-100 hover:text-text"
        >
          <Icon name="solar:close-linear" size={20} />
        </button>
        <div>
          <h2 className="font-serif text-card-title text-text">Add Book</h2>
          {method === null && <p className="mt-1 text-sm text-text-muted">Choose how you want to add this title to the library.</p>}
        </div>

        {renderMethodBody()}
      </div>
    </>
  );
}
