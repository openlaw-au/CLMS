import { useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import Icon from '../atoms/Icon';
import Select from '../atoms/Select';
import DropZone from '../molecules/DropZone';

// TODO(api): POST /api/books/import — upload CSV or Excel file, return parsed columns + row count

const MOCK_CSV_COLUMNS = ['Book Title', 'Author Name', 'ISBN Number', 'Shelf Location', 'Purchase Date', 'Price'];
const TARGET_FIELDS = ['Title', 'Author', 'ISBN', 'Location'];
const SKIP_VALUE = 'skip';
const MOCK_IMPORT_COUNT = 247;

// Auto-match CSV column name → CLMS field by keyword
function autoMatchField(csvColumn) {
  const col = csvColumn.toLowerCase();
  if (col.includes('title')) return 'Title';
  if (col.includes('author')) return 'Author';
  if (col.includes('isbn')) return 'ISBN';
  if (col.includes('location') || col.includes('shelf')) return 'Location';
  return SKIP_VALUE;
}

const CsvImportFlow = forwardRef(function CsvImportFlow({ onImported, onPhaseChange }, ref) {
  const [phase, _setPhase] = useState('idle'); // idle | uploading | mapping | done
  const setPhase = (next) => {
    _setPhase(next);
    onPhaseChange?.(next);
  };
  const [fileName, setFileName] = useState('');
  const [progress, setProgress] = useState(0);
  const [mapping, setMapping] = useState(() =>
    MOCK_CSV_COLUMNS.map((col) => ({ csv: col, field: autoMatchField(col) })),
  );
  const startUpload = useCallback((name) => {
    setFileName(name);
    setPhase('uploading');
    setProgress(0);

    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 18 + 4;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setTimeout(() => setPhase('mapping'), 300);
      }
      setProgress(Math.round(current));
    }, 120);
  }, []);

  const handleFile = useCallback(
    (file) => {
      if (!file) return;
      startUpload(file.name);
    },
    [startUpload],
  );

  const handleImport = useCallback(() => {
    setPhase('collapsing');
    setTimeout(() => {
      setPhase('done');
      onImported(MOCK_IMPORT_COUNT);
    }, 300);
  }, [onImported]);

  useImperativeHandle(ref, () => ({
    doImport: handleImport,
    importCount: MOCK_IMPORT_COUNT,
  }), [handleImport]);

  const updateMapping = (index, field) => {
    setMapping((prev) =>
      prev.map((row, i) => (i === index ? { ...row, field } : row)),
    );
  };

  // idle
  if (phase === 'idle') {
    return (
      <DropZone
        icon="solar:folder-open-linear"
        label="Drop file here or click to browse"
        hint="Supports .csv, .xlsx, .xls"
        accept=".csv,.xlsx,.xls"
        onFile={handleFile}
      />
    );
  }

  // uploading
  if (phase === 'uploading') {
    return (
      <div className="rounded-2xl border border-border bg-slate-50 px-6 py-6">
        <div className="flex items-center gap-2 text-sm font-medium text-text">
          <Icon name="solar:document-text-linear" size={18} className="text-text-muted" />
          {fileName}
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-brand transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-text-muted">Uploading... {progress}%</p>
      </div>
    );
  }

  // mapping & collapsing
  if (phase === 'mapping' || phase === 'collapsing') {
    return (
      <div
        className="rounded-2xl border border-border bg-slate-50 px-6 py-6 transition-all duration-300 ease-in-out origin-top"
        style={phase === 'collapsing' ? { opacity: 0, transform: 'scaleY(0.96) translateY(-4px)' } : undefined}
      >
        <p className="text-base font-semibold text-text">Column mapping</p>
        <p className="mt-1 mb-5 text-sm text-text-secondary">
          CLMS needs 4 fields: Title, Author, ISBN, and Location. We matched what we could. Adjust or skip the rest.
        </p>
        <div className="mb-2 flex items-center gap-3 text-[11px] uppercase tracking-wide text-text-muted">
          <span className="w-36 shrink-0">Your CSV</span>
          <span className="w-3.5 shrink-0" />
          <span className="flex-1">CLMS field</span>
        </div>
        <div className="space-y-2">
          {mapping.map((row, index) => {
            const isSkipped = row.field === SKIP_VALUE;
            return (
              <div
                key={row.csv}
                className={`flex items-center gap-3 text-sm ${isSkipped ? 'text-text-muted' : ''}`}
              >
                <span className={`w-36 shrink-0 truncate ${isSkipped ? 'text-text-muted' : 'text-text-secondary'}`}>
                  {row.csv}
                </span>
                <Icon name="solar:arrow-right-linear" size={14} className="shrink-0 text-text-muted" />
                <Select
                  value={row.field}
                  onChange={(e) => updateMapping(index, e.target.value)}
                  className={isSkipped ? 'text-text-muted' : ''}
                >
                  <option value={SKIP_VALUE}>Skip this column</option>
                  <option disabled>──────────</option>
                  {TARGET_FIELDS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </Select>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // done
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-5 motion-fade">
      <Icon name="solar:check-circle-bold" size={22} className="mt-0.5 shrink-0 text-emerald-600" />
      <div>
        <p className="text-sm font-medium text-emerald-800">
          {MOCK_IMPORT_COUNT} books imported
        </p>
        <p className="mt-0.5 text-xs text-emerald-600">
          You can manage them in the Catalogue later.
        </p>
      </div>
    </div>
  );
});

export default CsvImportFlow;
