import { useState, useCallback } from 'react';
import Icon from '../atoms/Icon';
import Button from '../atoms/Button';
import Select from '../atoms/Select';
import DropZone from '../molecules/DropZone';

// TODO(api): POST /api/books/import — upload CSV or Excel file, return parsed columns + row count

const MOCK_CSV_COLUMNS = ['Book Title', 'Author Name', 'ISBN Number', 'Shelf Location'];
const TARGET_FIELDS = ['Title', 'Author', 'ISBN', 'Location'];
const MOCK_IMPORT_COUNT = 247;

export default function CsvImportFlow({ onImported }) {
  const [phase, setPhase] = useState('idle'); // idle | uploading | mapping | done
  const [fileName, setFileName] = useState('');
  const [progress, setProgress] = useState(0);
  const [mapping, setMapping] = useState(() =>
    MOCK_CSV_COLUMNS.map((col, i) => ({ csv: col, field: TARGET_FIELDS[i] })),
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

  const handleImport = () => {
    setPhase('done');
    onImported(MOCK_IMPORT_COUNT);
  };

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

  // mapping
  if (phase === 'mapping') {
    return (
      <div className="rounded-2xl border border-border bg-slate-50 px-6 py-6">
        <p className="text-sm font-medium text-text">Column mapping</p>
        <p className="mt-1 mb-4 text-xs text-text-muted">
          We auto-matched your columns. Review and adjust if needed.
        </p>
        <div className="mb-2 flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-text-muted">
          <span className="w-36 shrink-0">Your CSV</span>
          <span className="w-3.5 shrink-0" />
          <span className="flex-1">CLMS field</span>
        </div>
        <div className="space-y-2">
          {mapping.map((row, index) => (
            <div
              key={row.csv}
              className="flex items-center gap-3 text-sm"
            >
              <span className="w-36 shrink-0 truncate text-text-secondary">{row.csv}</span>
              <Icon name="solar:arrow-right-linear" size={14} className="shrink-0 text-text-muted" />
              <Select
                value={row.field}
                onChange={(e) => updateMapping(index, e.target.value)}
              >
                {TARGET_FIELDS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </Select>
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-end">
          <Button size="sm" onClick={handleImport}>
            Import {MOCK_IMPORT_COUNT} books
          </Button>
        </div>
      </div>
    );
  }

  // done
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-5">
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
}
