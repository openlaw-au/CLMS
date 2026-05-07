import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import Icon from '../atoms/Icon';
import Button from '../atoms/Button';
import { MOCK_ISBN_RESULTS } from '../../mocks/isbnResults';
import { pushScannedBook, touchScanSession } from '../../services/scanSync';

// TODO(api): POST /api/scan/session/:id/book — submit scanned barcode to server for ISBN lookup
// TODO(api): WebSocket /api/scan/session/:id — sync scanned books in real-time with desktop session

const READER_ID = 'barcode-reader';
const MAX_MOCK_SCANS = 3;
const HEARTBEAT_MS = 4000;
const DEVICE_ID_KEY = 'clms-scan-device-id';

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

let mockScanIndex = 0;
function getNextMockScan() {
  const book = MOCK_ISBN_RESULTS[mockScanIndex % MOCK_ISBN_RESULTS.length];
  mockScanIndex++;
  return book;
}

function getDeviceId() {
  if (typeof window === 'undefined') return 'scanner-device';
  try {
    const saved = window.localStorage.getItem(DEVICE_ID_KEY);
    if (saved) return saved;
    const next = `scanner-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(DEVICE_ID_KEY, next);
    return next;
  } catch {
    return `scanner-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function getDeviceName() {
  if (typeof navigator === 'undefined') return 'Phone scanner';
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iPhone scanner';
  if (/Android/i.test(ua)) return 'Android scanner';
  return 'Phone scanner';
}

export default function ScanPage() {
  const [phase, setPhase] = useState('idle'); // idle | scanning | looking-up | success | error | done
  const [scannedBooks, setScannedBooks] = useState([]);
  const [lastAdded, setLastAdded] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const scannerRef = useRef(null);
  const isRunningRef = useRef(false);
  const scannedBooksRef = useRef(scannedBooks);
  const lastBarcodeRef = useRef('');
  const lastBarcodeTimeRef = useRef(0);
  const initialSessionId = typeof window !== 'undefined'
    ? (new URLSearchParams(window.location.search).get('session') || 'demo')
    : 'demo';
  const sessionIdRef = useRef(initialSessionId);
  const deviceIdRef = useRef(getDeviceId());
  const deviceNameRef = useRef(getDeviceName());

  useEffect(() => { scannedBooksRef.current = scannedBooks; }, [scannedBooks]);

  useEffect(() => {
    const sendHeartbeat = () => {
      touchScanSession(sessionIdRef.current, {
        deviceId: deviceIdRef.current,
        deviceName: deviceNameRef.current,
      });
    };

    sendHeartbeat();
    const timer = setInterval(sendHeartbeat, HEARTBEAT_MS);
    return () => clearInterval(timer);
  }, []);


  const resumeScanning = useCallback(() => {
    // If we've hit the mock limit, show done state
    if (scannedBooksRef.current.length >= MAX_MOCK_SCANS) {
      setPhase('done');
      return;
    }

    if (scannerRef.current) {
      try {
        scannerRef.current.resume();
        isRunningRef.current = true;
      } catch { /* noop */ }
    }
    setPhase('scanning');
  }, []);

  // Core barcode handler
  const processBarcode = useCallback((decodedText) => {
    if (!isRunningRef.current) return;

    // Cooldown: ignore same barcode within 3s
    const now = Date.now();
    if (decodedText === lastBarcodeRef.current && now - lastBarcodeTimeRef.current < 3000) {
      return;
    }
    lastBarcodeRef.current = decodedText;
    lastBarcodeTimeRef.current = now;

    // Check mock limit
    if (scannedBooksRef.current.length >= MAX_MOCK_SCANS) {
      isRunningRef.current = false;
      if (scannerRef.current) {
        try { scannerRef.current.pause(); } catch { /* noop */ }
      }
      setPhase('done');
      return;
    }

    isRunningRef.current = false;
    if (scannerRef.current) {
      try { scannerRef.current.pause(); } catch { /* noop */ }
    }

    setPhase('looking-up');

    // TODO(api): GET /api/books/isbn/:barcode — look up from real API
    setTimeout(() => {
      const book = getNextMockScan();
      const entry = { ...book, barcode: decodedText, scannedAt: Date.now() };
      const isDuplicate = scannedBooksRef.current.some((b) => b.isbn === book.isbn);

      setLastAdded({ ...entry, isDuplicate });
      setScannedBooks((prev) => [...prev, entry]);
      pushScannedBook(entry, sessionIdRef.current, {
        deviceId: deviceIdRef.current,
        deviceName: deviceNameRef.current,
      });
      setPhase('success');

      // Auto-resume
      setTimeout(() => {
        setLastAdded(null);
        resumeScanning();
      }, isDuplicate ? 2200 : 1600);
    }, 800);
  }, [resumeScanning]);

  const startScanner = useCallback(async () => {
    try {
      const scanner = new Html5Qrcode(READER_ID, {
        formatsToSupport: SUPPORTED_FORMATS,
        verbose: false,
      });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          disableFlip: false,
        },
        (decodedText) => {
          processBarcode(decodedText);
        },
        () => {},
      );

      isRunningRef.current = true;
      setPhase('scanning');
    } catch (err) {
      setErrorMsg(err?.message || 'Camera access denied');
      setPhase('error');
    }
  }, [processBarcode]);

  useEffect(() => {
    const timer = setTimeout(() => startScanner(), 300);
    return () => {
      clearTimeout(timer);
      isRunningRef.current = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetry = useCallback(() => {
    setPhase('idle');
    setErrorMsg('');
    setTimeout(() => startScanner(), 300);
  }, [startScanner]);

  const handleSimulateScan = useCallback(() => {
    isRunningRef.current = true;
    const fakeBarcode = `978${Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')}`;
    processBarcode(fakeBarcode);
  }, [processBarcode]);

  const remaining = MAX_MOCK_SCANS - scannedBooks.length;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#0b1220' }}>
      {/* ── Header — logo only ── */}
      <div className="relative z-20 flex items-center justify-center px-4 py-3" style={{ background: 'rgba(11,18,32,0.85)', backdropFilter: 'blur(12px)' }}>
        <img
          src="/assets/CLMS_logo.svg"
          alt="CLMS"
          className="h-5 w-auto brightness-0 invert opacity-80"
        />
      </div>

      {/* ── Camera viewfinder ── */}
      <div className="relative flex-1 overflow-hidden">
        <div id={READER_ID} className="absolute inset-0" />

        {/* Corner bracket overlay */}
        {(phase === 'scanning' || phase === 'idle') && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-36 w-60">
              <div className="absolute left-0 top-0 h-7 w-7 border-l-[3px] border-t-[3px] border-brand/80 rounded-tl-lg" />
              <div className="absolute right-0 top-0 h-7 w-7 border-r-[3px] border-t-[3px] border-brand/80 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 h-7 w-7 border-b-[3px] border-l-[3px] border-brand/80 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 h-7 w-7 border-b-[3px] border-r-[3px] border-brand/80 rounded-br-lg" />
              <div
                className="absolute left-3 right-3 h-0.5 bg-brand/50 rounded-full"
                style={{ animation: 'scan-line 2s ease-in-out infinite' }}
              />
            </div>
            <p className="absolute bottom-6 rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-white/60 backdrop-blur-sm">
              Point at any barcode
            </p>
          </div>
        )}

        {/* Looking up */}
        {phase === 'looking-up' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: 'rgba(11,18,32,0.7)', backdropFilter: 'blur(4px)' }}>
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/10 px-8 py-6 backdrop-blur-md">
              <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-white/20 border-t-brand" />
              <p className="text-sm font-medium text-white/80">Looking up book...</p>
            </div>
          </div>
        )}

        {/* Success */}
        {phase === 'success' && lastAdded && (
          <div className="absolute inset-0 flex items-end justify-center" style={{ background: 'rgba(11,18,32,0.5)', backdropFilter: 'blur(2px)' }}>
            <div className="motion-fade mx-4 mb-4 w-full max-w-sm space-y-2">
              {lastAdded.isDuplicate && (
                <div className="flex items-center gap-2 rounded-xl bg-amber-500/20 px-4 py-2.5 backdrop-blur-md">
                  <Icon name="solar:copy-linear" size={16} className="text-amber-400" />
                  <p className="text-xs font-medium text-amber-300">Duplicate. Will consolidate on desktop.</p>
                </div>
              )}
              <div className="overflow-hidden rounded-2xl border border-white/10 backdrop-blur-xl" style={{ background: 'rgba(11,18,32,0.85)' }}>
                <div className="flex items-center gap-2 bg-emerald-600 px-4 py-2.5">
                  <Icon name="solar:check-circle-bold" size={18} className="text-white" />
                  <p className="text-sm font-semibold text-white">Added to library!</p>
                </div>
                <div className="flex items-start gap-3 px-4 py-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                    <Icon name="solar:book-2-linear" size={20} className="text-brand" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{lastAdded.title}</p>
                    <p className="mt-0.5 text-xs text-white/60">{lastAdded.author}</p>
                    <p className="mt-1 font-mono text-xs text-white/40">{lastAdded.isbn}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Done — max mock scans reached */}
        {phase === 'done' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-8" style={{ background: 'rgba(11,18,32,0.9)' }}>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15">
              <Icon name="solar:check-circle-bold" size={36} className="text-emerald-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-white">{scannedBooks.length} books scanned</p>
              <p className="mt-1 text-xs text-white/50">Check the scan history below to review.</p>
            </div>
          </div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-8" style={{ background: 'rgba(11,18,32,0.95)' }}>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/15">
              <Icon name="solar:camera-broken-linear" size={32} className="text-red-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-white">Camera access required</p>
              <p className="mt-1 text-xs text-white/50">{errorMsg}</p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleRetry}
              className="rounded-xl px-6 py-2.5"
            >
              Try again
            </Button>
          </div>
        )}

        {/* ── History slide-up panel ── */}
        <div
          className={`absolute inset-x-0 bottom-0 z-40 transition-transform duration-300 ease-in-out ${
            showHistory ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="max-h-[60vh] overflow-hidden rounded-t-2xl border-t border-white/10" style={{ background: 'rgba(11,18,32,0.95)', backdropFilter: 'blur(20px)' }}>
            <button
              type="button"
              onClick={() => setShowHistory(false)}
              className="flex w-full items-center justify-center pt-3 pb-1"
            >
              <div className="h-1 w-8 rounded-full bg-white/20" />
            </button>
            <div className="flex items-center justify-between px-4 pb-3">
              <p className="text-sm font-semibold text-white">
                Scan history ({scannedBooks.length})
              </p>
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="rounded-lg bg-white/10 px-3 py-1 text-xs font-medium text-white/70 transition-colors hover:bg-white/15"
              >
                Close
              </button>
            </div>
            <div className="overflow-y-auto px-4 pb-4" style={{ maxHeight: 'calc(60vh - 72px)' }}>
              {scannedBooks.length === 0 ? (
                <p className="py-8 text-center text-xs text-white/30">No books scanned yet</p>
              ) : (
                <div className="space-y-2">
                  {[...scannedBooks].reverse().map((book, i) => {
                    const isbnCount = scannedBooks.filter((b) => b.isbn === book.isbn).length;
                    return (
                      <div
                        key={`${book.isbn}-${book.scannedAt}-${i}`}
                        className="flex items-start gap-3 rounded-xl bg-white/5 px-3 py-2.5 border border-white/5"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50">
                          <Icon name="solar:book-2-linear" size={16} className="text-brand" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2">
                            <p className="truncate font-serif text-sm font-medium text-white/90">{book.title}</p>
                            {isbnCount > 1 && (
                              <span className="shrink-0 rounded-md bg-amber-500/20 px-1.5 py-0.5 text-2xs font-semibold text-amber-400">
                                x{isbnCount}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-white/50">{book.author}</p>
                          <p className="mt-0.5 font-mono text-xs text-white/25">{book.isbn}</p>
                        </div>
                        <p className="shrink-0 text-2xs text-white/25">
                          {new Date(book.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="relative z-20 flex items-center gap-2 px-4 py-3" style={{ background: 'rgba(11,18,32,0.85)', backdropFilter: 'blur(12px)' }}>
        {/* History toggle */}
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className={`flex flex-1 items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
            scannedBooks.length > 0
              ? 'bg-white/10 text-white hover:bg-white/15'
              : 'bg-white/5 text-white/40'
          }`}
        >
          <Icon name="solar:book-2-linear" size={16} />
          <span>{scannedBooks.length} book{scannedBooks.length !== 1 ? 's' : ''} scanned</span>
          {scannedBooks.length > 0 && (
            <Icon
              name="solar:alt-arrow-up-linear"
              size={14}
              className={`ml-auto transition-transform duration-200 ${showHistory ? 'rotate-180' : ''}`}
            />
          )}
        </button>

        {/* Simulate — ghost button, not primary */}
        {(phase === 'scanning' || phase === 'idle' || phase === 'error') && remaining > 0 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleSimulateScan(); }}
            className="shrink-0 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs font-medium text-white/50 transition-colors hover:bg-white/10 hover:text-white/70"
          >
            Simulate ({remaining})
          </button>
        )}
      </div>
    </div>
  );
}
