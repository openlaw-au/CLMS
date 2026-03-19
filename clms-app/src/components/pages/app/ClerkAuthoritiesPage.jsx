import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../atoms/Icon';
import Button from '../../atoms/Button';
import Skeleton from '../../atoms/Skeleton';
import ContentLoader from '../../atoms/ContentLoader';
import PageHeader from '../../molecules/PageHeader';
import { useToast } from '../../../context/ToastContext';
import { getLists, addItem, updateItem } from '../../../services/authorityListsService';
import { searchAll } from '../../../services/searchService';
import ExportPreviewModal from '../../organisms/ExportPreviewModal';

const pinpointPlaceholder = (type) => {
  if (type === 'case') return 'e.g., [45]-[48]';
  if (type === 'legislation') return 'e.g., s 135';
  return 'e.g., ch 4, pp 120-135';
};

function itemBadge(type) {
  if (type === 'book') return 'bg-orange-50 text-brand';
  if (type === 'case') return 'bg-green-50 text-green-600';
  return 'bg-purple-50 text-purple-600';
}

export default function ClerkAuthoritiesPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [lists, setLists] = useState([]);
  const [listsLoaded, setListsLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ books: [], jade: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const [showExportPreview, setShowExportPreview] = useState(false);

  const startEdit = (item) => {
    setEditingItemId(item.id);
    setEditValue(item.pageRange || '');
  };

  const cancelEdit = () => {
    setEditingItemId(null);
    setEditValue('');
  };

  const saveEdit = async (item) => {
    if (!selected) return;
    const trimmed = editValue.trim();
    await updateItem(selected.id, item.id, { pageRange: trimmed || null });
    const updated = await getLists();
    setLists(updated);
    setEditingItemId(null);
    setEditValue('');
    addToast({ message: trimmed ? 'Pinpoint updated' : 'Pinpoint removed', type: 'success' });
  };

  const handleInlineSearch = useCallback(async (q) => {
    if (!q || q.trim().length < 2) {
      setSearchResults({ books: [], jade: [] });
      return;
    }
    setSearchLoading(true);
    const data = await searchAll(q);
    setSearchResults(data);
    setSearchLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => handleInlineSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, handleInlineSearch]);

  const handleInlineAdd = async (item, type) => {
    if (!selected) return;
    const newItem = {
      type: type === 'jade' ? item.type : 'book',
      title: item.title,
      citation: item.citation || null,
      pageRange: null,

    };
    await addItem(selected.id, newItem);
    // Refresh lists to pick up the new item
    const updated = await getLists();
    setLists(updated);
    addToast({ message: `Added to ${selected.name}`, type: 'success' });
  };

  useEffect(() => {
    // TODO(api): Replace with GET /api/authority-lists — fetch all chambers authority lists
    const min = new Promise((r) => setTimeout(r, 400));
    Promise.all([getLists(), min]).then(([data]) => { setLists(data); setListsLoaded(true); });
  }, []);

  const selected = useMemo(
    () => lists.find((list) => list.id === selectedId) || lists[0] || null,
    [lists, selectedId],
  );

  const totalItems = lists.reduce((acc, list) => acc + list.items.length, 0);
  const readyToExport = lists.filter((list) => list.items.length > 0).length;

  const loading = !listsLoaded;

  return (
    <div className="animate-page-in">
      {/* Header area — skeleton vs real */}
      <ContentLoader
        loading={loading}
        skeleton={
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-7 w-40 rounded-lg" />
              <Skeleton className="mt-2 h-4 w-56 rounded" />
            </div>
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
        }
      >
        <PageHeader title="Authorities" subtitle="Manage shared authority lists used in research and court submissions.">
          <Button size="sm" variant="secondary" onClick={() => navigate('/app/catalogue')}>
            <Icon name="solar:book-2-linear" size={14} />
            Open Catalogue
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => addToast({ message: 'List creation flow is mocked for now', type: 'info' })}
          >
            <Icon name="solar:add-circle-linear" size={14} />
            New List
          </Button>
        </PageHeader>
      </ContentLoader>

      {/* Metric cards — containers always visible */}
      <ContentLoader
        loading={loading}
        className="mt-5 grid gap-3 sm:grid-cols-3"
        skeleton={
          <>
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <Skeleton className="h-7 w-10 rounded-lg" />
                </div>
                <Skeleton className="mt-2 h-4 w-24 rounded" />
              </div>
            ))}
          </>
        }
      >
        {[
          ['Lists', lists.length, 'solar:list-check-linear', 'bg-brand/10', 'text-brand'],
          ['Total Entries', totalItems, 'solar:document-text-linear', 'bg-blue-50', 'text-blue-600'],
          ['Export Ready', readyToExport, 'solar:shield-check-linear', 'bg-emerald-50', 'text-emerald-600'],
        ].map(([label, value, icon, bg, color]) => (
          <article key={label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                <Icon name={icon} size={18} className={color} />
              </span>
              <p className="text-2xl font-semibold text-text">{value}</p>
            </div>
            <p className="mt-2 text-sm text-text-secondary">{label}</p>
          </article>
        ))}
      </ContentLoader>

      {/* Main content grid — containers always visible */}
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {/* Lists sidebar */}
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 lg:col-span-1">
          <ContentLoader
            loading={loading}
            skeleton={
              <>
                <Skeleton className="h-5 w-24 rounded-lg" />
                <div className="mt-3 space-y-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="rounded-xl border border-border/70 p-3">
                      <Skeleton className="h-4 w-36 rounded" />
                      <Skeleton className="mt-2 h-3 w-48 rounded" />
                      <Skeleton className="mt-2 h-3 w-24 rounded" />
                    </div>
                  ))}
                </div>
              </>
            }
          >
            <h2 className="font-serif text-card-title text-text">All Lists</h2>
            <div className="mt-3 space-y-2">
              {lists.map((list) => {
                const active = selected?.id === list.id;
                return (
                  <button
                    key={list.id}
                    type="button"
                    onClick={() => setSelectedId(list.id)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                      active
                        ? 'border-brand/30 bg-brand/5'
                        : 'border-border/70 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-sm font-medium text-text">{list.name}</p>
                    <p className="mt-0.5 text-xs text-text-secondary">{list.caseRef}</p>
                    <p className="mt-1 text-[11px] text-text-muted">{list.items.length} entries</p>
                  </button>
                );
              })}
              {lists.length === 0 && (
                <p className="rounded-xl border border-dashed border-border p-3 text-sm text-text-muted">
                  No lists yet. Add results from Search to start your first authority list.
                </p>
              )}
            </div>
          </ContentLoader>
        </section>

        {/* Detail panel */}
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 lg:col-span-2">
          <ContentLoader
            loading={loading}
            skeleton={
              <>
                <Skeleton className="h-5 w-36 rounded-lg" />
                <Skeleton className="mt-2 h-3 w-48 rounded" />
                <Skeleton className="mt-4 h-3 w-24 rounded" />
              </>
            }
          >
            {selected ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-serif text-section-title text-text">{selected.name}</h2>
                  <p className="mt-1 text-xs text-text-secondary">{selected.caseRef} · {selected.items.length} entries</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={showSearch ? 'secondary' : 'primary'}
                    onClick={() => { setShowSearch(!showSearch); setSearchQuery(''); setSearchResults({ books: [], jade: [] }); }}
                  >
                    <Icon name={showSearch ? 'solar:close-circle-linear' : 'solar:add-circle-linear'} size={14} />
                    {showSearch ? 'Close Search' : 'Add Items'}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setShowExportPreview(true)}
                  >
                    <Icon name="solar:download-linear" size={14} />
                    Export
                  </Button>
                </div>
              </div>

              {/* Inline search panel */}
              {showSearch && (
                <div className="mt-4 rounded-xl border border-brand/20 bg-brand/5 p-4 animate-page-in">
                  <div className="flex items-center gap-3">
                    <Icon name="solar:magnifer-linear" size={16} className="shrink-0 text-text-muted" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Search cases, books, legislation..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent text-sm text-text placeholder:text-text-muted focus:outline-none"
                    />
                    {searchQuery && (
                      <button type="button" onClick={() => { setSearchQuery(''); setSearchResults({ books: [], jade: [] }); }} className="shrink-0 text-text-muted hover:text-text">
                        <Icon name="solar:close-circle-linear" size={16} />
                      </button>
                    )}
                  </div>
                  {/* Skeleton loading */}
                  {searchLoading && (
                    <div className="mt-3 space-y-1.5 animate-pulse border-t border-border/50 pt-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2.5">
                            <div className="h-4 w-4 rounded bg-slate-200" />
                            <div className="space-y-1.5">
                              <div className="h-3.5 w-40 rounded bg-slate-200" />
                              <div className="h-2.5 w-24 rounded bg-slate-100" />
                            </div>
                          </div>
                          <div className="h-6 w-14 rounded-lg bg-slate-100" />
                        </div>
                      ))}
                    </div>
                  )}
                  {!searchLoading && (searchResults.books.length > 0 || searchResults.jade.length > 0) && (
                    <div className="mt-3 max-h-56 space-y-1 overflow-y-auto border-t border-border/50 pt-3">
                      {searchResults.books.map((book) => {
                        const alreadyAdded = selected.items.some((i) => i.title === book.title);
                        return (
                          <div key={book.id} className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-white/60">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Icon name="solar:book-2-linear" size={14} className="shrink-0 text-brand" />
                              <div className="min-w-0">
                                <p className="truncate text-sm text-text">{book.title}</p>
                                <p className="text-[11px] text-text-muted">{book.author} · {book.edition} Ed</p>
                              </div>
                            </div>
                            {alreadyAdded ? (
                              <span className="shrink-0 flex items-center gap-1 text-xs text-emerald-600">
                                <Icon name="solar:check-circle-linear" size={14} /> Added
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleInlineAdd(book, 'book')}
                                className="shrink-0 rounded-lg bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand transition-colors hover:bg-brand/20"
                              >
                                + Add
                              </button>
                            )}
                          </div>
                        );
                      })}
                      {searchResults.jade.map((j) => {
                        const alreadyAdded = selected.items.some((i) => i.title === j.title);
                        return (
                          <div key={j.id} className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-white/60">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Icon name={j.type === 'case' ? 'solar:scale-linear' : 'solar:document-text-linear'} size={14} className={`shrink-0 ${j.type === 'case' ? 'text-emerald-600' : 'text-purple-600'}`} />
                              <div className="min-w-0">
                                <p className="truncate text-sm text-text">{j.title}</p>
                                <p className="text-[11px] text-text-muted">{j.citation}</p>
                              </div>
                            </div>
                            {alreadyAdded ? (
                              <span className="shrink-0 flex items-center gap-1 text-xs text-emerald-600">
                                <Icon name="solar:check-circle-linear" size={14} /> Added
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleInlineAdd(j, 'jade')}
                                className="shrink-0 rounded-lg bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand transition-colors hover:bg-brand/20"
                              >
                                + Add
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {searchQuery.trim().length >= 2 && !searchLoading && searchResults.books.length === 0 && searchResults.jade.length === 0 && (
                    <p className="mt-3 text-xs text-text-muted">No results for "{searchQuery}"</p>
                  )}
                </div>
              )}

              <div className="mt-4 space-y-2">
                {selected.items.map((item, index) => (
                  <article key={item.id} className="rounded-xl border border-border/70 bg-slate-50/40 px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text">{index + 1}. {item.title}</p>
                        <p className="mt-0.5 text-xs text-text-secondary">
                          {item.citation || 'No citation attached yet'}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${itemBadge(item.type)}`}>
                        {item.type === 'book' ? 'Book' : item.type === 'case' ? 'Case' : 'Legislation'}
                      </span>
                    </div>
                    {/* Pinpoint row */}
                    <div className="mt-1.5">
                      {editingItemId === item.id ? (
                        <form
                          className="flex items-center gap-2"
                          onSubmit={(e) => { e.preventDefault(); saveEdit(item); }}
                        >
                          <input
                            type="text"
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Escape') cancelEdit(); }}
                            placeholder={pinpointPlaceholder(item.type)}
                            className="w-44 rounded-lg border border-brand/40 bg-white px-2.5 py-1 text-sm text-text shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                          />
                          <button type="submit" className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100">
                            Save
                          </button>
                          <button type="button" onClick={cancelEdit} className="rounded-lg px-2.5 py-1 text-xs font-medium text-text-secondary transition-colors hover:bg-slate-100">
                            Cancel
                          </button>
                        </form>
                      ) : item.pageRange ? (
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="group inline-flex items-center gap-1.5 rounded-lg bg-brand/5 px-2.5 py-1 text-sm font-medium text-brand transition-colors hover:bg-brand/10"
                        >
                          <Icon name="solar:pin-bold" size={13} />
                          {item.pageRange}
                          <Icon name="solar:pen-2-linear" size={12} className="text-brand/50 transition-opacity group-hover:text-brand" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="group inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-2.5 py-1 text-sm text-text-secondary transition-colors hover:border-brand/40 hover:bg-brand/5 hover:text-brand"
                        >
                          <Icon name="solar:add-circle-linear" size={14} />
                          Add pinpoint
                        </button>
                      )}
                    </div>
                  </article>
                ))}
                {selected.items.length === 0 && (
                  <p className="rounded-xl border border-dashed border-border p-3 text-sm text-text-muted">
                    Add books, cases, or legislation from Search.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-border p-10 text-center">
              <Icon name="solar:list-check-linear" size={22} className="text-text-muted" />
              <p className="mt-3 text-sm font-medium text-text">Select a list to review details</p>
              <p className="mt-1 text-xs text-text-secondary">You can add entries from Search and export AGLC output.</p>
            </div>
          )}
          </ContentLoader>
        </section>
      </div>
      {showExportPreview && selected && (
        <ExportPreviewModal list={selected} onClose={() => setShowExportPreview(false)} />
      )}
    </div>
  );
}
