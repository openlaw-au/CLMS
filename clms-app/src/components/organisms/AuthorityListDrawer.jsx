import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../atoms/Icon';
import Button from '../atoms/Button';
import { getLists, removeItem, updateItem } from '../../services/authorityListsService';
import ExportPreviewModal from './ExportPreviewModal';

const pinpointPlaceholder = (type) => {
  if (type === 'case') return '[45]-[48]';
  if (type === 'legislation') return 's 135';
  return 'ch 4, pp 120-135';
};

/* ── Compact always-visible pinpoint input for drawer ── */
function DrawerPinpointInput({ item, listId, onSaved }) {
  const [value, setValue] = useState(item.pageRange || '');
  const prevRef = useRef(item.pageRange || '');

  useEffect(() => {
    setValue(item.pageRange || '');
    prevRef.current = item.pageRange || '';
  }, [item.pageRange]);

  const save = async () => {
    const trimmed = value.trim();
    if (trimmed === prevRef.current) return;
    await updateItem(listId, item.id, { pageRange: trimmed || null });
    prevRef.current = trimmed;
    onSaved();
  };

  const hasPinpoint = value.trim().length > 0;
  const borderCls = hasPinpoint
    ? 'border-emerald-300 bg-emerald-50/50 focus:border-emerald-400 focus:ring-emerald-200/40'
    : 'border-amber-300 bg-amber-50/50 focus:border-amber-400 focus:ring-amber-200/40';

  return (
    <div className="flex items-center gap-1">
      <Icon name="solar:pin-bold" size={11} className={hasPinpoint ? 'text-emerald-600' : 'text-amber-500'} />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.target.blur(); } }}
        placeholder={pinpointPlaceholder(item.type)}
        className={`w-28 rounded border px-1.5 py-0.5 text-[11px] text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-1 transition-colors ${borderCls}`}
      />
    </div>
  );
}

export default function AuthorityListDrawer({ autoExpandId, refreshKey, onRemove }) {
  const navigate = useNavigate();
  const [lists, setLists] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [selectedListId, setSelectedListId] = useState(null);
  const [showExportPreview, setShowExportPreview] = useState(false);

  const refresh = async () => {
    const data = await getLists();
    setLists(data);
  };

  useEffect(() => {
    // TODO(api): Replace with GET /api/authority-lists — fetch user's lists
    getLists().then((data) => {
      setLists(data);
      if (data.length > 0 && !selectedListId) {
        setSelectedListId(data[0].id);
      }
    });
  }, []);

  // Auto-expand and refresh when item added
  useEffect(() => {
    if (autoExpandId) {
      refresh().then(() => setExpanded(true));
    }
  }, [autoExpandId]);

  // Refresh without expanding (e.g. after parent removes an item)
  useEffect(() => {
    if (refreshKey) refresh();
  }, [refreshKey]);

  const selectedList = lists.find((l) => l.id === selectedListId);
  const totalItems = selectedList ? selectedList.items.length : 0;

  const handleRemoveItem = async (itemId) => {
    if (!selectedListId) return;
    await removeItem(selectedListId, itemId);
    await refresh();
    if (onRemove) onRemove(selectedListId, itemId);
  };

  const handleExport = () => {
    if (selectedList) {
      setShowExportPreview(true);
    }
  };

  if (lists.length === 0) {
    return (
      <div className="fixed bottom-4 left-1/2 z-30 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 md:left-[calc(50%+8rem)] md:w-[calc(100%-18rem)]">
        <div className="rounded-2xl bg-white px-5 py-3 shadow-lg ring-1 ring-black/8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="solar:list-check-linear" size={16} className="text-text-muted" />
              <span className="text-sm text-text-secondary">Authority Lists (0)</span>
            </div>
            <Button size="sm" variant="secondary" onClick={() => navigate('/app/authorities')}>
              <Icon name="solar:add-circle-linear" size={14} />
              New List
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-30 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 md:left-[calc(50%+8rem)] md:w-[calc(100%-18rem)]">
      <div className="rounded-2xl bg-white shadow-lg ring-1 ring-black/8 transition-all duration-300">
        {/* Header — always visible */}
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex w-full items-center justify-between rounded-2xl px-5 py-3 text-left transition-colors hover:bg-slate-50"
        >
          <div className="flex items-center gap-2">
            <Icon
              name={expanded ? 'solar:alt-arrow-down-linear' : 'solar:alt-arrow-up-linear'}
              size={16}
              className="text-text-muted"
            />
            <span className="text-sm font-medium text-text">
              {selectedList?.name || 'Authority Lists'}
            </span>
            <span className="text-xs text-text-muted">· {totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
          </div>
        </button>

        {/* Expanded content */}
        {expanded && selectedList && (
          <div className="border-t border-border/30 px-5 pb-4">
            {selectedList.items.length > 0 ? (
              <div className="mt-3 max-h-64 space-y-1.5 overflow-y-auto">
                {selectedList.items.map((item, idx) => (
                  <div key={item.id} className="rounded-lg bg-slate-50 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="text-xs font-medium text-text-muted">{idx + 1}.</span>
                        <span className="truncate text-sm text-text">{item.title}</span>
                        {item.citation && <span className="shrink-0 text-xs text-text-muted">{item.citation}</span>}
                        <span className={`shrink-0 rounded px-1 py-0.5 text-[9px] font-medium ${item.usage === 'read' ? 'bg-brand/10 text-brand' : 'bg-slate-100 text-text-muted'}`}>
                          {item.usage === 'read' ? 'Read' : 'Ref'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="shrink-0 rounded p-1 text-text-muted transition-colors hover:bg-slate-200 hover:text-red-500"
                      >
                        <Icon name="solar:close-circle-linear" size={14} />
                      </button>
                    </div>
                    {/* Pinpoint — always shown for 'read', shown if exists for 'referred' */}
                    {(item.usage === 'read' || item.pageRange) && (
                      <div className="mt-1 ml-5">
                        <DrawerPinpointInput item={item} listId={selectedListId} onSaved={refresh} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs text-text-muted">No items yet. Add from search results above.</p>
            )}

            <div className="mt-3 flex items-center justify-between">
              <Button size="sm" variant="secondary" onClick={handleExport}>
                <Icon name="solar:document-text-linear" size={14} />
                Export PDF · Court-ready · AGLC4
              </Button>
              {lists.length > 1 && (
                <select
                  value={selectedListId}
                  onChange={(e) => setSelectedListId(e.target.value)}
                  className="rounded-lg border border-border bg-white px-2 py-1 text-xs"
                >
                  {lists.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}
      </div>

      {showExportPreview && selectedList && (
        <ExportPreviewModal list={selectedList} onClose={() => setShowExportPreview(false)} />
      )}
    </div>
  );
}
