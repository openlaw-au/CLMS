import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../../atoms/Icon';
import Input from '../../atoms/Input';
import Button from '../../atoms/Button';
import SearchResultCard from '../../molecules/SearchResultCard';
import FilterPillBar from '../../molecules/FilterPillBar';
import { useAppContext } from '../../../context/AppContext';
import { useToast } from '../../../context/ToastContext';
import { suggestedBarristerQueries } from '../../../mocks/barristerQueries';
import { searchAll } from '../../../services/searchService';
import { requestLoan, requestReturn } from '../../../services/loansService';
import { membersMock } from '../../../mocks/members';
import { getLists, addItem, createList, removeItem } from '../../../services/authorityListsService';
import { addQueueEntry, dismissQueueItemBySource } from '../../../services/uncataloguedQueueService';


export default function BarristerSearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { onboarding, clearFirstVisit } = useAppContext();
  const { addToast } = useToast();
  const firstVisit = onboarding.firstVisit !== false;
  const mode = searchParams.get('mode') || onboarding.mode || 'joined';
  const queryParam = searchParams.get('q') || '';
  const listIdParam = searchParams.get('listId');

  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ books: [], jade: [] });
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [filters, setFilters] = useState({ source: 'all', subject: 'all', jurisdiction: 'all', type: 'all', availability: 'all' });

  // Focused mode: active list context (APP-003)
  const [activeList, setActiveList] = useState(null);
  const focusedMode = Boolean(listIdParam && activeList);

  // List picker popover state (casual mode only)
  const [pendingItem, setPendingItem] = useState(null);
  const [allLists, setAllLists] = useState([]);
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListRef, setNewListRef] = useState('');
  const [addedResultMap, setAddedResultMap] = useState({});

  const getResultKey = (item, type) => `${type}:${item.id ?? item.title}`;

  useEffect(() => {
    getLists().then((data) => {
      setAllLists(data);
      // If listId param present, find and set active list
      if (listIdParam) {
        const found = data.find((l) => l.id === listIdParam);
        if (found) setActiveList(found);
      }
    });
  }, [listIdParam]);

  useEffect(() => {
    setQuery(queryParam);
  }, [queryParam]);

  const handleSearch = useCallback(async (q) => {
    if (!q || q.trim().length < 2) {
      setResults({ books: [], jade: [] });
      return;
    }
    setSearching(true);
    if (firstVisit && !hasSearched) {
      setHasSearched(true);
      clearFirstVisit();
    }
    // TODO(api): Replace with GET /api/search?q={query} — unified search endpoint
    const data = await searchAll(q);
    setResults(data);
    setSearching(false);
  }, [firstVisit, hasSearched, clearFirstVisit]);

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  const getBorrowerName = (borrowerId) => {
    if (!borrowerId) return null;
    const member = membersMock.find((m) => m.id === borrowerId);
    return member ? member.name : borrowerId;
  };

  const enrichBook = (book) => ({
    ...book,
    borrowerName: getBorrowerName(book.borrower),
  });

  // Apply filters
  let filteredBooks = results.books;
  let filteredJade = results.jade;

  if (filters.source === 'book') filteredJade = [];
  if (filters.source === 'jade') filteredBooks = [];

  if (filters.subject !== 'all') {
    filteredBooks = filteredBooks.filter((b) => b.enrichment?.subject === filters.subject);
    filteredJade = filteredJade.filter((j) => j.tags.includes(filters.subject));
  }
  if (filters.jurisdiction !== 'all') {
    filteredBooks = filteredBooks.filter((b) => b.enrichment?.jurisdiction?.includes(filters.jurisdiction));
    filteredJade = filteredJade.filter((j) => j.tags.includes(filters.jurisdiction));
  }
  if (filters.type === 'book') { filteredJade = []; }
  if (filters.type === 'jade') { filteredBooks = []; }
  if (filters.availability === 'available') {
    filteredBooks = filteredBooks.filter((b) => b.status === 'available');
  }
  if (filters.availability === 'on-loan') {
    filteredBooks = filteredBooks.filter((b) => b.status === 'on-loan');
  }

  // Type-alternating interleave
  const interleaved = [];
  const maxLen = Math.max(filteredBooks.length, filteredJade.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < filteredBooks.length) interleaved.push({ item: enrichBook(filteredBooks[i]), type: 'book' });
    if (i < filteredJade.length) interleaved.push({ item: filteredJade[i], type: 'jade' });
  }

  const totalResults = filteredBooks.length + filteredJade.length;
  const hasQuery = query.trim().length >= 2;

  const handleRequestLoan = async (book) => {
    await requestLoan(book.id, onboarding.name || 'James Chen');
    addToast({ message: 'Loan requested. Clerk will review.', type: 'success' });
  };

  const handleRequestReturn = async (book) => {
    await requestReturn(book.id, onboarding.name || 'James Chen');
    addToast({ message: 'Recall requested. Clerk will contact the borrower.', type: 'success' });
  };

  // ── Focused mode: direct add/remove (APP-003) ──
  const refreshActiveList = async () => {
    const freshLists = await getLists();
    setAllLists(freshLists);
    if (listIdParam) {
      const fresh = freshLists.find((l) => l.id === listIdParam);
      if (fresh) setActiveList(fresh);
    }
  };

  const getActiveListEntry = (item) => {
    if (!activeList) return null;
    const found = activeList.items.find((i) => i.title === item.title);
    if (!found) return null;
    return { listId: activeList.id, itemId: found.id, listName: activeList.name };
  };

  const enqueueUncatalogued = async (item, listId, listName, itemId) => {
    if (!item?.uncatalogued || item.type === 'jade') return;
    await addQueueEntry({
      title: item.title,
      author: item.author || '',
      addedBy: onboarding.name || 'Barrister',
      listId,
      listName,
      itemId,
    });
  };

  const handleDirectAdd = async (item, type) => {
    if (!activeList) return;
    const newItem = {
      type: type === 'jade' ? item.type : 'book',
      title: item.title,
      citation: item.citation || null,
      pageRange: null,
      uncatalogued: Boolean(item.uncatalogued),
    };
    const addedItem = await addItem(activeList.id, newItem);
    await enqueueUncatalogued(item, activeList.id, activeList.name, addedItem.id);
    addToast({ message: `Added to ${activeList.name}`, type: 'success' });
    await refreshActiveList();
  };

  const handleDirectRemove = async (item, type, entry) => {
    await removeItem(entry.listId, entry.itemId);
    await dismissQueueItemBySource(entry.listId, entry.itemId);
    addToast({ message: `Removed from ${entry.listName}`, type: 'success' });
    await refreshActiveList();
  };

  // ── Casual mode: modal-based add/remove ──
  const handleAddToList = async (item, type) => {
    const freshLists = await getLists();
    setAllLists(freshLists);
    setPendingItem({ item, type, resultKey: getResultKey(item, type) });
    setShowNewList(false);
    setNewListName('');
    setNewListRef('');
    return false;
  };

  const handlePickList = async (targetList) => {
    if (!pendingItem) return;
    const { item, type } = pendingItem;
    const newItem = {
      type: type === 'jade' ? item.type : 'book',
      title: item.title,
      citation: item.citation || null,
      pageRange: null,
      uncatalogued: Boolean(item.uncatalogued),
    };
    const addedItem = await addItem(targetList.id, newItem);
    await enqueueUncatalogued(item, targetList.id, targetList.name, addedItem.id);
    addToast({ message: `Added to ${targetList.name}`, type: 'success' });
    setAddedResultMap((prev) => ({
      ...prev,
      [pendingItem.resultKey]: { listId: targetList.id, itemId: addedItem.id, listName: targetList.name },
    }));
    setPendingItem(null);
    const freshLists = await getLists();
    setAllLists(freshLists);
  };

  const handleCreateAndAdd = async () => {
    if (!newListName.trim() || !pendingItem) return;
    const newList = await createList(newListName.trim(), newListRef.trim());
    const { item, type } = pendingItem;
    const newItem = {
      type: type === 'jade' ? item.type : 'book',
      title: item.title,
      citation: item.citation || null,
      pageRange: null,
      uncatalogued: Boolean(item.uncatalogued),
    };
    const addedItem = await addItem(newList.id, newItem);
    await enqueueUncatalogued(item, newList.id, newList.name, addedItem.id);
    addToast({ message: `Created "${newList.name}" and added item`, type: 'success' });
    setAddedResultMap((prev) => ({
      ...prev,
      [pendingItem.resultKey]: { listId: newList.id, itemId: addedItem.id, listName: newList.name },
    }));
    setPendingItem(null);
    setShowNewList(false);
    setNewListName('');
    setNewListRef('');
    const freshLists = await getLists();
    setAllLists(freshLists);
  };

  const handleRemoveFromList = async (item, type, entry) => {
    const resultKey = getResultKey(item, type);
    const removed = await removeItem(entry.listId, entry.itemId);
    if (!removed) return;
    await dismissQueueItemBySource(entry.listId, entry.itemId);

    setAddedResultMap((prev) => {
      const next = { ...prev };
      delete next[resultKey];
      return next;
    });
    addToast({ message: `Removed from ${entry.listName}`, type: 'success' });
    const freshLists = await getLists();
    setAllLists(freshLists);
  };

  return (
    <div className="animate-page-in">
      {/* Focused mode: list context bar (APP-003) */}
      {focusedMode && (
        <div className="mb-5 flex items-center justify-between rounded-2xl border border-brand/20 bg-brand/5 px-4 py-3 animate-fade-in">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10">
              <Icon name="solar:list-check-linear" size={18} className="text-brand" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text">Adding to: {activeList.name}</p>
              <p className="text-xs text-text-secondary">{activeList.caseRef} · {activeList.items.length} {activeList.items.length === 1 ? 'entry' : 'entries'}</p>
            </div>
          </div>
          <Button size="sm" variant="primary" onClick={() => navigate(`/app/authorities?listId=${activeList.id}`)}>
            <Icon name="solar:check-circle-linear" size={14} />
            Done
          </Button>
        </div>
      )}

      {/* listId present but list not found — mock data reset after refresh */}
      {listIdParam && !activeList && (
        <div className="mb-5 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <Icon name="solar:danger-triangle-linear" size={18} className="text-amber-600" />
            <p className="text-sm text-amber-800">List not found. It may have been deleted or the page was refreshed.</p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => navigate('/app/authorities')}>
            Back to Lists
          </Button>
        </div>
      )}

      <div>
        <h1 className="font-serif text-3xl text-text">Search</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Find cases, books, and legislation across JADE and your chambers library.
        </p>
      </div>

      {firstVisit && !listIdParam && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <Icon name="solar:hand-shake-linear" size={20} className="mt-0.5 shrink-0 text-emerald-600" />
          <p className="text-sm font-medium text-emerald-800">
            {mode === 'joined'
              ? `Connected to ${onboarding.chambersName || 'your chambers'}. Start by searching for a book or case.`
              : "You're starting with JADE. Search case law and build authority lists."}
          </p>
        </div>
      )}

      {mode === 'solo' && !firstVisit && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-brand/30 bg-brand/10 p-3 text-sm text-brand">
          <span>JADE only mode. Join chambers to unlock shared library.</span>
          <button
            type="button"
            onClick={() => navigate('/onboarding/barrister/lookup')}
            className="ml-3 shrink-0 rounded-full bg-brand px-3 py-1 text-xs font-medium text-white hover:bg-brand-hover"
          >
            Join Chambers
          </button>
        </div>
      )}

      <div className="mt-5 max-w-2xl">
        <Input
          autoFocus
          icon="solar:magnifer-linear"
          placeholder='Try: "evidence", "contract", "negligence"...'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Suggested queries — only when no active search */}
      {!hasQuery && !searching && (
        <div className="mt-4 flex flex-wrap gap-2">
          {suggestedBarristerQueries.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setQuery(q)}
              className="rounded-full border border-border/70 bg-slate-50 px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-slate-100 hover:text-text"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Filter pills */}
      {hasQuery && (
        <div className="mt-3">
          <FilterPillBar filters={filters} onChange={setFilters} />
        </div>
      )}

      {/* Skeleton loading state */}
      {searching && (
        <div className="mt-4 space-y-2 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-border/50 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/5 rounded bg-slate-200" />
                  <div className="h-3 w-2/5 rounded bg-slate-100" />
                </div>
                <div className="h-8 w-20 rounded-lg bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!searching && totalResults > 0 && (
        <div className="mt-4">
          <p className="mb-3 text-xs text-text-muted">
            {totalResults} {totalResults === 1 ? 'result' : 'results'} across books and JADE
          </p>
          <div className="space-y-2">
            {interleaved.map(({ item, type }) => (
              <SearchResultCard
                key={`${type}-${item.id}`}
                item={item}
                type={type}
                directAdd={focusedMode}
                onRequestLoan={handleRequestLoan}
                onRequestReturn={handleRequestReturn}
                onAddToList={focusedMode ? handleDirectAdd : handleAddToList}
                onRemoveFromList={focusedMode ? handleDirectRemove : handleRemoveFromList}
                addedListEntry={focusedMode ? getActiveListEntry(item) : addedResultMap[getResultKey(item, type)]}
              />
            ))}
          </div>
        </div>
      )}

      {hasQuery && !searching && totalResults === 0 && (
        <p className="mt-4 text-sm text-text-muted">No results found for "{query}".</p>
      )}

      {/* Always-visible manual add */}
      {hasQuery && !searching && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => {
              const title = query.trim();
              const manualItem = { title, citation: null, id: `manual-${Date.now()}`, uncatalogued: true };
              if (focusedMode) {
                handleDirectAdd(manualItem, 'book');
              } else {
                handleAddToList(manualItem, 'book');
              }
            }}
            className="flex w-full max-w-2xl items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-3 text-sm font-medium text-text-secondary transition-colors hover:border-brand hover:text-brand"
          >
            <Icon name="solar:add-circle-linear" size={16} />
            {focusedMode ? `Add "${query}" as uncatalogued book` : `Manually add "${query}" as uncatalogued book`}
          </button>
        </div>
      )}

      {/* List picker popover — casual mode only */}
      {!focusedMode && pendingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 transition-opacity duration-200" onClick={() => setPendingItem(null)}>
          <div
            className="mx-4 w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl ring-1 ring-black/5 animate-page-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg text-text">Add to List</h3>
              <button type="button" onClick={() => setPendingItem(null)} className="rounded-lg p-1 text-text-muted transition-colors hover:bg-slate-100 hover:text-text">
                <Icon name="solar:close-circle-linear" size={18} />
              </button>
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              {pendingItem.item.title}
            </p>

            <div className="mt-4 max-h-60 space-y-1.5 overflow-y-auto">
              {allLists.map((list) => (
                <button
                  key={list.id}
                  type="button"
                  onClick={() => handlePickList(list)}
                  className="flex w-full items-center justify-between rounded-xl border border-border/70 px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text">{list.name}</p>
                    <p className="text-[11px] text-text-muted">{list.caseRef}</p>
                  </div>
                  <span className="shrink-0 text-xs text-text-secondary">{list.items.length} entries</span>
                </button>
              ))}
              {allLists.length === 0 && !showNewList && (
                <p className="py-2 text-center text-sm text-text-muted">No lists yet. Create one below.</p>
              )}
            </div>

            {showNewList ? (
              <div className="mt-3 space-y-2 rounded-xl border border-brand/20 bg-brand/5 p-3">
                <input
                  type="text"
                  autoFocus
                  placeholder="List name (e.g. Smith v Jones)"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                <input
                  type="text"
                  placeholder="Case ref (e.g. [2024] NSWSC 412)"
                  value={newListRef}
                  onChange={(e) => setNewListRef(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreateAndAdd(); }}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="primary" onClick={handleCreateAndAdd} disabled={!newListName.trim()}>
                    Create & Add
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setShowNewList(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : allLists.length === 0 ? (
              <button
                type="button"
                onClick={() => setShowNewList(true)}
                className="mt-3 flex w-full items-center gap-2 rounded-xl border border-dashed border-brand/30 px-3 py-2.5 text-sm font-medium text-brand transition-colors hover:bg-brand/5"
              >
                <Icon name="solar:add-circle-linear" size={16} />
                New List
              </button>
            ) : null}
          </div>
        </div>
      )}

    </div>
  );
}
