import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import Icon from '../atoms/Icon';
import Button from '../atoms/Button';
import { getSuggestions } from '../../services/searchService';
import { getLists, createList, addItem } from '../../services/authorityListsService';
import { useToast } from '../../context/ToastContext';

export default function HeaderSearchBar({ placeholder, role, className = '' }) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Add-to-list modal state
  const [pendingItem, setPendingItem] = useState(null);
  const [lists, setLists] = useState([]);
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListRef, setNewListRef] = useState('');

  // Autosuggest — debounced fetch
  const fetchSuggestions = useCallback(async (q) => {
    if (!q || q.trim().length < 1) { setSuggestions([]); return; }
    const results = await getSuggestions(q);
    setSuggestions(results);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); return undefined; }
    const timer = setTimeout(() => fetchSuggestions(query), 180);
    return () => clearTimeout(timer);
  }, [query, fetchSuggestions]);

  // Close suggestions when clicking outside
  useEffect(() => {
    if (!showSuggestions) return undefined;
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSuggestions]);

  const handleSubmit = (event) => {
    event.preventDefault();
    // No navigation — just keep suggestions open or do nothing
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      handleSuggestionSelect(suggestions[activeIndex]);
    }
  };

  const handleSuggestionSelect = (suggestion) => {
    setShowSuggestions(false);
    setQuery('');
    setActiveIndex(-1);

    if (suggestion.type === 'list') {
      // Navigate to list detail
      navigate(`/app/authorities?listId=${suggestion.id}`);
      return;
    }

    // Book or JADE — open "Add to List" modal
    setPendingItem(suggestion);
    getLists().then(setLists);
  };

  const getPendingItemType = () => pendingItem?.type === 'jade' ? (pendingItem.jadeType || 'case') : 'book';

  const handleAddToList = async (list) => {
    if (!pendingItem) return;
    const newItem = {
      type: getPendingItemType(),
      title: pendingItem.title,
      citation: pendingItem.subtitle || null,
      pageRange: null,
    };
    await addItem(list.id, newItem);
    addToast({ message: `Added to "${list.name}"`, type: 'success' });
    window.dispatchEvent(new CustomEvent('authority-lists-changed'));
    setPendingItem(null);
    setShowNewList(false);
    setNewListName('');
    setNewListRef('');
    navigate(`/app/authorities?listId=${list.id}`);
  };

  const handleCreateAndAdd = async () => {
    if (!newListName.trim() || !pendingItem) return;
    const newList = await createList(newListName.trim(), newListRef.trim());
    const newItem = {
      type: pendingItem.type === 'jade' ? (pendingItem.jadeType || 'case') : 'book',
      title: pendingItem.title,
      citation: pendingItem.subtitle || null,
      pageRange: null,
    };
    await addItem(newList.id, newItem);
    addToast({ message: `Created "${newList.name}" and added item`, type: 'success' });
    window.dispatchEvent(new CustomEvent('authority-lists-changed'));
    setPendingItem(null);
    setShowNewList(false);
    setNewListName('');
    setNewListRef('');
    navigate(`/app/authorities?listId=${newList.id}`);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSuggestionSelect(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  };

  // Group suggestions by type
  const listSuggestions = suggestions.filter((s) => s.type === 'list');
  const itemSuggestions = suggestions.filter((s) => s.type !== 'list');

  return (
    <>
      <form onSubmit={handleSubmit} ref={wrapperRef} className={className}>
        <div className="flex items-center gap-2 rounded-full border border-border/60 bg-[#f8fafc] p-1 ring-1 ring-black/5">
          <span className="flex shrink-0 items-center justify-center pl-2 text-brand">
            <Icon name="solar:magnifer-linear" size={16} />
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => { setQuery(event.target.value); setShowSuggestions(true); setActiveIndex(-1); }}
            onFocus={() => { if (query.trim()) setShowSuggestions(true); }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent py-0.5 text-sm text-text placeholder:text-text-muted focus:outline-none"
            autoComplete="off"
            role="combobox"
            aria-expanded={showSuggestions && suggestions.length > 0}
            aria-autocomplete="list"
            aria-controls="header-search-suggestions"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setSuggestions([]); setShowSuggestions(false); setActiveIndex(-1); inputRef.current?.focus(); }}
              className="shrink-0 rounded-full p-0.5 text-slate-400 transition-colors hover:text-slate-600"
            >
              <Icon name="solar:close-circle-linear" size={14} />
            </button>
          )}
          <button
            type="submit"
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-brand px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-hover"
          >
            Search
          </button>
        </div>

        {/* Autosuggest dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            id="header-search-suggestions"
            role="listbox"
            className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 rounded-[24px] border border-slate-200 bg-white p-2 shadow-[0_22px_48px_rgba(15,23,42,0.14)] ring-1 ring-black/5"
          >
            {/* My Lists section */}
            {listSuggestions.length > 0 && (
              <>
                <p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                  My Lists
                </p>
                {listSuggestions.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    role="option"
                    aria-selected={idx === activeIndex}
                    onClick={() => handleSuggestionSelect(s)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${
                      idx === activeIndex ? 'bg-slate-100' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Icon name={s.icon} size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text">{s.title}</p>
                      <p className="truncate text-xs text-text-muted">{s.subtitle}</p>
                    </div>
                    <Icon name="solar:arrow-right-linear" size={14} className="shrink-0 text-text-muted" />
                  </button>
                ))}
              </>
            )}

            {/* Books & Authorities section */}
            {itemSuggestions.length > 0 && (
              <>
                {listSuggestions.length > 0 && <div className="my-1.5 border-t border-slate-100" />}
                <p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                  Add to List
                </p>
                {itemSuggestions.map((s) => {
                  const globalIdx = suggestions.indexOf(s);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="option"
                      aria-selected={globalIdx === activeIndex}
                      onClick={() => handleSuggestionSelect(s)}
                      onMouseEnter={() => setActiveIndex(globalIdx)}
                      className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${
                        globalIdx === activeIndex ? 'bg-slate-100' : 'hover:bg-slate-50'
                      }`}
                    >
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        s.type === 'book' ? 'bg-brand/10 text-brand' : s.jadeType === 'legislation' ? 'bg-violet-100 text-violet-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        <Icon name={s.icon} size={15} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-text">{s.title}</p>
                        <p className="truncate text-xs text-text-muted">{s.subtitle}</p>
                      </div>
                      {s.type === 'book' && (
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          s.status === 'available' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {s.status === 'available' ? 'Available' : 'On loan'}
                        </span>
                      )}
                      {s.type === 'jade' && (
                        <span className="shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-600">
                          JADE
                        </span>
                      )}
                      <Icon name="solar:add-circle-linear" size={16} className="shrink-0 text-text-muted" />
                    </button>
                  );
                })}
              </>
            )}
          </div>
        )}
      </form>

      {/* Add to List modal — portaled to body to escape header overflow/z-index */}
      {pendingItem && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 transition-opacity duration-200" onClick={() => { setPendingItem(null); setShowNewList(false); }}>
          <div className="mx-4 flex w-full max-w-sm flex-col rounded-2xl bg-white p-5 shadow-xl ring-1 ring-black/5 animate-page-in" style={{ maxHeight: 'calc(100vh - 2rem)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex shrink-0 items-center justify-between">
              <h3 className="font-serif text-card-title text-text">Add to List</h3>
              <button type="button" onClick={() => { setPendingItem(null); setShowNewList(false); }} className="rounded-lg p-1 text-text-muted transition-colors hover:bg-slate-100 hover:text-text">
                <Icon name="solar:close-circle-linear" size={18} />
              </button>
            </div>
            <p className="mt-1 shrink-0 text-sm text-text-secondary">{pendingItem.title}</p>

            <div className="mt-4 min-h-0 space-y-1.5 overflow-y-auto">
              {lists.map((list) => {
                const alreadyAdded = pendingItem && list.items.some((i) => i.title === pendingItem.title && i.type === getPendingItemType());
                return (
                  <button
                    key={list.id}
                    type="button"
                    onClick={() => !alreadyAdded && handleAddToList(list)}
                    disabled={alreadyAdded}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${alreadyAdded ? 'cursor-not-allowed border-border/40 opacity-50' : 'border-border/70 hover:bg-slate-50'}`}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${alreadyAdded ? 'bg-slate-100 text-slate-400' : 'bg-brand/10 text-brand'}`}>
                      <Icon name={alreadyAdded ? 'solar:check-circle-linear' : 'solar:folder-open-linear'} size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium ${alreadyAdded ? 'text-text-muted' : 'text-text'}`}>{list.name}</p>
                      <p className="text-xs text-text-muted">{alreadyAdded ? 'Already added' : list.caseRef}</p>
                    </div>
                    <span className="shrink-0 text-xs text-text-secondary">{list.items.length} entries</span>
                  </button>
                );
              })}
              {lists.length === 0 && !showNewList && (
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
                  placeholder="Case ref (optional)"
                  value={newListRef}
                  onChange={(e) => setNewListRef(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreateAndAdd(); }}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="primary" onClick={handleCreateAndAdd} disabled={!newListName.trim()}>Create & Add</Button>
                  <Button size="sm" variant="secondary" onClick={() => setShowNewList(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowNewList(true)}
                className="mt-3 flex w-full items-center gap-2 rounded-xl border border-dashed border-brand/30 px-3 py-2.5 text-sm font-medium text-brand transition-colors hover:bg-brand/5"
              >
                <Icon name="solar:add-circle-linear" size={16} />
                New List
              </button>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
