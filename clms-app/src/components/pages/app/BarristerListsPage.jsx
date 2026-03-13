import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../../atoms/Icon';
import Input from '../../atoms/Input';
import Select from '../../atoms/Select';
import Button from '../../atoms/Button';
import { useAppContext } from '../../../context/AppContext';
import { useToast } from '../../../context/ToastContext';
import {
  getLists, createList, updateItem, updateList, removeItem, addItem, reorderItems,
  deleteList, addIssue, renameIssue, removeIssue,
} from '../../../services/authorityListsService';
import { addQueueEntry, dismissQueueItemBySource } from '../../../services/uncataloguedQueueService';
import { requestReturn, requestLoan } from '../../../services/loansService';
import { searchAll } from '../../../services/searchService';
import ExportPreviewModal from '../../organisms/ExportPreviewModal';
import SearchResultCard from '../../molecules/SearchResultCard';
import FilterPillBar from '../../molecules/FilterPillBar';
import { getCourtStructure, getCourtOptions, derivePart } from '../../../utils/courtStructures';
import { lookupBookByTitle, getBorrowerName } from '../../../utils/bookLookup';
import { formatCase, formatLegislation, formatBook, generateAGLCPlainText } from '../../../utils/aglcFormatter';
import { suggestedBarristerQueries } from '../../../mocks/barristerQueries';
import { membersMock } from '../../../mocks/members';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const pinpointPlaceholder = (type) => {
  if (type === 'case') return '[45]-[48]';
  if (type === 'legislation') return 's 135';
  return 'ch 4, pp 120-135';
};

function getSearchBorrowerName(borrowerId) {
  if (!borrowerId) return null;
  const member = membersMock.find((m) => m.id === borrowerId);
  return member ? member.name : borrowerId;
}

function enrichSearchBook(book) {
  return { ...book, borrowerName: getSearchBorrowerName(book.borrower) };
}

/* ── Inline always-visible pinpoint input ── */
function PinpointInput({ item, listId, onSaved }) {
  const [value, setValue] = useState(item.pageRange || '');
  const prevRef = useRef(item.pageRange || '');

  const save = async () => {
    const trimmed = value.trim();
    if (trimmed === prevRef.current) return;
    await updateItem(listId, item.id, { pageRange: trimmed || null });
    prevRef.current = trimmed;
    onSaved(trimmed ? 'Pinpoint updated' : 'Pinpoint removed');
  };

  const hasPinpoint = value.trim().length > 0;
  const borderCls = hasPinpoint
    ? 'border-success/40 bg-success/5 focus:border-success focus:ring-success/20'
    : 'border-warning/40 bg-warning/5 focus:border-warning focus:ring-warning/20';

  return (
    <div className="flex items-center gap-1.5">
      <Icon name="solar:pin-bold" size={13} className={hasPinpoint ? 'text-success' : 'text-warning'} />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.target.blur(); } }}
        placeholder={pinpointPlaceholder(item.type)}
        className={`w-36 rounded-lg border px-2 py-0.5 text-xs text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-2 transition-colors ${borderCls}`}
      />
    </div>
  );
}

/* ── Book availability indicator ── */
function BookAvailability({ item, onRequestReturn }) {
  if (item.uncatalogued) return null;
  const book = lookupBookByTitle(item.title);
  if (!book) return null;

  if (book.status === 'available') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-success">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
        Available
      </span>
    );
  }

  const borrower = getBorrowerName(book.borrower);
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-warning">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-warning" />
      On Loan{borrower ? ` \u00b7 ${borrower}` : ''}{book.dueDate ? `, due ${book.dueDate}` : ''}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onRequestReturn(book); }}
        className="ml-1 text-brand hover:text-brand-hover underline"
      >
        Request Return
      </button>
    </span>
  );
}

/* ── Persistent preview pane — pure document output (1:1 with export) ── */
function AGLCPreviewInline({ list, onScrollToItem }) {
  const court = getCourtStructure(list.courtStructure || 'vic');
  const sortAlpha = (items) => [...items].sort((a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }));
  const hasPinpointData = (item) => {
    if (item.type === 'legislation') return !!(item.pageRange || item.citation);
    return !!item.pageRange;
  };

  const fmtItem = (item) => {
    if (item.type === 'case') return formatCase(item);
    if (item.type === 'legislation') return formatLegislation(item);
    return formatBook(item);
  };

  const getIssues = (item) => {
    const issues = [];
    if (item.usage === 'read' && !hasPinpointData(item)) issues.push('Pinpoint missing');
    if (item.type === 'case' && !item.reporter) issues.push('Reporter missing');
    return issues;
  };

  // Collect all issues for summary bar
  const allIssues = [];
  const missingPinpoints = list.items.filter((item) => item.usage === 'read' && !hasPinpointData(item)).length;
  const missingReporter = list.items.filter((item) => item.type === 'case' && !item.reporter).length;
  if (missingPinpoints > 0) allIssues.push(`${missingPinpoints} pinpoint missing`);
  if (missingReporter > 0) allIssues.push(`${missingReporter} reporter missing`);
  const firstProblemItem = list.items.find((item) => getIssues(item).length > 0);

  return (
    <aside className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm animate-page-in">
      {allIssues.length > 0 && (
        <div className="flex items-center justify-between gap-3 border-b border-red-200/60 bg-red-50 px-5 py-2.5">
          <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
            <Icon name="solar:danger-triangle-linear" size={13} />
            {allIssues.join(' · ')}
          </p>
          {firstProblemItem && onScrollToItem && (
            <button
              type="button"
              onClick={() => onScrollToItem(firstProblemItem.id)}
              className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-200"
            >
              Fix issues
            </button>
          )}
        </div>
      )}

      <div className="px-6 py-5">
        <div className="mb-5 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-secondary">Table of Authorities</p>
          <p className="mt-1.5 font-serif text-sm font-semibold text-text">{list.name}</p>
          {list.caseRef && <p className="mt-0.5 text-xs text-text-muted">{list.caseRef}</p>}
          <p className="mt-0.5 text-xs text-text-muted">{court.label}</p>
        </div>

        <div className="space-y-4">
          {court.parts.map((part) => {
            const partItems = sortAlpha(list.items.filter((i) => derivePart(i.type, i.usage, list.courtStructure) === part.key));
            if (partItems.length === 0) return null;
            return (
              <div key={part.key}>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{part.label}: {part.desc}</p>
                <ol className="mt-2 list-decimal pl-4 space-y-2">
                  {partItems.map((item) => {
                    const issues = getIssues(item);
                    const hasIssue = issues.length > 0;
                    return (
                      <li
                        key={item.id}
                        className={`text-xs leading-relaxed text-text ${hasIssue ? '-mx-2 rounded bg-red-50 px-2 py-0.5' : ''}`}
                        title={hasIssue ? issues.join(', ') : undefined}
                      >
                        {fmtItem(item)}
                      </li>
                    );
                  })}
                </ol>
              </div>
            );
          })}
          {list.items.length === 0 && (
            <p className="text-xs text-text-muted">No items to preview.</p>
          )}
        </div>
      </div>
    </aside>
  );
}

/* ── Editor stat pills ── */
function EditorStats({ list }) {
  const cases = list.items.filter((i) => i.type === 'case').length;
  const legislation = list.items.filter((i) => i.type === 'legislation').length;
  const books = list.items.filter((i) => i.type === 'book').length;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 font-medium text-success">
        <Icon name="solar:scale-linear" size={12} />
        Cases: {cases}
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-2.5 py-1 font-medium text-purple-600">
        <Icon name="solar:document-text-linear" size={12} />
        Legislation: {legislation}
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 font-medium text-brand">
        <Icon name="solar:book-2-linear" size={12} />
        Books: {books}
      </span>
    </div>
  );
}

/* ── List header — read-only or edit mode with auto-save ── */
function ListHeader({ list, editing, onSave, partGroups = [], onCourtChange }) {
  const [name, setName] = useState(list.name);
  const [caseRef, setCaseRef] = useState(list.caseRef || '');
  const [saveStatus, setSaveStatus] = useState(null); // null | 'saving' | 'saved'
  const prevName = useRef(list.name);
  const prevRef = useRef(list.caseRef || '');
  const nameInputRef = useRef(null);
  const statusTimer = useRef(null);

  useEffect(() => {
    setName(list.name);
    setCaseRef(list.caseRef || '');
    prevName.current = list.name;
    prevRef.current = list.caseRef || '';
    setSaveStatus(null);
  }, [list.id, list.name, list.caseRef]);

  // Focus name input when entering edit mode
  useEffect(() => {
    if (editing) setTimeout(() => nameInputRef.current?.focus(), 50);
  }, [editing]);

  const saveIfChanged = async () => {
    const trimmedName = name.trim() || prevName.current;
    const trimmedRef = caseRef.trim();
    if (trimmedName === prevName.current && trimmedRef === prevRef.current) return;
    prevName.current = trimmedName;
    prevRef.current = trimmedRef;
    setName(trimmedName);
    setSaveStatus('saving');
    await onSave({ name: trimmedName, caseRef: trimmedRef });
    setSaveStatus('saved');
    clearTimeout(statusTimer.current);
    statusTimer.current = setTimeout(() => setSaveStatus(null), 2000);
  };

  const titleWidth = `${Math.min(Math.max((name || '').length + 2, 30), 50)}ch`;
  const referenceWidth = `${Math.min(Math.max((caseRef || '').length + 2, 28), 44)}ch`;

  // Strip case name from caseRef to get just the neutral citation
  const neutralCitation = list.caseRef
    ? list.caseRef.replace(list.name, '').replace(/^\s*/, '')
    : '';
  const courtLabel = getCourtStructure(list.courtStructure || 'vic').label;

  if (!editing) {
    const subtitle = [courtLabel, neutralCitation].filter(Boolean).join(' · ');
    return (
      <div>
        <h1 className="font-serif text-xl font-bold text-text">{list.name}</h1>
        {subtitle && (
          <p className="mt-1 text-xs text-text-secondary">{subtitle}</p>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-2">
        <input
          ref={nameInputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveIfChanged}
          onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
          placeholder="Case title, e.g. Smith v Jones [2024]"
          style={{ width: titleWidth }}
          className="max-w-full min-w-[18ch] rounded-lg border border-border bg-white px-3 py-1.5 font-serif text-xl font-bold text-text placeholder:text-text-muted/60 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        {saveStatus && (
          <span className={`inline-flex items-center gap-1 text-xs transition-opacity duration-300 ${saveStatus === 'saving' ? 'text-text-muted animate-pulse' : 'text-success'}`}>
            {saveStatus === 'saving' ? 'Saving...' : (<><Icon name="solar:check-circle-bold" size={12} /> Saved</>)}
          </span>
        )}
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={caseRef}
          onChange={(e) => setCaseRef(e.target.value)}
          onBlur={saveIfChanged}
          onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
          placeholder="Case ref, e.g. [2024] NSWSC 412"
          style={{ width: referenceWidth }}
          className="max-w-full min-w-[20ch] rounded-lg border border-border bg-white px-3 py-1 text-xs text-text placeholder:text-text-muted/60 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <span className="inline-block h-0.5 w-0.5 rounded-full bg-text-muted/40" />
        <Select
          size="sm"
          value={list.courtStructure || 'vic'}
          onChange={(e) => onCourtChange?.(e.target.value)}
          className="inline-block"
        >
          {getCourtOptions().map((opt) => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </Select>
      </div>
    </div>
  );
}

/* ── Editable header for new draft — name + ref as visible inputs, rest of detail page renders below ── */
function DraftEditableHeader({ nameRef, onCommit, onCancel }) {
  const [name, setName] = useState('');
  const [caseRef, setCaseRef] = useState('');

  const save = () => { if (name.trim()) onCommit(name, caseRef); };

  return (
    <div className="animate-fade-in">
      <div>
        <label className="mb-1 block text-xs font-medium text-text-secondary">Case title</label>
        <input
          ref={nameRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); save(); } if (e.key === 'Escape') onCancel?.(); }}
          placeholder="Smith v Jones [2024]"
          className="w-full rounded-xl border border-border bg-white px-4 py-2 font-serif text-3xl text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
      </div>
      <div className="mt-3">
        <label className="mb-1 block text-xs font-medium text-text-secondary">Case reference</label>
        <input
          type="text"
          value={caseRef}
          onChange={(e) => setCaseRef(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); save(); } if (e.key === 'Escape') onCancel?.(); }}
          placeholder="[2024] NSWSC 412 (optional)"
          className="w-full rounded-xl border border-border bg-white px-4 py-2 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" variant="primary" onClick={save} disabled={!name.trim()}>
          <Icon name="solar:check-circle-linear" size={16} />
          Save
        </Button>
        <Button size="sm" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export default function BarristerListsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { onboarding } = useAppContext();
  const { addToast } = useToast();
  const listIdParam = searchParams.get('listId');
  const newParam = searchParams.get('new');

  const [lists, setLists] = useState([]);
  const [listsLoaded, setListsLoaded] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showExportPreview, setShowExportPreview] = useState(false);
  const workspaceRef = useRef(null);
  const previewPaneRef = useRef(null);
  const [editorPaneWidth, setEditorPaneWidth] = useState(() => {
    const stored = window.localStorage.getItem('clms-authority-editor-width');
    return stored ? Number(stored) : 60;
  });
  const [isResizing, setIsResizing] = useState(false);

  // New list draft — reuses the detail view with inline-editable header
  const [isNewDraft, setIsNewDraft] = useState(false);
  const draftNameRef = useRef(null);

  // Edit mode — toggle via Edit button, auto-save on blur
  const [editMode, setEditMode] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Issue (section) management
  const [addingIssue, setAddingIssue] = useState(false);
  const [newIssueName, setNewIssueName] = useState('');
  const [renamingIssue, setRenamingIssue] = useState(null);
  const [renameIssueValue, setRenameIssueValue] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());
  const [mobileView, setMobileView] = useState('editor'); // 'editor' | 'preview'

  const toggleGroupCollapse = (groupKey) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  };

  // Focused issue — inline quick-add appears on this issue card
  const [focusedIssue, setFocusedIssue] = useState(null);

  // Inline quick-add per issue
  const [inlineQuery, setInlineQuery] = useState('');
  const [inlineResults, setInlineResults] = useState({ books: [], jade: [] });
  const [inlineLoading, setInlineLoading] = useState(false);
  const [showInlineResults, setShowInlineResults] = useState(false);

  // Legacy: embedded search (casual mode from header)
  const qParam = searchParams.get('q') || '';
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ books: [], jade: [] });
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchFilters, setSearchFilters] = useState({ source: 'all', subject: 'all', jurisdiction: 'all', type: 'all', availability: 'all' });

  // Casual search — list picker for header search (no list selected)
  const [pendingItem, setPendingItem] = useState(null);
  const [casualShowNewList, setCasualShowNewList] = useState(false);
  const [casualNewName, setCasualNewName] = useState('');
  const [casualNewRef, setCasualNewRef] = useState('');
  const [casualAddedMap, setCasualAddedMap] = useState({});

  const syncSelectedList = useCallback((list) => {
    setSelected(list);
    setIsNewDraft(false);
    setEditMode(false);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (list?.id) next.set('listId', list.id);
      else next.delete('listId');
      next.delete('new');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  useEffect(() => {
    window.localStorage.setItem('clms-authority-editor-width', String(editorPaneWidth));
  }, [editorPaneWidth]);

  useEffect(() => {
    if (!isResizing) return undefined;

    const handlePointerMove = (event) => {
      if (!workspaceRef.current) return;
      const rect = workspaceRef.current.getBoundingClientRect();
      const nextWidth = ((event.clientX - rect.left) / rect.width) * 100;
      setEditorPaneWidth(Math.min(72, Math.max(42, nextWidth)));
    };

    const handlePointerUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
    };
  }, [isResizing]);

  const refreshLists = useCallback(async () => {
    const data = await getLists();
    setLists(data);
    const targetId = listIdParam || selected?.id;
    if (!targetId) {
      if (newParam === '1') return;
      setSelected(null);
      setIsNewDraft(false);
      setEditMode(false);
      return;
    }
    const fresh = data.find((l) => l.id === targetId);
    if (fresh) setSelected(fresh);
    else {
      setSelected(null);
      setIsNewDraft(false);
      setEditMode(false);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('listId');
        next.delete('new');
        return next;
      }, { replace: true });
    }
  }, [listIdParam, newParam, selected?.id, setSearchParams]);

  const enqueueUncatalogued = useCallback(async (item, listId, listName, itemId) => {
    if (!item?.uncatalogued || item.type === 'jade') return;
    await addQueueEntry({
      title: item.title,
      author: item.author || '',
      addedBy: onboarding.name || 'Barrister',
      listId,
      listName,
      itemId,
    });
  }, [onboarding.name]);

  useEffect(() => {
    const load = async () => {
      const data = await getLists();
      setLists(data);
      setListsLoaded(true);

      if (listIdParam) {
        const target = data.find((list) => list.id === listIdParam);
        if (target) {
          setSelected(target);
          const isDraft = newParam === '1';
          setIsNewDraft(isDraft);
          setEditMode(isDraft);
          return;
        }
      }

      if (newParam === '1') {
        return;
      }

      setSelected(null);
      setIsNewDraft(false);
    };

    load();
  }, [listIdParam, newParam, syncSelectedList]);

  // Open search mode when ?q= param arrives from header search
  useEffect(() => {
    if (qParam) {
      setSearchQuery(qParam);
      setIsSearching(true);
    }
  }, [qParam]);

  // Auto-create draft list when ?new=1 arrives — no need to wait for lists
  const newCreatedRef = useRef(false);

  useEffect(() => {
    if (newParam !== '1') {
      newCreatedRef.current = false;
    }
  }, [newParam]);

  // Debounced search execution
  useEffect(() => {
    if (!isSearching) return undefined;
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults({ books: [], jade: [] });
      return undefined;
    }
    setIsSearchLoading(true);
    const timer = setTimeout(async () => {
      const data = await searchAll(searchQuery);
      setSearchResults(data);
      setIsSearchLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, isSearching]);

  // Inline quick-add debounced search
  useEffect(() => {
    if (!inlineQuery || inlineQuery.trim().length < 2) {
      setInlineResults({ books: [], jade: [] });
      setShowInlineResults(false);
      return undefined;
    }
    setInlineLoading(true);
    setShowInlineResults(true);
    const timer = setTimeout(async () => {
      const data = await searchAll(inlineQuery);
      setInlineResults(data);
      setInlineLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [inlineQuery]);

  // Inline quick-add: interleaved results (max 5)
  const inlineInterleaved = useMemo(() => {
    const books = inlineResults.books || [];
    const jade = inlineResults.jade || [];
    const result = [];
    const maxLen = Math.max(books.length, jade.length);
    for (let i = 0; i < maxLen && result.length < 5; i++) {
      if (i < books.length) result.push({ item: enrichSearchBook(books[i]), type: 'book' });
      if (i < jade.length && result.length < 5) result.push({ item: jade[i], type: 'jade' });
    }
    return result;
  }, [inlineResults]);

  // Inline add to specific issue
  const handleInlineAdd = async (item, type) => {
    if (!selected) return;
    try {
      const targetIssue = focusedIssue === '__ungrouped' ? null : focusedIssue;
      const newItem = {
        type: type === 'jade' ? (item.type || 'case') : 'book',
        title: item.title,
        citation: item.citation || null,
        pageRange: null,
        issue: targetIssue,
        uncatalogued: Boolean(item.uncatalogued),
      };
      const addedItem = await addItem(selected.id, newItem);
      await enqueueUncatalogued(item, selected.id, selected.name, addedItem.id);
      addToast({ message: `Added to ${targetIssue || selected.name}`, type: 'success' });
      setInlineQuery('');
      setShowInlineResults(false);
      await refreshLists();
    } catch (err) {
      console.error('handleInlineAdd error:', err);
      addToast({ message: 'Failed to add item', type: 'error' });
    }
  };

  const exitSearchMode = () => {
    setIsSearching(false);
    setSearchQuery('');
    setSearchResults({ books: [], jade: [] });
    // Clear ?q= param if present
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('q');
      return next;
    }, { replace: true });
  };

  // Search result helpers
  const getSearchResultKey = (item, type) => `${type}:${item.id ?? item.title}`;

  // Search: get entry if item is already in active list
  const getActiveListEntry = (item) => {
    if (!selected) return null;
    const found = selected.items.find((i) => i.title === item.title);
    if (!found) return null;
    return { listId: selected.id, itemId: found.id, listName: selected.name };
  };

  // Search: direct add to active list (focused mode)
  const handleSearchAdd = async (item, type) => {
    if (!selected) return;
    const newItem = {
      type: type === 'jade' ? item.type : 'book',
      title: item.title,
      citation: item.citation || null,
      pageRange: null,
      uncatalogued: Boolean(item.uncatalogued),
    };
    const addedItem = await addItem(selected.id, newItem);
    await enqueueUncatalogued(item, selected.id, selected.name, addedItem.id);
    addToast({ message: `Added to ${selected.name}`, type: 'success' });
    await refreshLists();
  };

  // Search: remove from active list (focused mode)
  const handleSearchRemove = async (item, type, entry) => {
    await removeItem(entry.listId, entry.itemId);
    await dismissQueueItemBySource(entry.listId, entry.itemId);
    addToast({ message: `Removed from ${entry.listName}`, type: 'success' });
    await refreshLists();
  };

  // Search: casual mode — list picker
  const handleCasualAdd = async (item, type) => {
    const freshLists = await getLists();
    setLists(freshLists);
    setPendingItem({ item, type, resultKey: getSearchResultKey(item, type) });
    setCasualShowNewList(false);
    setCasualNewName('');
    setCasualNewRef('');
  };

  const handleCasualPickList = async (targetList) => {
    if (!pendingItem) return;
    const { item, type } = pendingItem;
    const newItem = {
      type: type === 'jade' ? item.type : 'book',
      title: item.title,
      citation: item.citation || null,
      pageRange: null,
      uncatalogued: Boolean(item.uncatalogued),
    };
    const addedEntry = await addItem(targetList.id, newItem);
    await enqueueUncatalogued(item, targetList.id, targetList.name, addedEntry.id);
    addToast({ message: `Added to ${targetList.name}`, type: 'success' });
    setCasualAddedMap((prev) => ({ ...prev, [pendingItem.resultKey]: { listId: targetList.id, itemId: addedEntry.id, listName: targetList.name } }));
    setPendingItem(null);
    await refreshLists();
  };

  const handleCasualCreateAndAdd = async () => {
    if (!casualNewName.trim() || !pendingItem) return;
    const newList = await createList(casualNewName.trim(), casualNewRef.trim());
    const { item, type } = pendingItem;
    const newItem = {
      type: type === 'jade' ? item.type : 'book',
      title: item.title,
      citation: item.citation || null,
      pageRange: null,
      uncatalogued: Boolean(item.uncatalogued),
    };
    const addedEntry = await addItem(newList.id, newItem);
    await enqueueUncatalogued(item, newList.id, newList.name, addedEntry.id);
    addToast({ message: `Created "${newList.name}" and added item`, type: 'success' });
    setCasualAddedMap((prev) => ({ ...prev, [pendingItem.resultKey]: { listId: newList.id, itemId: addedEntry.id, listName: newList.name } }));
    setPendingItem(null);
    setCasualShowNewList(false);
    await refreshLists();
  };

  const handleCasualRemove = async (item, type, entry) => {
    const resultKey = getSearchResultKey(item, type);
    await removeItem(entry.listId, entry.itemId);
    await dismissQueueItemBySource(entry.listId, entry.itemId);
    setCasualAddedMap((prev) => { const next = { ...prev }; delete next[resultKey]; return next; });
    addToast({ message: `Removed from ${entry.listName}`, type: 'success' });
    await refreshLists();
  };

  const handleRequestLoan = async (book) => {
    await requestLoan(book.id, onboarding.name || 'James Chen');
    addToast({ message: 'Loan requested.', type: 'success' });
  };

  const handleRequestReturnSearch = async (book) => {
    await requestReturn(book.id, onboarding.name || 'James Chen');
    addToast({ message: 'Recall requested.', type: 'success' });
  };

  const createDraftList = useCallback(async (persistDraftParam = false) => {
    const newList = await createList('Untitled List', '', 'vic');
    const freshLists = await getLists();
    setLists(freshLists);
    setListsLoaded(true);
    setSelected(newList);
    setIsNewDraft(true);
    setEditMode(true);
    setSearchParams(
      persistDraftParam ? { listId: newList.id, new: '1' } : { listId: newList.id },
      { replace: true },
    );
    setTimeout(() => draftNameRef.current?.select(), 100);
  }, [setSearchParams]);

  const handleQuickCreate = useCallback(async () => {
    await createDraftList(false);
  }, [createDraftList]);

  useEffect(() => {
    if (newParam === '1' && !listIdParam && !newCreatedRef.current) {
      newCreatedRef.current = true;
      createDraftList(true);
    }
  }, [createDraftList, listIdParam, newParam]);


  const handleCourtChange = async (courtId) => {
    if (!selected) return;
    await updateList(selected.id, { courtStructure: courtId });
    await refreshLists();
    addToast({ message: `Court changed to ${getCourtStructure(courtId).label}`, type: 'success' });
  };

  const handleDragEnd = async (result) => {
    if (!selected) return;
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceIssue = source.droppableId === '__ungrouped' ? null : source.droppableId;
    const destIssue = destination.droppableId === '__ungrouped' ? null : destination.droppableId;
    const orderedGroupKeys = [...(selected.issues || []), '__ungrouped'];
    const normalizeGroupKey = (issue) => (issue && (selected.issues || []).includes(issue) ? issue : '__ungrouped');
    const draggedItem = selected.items.find((item) => item.id === draggableId);
    if (!draggedItem) return;

    const nextItems = selected.items.map((item) => (
      item.id === draggableId ? { ...item, issue: destIssue } : { ...item }
    ));

    const groupsMap = new Map();
    orderedGroupKeys.forEach((key) => groupsMap.set(key, []));
    nextItems.forEach((item) => {
      const key = normalizeGroupKey(item.issue);
      if (!groupsMap.has(key)) groupsMap.set(key, []);
      groupsMap.get(key).push(item);
    });

    const sourceKey = sourceIssue || '__ungrouped';
    const destKey = destIssue || '__ungrouped';
    const sourceItems = (groupsMap.get(sourceKey) || []).filter((item) => item.id !== draggableId);

    if (sourceKey === destKey) {
      sourceItems.splice(destination.index, 0, { ...draggedItem, issue: destIssue });
      groupsMap.set(sourceKey, sourceItems);
    } else {
      const destItems = (groupsMap.get(destKey) || []).filter((item) => item.id !== draggableId);
      destItems.splice(destination.index, 0, { ...draggedItem, issue: destIssue });
      groupsMap.set(sourceKey, sourceItems);
      groupsMap.set(destKey, destItems);
    }

    const reorderedItems = [];
    orderedGroupKeys.forEach((key) => {
      reorderedItems.push(...(groupsMap.get(key) || []));
    });
    [...groupsMap.keys()]
      .filter((key) => !orderedGroupKeys.includes(key))
      .forEach((key) => reorderedItems.push(...(groupsMap.get(key) || [])));

    setSelected((prev) => (prev ? { ...prev, items: reorderedItems } : prev));

    if (sourceIssue !== destIssue) {
      await updateItem(selected.id, draggableId, { issue: destIssue });
    }
    await reorderItems(selected.id, reorderedItems.map((item) => item.id));
    await refreshLists();
    addToast({ message: 'Order updated', type: 'success' });
  };

  const handleRemoveItem = async (itemId) => {
    if (!selected) return;
    await removeItem(selected.id, itemId);
    await dismissQueueItemBySource(selected.id, itemId);
    await refreshLists();
    addToast({ message: 'Item removed', type: 'success' });
  };

  const handleRequestReturn = async (book) => {
    await requestReturn(book.id, onboarding.name || 'James Chen');
    addToast({ message: 'Return requested. Clerk notified.', type: 'success' });
  };

  const handleCopyPreviewText = useCallback(async () => {
    if (!selected) return;
    try {
      await navigator.clipboard.writeText(generateAGLCPlainText(selected));
      addToast({ message: 'Preview copied to clipboard', type: 'success' });
    } catch {
      addToast({ message: 'Failed to copy preview', type: 'error' });
    }
  }, [addToast, selected]);

  const handleSharePreview = useCallback(async () => {
    if (!selected) return;
    const text = generateAGLCPlainText(selected);

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Table of Authorities - ${selected.name}`,
          text,
        });
      } catch {
        // User cancelled share — no-op
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      addToast({ message: 'Preview copied (share not supported)', type: 'info' });
    } catch {
      addToast({ message: 'Failed to copy preview', type: 'error' });
    }
  }, [addToast, selected]);

  // Issue management handlers
  const handleAddIssue = async () => {
    if (!selected || !newIssueName.trim()) return;
    await addIssue(selected.id, newIssueName.trim());
    await refreshLists();
    setNewIssueName('');
    setAddingIssue(false);
    addToast({ message: 'Issue group added', type: 'success' });
  };

  const handleRenameIssue = async () => {
    if (!selected || !renamingIssue || !renameIssueValue.trim()) return;
    await renameIssue(selected.id, renamingIssue, renameIssueValue.trim());
    await refreshLists();
    setRenamingIssue(null);
    setRenameIssueValue('');
    addToast({ message: 'Issue renamed', type: 'success' });
  };

  const handleRemoveIssue = async (issueName) => {
    if (!selected) return;
    await removeIssue(selected.id, issueName);
    await refreshLists();
    addToast({ message: 'Section removed. Items ungrouped.', type: 'success' });
  };

  const handleMoveToGroup = async (item, targetIssue) => {
    if (!selected) return;
    await updateItem(selected.id, item.id, { issue: targetIssue });
    await refreshLists();
  };

  const handleDelete = async (listId) => {
    setDeleteConfirmId(null);
    await deleteList(listId);
    if (selected?.id === listId) syncSelectedList(null);
    await refreshLists();
    addToast({ message: 'List deleted', type: 'success' });
  };

  // Group items by Issue
  const issueGroups = useMemo(() => {
    if (!selected) return [];
    const issues = selected.issues || [];
    const groups = issues.map((issueName) => ({
      issue: issueName,
      items: selected.items.filter((i) => i.issue === issueName),
    }));
    // Ungrouped items
    const ungrouped = selected.items.filter((i) => !i.issue || !issues.includes(i.issue));
    if (ungrouped.length > 0 || issues.length === 0) {
      groups.push({ issue: null, items: ungrouped });
    }
    return groups;
  }, [selected]);

  // Part groups for sidebar summary + AGLC preview
  const court = selected ? getCourtStructure(selected.courtStructure) : null;
  const partGroups = useMemo(() => {
    if (!selected || !court) return [];
    return court.parts.map((part) => ({
      ...part,
      items: selected.items.filter((i) => derivePart(i.type, i.usage, selected.courtStructure) === part.key),
    }));
  }, [selected, court]);

  // Computed search results (filtered + interleaved)
  const searchInterleaved = useMemo(() => {
    if (!isSearching) return [];
    let books = searchResults.books;
    let jade = searchResults.jade;
    if (searchFilters.source === 'book') jade = [];
    if (searchFilters.source === 'jade') books = [];
    if (searchFilters.subject !== 'all') {
      books = books.filter((b) => b.enrichment?.subject === searchFilters.subject);
      jade = jade.filter((j) => j.tags.includes(searchFilters.subject));
    }
    if (searchFilters.jurisdiction !== 'all') {
      books = books.filter((b) => b.enrichment?.jurisdiction?.includes(searchFilters.jurisdiction));
      jade = jade.filter((j) => j.tags.includes(searchFilters.jurisdiction));
    }
    if (searchFilters.type === 'book') jade = [];
    if (searchFilters.type === 'jade') books = [];
    if (searchFilters.availability === 'available') books = books.filter((b) => b.status === 'available');
    if (searchFilters.availability === 'on-loan') books = books.filter((b) => b.status === 'on-loan');

    const interleaved = [];
    const maxLen = Math.max(books.length, jade.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < books.length) interleaved.push({ item: enrichSearchBook(books[i]), type: 'book' });
      if (i < jade.length) interleaved.push({ item: jade[i], type: 'jade' });
    }
    return interleaved;
  }, [isSearching, searchResults, searchFilters]);

  const searchHasQuery = searchQuery.trim().length >= 2;
  const searchTotalResults = searchInterleaved.length;
  const workspaceColumnsStyle = {
    gridTemplateColumns: `${editorPaneWidth}% 14px calc(${100 - editorPaneWidth}% - 14px)`,
  };

  /* ── Render item row — draggable, bigger controls ── */
  const hasIssues = selected?.issues?.length > 0;

  const renderItemRow = (item, idx) => {
    if (!item || !item.id) return null;
    const typeIcon = item.type === 'case' ? 'solar:scale-linear'
      : item.type === 'legislation' ? 'solar:document-text-linear'
      : 'solar:book-2-linear';
    const typeColor = item.type === 'case' ? 'text-success'
      : item.type === 'legislation' ? 'text-info'
      : 'text-brand';
    const typeBadgeCls = item.type === 'case' ? 'bg-success/10 text-success'
      : item.type === 'legislation' ? 'bg-info/10 text-info'
      : 'bg-brand/10 text-brand';
    const typeLabel = item.type === 'case' ? 'Case'
      : item.type === 'legislation' ? 'Legislation' : 'Book';

    const isEditing = editMode || isNewDraft;

    return (
      <Draggable key={item.id} draggableId={item.id} index={idx} isDragDisabled={!isEditing}>
        {(provided, snapshot) => (
          <article
            id={`auth-item-${item.id}`}
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...(isEditing ? provided.dragHandleProps : {})}
            className={`rounded-xl p-3 transition-all ${isEditing ? 'cursor-grab active:cursor-grabbing' : ''} ${snapshot.isDragging ? 'border-2 border-dashed border-brand/30 bg-brand/5 shadow-none' : 'border border-border bg-white hover:border-border shadow-none'}`}
          >
            {/* Row 1: drag handle + title + badges */}
            <div className="flex items-start gap-2">
              {/* Drag handle — edit mode only */}
              {isEditing && (
                <div
                  className="mt-0.5 flex shrink-0 cursor-grab items-center justify-center rounded p-1 text-text-muted/50 transition-colors hover:bg-surface-subtle hover:text-text-muted active:cursor-grabbing"
                >
                  <Icon name="solar:hamburger-menu-linear" size={16} />
                </div>
              )}

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Icon name={typeIcon} size={15} className={`shrink-0 ${typeColor}`} />
                  <p className="truncate text-sm font-medium text-text">{item.title}</p>
                </div>
                {item.citation && <p className={`text-xs text-text-secondary ${isEditing ? 'pl-6' : 'pl-[22px]'}`}>{item.citation}</p>}
              </div>

              {/* Remove button — edit mode only */}
              {isEditing && (
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  className="shrink-0 rounded-lg p-1.5 text-text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                >
                  <Icon name="solar:close-circle-linear" size={16} />
                </button>
              )}
            </div>

            {/* Row 2: tags + pinpoint + availability — single line */}
            <div className={`mt-2 flex flex-wrap items-center gap-2 ${isEditing ? 'pl-8' : 'pl-[22px]'}`}>
              {/* Type badge */}
              <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${typeBadgeCls}`}>{typeLabel}</span>

              {item.uncatalogued && (
                <span className="inline-flex items-center gap-1 rounded-md border border-warning bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                  <Icon name="solar:danger-triangle-linear" size={12} />
                  Uncatalogued
                </span>
              )}

              {/* Usage toggle — edit mode only */}
              {isEditing && (
                <span className="inline-flex rounded-lg border border-border text-xs font-medium overflow-hidden">
                  <button
                    type="button"
                    onClick={async () => { await updateItem(selected.id, item.id, { usage: 'read' }); await refreshLists(); }}
                    className={`px-2.5 py-1 transition-colors ${item.usage === 'read' ? 'bg-brand text-white' : 'bg-white text-text-secondary hover:bg-surface-subtle hover:text-text'}`}
                  >
                    Read
                  </button>
                  <button
                    type="button"
                    onClick={async () => { await updateItem(selected.id, item.id, { usage: 'referred' }); await refreshLists(); }}
                    className={`px-2.5 py-1 transition-colors ${item.usage === 'referred' || !item.usage ? 'bg-brand text-white' : 'bg-white text-text-secondary hover:bg-surface-subtle hover:text-text'}`}
                  >
                    Referred
                  </button>
                </span>
              )}

              {/* Derived part badge */}
              {court && (
                <span className="rounded-md bg-surface-subtle px-2 py-0.5 text-xs font-medium text-text-secondary">
                  {court.parts.find((p) => p.key === derivePart(item.type, item.usage, selected.courtStructure))?.label || ''}
                </span>
              )}

              {/* Pinpoint */}
              {isEditing ? (
                (item.usage === 'read' || item.pageRange) && (
                  <PinpointInput
                    key={`${item.id}:${item.pageRange || ''}`}
                    item={item}
                    listId={selected.id}
                    onSaved={(msg) => { refreshLists(); addToast({ message: msg, type: 'success' }); }}
                  />
                )
              ) : (
                item.pageRange ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
                    <Icon name="solar:pin-bold" size={13} className="text-success" />
                    {item.pageRange}
                  </span>
                ) : item.usage === 'read' && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-warning">
                    <Icon name="solar:pin-bold" size={13} />
                    Missing pinpoint
                  </span>
                )
              )}

              {/* Book availability */}
              {item.type === 'book' && !item.uncatalogued && (
                <BookAvailability item={item} onRequestReturn={handleRequestReturn} />
              )}

              {/* Section selector — edit mode only */}
              {isEditing && hasIssues && (
                <label className="relative inline-block">
                  <select
                    value={item.issue || ''}
                    onChange={(e) => handleMoveToGroup(item, e.target.value || null)}
                    className="appearance-none rounded-lg border border-border bg-white py-1 pl-2.5 pr-7 text-xs text-text-secondary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20"
                  >
                    <option disabled style={{ color: '#888', fontWeight: 600 }}>— Issue group —</option>
                    <option value="">No section</option>
                    {(selected.issues || []).map((iss) => (
                      <option key={iss} value={iss}>{iss}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-muted">
                    <Icon name="solar:alt-arrow-down-linear" size={14} />
                  </span>
                </label>
              )}
            </div>
          </article>
        )}
      </Draggable>
    );
  };

  // While draft is being created, show nothing (prevents list overview flash)
  if (newParam === '1' && !selected) {
    return <div className="animate-page-in" />;
  }

  return (
    <div className={`animate-page-in ${selected ? 'h-full overflow-hidden' : ''}`}>
      {/* ── CASUAL SEARCH MODE (no list selected) ── */}
      {isSearching && !selected ? (
        <>
          {/* Search header with context */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={exitSearchMode}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-subtle"
              >
                <Icon name="solar:arrow-left-linear" size={16} />
              </button>
              <div>
                {selected ? (
                  <>
                    <div className="mb-0.5 flex items-center gap-1.5 text-xs text-text-muted">
                      <Icon name="solar:list-check-linear" size={12} className="text-brand" />
                      <span>Adding to <span className="font-medium text-text-secondary">{selected.name}</span></span>
                      <span className="rounded-md bg-surface-subtle px-1.5 py-0.5 text-xs font-medium text-text-muted">{selected.items.length}</span>
                    </div>
                    <h1 className="font-serif text-2xl text-text">Search & Add</h1>
                  </>
                ) : (
                  <>
                    <h1 className="font-serif text-2xl text-text">Search</h1>
                    <p className="mt-0.5 text-sm text-text-secondary">Find cases, books, and legislation across JADE and your library.</p>
                  </>
                )}
              </div>
            </div>
            {selected && (
              <Button size="sm" variant="primary" onClick={exitSearchMode}>
                <Icon name="solar:check-circle-linear" size={14} />
                Done
              </Button>
            )}
          </div>

          {/* Search input */}
          <div className="mt-4 max-w-2xl">
            <Input
              autoFocus
              icon="solar:magnifer-linear"
              placeholder='Try: "evidence", "contract", "negligence"...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Suggested queries */}
          {!searchHasQuery && !isSearchLoading && (
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestedBarristerQueries.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setSearchQuery(q)}
                  className="rounded-full border border-border/70 bg-surface-subtle px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Filter pills */}
          {searchHasQuery && (
            <div className="mt-3">
              <FilterPillBar filters={searchFilters} onChange={setSearchFilters} />
            </div>
          )}

          {/* Loading skeleton */}
          {isSearchLoading && (
            <div className="mt-4 space-y-2 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-border" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/5 rounded bg-border" />
                      <div className="h-3 w-2/5 rounded bg-surface-subtle" />
                    </div>
                    <div className="h-8 w-20 rounded-lg bg-surface-subtle" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Search results */}
          {!isSearchLoading && searchTotalResults > 0 && (
            <div className="mt-4">
              <p className="mb-3 text-xs text-text-muted">
                {searchTotalResults} {searchTotalResults === 1 ? 'result' : 'results'}
              </p>
              <div className="space-y-2">
                {searchInterleaved.map(({ item, type }) => (
                  <SearchResultCard
                    key={`${type}-${item.id}`}
                    item={item}
                    type={type}
                    directAdd={!!selected}
                    onRequestLoan={handleRequestLoan}
                    onRequestReturn={handleRequestReturnSearch}
                    onAddToList={selected ? handleSearchAdd : handleCasualAdd}
                    onRemoveFromList={selected ? handleSearchRemove : handleCasualRemove}
                    addedListEntry={selected ? getActiveListEntry(item) : casualAddedMap[getSearchResultKey(item, type)]}
                  />
                ))}
              </div>
            </div>
          )}

          {searchHasQuery && !isSearchLoading && searchTotalResults === 0 && (
            <p className="mt-4 text-sm text-text-muted">No results found for "{searchQuery}".</p>
          )}

          {/* Manual add */}
          {searchHasQuery && !isSearchLoading && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => {
                  const title = searchQuery.trim();
                  const manualItem = { title, citation: null, id: `manual-${Date.now()}`, uncatalogued: true };
                  if (selected) handleSearchAdd(manualItem, 'book');
                  else handleCasualAdd(manualItem, 'book');
                }}
                className="flex w-full max-w-2xl items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-3 text-sm font-medium text-text-secondary transition-colors hover:border-brand hover:text-brand"
              >
                <Icon name="solar:add-circle-linear" size={16} />
                Add "{searchQuery}" as uncatalogued book
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          {/* ── NORMAL MODE ── */}
          {!selected && (
            <div
              className="sticky top-0 z-[9] border-b border-border/60 bg-white/95 backdrop-blur-sm"
              style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', width: '100vw', left: 0 }}
            >
              <div className="flex items-center justify-between gap-6 px-6 py-3 lg:px-14 xl:px-16 2xl:px-10">
                <div className="min-w-0">
                  <h1 className="font-serif text-xl font-bold text-text">Authorities</h1>
                  <p className="mt-0.5 text-xs text-text-secondary">Build authority lists from search results and export for court.</p>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleQuickCreate}
                >
                  <Icon name="solar:add-circle-linear" size={16} />
                  New List
                </Button>
              </div>
            </div>
          )}

      {selected ? (
        <div className="flex w-full flex-col" style={{ height: '100%', overflow: 'hidden' }}>
          {/* ── Subheader: fixed toolbar below main header ── */}
          <div className="shrink-0">
            <div className="hidden lg:grid" style={workspaceColumnsStyle}>
              {/* Left sub-header — title + actions */}
              <div className="border-b border-border/60 bg-white py-3 pl-6 pr-5 lg:pl-8 xl:pl-10">
                {isNewDraft ? (
                  <DraftEditableHeader
                    nameRef={draftNameRef}
                    onCommit={async (name, caseRef) => {
                      if (!name.trim()) return;
                      await updateList(selected.id, { name: name.trim(), caseRef: caseRef.trim() });
                      await refreshLists();
                      setIsNewDraft(false);
                      setSearchParams({ listId: selected.id }, { replace: true });
                      addToast({ message: `"${name.trim()}" saved`, type: 'success' });
                    }}
                    onCancel={async () => {
                      await deleteList(selected.id);
                      await refreshLists();
                      syncSelectedList(null);
                      setIsNewDraft(false);
                    }}
                  />
                ) : (
                  <div className="flex flex-col gap-2 min-[1200px]:flex-row min-[1200px]:items-center min-[1200px]:justify-between">
                    <div className="min-w-0">
                      <ListHeader
                        list={selected}
                        editing={editMode}
                        partGroups={partGroups}
                        onSave={async (updates) => {
                          await updateList(selected.id, updates);
                          await refreshLists();
                        }}
                        onCourtChange={handleCourtChange}
                      />
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      {editMode ? (
                        <Button size="sm" variant="primary" onClick={() => setEditMode(false)}>
                          <Icon name="solar:check-circle-linear" size={16} />
                          Done
                        </Button>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => setEditMode(true)}>
                          <Icon name="solar:pen-2-linear" size={16} />
                          Edit
                        </Button>
                      )}
                      <Button size="sm" variant="secondary" onClick={() => setAddingIssue(true)}>
                        <Icon name="solar:add-circle-linear" size={16} />
                        Add Section
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Divider — continuous vertical line */}
              <div className="flex justify-center border-b border-border/60" style={{ background: 'linear-gradient(to right, white 50%, #f1f5f9 50%)' }}>
                <span className="w-px bg-border" />
              </div>

              {/* Right sub-header — preview tools */}
              <div className="flex items-center justify-between gap-3 border-b border-slate-300/60 bg-slate-100 py-3 pl-5 pr-6 lg:pr-8 xl:pr-10">
                <div className="flex items-center gap-1.5">
                  <Icon name="solar:eye-linear" size={16} className="text-text-muted" />
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Live Preview</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={handleSharePreview}>
                    <Icon name="solar:share-linear" size={16} />
                    Share
                  </Button>
                  <Button size="sm" variant="secondary" onClick={handleCopyPreviewText}>
                    <Icon name="solar:copy-linear" size={16} />
                    Copy
                  </Button>
                  <Button size="sm" variant="primary" onClick={() => setShowExportPreview(true)}>
                    <Icon name="solar:export-linear" size={16} />
                    Export
                  </Button>
                </div>
              </div>
            </div>

            {/* Mobile sub-header */}
            <div className="border-b border-border/60 bg-white px-6 py-3 lg:hidden">
              {isNewDraft ? (
                <DraftEditableHeader
                  nameRef={draftNameRef}
                  onCommit={async (name, caseRef) => {
                    if (!name.trim()) return;
                    await updateList(selected.id, { name: name.trim(), caseRef: caseRef.trim() });
                    await refreshLists();
                    setIsNewDraft(false);
                    setSearchParams({ listId: selected.id }, { replace: true });
                    addToast({ message: `"${name.trim()}" saved`, type: 'success' });
                  }}
                  onCancel={async () => {
                    await deleteList(selected.id);
                    await refreshLists();
                    syncSelectedList(null);
                    setIsNewDraft(false);
                  }}
                />
              ) : (
                <div className="flex flex-col gap-2">
                  <ListHeader
                    list={selected}
                    editing={editMode}
                    partGroups={partGroups}
                    onSave={async (updates) => {
                      await updateList(selected.id, updates);
                      await refreshLists();
                    }}
                    onCourtChange={handleCourtChange}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <div className={`flex items-center gap-2 ${mobileView === 'preview' ? 'hidden' : ''}`}>
                      {editMode ? (
                        <Button size="sm" variant="primary" onClick={() => setEditMode(false)}>
                          <Icon name="solar:check-circle-linear" size={16} />
                          Done
                        </Button>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => setEditMode(true)}>
                          <Icon name="solar:pen-2-linear" size={16} />
                          Edit
                        </Button>
                      )}
                      <Button size="sm" variant="secondary" onClick={() => setAddingIssue(true)}>
                        <Icon name="solar:add-circle-linear" size={16} />
                        Add Section
                      </Button>
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-2">
                      <span className="text-xs font-medium text-text-secondary">Preview</span>
                      <span
                        role="switch"
                        aria-checked={mobileView === 'preview'}
                        tabIndex={0}
                        onClick={() => setMobileView(mobileView === 'editor' ? 'preview' : 'editor')}
                        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setMobileView(mobileView === 'editor' ? 'preview' : 'editor'); } }}
                        className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors duration-200 ${
                          mobileView === 'preview' ? 'bg-brand' : 'bg-slate-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                          mobileView === 'preview' ? 'translate-x-5' : 'translate-x-1'
                        }`} />
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Workspace body: dual-pane scroll ── */}
          <div
            ref={workspaceRef}
            className="hidden min-h-0 flex-1 lg:grid"
            style={workspaceColumnsStyle}
          >
            {/* Left pane — editor */}
            <section className="min-w-0 h-full min-h-0 overflow-y-auto bg-white pl-6 pr-5 lg:pl-8 xl:pl-10">

              <div className="pb-8 pt-4">
                <div className="mb-4">
                  <EditorStats list={selected} />
                </div>
                {selected.items.length > 0 || hasIssues ? (
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="space-y-4">
                      {issueGroups.map((group) => {
                        const groupKey = group.issue || '__ungrouped';
                        const isFocused = focusedIssue === groupKey;
                        const isCollapsed = collapsedGroups.has(groupKey);
                        const issueLabel = group.issue || (hasIssues ? 'Ungrouped' : null);

                        return (
                          <div
                            key={groupKey}
                            onClick={() => { setFocusedIssue(groupKey); setInlineQuery(''); setShowInlineResults(false); }}
                            className={`rounded-xl border-[1.5px] bg-white shadow-sm transition-colors ${isFocused ? 'border-brand/50 ring-1 ring-brand/10' : 'border-border'}`}
                          >
                            {issueLabel && (
                              <div className={`group/header flex items-center gap-2 rounded-t-xl border-b px-4 py-3 ${isFocused ? 'border-brand/20 bg-brand/5' : 'border-border-light bg-surface-subtle/80'}`}>
                                {(editMode || isNewDraft) && (
                                  <span className="cursor-grab text-text-muted/40 select-none">
                                    <Icon name="solar:hamburger-menu-linear" size={14} />
                                  </span>
                                )}
                                <span className="text-xs text-text-muted">{group.items.length}</span>
                                {(editMode || isNewDraft) && group.issue ? (
                                  <>
                                    <input
                                      type="text"
                                      value={renamingIssue === group.issue ? renameIssueValue : group.issue}
                                      onChange={(e) => { if (renamingIssue !== group.issue) { setRenamingIssue(group.issue); setRenameIssueValue(e.target.value); } else { setRenameIssueValue(e.target.value); } }}
                                      onFocus={() => { if (renamingIssue !== group.issue) { setRenamingIssue(group.issue); setRenameIssueValue(group.issue); } }}
                                      onBlur={() => { if (renamingIssue === group.issue && renameIssueValue.trim() && renameIssueValue.trim() !== group.issue) { handleRenameIssue(); } else { setRenamingIssue(null); } }}
                                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } if (e.key === 'Escape') { setRenamingIssue(null); } }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex-1 rounded border border-border bg-white px-2 py-1 font-serif text-sm font-semibold text-text transition-colors focus:border-brand/40 focus:outline-none focus:ring-2 focus:ring-brand/20"
                                    />
                                    <button type="button" onClick={(e) => { e.stopPropagation(); handleRemoveIssue(group.issue); }} className="rounded p-1 text-text-muted hover:bg-danger/10 hover:text-danger" title="Remove section">
                                      <Icon name="solar:trash-bin-trash-linear" size={13} />
                                    </button>
                                  </>
                                ) : (
                                  <span className={`flex-1 font-serif text-sm font-semibold ${isFocused ? 'text-brand' : 'text-text'}`}>
                                    {issueLabel}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); toggleGroupCollapse(groupKey); }}
                                  className="flex shrink-0 items-center justify-center rounded p-0.5 text-text-muted transition-colors hover:bg-white/80"
                                >
                                  <Icon name={isCollapsed ? 'solar:alt-arrow-right-linear' : 'solar:alt-arrow-down-linear'} size={14} />
                                </button>
                              </div>
                            )}

                            {!isCollapsed && (
                              <Droppable
                                droppableId={groupKey}
                                renderClone={(cloneProvided, cloneSnapshot, rubric) => {
                                  const cloneItem = group.items.find((i) => i.id === rubric.draggableId);
                                  if (!cloneItem) return <div ref={cloneProvided.innerRef} {...cloneProvided.draggableProps} {...cloneProvided.dragHandleProps} />;
                                  const cloneIcon = cloneItem.type === 'case' ? 'solar:document-text-linear' : cloneItem.type === 'legislation' ? 'solar:bill-list-linear' : 'solar:book-2-linear';
                                  const cloneBadge = cloneItem.type === 'case' ? 'bg-success/10 text-success' : cloneItem.type === 'legislation' ? 'bg-info/10 text-info' : 'bg-brand/10 text-brand';
                                  return (
                                    <article
                                      ref={cloneProvided.innerRef}
                                      {...cloneProvided.draggableProps}
                                      {...cloneProvided.dragHandleProps}
                                      className="rounded-xl border-2 border-brand/30 bg-white p-3 shadow-xl ring-2 ring-brand/20"
                                    >
                                      <div className="flex items-center gap-2">
                                        <Icon name="solar:hamburger-menu-linear" size={16} className="text-text-muted/50" />
                                        <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${cloneBadge}`}>
                                          <Icon name={cloneIcon} size={12} />
                                          {cloneItem.type}
                                        </span>
                                        <span className="truncate text-sm font-semibold text-text">{cloneItem.title}</span>
                                        {cloneItem.citation && <span className="truncate text-xs text-text-muted">{cloneItem.citation}</span>}
                                      </div>
                                    </article>
                                  );
                                }}
                              >
                                {(droppableProvided, droppableSnapshot) => (
                                  <div
                                    ref={droppableProvided.innerRef}
                                    {...droppableProvided.droppableProps}
                                    className={`space-y-1 rounded-lg p-2 transition-colors duration-200 ${droppableSnapshot.isDraggingOver ? 'bg-brand/8 ring-1 ring-inset ring-brand/20' : ''}`}
                                  >
                                    {group.items.length > 0 ? (
                                      group.items.map((item, idx) => renderItemRow(item, idx, group.issue))
                                    ) : issueLabel && group.issue ? (
                                      <p className="py-3 text-center text-sm text-text-muted">No items yet. Use quick-add below.</p>
                                    ) : null}
                                    {droppableProvided.placeholder}
                                  </div>
                                )}
                              </Droppable>
                            )}

                            {isCollapsed && group.items.length > 0 && (
                              <p className="px-4 py-2 text-xs text-text-muted">{group.items.length} items hidden</p>
                            )}

                            {!isCollapsed && (
                              <div className="relative border-t border-border/30 px-4 py-3">
                                <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-all ${isFocused && inlineQuery ? 'border-brand bg-brand/5' : 'border-border bg-surface-subtle/80'}`}>
                                  <Icon name="solar:add-circle-linear" size={16} className={isFocused && inlineQuery ? 'text-brand' : 'text-text-muted/60'} />
                                  <input
                                    type="text"
                                    value={isFocused ? inlineQuery : ''}
                                    onChange={(e) => setInlineQuery(e.target.value)}
                                    onFocus={() => { setFocusedIssue(groupKey); if (inlineQuery.trim().length >= 2) setShowInlineResults(true); }}
                                    onClick={(e) => e.stopPropagation()}
                                    placeholder={`Add to "${issueLabel || selected.name}"...`}
                                    className="flex-1 border-none bg-transparent text-sm text-text placeholder:text-text-muted/60 focus:outline-none"
                                  />
                                  {isFocused && inlineQuery && (
                                    <button type="button" onClick={(e) => { e.stopPropagation(); setInlineQuery(''); setShowInlineResults(false); }} className="text-text-muted hover:text-text">
                                      <Icon name="solar:close-circle-linear" size={16} />
                                    </button>
                                  )}
                                </div>

                                {isFocused && showInlineResults && (
                                  <div className="absolute left-4 right-4 z-10 mt-1 overflow-hidden rounded-xl border border-border bg-white shadow-lg ring-1 ring-black/5">
                                    {inlineLoading && (
                                      <div className="p-3 text-center text-xs text-text-muted animate-pulse">Searching...</div>
                                    )}
                                    {!inlineLoading && inlineInterleaved.length > 0 && inlineInterleaved.map(({ item, type }) => {
                                      const isAdded = selected.items.some((i) => i.title === item.title);
                                      return (
                                        <div
                                          key={`${type}-${item.id}`}
                                          className="flex items-center gap-2 border-b border-border-light px-3 py-2.5 last:border-b-0 transition-colors hover:bg-brand/5"
                                        >
                                          <span className={`rounded-md px-1.5 py-0.5 text-xs font-bold uppercase ${
                                            (type === 'jade' ? item.type : 'book') === 'case' ? 'bg-success/10 text-success'
                                            : (type === 'jade' ? item.type : 'book') === 'legislation' ? 'bg-info/10 text-info'
                                            : 'bg-surface-subtle text-text-secondary'
                                          }`}>
                                            {type === 'jade' ? item.type : 'Book'}
                                          </span>
                                          <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-text">{item.title} {item.citation && <span className="font-normal text-text-muted">{item.citation}</span>}</p>
                                          </div>
                                          {item.status && (
                                            <span className={`text-xs font-semibold ${item.status === 'available' ? 'text-success' : 'text-warning'}`}>
                                              {item.status === 'available' ? '●' : '●'}
                                            </span>
                                          )}
                                          {isAdded ? (
                                            <span className="rounded-md bg-success/10 px-2 py-1 text-xs font-semibold text-success">Added</span>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={(e) => { e.stopPropagation(); handleInlineAdd(item, type); }}
                                              className="rounded-md border border-success/30 bg-transparent px-2 py-1 text-xs font-bold text-success transition-colors hover:bg-success/10"
                                            >
                                              + Add
                                            </button>
                                          )}
                                        </div>
                                      );
                                    })}
                                    {!inlineLoading && inlineQuery.trim().length >= 2 && inlineInterleaved.length === 0 && (
                                      <div className="p-3 text-center text-xs text-text-muted">No results for "{inlineQuery}"</div>
                                    )}
                                    {!inlineLoading && inlineQuery.trim().length >= 2 && (
                                      <div
                                        onClick={(e) => { e.stopPropagation(); handleInlineAdd({ title: inlineQuery.trim(), citation: null, id: `manual-${Date.now()}`, uncatalogued: true }, 'book'); }}
                                        className="cursor-pointer border-t border-border-light bg-surface-subtle/80 px-3 py-2.5 text-center text-xs text-text-muted transition-colors hover:bg-surface-subtle hover:text-brand"
                                      >
                                        + Add "{inlineQuery}" as uncatalogued book
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </DragDropContext>
                ) : (
                  <div className="rounded-xl border-[1.5px] border-brand/30 bg-white shadow-sm">
                    <div className="px-5 pt-5 pb-3">
                      <p className="text-sm font-medium text-text">{(editMode || isNewDraft) ? 'Start building your authority list' : 'This list has no items yet'}</p>
                      <p className="mt-0.5 text-xs text-text-secondary">Search for cases, legislation, or books to add.</p>
                    </div>

                    <div className="relative px-5 pb-4">
                      <div className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 transition-all ${inlineQuery ? 'border-brand bg-brand/5' : 'border-border bg-surface-subtle/80'}`}>
                        <Icon name="solar:magnifer-linear" size={16} className={inlineQuery ? 'text-brand' : 'text-text-muted/60'} />
                        <input
                          type="text"
                          value={inlineQuery}
                          onChange={(e) => setInlineQuery(e.target.value)}
                          onFocus={() => { setFocusedIssue('__ungrouped'); if (inlineQuery.trim().length >= 2) setShowInlineResults(true); }}
                          placeholder="Search cases, legislation, books..."
                          className="flex-1 border-none bg-transparent text-sm text-text placeholder:text-text-muted/60 focus:outline-none"
                        />
                        {inlineQuery && (
                          <button type="button" onClick={() => { setInlineQuery(''); setShowInlineResults(false); }} className="text-text-muted hover:text-text">
                            <Icon name="solar:close-circle-linear" size={16} />
                          </button>
                        )}
                      </div>

                      {showInlineResults && (
                        <div className="absolute left-5 right-5 z-10 mt-1 overflow-hidden rounded-xl border border-border bg-white shadow-lg ring-1 ring-black/5">
                          {inlineLoading && (
                            <div className="p-3 text-center text-xs text-text-muted animate-pulse">Searching...</div>
                          )}
                          {!inlineLoading && inlineInterleaved.length > 0 && inlineInterleaved.map(({ item, type }) => {
                            const isAdded = selected.items.some((i) => i.title === item.title);
                            return (
                              <div
                                key={`${type}-${item.id}`}
                                className="flex items-center gap-2 border-b border-border-light px-3 py-2.5 last:border-b-0 transition-colors hover:bg-brand/5"
                              >
                                <span className={`rounded-md px-1.5 py-0.5 text-xs font-bold uppercase ${
                                  (type === 'jade' ? item.type : 'book') === 'case' ? 'bg-success/10 text-success'
                                  : (type === 'jade' ? item.type : 'book') === 'legislation' ? 'bg-info/10 text-info'
                                  : 'bg-surface-subtle text-text-secondary'
                                }`}>
                                  {type === 'jade' ? item.type : 'Book'}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-text">{item.title} {item.citation && <span className="font-normal text-text-muted">{item.citation}</span>}</p>
                                </div>
                                {item.status && (
                                  <span className={`text-xs font-semibold ${item.status === 'available' ? 'text-success' : 'text-warning'}`}>
                                    {item.status === 'available' ? '●' : '●'}
                                  </span>
                                )}
                                {isAdded ? (
                                  <span className="rounded-md bg-success/10 px-2 py-1 text-xs font-semibold text-success">Added</span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleInlineAdd(item, type); }}
                                    className="rounded-md border border-success/30 bg-transparent px-2 py-1 text-xs font-bold text-success transition-colors hover:bg-success/10"
                                  >
                                    + Add
                                  </button>
                                )}
                              </div>
                            );
                          })}
                          {!inlineLoading && inlineQuery.trim().length >= 2 && inlineInterleaved.length === 0 && (
                            <div className="p-3 text-center text-xs text-text-muted">No results for "{inlineQuery}"</div>
                          )}
                          {!inlineLoading && inlineQuery.trim().length >= 2 && (
                            <div
                              onClick={() => { handleInlineAdd({ title: inlineQuery.trim(), citation: null, id: `manual-${Date.now()}`, uncatalogued: true }, 'book'); }}
                              className="cursor-pointer border-t border-border-light bg-surface-subtle/80 px-3 py-2.5 text-center text-xs text-text-muted transition-colors hover:bg-surface-subtle hover:text-brand"
                            >
                              + Add "{inlineQuery}" as uncatalogued book
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {!editMode && !isNewDraft ? null : (
                      <div className="border-t border-border/50 px-5 py-3">
                        <p className="mb-2 text-xs text-text-muted">Try searching:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {suggestedBarristerQueries.slice(0, 4).map((q) => (
                            <button
                              key={q}
                              type="button"
                              onClick={() => { setInlineQuery(q); setFocusedIssue('__ungrouped'); }}
                              className="rounded-full border border-border bg-surface-subtle/80 px-2.5 py-1 text-xs text-text-secondary transition-colors hover:border-brand/40 hover:bg-brand/5 hover:text-brand"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {addingIssue && (
                  <div className="mt-4">
                    <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); handleAddIssue(); }}>
                      <input
                        type="text"
                        autoFocus
                        value={newIssueName}
                        onChange={(e) => setNewIssueName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Escape') { setAddingIssue(false); setNewIssueName(''); } }}
                        placeholder="Issue name, e.g. Breach of Fiduciary Duty"
                        className="flex-1 rounded-lg border border-brand/40 bg-white px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                      />
                      <Button size="sm" variant="primary" type="submit" disabled={!newIssueName.trim()}>Add</Button>
                      <Button size="sm" variant="secondary" type="button" onClick={() => { setAddingIssue(false); setNewIssueName(''); }}>Cancel</Button>
                    </form>
                  </div>
                )}
              </div>
            </section>

            {/* Divider — resize handle */}
            <div className="relative flex items-stretch justify-center" style={{ background: 'linear-gradient(to right, white 50%, #f1f5f9 50%)' }}>
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  setIsResizing(true);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowLeft') setEditorPaneWidth((prev) => Math.max(42, prev - 2));
                  if (event.key === 'ArrowRight') setEditorPaneWidth((prev) => Math.min(72, prev + 2));
                }}
                className="group relative flex h-full w-full cursor-col-resize items-center justify-center"
                aria-label="Resize editor and preview panes"
              >
                <span className="h-full w-px bg-border transition-colors group-hover:bg-slate-300" />
                <span className="absolute left-1/2 top-1/2 z-[2] flex h-16 w-3 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition-colors group-hover:border-slate-300">
                  <span className="h-8 w-1 rounded-full bg-slate-300 transition-colors group-hover:bg-slate-400" />
                </span>
              </button>
            </div>

            {/* Right pane — preview (full-height pane, not card) */}
            <section ref={previewPaneRef} className="min-w-0 h-full min-h-0 overflow-y-auto bg-slate-100 py-5 pl-5 pr-6 lg:pr-8 xl:pr-10">
              <AGLCPreviewInline
                list={selected}
                onScrollToItem={(itemId) => {
                  const el = document.getElementById(`auth-item-${itemId}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
              />
            </section>
          </div>

          {/* Mobile body — single pane at a time, page-scroll */}
          <div className={`px-6 pb-8 pt-4 lg:hidden ${mobileView === 'preview' ? 'hidden' : ''}`}>
            <div className="mb-4">
              <EditorStats list={selected} />
            </div>
            {selected.items.length > 0 || hasIssues ? (
              <DragDropContext onDragEnd={handleDragEnd}>
                <div className="space-y-4">
                  {/* Simplified mobile editor — item list without drag for now */}
                  {issueGroups.map((group) => {
                    const groupKey = group.issue || '__ungrouped';
                    return (
                      <div key={groupKey}>
                        {group.issue && (
                          <p className="mb-2 font-serif text-sm font-semibold text-text">{group.issue}</p>
                        )}
                        <div className="space-y-2">
                          {group.items.map((item) => (
                            <div key={item.id} id={`auth-item-${item.id}`} className="rounded-xl border border-border bg-white px-4 py-3">
                              <p className="text-sm font-medium text-text">{item.title}</p>
                              {item.citation && <p className="mt-0.5 text-xs text-text-muted">{item.citation}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </DragDropContext>
            ) : (
              <p className="text-xs text-text-muted">No items yet. Search to add authorities.</p>
            )}
          </div>
          <div className={`bg-slate-100 p-5 lg:hidden ${mobileView === 'editor' ? 'hidden' : ''}`}>
            <AGLCPreviewInline
              list={selected}
              onScrollToItem={(itemId) => {
                const el = document.getElementById(`auth-item-${itemId}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
            />
          </div>
        </div>
      ) : (
        /* List overview — with action menus */
        !listsLoaded ? (
        <div className="mt-5 space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <div className="space-y-2">
                <div className="h-4 w-2/5 rounded bg-border" />
                <div className="h-3 w-3/5 rounded bg-surface-subtle" />
                <div className="flex gap-2 mt-1">
                  <div className="h-5 w-16 rounded bg-surface-subtle" />
                  <div className="h-5 w-16 rounded bg-surface-subtle" />
                  <div className="h-5 w-20 rounded bg-surface-subtle" />
                </div>
              </div>
            </div>
          ))}
        </div>
        ) : (
        <div className="mt-5 space-y-2 animate-fade-in">
          {lists.map((list) => {
            const cases = list.items.filter((i) => i.type === 'case').length;
            const legislation = list.items.filter((i) => i.type === 'legislation').length;
            const books = list.items.filter((i) => i.type === 'book').length;
            const courtLabel = getCourtStructure(list.courtStructure).label;

            return (
              <article
                key={list.id}
                className="relative rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition-colors hover:bg-surface-subtle"
              >
                <div className="flex items-center justify-between cursor-pointer" onClick={() => syncSelectedList(list)}>
                  <div>
                    <p className="text-sm font-semibold text-text">{list.name}</p>
                    <p className="mt-0.5 text-xs text-text-secondary">{list.caseRef}</p>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {cases > 0 && (
                        <span className="rounded-md bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                          {cases} {cases === 1 ? 'case' : 'cases'}
                        </span>
                      )}
                      {legislation > 0 && (
                        <span className="rounded-md bg-info/10 px-2 py-0.5 text-xs font-medium text-info">
                          {legislation} legislation
                        </span>
                      )}
                      {books > 0 && (
                        <span className="rounded-md bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                          {books} {books === 1 ? 'book' : 'books'}
                        </span>
                      )}
                      {(list.issues?.length > 0) && (
                        <span className="rounded-md bg-surface-subtle px-2 py-0.5 text-xs font-medium text-text-muted">
                          {list.issues.length} {list.issues.length === 1 ? 'issue' : 'issues'}
                        </span>
                      )}
                      <span className="rounded-md bg-surface-subtle px-2 py-0.5 text-xs font-medium text-text-muted">
                        {courtLabel}
                      </span>
                      {list.createdAt && (
                        <span className="text-xs text-text-muted">{list.createdAt}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(list.id); }}
                      className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                      aria-label={`Delete ${list.name}`}
                    >
                      <Icon name="solar:trash-bin-trash-linear" size={16} />
                    </button>
                    <Icon name="solar:arrow-right-linear" size={14} className="text-text-muted" />
                  </div>
                </div>
              </article>
            );
          })}
          {lists.length === 0 && !isNewDraft && (
            <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-border bg-white p-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10">
                <Icon name="solar:list-check-linear" size={24} className="text-brand" />
              </span>
              <p className="mt-4 text-sm font-medium text-text">No authority lists yet</p>
              <p className="mt-1 max-w-sm text-sm text-text-secondary">
                Create a list for your case, then search and add authorities.
              </p>
              <Button
                className="mt-4"
                onClick={handleQuickCreate}
              >
                <Icon name="solar:add-circle-linear" size={16} />
                Create your first list
              </Button>
              <div className="mx-auto mt-6 flex items-center gap-6 text-xs text-text-muted">
                {[
                  { icon: 'solar:add-circle-linear', label: 'Create list' },
                  { icon: 'solar:magnifer-linear', label: 'Search & add' },
                  { icon: 'solar:document-text-linear', label: 'Export AGLC' },
                ].map((step, idx) => (
                  <div key={step.label} className="flex items-center gap-1.5">
                    {idx > 0 && <span className="mr-1.5 text-border">→</span>}
                    <Icon name={step.icon} size={13} />
                    <span>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        )
      )}
        </>
      )}

      {/* Casual list picker modal — shown when adding from search without active list */}
      {!selected && pendingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 transition-opacity duration-200" onClick={() => setPendingItem(null)}>
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl ring-1 ring-black/5 animate-page-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg text-text">Add to List</h3>
              <button type="button" onClick={() => setPendingItem(null)} className="rounded-lg p-1 text-text-muted transition-colors hover:bg-surface-subtle hover:text-text">
                <Icon name="solar:close-circle-linear" size={18} />
              </button>
            </div>
            <p className="mt-1 text-sm text-text-secondary">{pendingItem.item.title}</p>
            <div className="mt-4 max-h-60 space-y-1.5 overflow-y-auto">
              {lists.map((list) => (
                <button
                  key={list.id}
                  type="button"
                  onClick={() => handleCasualPickList(list)}
                  className="flex w-full items-center justify-between rounded-xl border border-border/70 px-3 py-2.5 text-left transition-colors hover:bg-surface-subtle"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text">{list.name}</p>
                    <p className="text-xs text-text-muted">{list.caseRef}</p>
                  </div>
                  <span className="shrink-0 text-xs text-text-secondary">{list.items.length} entries</span>
                </button>
              ))}
              {lists.length === 0 && !casualShowNewList && (
                <p className="py-2 text-center text-sm text-text-muted">No lists yet. Create one below.</p>
              )}
            </div>
            {casualShowNewList ? (
              <div className="mt-3 space-y-2 rounded-xl border border-brand/20 bg-brand/5 p-3">
                <input
                  type="text"
                  autoFocus
                  placeholder="List name (e.g. Smith v Jones)"
                  value={casualNewName}
                  onChange={(e) => setCasualNewName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                <input
                  type="text"
                  placeholder="Case ref (optional)"
                  value={casualNewRef}
                  onChange={(e) => setCasualNewRef(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCasualCreateAndAdd(); }}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="primary" onClick={handleCasualCreateAndAdd} disabled={!casualNewName.trim()}>Create & Add</Button>
                  <Button size="sm" variant="secondary" onClick={() => setCasualShowNewList(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCasualShowNewList(true)}
                className="mt-3 flex w-full items-center gap-2 rounded-xl border border-dashed border-brand/30 px-3 py-2.5 text-sm font-medium text-brand transition-colors hover:bg-brand/5"
              >
                <Icon name="solar:add-circle-linear" size={16} />
                New List
              </button>
            )}
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setDeleteConfirmId(null)}>
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl ring-1 ring-black/5 animate-page-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-lg text-text">Delete List?</h3>
            <p className="mt-2 text-sm text-text-secondary">
              This will permanently remove the list and all its entries. This cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button size="sm" variant="secondary" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
              <Button size="sm" variant="primary" onClick={() => handleDelete(deleteConfirmId)} className="!bg-danger hover:!bg-danger/90">Delete</Button>
            </div>
          </div>
        </div>
      )}

      {showExportPreview && selected && (
        <ExportPreviewModal list={selected} onClose={() => setShowExportPreview(false)} />
      )}
    </div>
  );
}
