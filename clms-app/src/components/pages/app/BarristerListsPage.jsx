import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../../atoms/Icon';
import Input from '../../atoms/Input';
import Select from '../../atoms/Select';
import Button from '../../atoms/Button';
import Skeleton from '../../atoms/Skeleton';
import PageHeader from '../../molecules/PageHeader';
import { useAppContext } from '../../../context/AppContext';
import { useToast } from '../../../context/ToastContext';
import {
  getLists, createList, updateItem, updateList, removeItem, addItem, reorderItems,
  deleteList, duplicateList, addIssue, renameIssue, removeIssue,
} from '../../../services/authorityListsService';
import { addQueueEntry, dismissQueueItemBySource } from '../../../services/uncataloguedQueueService';
import { requestReturn, requestLoan } from '../../../services/loansService';
import { searchAll } from '../../../services/searchService';
import ExportPreviewModal from '../../organisms/ExportPreviewModal';
import SearchResultCard from '../../molecules/SearchResultCard';
import FilterPillBar from '../../molecules/FilterPillBar';
import AuthorityListCard from '../../molecules/AuthorityListCard';
import { getCourtStructure, getCourtOptions, derivePart } from '../../../utils/courtStructures';
import { lookupBookByTitle, getBorrowerName } from '../../../utils/bookLookup';
import { formatLegislation, formatBook, generateAGLCPlainText } from '../../../utils/aglcFormatter';
import { suggestedBarristerQueries } from '../../../mocks/barristerQueries';
import { membersMock } from '../../../mocks/members';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const MODAL_CLOSE_MS = 200;

const hasPinpointData = (item) => {
  if (item.type === 'legislation') return !!(item.pageRange || item.citation);
  return !!item.pageRange;
};

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
        data-pinpoint-item={item.id}
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

/* ── Inline book citation metadata editor ── */
function BookCitationEditor({ item, listId, onSaved }) {
  const [author, setAuthor] = useState(item.author || '');
  const [publisher, setPublisher] = useState(item.publisher || '');
  const [edition, setEdition] = useState(item.edition || '');
  const [year, setYear] = useState(item.year ? String(item.year) : '');
  const prevRef = useRef({ author: item.author || '', publisher: item.publisher || '', edition: item.edition || '', year: item.year ? String(item.year) : '' });

  const save = async () => {
    const cur = { author: author.trim(), publisher: publisher.trim(), edition: edition.trim(), year: year.trim() };
    const prev = prevRef.current;
    if (cur.author === prev.author && cur.publisher === prev.publisher && cur.edition === prev.edition && cur.year === prev.year) return;
    prevRef.current = cur;
    await updateItem(listId, item.id, {
      author: cur.author || null,
      publisher: cur.publisher || null,
      edition: cur.edition || null,
      year: cur.year ? Number(cur.year) : null,
    });
    onSaved('Citation updated');
  };

  const onEnter = (e) => { if (e.key === 'Enter') e.target.blur(); };
  const isComplete = author.trim() && publisher.trim() && year.trim();
  const borderCls = isComplete
    ? 'border-success/40 bg-success/5 focus:border-success focus:ring-success/20'
    : 'border-warning/40 bg-warning/5 focus:border-warning focus:ring-warning/20';
  const inputCls = `rounded-lg border px-2 py-0.5 text-xs text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-2 transition-colors ${borderCls}`;

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      <Icon name="solar:book-2-linear" size={13} className={isComplete ? 'text-success' : 'text-warning'} />
      <input type="text" data-bookcite-item={item.id} value={author} onChange={(e) => setAuthor(e.target.value)} onBlur={save} onKeyDown={onEnter} placeholder="Author" className={`w-40 ${inputCls}`} />
      <input type="text" value={publisher} onChange={(e) => setPublisher(e.target.value)} onBlur={save} onKeyDown={onEnter} placeholder="Publisher" className={`w-32 ${inputCls}`} />
      <input type="text" value={edition} onChange={(e) => setEdition(e.target.value)} onBlur={save} onKeyDown={onEnter} placeholder="Ed" className={`w-12 ${inputCls}`} />
      <input type="text" value={year} onChange={(e) => setYear(e.target.value)} onBlur={save} onKeyDown={onEnter} placeholder="Year" className={`w-14 ${inputCls}`} />
    </div>
  );
}

/* ── Book availability indicator ── */
function BookAvailability({ item }) {
  if (item.uncatalogued) return null;
  const book = lookupBookByTitle(item.title);
  if (!book) return null;

  if (book.status === 'available') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
        Available
      </span>
    );
  }

  const borrower = getBorrowerName(book.borrower);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-warning" />
      On Loan{borrower ? ` \u00b7 ${borrower}` : ''}{book.dueDate ? `, due ${book.dueDate}` : ''}
    </span>
  );
}

/**
 * Auto-bracket bare numeric pinpoints for AGLC4 paragraph references (JSX version).
 */
function bracketPinpointJsx(raw) {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (trimmed.includes('[')) return trimmed;
  return trimmed.replace(/\b(\d+)\b/g, '[$1]');
}

/* ── Persistent preview pane — court filing document style ── */
function AGLCPreviewInline({ list, onScrollToItem }) {
  const court = getCourtStructure(list.courtStructure || 'vic');
  const sortAlpha = (items) => [...items].sort((a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }));

  /** Check if a book item has incomplete citation metadata */
  const isBookIncomplete = (item) => item.type === 'book' && (!item.author || !item.publisher || !item.year);

  const fmtItemJsx = (item) => {
    if (item.type === 'case') {
      const citation = item.citation || '';
      const pinpoint = item.pageRange ? ` at ${bracketPinpointJsx(item.pageRange)}` : '';
      return <><em>{item.title}</em> {citation}{pinpoint}</>;
    }
    if (item.type === 'legislation') return formatLegislation(item);
    return formatBook(item);
  };

  const getIssues = (item) => {
    const issues = [];
    if (item.usage === 'read' && !hasPinpointData(item)) issues.push('Pinpoint missing');
    if (isBookIncomplete(item)) issues.push('Incomplete citation');
    return issues;
  };

  // Collect all issues for summary bar
  const allIssues = [];
  const missingPinpoints = list.items.filter((item) => item.usage === 'read' && !hasPinpointData(item)).length;
  if (missingPinpoints > 0) allIssues.push(`${missingPinpoints} pinpoint missing`);
  const incompleteBooks = list.items.filter((item) => isBookIncomplete(item)).length;
  if (incompleteBooks > 0) allIssues.push(`${incompleteBooks} incomplete citation`);
  const firstProblemItem = list.items.find((item) => getIssues(item).length > 0);

  // Continuous numbering — precompute start number per part (pure, no render-phase mutation)
  const useContinuous = court.continuousNumbering;
  const partStartNums = useMemo(() => {
    const nums = {};
    let running = 0;
    court.parts.forEach((part) => {
      const count = list.items.filter((i) => derivePart(i.type, i.usage, list.courtStructure) === part.key).length;
      nums[part.key] = useContinuous ? running + 1 : 1;
      running += count;
    });
    return nums;
  }, [court.parts, list.items, list.courtStructure, useContinuous]);

  // Filing metadata
  const roleLabel = (list.partyRole || 'Applicant').toUpperCase();
  const preparer = list.preparedBy || '';
  const registry = list.registryCity || court.defaultRegistry || '';
  const partyOneName = list.filedOnBehalf || '';
  const partyTwoName = list.otherPartyName || '';

  return (
    <aside className="flex flex-col overflow-hidden rounded-sm bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] animate-page-in font-serif">
      {allIssues.length > 0 && (
        <div className="flex items-center justify-between gap-3 border-b border-red-200/60 bg-red-50 px-5 py-2.5 font-sans">
          <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
            <Icon name="solar:danger-triangle-linear" size={13} />
            {allIssues.join(' · ')}
          </p>
          {firstProblemItem && onScrollToItem && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onScrollToItem(firstProblemItem.id)}
              className="px-2.5 py-1 text-xs text-red-600 hover:!text-red-700"
            >
              <Icon name="solar:danger-triangle-linear" size={13} />
              Fix issues
            </Button>
          )}
        </div>
      )}

      <div className="px-8 py-8 text-[13px] leading-[1.9]">
        {/* Court header — centered */}
        <div className="mb-5 text-center text-[13px]">
          <p className="font-bold">IN THE {court.label.toUpperCase()}</p>
          {registry && <p>AT {registry.toUpperCase()}</p>}
          {list.division && <p>{list.division.toUpperCase()}</p>}
          {list.caseRef && <p className="mt-1.5 text-text-muted">{list.caseRef}</p>}
        </div>

        {/* Parties block — always visible */}
        <div className="my-5 text-[13px]">
          <div className="flex items-baseline justify-between">
            {partyOneName ? (
              <span className="font-bold">{partyOneName.toUpperCase()}</span>
            ) : (
              <span className="italic text-text-muted">[Party name]</span>
            )}
            <span className="text-text-muted">{list.partyRole || 'Applicant'}</span>
          </div>
          <p className="my-1 text-center text-text-muted">and</p>
          <div className="flex items-baseline justify-between">
            {partyTwoName ? (
              <span className="font-bold">{partyTwoName.toUpperCase()}</span>
            ) : (
              <span className="italic text-text-muted">[Other party name]</span>
            )}
            <span className="text-text-muted">{list.otherPartyRole || 'Respondent'}</span>
          </div>
        </div>

        {/* Document title */}
        <p className="my-5 text-center text-sm font-bold uppercase tracking-[0.1em]">
          {roleLabel}&rsquo;S LIST OF AUTHORITIES
        </p>

        {/* Filing metadata — left-aligned */}
        <div className="mb-6 border-b border-slate-200 pb-4 text-[12px] leading-relaxed text-text-muted">
          <p>Date of document: {list.filingDate || <span className="italic">[date]</span>}</p>
          <p>Filed on behalf of: {partyOneName || <span className="italic">[party name]</span>}{list.partyRole ? `, ${list.partyRole}` : ''}</p>
          <p>Prepared by: {preparer || <span className="italic">[practitioner name]</span>}</p>
        </div>

        {/* Parts — left-aligned, serif, sentence case desc */}
        <div className="space-y-6">
          {court.parts.map((part) => {
            const partItems = sortAlpha(list.items.filter((i) => derivePart(i.type, i.usage, list.courtStructure) === part.key));
            const isEmpty = partItems.length === 0;
            const startNum = partStartNums[part.key] || 1;

            // Skip empty parts unless court requires showing them
            if (isEmpty && !court.showEmptyParts) return null;

            return (
              <div key={part.key}>
                <p className="text-[13px]">
                  <span className="font-bold">{part.label}</span>
                  <span className="ml-3 text-text-secondary">{part.desc}</span>
                </p>
                {isEmpty ? (
                  <p className="mt-1.5 pl-7 italic text-text-muted">None</p>
                ) : (
                  <ol start={startNum} className="mt-2 list-decimal pl-7 space-y-1.5">
                    {partItems.map((item) => {
                      const issues = getIssues(item);
                      const hasIssue = issues.length > 0;
                      return (
                        <li
                          key={item.id}
                          className={`text-[13px] leading-[1.9] text-text ${hasIssue ? '-mx-2 rounded bg-red-50 px-2 py-0.5' : ''}`}
                          title={hasIssue ? issues.join(', ') : undefined}
                        >
                          {fmtItemJsx(item)}
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            );
          })}
          {list.items.length === 0 && !court.showEmptyParts && (
            <p className="text-[13px] italic text-text-muted">No items to preview.</p>
          )}
        </div>

        {/* Signature block */}
        <div className="mt-14 text-[13px]">
          <p className="text-text-muted">Date: {list.filingDate || '_______________'}</p>
          <p className="mt-7">Signed</p>
          <div className="mt-9 w-60 border-t border-text/60 pt-1.5">
            <p>{preparer || <span className="italic text-text-muted">[Name]</span>}</p>
            {list.signatoryCapacity && <p className="text-text-muted">{list.signatoryCapacity}</p>}
          </div>
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
      <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-subtle px-2.5 py-1 font-medium text-emerald-700">
        <Icon name="solar:scale-linear" size={12} />
        Cases: {cases}
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-subtle px-2.5 py-1 font-medium text-legislation">
        <Icon name="solar:document-text-linear" size={12} />
        Legislation: {legislation}
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-subtle px-2.5 py-1 font-medium text-orange-700">
        <Icon name="solar:book-2-linear" size={12} />
        Books: {books}
      </span>
    </div>
  );
}

/* ── List header — read-only or edit mode with auto-save ── */
const PARTY_ROLE_OPTIONS = ['Applicant', 'Appellant', 'Respondent', 'Plaintiff', 'Defendant'];

function ListHeader({ list, editing, onSave, partGroups = [], onCourtChange }) {
  const court = getCourtStructure(list.courtStructure || 'vic');
  const [name, setName] = useState(list.name);
  const [caseRef, setCaseRef] = useState(list.caseRef || '');
  const [registryCity, setRegistryCity] = useState(list.registryCity || '');
  const [division, setDivision] = useState(list.division || '');
  const [filedOnBehalf, setFiledOnBehalf] = useState(list.filedOnBehalf || '');
  const [partyRole, setPartyRole] = useState(list.partyRole || 'Applicant');
  const [otherPartyName, setOtherPartyName] = useState(list.otherPartyName || '');
  const [otherPartyRole, setOtherPartyRole] = useState(list.otherPartyRole || 'Respondent');
  const [preparedBy, setPreparedBy] = useState(list.preparedBy || '');
  const [filingDate, setFilingDate] = useState(list.filingDate || '');
  const [signatoryCapacity, setSignatoryCapacity] = useState(list.signatoryCapacity || '');
  const [saveStatus, setSaveStatus] = useState(null);
  const nameInputRef = useRef(null);
  const statusTimer = useRef(null);
  const snapshotRef = useRef({});

  const snap = () => ({
    name: (list.name || ''),
    caseRef: (list.caseRef || ''),
    registryCity: (list.registryCity || ''),
    division: (list.division || ''),
    filedOnBehalf: (list.filedOnBehalf || ''),
    partyRole: (list.partyRole || 'Applicant'),
    otherPartyName: (list.otherPartyName || ''),
    otherPartyRole: (list.otherPartyRole || 'Respondent'),
    preparedBy: (list.preparedBy || ''),
    filingDate: (list.filingDate || ''),
    signatoryCapacity: (list.signatoryCapacity || ''),
  });

  useEffect(() => {
    const s = snap();
    snapshotRef.current = s;
    setName(s.name); setCaseRef(s.caseRef); setRegistryCity(s.registryCity);
    setDivision(s.division); setFiledOnBehalf(s.filedOnBehalf); setPartyRole(s.partyRole);
    setOtherPartyName(s.otherPartyName); setOtherPartyRole(s.otherPartyRole);
    setPreparedBy(s.preparedBy); setFilingDate(s.filingDate); setSignatoryCapacity(s.signatoryCapacity);
    setSaveStatus(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.id, list.name, list.caseRef, list.registryCity, list.division, list.filedOnBehalf, list.partyRole, list.otherPartyName, list.otherPartyRole, list.preparedBy, list.filingDate, list.signatoryCapacity]);

  useEffect(() => {
    if (editing) setTimeout(() => nameInputRef.current?.focus(), 50);
  }, [editing]);

  const saveIfChanged = async () => {
    const cur = {
      name: name.trim() || snapshotRef.current.name,
      caseRef: caseRef.trim(),
      registryCity: registryCity.trim(),
      division,
      filedOnBehalf: filedOnBehalf.trim(),
      partyRole,
      otherPartyName: otherPartyName.trim(),
      otherPartyRole,
      preparedBy: preparedBy.trim(),
      filingDate,
      signatoryCapacity: signatoryCapacity.trim(),
    };
    const prev = snapshotRef.current;
    const changed = Object.keys(cur).some((k) => cur[k] !== prev[k]);
    if (!changed) return;
    snapshotRef.current = cur;
    setName(cur.name);
    setSaveStatus('saving');
    await onSave(cur);
    setSaveStatus('saved');
    clearTimeout(statusTimer.current);
    statusTimer.current = setTimeout(() => setSaveStatus(null), 2000);
  };

  const hasFilingData = !!(list.filedOnBehalf || list.otherPartyName || list.preparedBy || list.filingDate || list.signatoryCapacity || list.registryCity || list.division);
  const [showFiling, setShowFiling] = useState(hasFilingData);

  const titleWidth = `${Math.min(Math.max((name || '').length + 2, 30), 50)}ch`;
  const referenceWidth = `${Math.min(Math.max((caseRef || '').length + 2, 20), 36)}ch`;
  const courtLabel = court.label;

  if (!editing) {
    const subtitle = [courtLabel, list.caseRef].filter(Boolean).join(' · ');
    return (
      <div>
        <h1 className="font-serif text-section-title font-bold text-text">{list.name}</h1>
        {subtitle && <p className="mt-1 text-xs text-text-secondary">{subtitle}</p>}
      </div>
    );
  }

  const inputCls = "max-w-full rounded-lg border border-border bg-white px-3 py-1 text-xs text-text placeholder:text-text-muted/60 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20";
  const onEnter = (e) => { if (e.key === 'Enter') e.target.blur(); };
  const selectSave = (setter) => (e) => { setter(e.target.value); setTimeout(saveIfChanged, 0); };


  return (
    <div className="animate-fade-in space-y-2">
      {/* Row 1: Case title */}
      <div className="flex items-center gap-2">
        <input
          ref={nameInputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveIfChanged}
          onKeyDown={onEnter}
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
      {/* Row 2: Case ref + Court */}
      <div className="flex flex-wrap items-center gap-2">
        <input type="text" value={caseRef} onChange={(e) => setCaseRef(e.target.value)} onBlur={saveIfChanged} onKeyDown={onEnter} placeholder="File no, e.g. S CI 2024/00412" style={{ width: referenceWidth }} className={`min-w-[16ch] ${inputCls}`} />
        <span className="inline-block h-0.5 w-0.5 rounded-full bg-text-muted/40" />
        <Select size="sm" value={list.courtStructure || 'vic'} onChange={(e) => onCourtChange?.(e.target.value)} className="inline-block">
          {getCourtOptions().map((opt) => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
        </Select>
        <button type="button" onClick={() => setShowFiling((v) => !v)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-text-muted transition-colors hover:bg-surface-subtle hover:text-text-secondary">
          <Icon name={showFiling ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'} size={14} />
          Filing details
        </button>
      </div>
      {/* Collapsible: Filing details */}
      {showFiling && (
        <div className="space-y-2 animate-fade-in">
          <div className="flex flex-wrap items-center gap-2">
            <input type="text" value={registryCity} onChange={(e) => setRegistryCity(e.target.value)} onBlur={saveIfChanged} onKeyDown={onEnter} placeholder={court.defaultRegistry || 'Registry city'} className={`w-28 ${inputCls}`} />
            {court.divisions?.length > 0 && (
              <Select size="sm" value={division} onChange={selectSave(setDivision)} className="inline-block">
                <option value="">Division...</option>
                {court.divisions.map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
            )}
            <span className="inline-block h-0.5 w-0.5 rounded-full bg-text-muted/40" />
            <input type="text" value={filedOnBehalf} onChange={(e) => setFiledOnBehalf(e.target.value)} onBlur={saveIfChanged} onKeyDown={onEnter} placeholder="Party name (filing)" className={`w-36 ${inputCls}`} />
            <Select size="sm" value={partyRole} onChange={selectSave(setPartyRole)} className="inline-block">
              {PARTY_ROLE_OPTIONS.map((role) => <option key={role} value={role}>{role}</option>)}
            </Select>
            <span className="text-xs text-text-muted">v</span>
            <input type="text" value={otherPartyName} onChange={(e) => setOtherPartyName(e.target.value)} onBlur={saveIfChanged} onKeyDown={onEnter} placeholder="Other party" className={`w-36 ${inputCls}`} />
            <Select size="sm" value={otherPartyRole} onChange={selectSave(setOtherPartyRole)} className="inline-block">
              {PARTY_ROLE_OPTIONS.map((role) => <option key={role} value={role}>{role}</option>)}
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input type="text" value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)} onBlur={saveIfChanged} onKeyDown={onEnter} placeholder="Prepared by..." className={`w-36 ${inputCls}`} />
            <input type="date" value={filingDate} onChange={selectSave(setFilingDate)} onBlur={saveIfChanged} className={`w-36 ${inputCls}`} />
            <input type="text" value={signatoryCapacity} onChange={(e) => setSignatoryCapacity(e.target.value)} onBlur={saveIfChanged} onKeyDown={onEnter} placeholder="Capacity, e.g. Counsel for the Applicant" className={`w-64 ${inputCls}`} />
          </div>
        </div>
      )}
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

function CreateListModal({ onConfirm, onCancel }) {
  const [name, setName] = useState('');
  const [caseRef, setCaseRef] = useState('');
  const [court, setCourt] = useState('vic');
  const [closing, setClosing] = useState(false);
  const nameRef = useRef(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  const requestClose = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => onCancel(), MODAL_CLOSE_MS);
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (name.trim()) onConfirm(name.trim(), caseRef.trim(), court);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/30 ${closing ? 'motion-fade-out' : 'motion-fade'}`}
      onClick={requestClose}
    >
      <div
        className={`mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/5 ${closing ? 'animate-page-out' : 'animate-page-in'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-card-title font-semibold text-text">New Authority List</h3>
          <button
            type="button"
            onClick={requestClose}
            className="rounded-full p-1.5 text-text-muted transition-colors duration-150 hover:bg-slate-100 hover:text-text"
          >
            <Icon name="solar:close-linear" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">Case title</label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Smith v Jones [2024]"
              className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">Case reference (optional)</label>
            <input
              type="text"
              value={caseRef}
              onChange={(e) => setCaseRef(e.target.value)}
              placeholder="[2024] NSWSC 412"
              className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div>
            <Select label="Court" value={court} onChange={(e) => setCourt(e.target.value)} size="md">
              {getCourtOptions().map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </Select>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button size="sm" variant="primary" type="submit" disabled={!name.trim()}>
              <Icon name="solar:add-circle-linear" size={16} />
              Create List
            </Button>
          </div>
        </form>
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

  // Create list modal
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Edit mode — toggle via Edit button, auto-save on blur
  const [editMode, setEditMode] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(null); // 'duplicate' | 'delete' | null

  // Card menu + multi-select
  const [cardMenuId, setCardMenuId] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedCards, setSelectedCards] = useState(new Set());

  // Issue (section) management
  const [addingIssue, setAddingIssue] = useState(false);
  const [newIssueName, setNewIssueName] = useState('');
  const [renamingIssue, setRenamingIssue] = useState(null);
  const [renameIssueValue, setRenameIssueValue] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());
  const [mobileView, setMobileView] = useState('editor'); // 'editor' | 'preview'
  const [highlightedItemId, setHighlightedItemId] = useState(null);
  const [showFixBar, setShowFixBar] = useState(false);
  const [requestedLoanIds, setRequestedLoanIds] = useState(new Set());
  const [requestedReturnIds, setRequestedReturnIds] = useState(new Set());

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
  const [closingCasualModal, setClosingCasualModal] = useState(false);
  const [closingDeleteConfirm, setClosingDeleteConfirm] = useState(false);

  // View crossfade: fade-out → swap → fade-in when navigating between overview ↔ editor
  const [viewFading, setViewFading] = useState(false);
  const fadingTimerRef = useRef(null);

  const syncSelectedList = useCallback((list) => {
    // Start fade-out
    setViewFading(true);
    if (fadingTimerRef.current) clearTimeout(fadingTimerRef.current);
    fadingTimerRef.current = setTimeout(() => {
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
      // Fade-in on next frame
      requestAnimationFrame(() => setViewFading(false));
    }, 150);
  }, [setSearchParams]);

  useEffect(() => {
    if (!pendingItem) return;
    setClosingCasualModal(false);
  }, [pendingItem]);

  useEffect(() => {
    if (!deleteConfirmId) return;
    setClosingDeleteConfirm(false);
  }, [deleteConfirmId]);

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
    window.dispatchEvent(new CustomEvent('authority-lists-changed'));
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

  const resetCasualModalState = () => {
    setPendingItem(null);
    setCasualShowNewList(false);
    setCasualNewName('');
    setCasualNewRef('');
    setClosingCasualModal(false);
  };

  const requestCloseCasualModal = () => {
    if (closingCasualModal) return;
    setClosingCasualModal(true);
    setTimeout(resetCasualModalState, MODAL_CLOSE_MS);
  };

  const requestCloseDeleteConfirm = () => {
    if (closingDeleteConfirm) return;
    setClosingDeleteConfirm(true);
    setTimeout(() => {
      setDeleteConfirmId(null);
      setClosingDeleteConfirm(false);
    }, MODAL_CLOSE_MS);
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
    if (requestedLoanIds.has(book.id)) return;
    await requestLoan(book.id, onboarding.name || 'James Chen');
    setRequestedLoanIds((prev) => new Set(prev).add(book.id));
    addToast({ message: 'Loan requested.', type: 'success' });
  };

  const handleCancelLoan = (book) => {
    // TODO(api): Replace with DELETE /api/loans/:id — cancel pending loan request
    setRequestedLoanIds((prev) => {
      const next = new Set(prev);
      next.delete(book.id);
      return next;
    });
    addToast({ message: 'Request cancelled.', type: 'success' });
  };

  const handleRequestReturnSearch = async (book) => {
    if (requestedReturnIds.has(book.id)) return;
    await requestReturn(book.id, onboarding.name || 'James Chen');
    setRequestedReturnIds((prev) => new Set(prev).add(book.id));
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

  const handleQuickCreate = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const handleCreateListFromModal = useCallback(async (name, caseRef, courtStructure) => {
    const newList = await createList(name, caseRef, courtStructure);
    const freshLists = await getLists();
    setLists(freshLists);
    setListsLoaded(true);
    setShowCreateModal(false);
    addToast({ message: `"${name}" created`, type: 'success' });
    window.dispatchEvent(new CustomEvent('authority-lists-changed'));
  }, [addToast]);

  useEffect(() => {
    if (newParam === '1' && !listIdParam && !newCreatedRef.current) {
      newCreatedRef.current = true;
      setShowCreateModal(true);
      // Clear the ?new=1 param so it doesn't re-trigger
      setSearchParams((prev) => { const next = new URLSearchParams(prev); next.delete('new'); return next; }, { replace: true });
    }
  }, [listIdParam, newParam, setSearchParams]);


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
    if (requestedReturnIds.has(book.id)) return;
    await requestReturn(book.id, onboarding.name || 'James Chen');
    setRequestedReturnIds((prev) => new Set(prev).add(book.id));
    addToast({ message: 'Return requested. Clerk notified.', type: 'success' });
  };

  const handleCancelReturn = (book) => {
    // TODO(api): Replace with DELETE /api/loans/:id/request-return — cancel return request
    setRequestedReturnIds((prev) => {
      const next = new Set(prev);
      next.delete(book.id);
      return next;
    });
    addToast({ message: 'Return request cancelled.', type: 'success' });
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
          title: `List of Authorities - ${selected.name}`,
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

  const handleDuplicate = async (listId) => {
    const list = lists.find((l) => l.id === listId);
    await duplicateList(listId);
    await refreshLists();
    setCardMenuId(null);
    addToast({ message: `"${list?.name}" duplicated`, type: 'success' });
  };

  const toggleCardSelect = (listId) => {
    setSelectedCards((prev) => {
      const next = new Set(prev);
      if (next.has(listId)) next.delete(listId);
      else next.add(listId);
      return next;
    });
  };

  const handleBulkDuplicate = async () => {
    if (selectedCards.size === 0) return;
    setBulkBusy('duplicate');
    const count = selectedCards.size;
    for (const id of [...selectedCards]) {
      await duplicateList(id);
    }
    await refreshLists();
    setSelectedCards(new Set());
    setSelectMode(false);
    setBulkBusy(null);
    addToast({ message: `${count} ${count === 1 ? 'list' : 'lists'} duplicated`, type: 'success' });
  };

  const handleBulkDelete = async () => {
    if (selectedCards.size === 0) return;
    setDeleteConfirmId('__bulk');
  };

  const confirmBulkDelete = async () => {
    setBulkBusy('delete');
    const ids = [...selectedCards];
    for (const id of ids) {
      await deleteList(id);
      if (selected?.id === id) syncSelectedList(null);
    }
    setDeleteConfirmId(null);
    setSelectedCards(new Set());
    setSelectMode(false);
    await refreshLists();
    setBulkBusy(null);
    addToast({ message: `${ids.length} ${ids.length === 1 ? 'list' : 'lists'} deleted`, type: 'success' });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedCards(new Set());
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

  // Items with issues (pinpoint missing / reporter missing)
  /** Items with issues, ordered to match editor card rendering (issue groups top-to-bottom) */
  const problemItems = useMemo(() => {
    if (!selected) return [];
    const hasIssue = (item) => {
      if (item.usage === 'read' && !hasPinpointData(item)) return true;
      if (item.type === 'book' && (!item.author || !item.publisher || !item.year)) return true;
      return false;
    };
    // Follow same order as issueGroups (editor card order)
    const issues = selected.issues || [];
    const groups = issues.map((issueName) => selected.items.filter((i) => i.issue === issueName));
    const ungrouped = selected.items.filter((i) => !i.issue || !issues.includes(i.issue));
    const allInOrder = [...groups.flat(), ...ungrouped];
    return allInOrder.filter(hasIssue);
  }, [selected, lists]);

  // Part groups for sidebar summary + AGLC preview
  const court = selected ? getCourtStructure(selected.courtStructure) : null;
  const partGroups = useMemo(() => {
    if (!selected || !court) return [];
    return court.parts.map((part) => ({
      ...part,
      items: selected.items.filter((i) => derivePart(i.type, i.usage, selected.courtStructure) === part.key),
    }));
  }, [selected, court]);

  // Refs synced in effects to avoid render-phase mutation
  const problemItemsRef = useRef(problemItems);
  const selectedRef = useRef(selected);
  useEffect(() => { problemItemsRef.current = problemItems; }, [problemItems]);
  useEffect(() => { selectedRef.current = selected; }, [selected]);

  // Handle "Fix issues" — activate edit mode, scroll to problem item, highlight + focus
  const handleFixIssues = useCallback(async (itemId) => {
    if (!selectedRef.current) return;

    // Blur any active pinpoint input first so it saves before we navigate
    const activePinpoint = document.activeElement;
    if (activePinpoint?.dataset?.pinpointItem) {
      activePinpoint.blur();
      // Wait for blur → save → refreshLists to complete
      await new Promise((r) => setTimeout(r, 500));
    }

    // Use provided itemId if valid, otherwise fall back to first problem item
    const freshProblems = problemItemsRef.current;
    if (freshProblems.length === 0) return;
    const targetId = (itemId && freshProblems.some((p) => p.id === itemId))
      ? itemId
      : freshProblems[0].id;

    // 1) Activate edit mode if not already
    if (!editMode && !isNewDraft) setEditMode(true);

    // 2) Mobile: switch to editor view
    setMobileView('editor');

    // 3) Expand collapsed group containing target item
    const sel = selectedRef.current;
    const targetItem = sel.items.find((i) => i.id === targetId);
    if (targetItem) {
      const groupKey = (targetItem.issue && (sel.issues || []).includes(targetItem.issue))
        ? targetItem.issue : '__ungrouped';
      setCollapsedGroups((prev) => {
        if (!prev.has(groupKey)) return prev;
        const next = new Set(prev);
        next.delete(groupKey);
        return next;
      });
    }

    // 4) Show the fix bar
    setShowFixBar(true);

    // 5) Highlight + scroll + focus
    setHighlightedItemId(targetId);
    setTimeout(() => {
      const el = document.getElementById(`auth-item-${targetId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });

      setTimeout(() => {
        // Focus the input matching the actual issue
        const sel = selectedRef.current;
        const targetItem = sel?.items.find((i) => i.id === targetId);
        if (!targetItem) return;
        const needsPinpoint = targetItem.usage === 'read' && !hasPinpointData(targetItem);
        const needsBookCite = targetItem.type === 'book' && (!targetItem.author || !targetItem.publisher || !targetItem.year);
        if (needsPinpoint) {
          const el = document.querySelector(`[data-pinpoint-item="${targetId}"]`);
          if (el) { el.focus(); return; }
        }
        if (needsBookCite) {
          const el = document.querySelector(`[data-bookcite-item="${targetId}"]`);
          if (el) el.focus();
        }
      }, 400);
    }, 50);

    // 6) Auto-clear highlight after 2.5s
    setTimeout(() => setHighlightedItemId(null), 2500);
  }, [editMode, isNewDraft]);

  // Auto-dismiss fix bar when all issues resolved
  useEffect(() => {
    if (showFixBar && problemItems.length === 0) {
      setShowFixBar(false);
      addToast({ message: 'All issues resolved', type: 'success' });
    }
  }, [problemItems.length, showFixBar, addToast]);

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
    const typeColor = item.type === 'case' ? 'text-emerald-700'
      : item.type === 'legislation' ? 'text-legislation'
      : 'text-orange-700';
    const typeBadgeCls = item.type === 'case' ? 'bg-surface-subtle text-emerald-700'
      : item.type === 'legislation' ? 'bg-surface-subtle text-legislation'
      : 'bg-surface-subtle text-orange-700';
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
            className={`rounded-xl p-3 transition-all ${isEditing ? 'cursor-grab active:cursor-grabbing' : ''} ${snapshot.isDragging ? 'border-2 border-dashed border-brand/30 bg-brand/5 shadow-none' : 'border border-border bg-white hover:border-border shadow-none'} ${highlightedItemId === item.id ? 'animate-issue-flash' : ''}`}
          >
            <div className="flex items-center gap-3">
              {/* Left: item content */}
              <div className="min-w-0 flex-1">
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
                      className="shrink-0 rounded-lg p-1.5 text-text-muted transition-colors hover:bg-red-50 hover:text-red-700"
                    >
                      <Icon name="solar:close-linear" size={16} />
                    </button>
                  )}
                </div>

                {/* Row 2 */}
                <div className={`mt-2 flex flex-wrap items-center gap-2 ${isEditing ? 'pl-8' : 'pl-[22px]'}`}>
                  {isEditing ? (
                    <>
                      {/* Edit mode: only editable controls */}
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

                      {(item.usage === 'read' || item.pageRange) && (
                        <PinpointInput
                          key={`${item.id}:${item.pageRange || ''}`}
                          item={item}
                          listId={selected.id}
                          onSaved={(msg) => { refreshLists(); addToast({ message: msg, type: 'success' }); }}
                        />
                      )}

                      {hasIssues && (
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

                      {/* Book citation metadata editor — full width to force own row */}
                      {item.type === 'book' && (
                        <div className="w-full">
                          <BookCitationEditor
                            key={`bookcite-${item.id}`}
                            item={item}
                            listId={selected.id}
                            onSaved={(msg) => { refreshLists(); addToast({ message: msg, type: 'success' }); }}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {/* View mode: read-only badges */}
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${typeBadgeCls}`}>{typeLabel}</span>

                      {item.uncatalogued && (
                        <span className="rounded-md bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                          Uncatalogued
                        </span>
                      )}

                      {court && (
                        <span className="rounded-md bg-surface-subtle px-2 py-0.5 text-xs font-medium text-text-secondary">
                          {court.parts.find((p) => p.key === derivePart(item.type, item.usage, selected.courtStructure))?.label || ''}
                        </span>
                      )}

                      {item.pageRange ? (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-subtle px-2 py-0.5 text-xs font-medium text-text-secondary">
                          <Icon name="solar:pin-bold" size={13} />
                          {item.pageRange}
                        </span>
                      ) : item.usage === 'read' && (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                          <Icon name="solar:pin-bold" size={13} />
                          Missing pinpoint
                        </span>
                      )}

                      {item.type === 'book' && !item.uncatalogued && (
                        <BookAvailability item={item} />
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Right: action button — vertically centered (hidden in edit mode) */}
              {!isEditing && item.type === 'book' && !item.uncatalogued && (() => {
                const book = lookupBookByTitle(item.title);
                if (!book) return null;
                const loanRequested = requestedLoanIds.has(book.id);
                const returnRequested = requestedReturnIds.has(book.id);
                if (book.status === 'available') {
                  return loanRequested ? (
                    <div className="flex shrink-0 animate-fade-in items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                        <Icon name="solar:hourglass-linear" size={12} />
                        Loan Requested
                      </span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleCancelLoan(book); }}
                        className="text-xs text-text-muted hover:text-text"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="recall"
                      onClick={(e) => { e.stopPropagation(); handleRequestLoan(book); }}
                      className="shrink-0 whitespace-nowrap px-3 py-1.5 text-xs"
                    >
                      Request Loan
                    </Button>
                  );
                }
                return returnRequested ? (
                  <div className="flex shrink-0 animate-fade-in items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md bg-info/10 px-2 py-0.5 text-xs font-medium text-info">
                      <Icon name="solar:clock-circle-linear" size={12} />
                      Return Requested
                    </span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleCancelReturn(book); }}
                      className="text-xs text-text-muted hover:text-text"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="recall"
                    onClick={(e) => { e.stopPropagation(); handleRequestReturn(book); }}
                    className="shrink-0 whitespace-nowrap px-3 py-1.5 text-xs"
                  >
                    Request Return
                  </Button>
                );
              })()}
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

  if (!listsLoaded) {
    return (
      <div className="animate-page-in mx-auto max-w-screen-2xl px-6 py-8 lg:px-14 xl:px-16 2xl:px-10">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-7 w-40 rounded-lg" />
            <Skeleton className="mt-2 h-4 w-64 rounded" />
          </div>
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <Skeleton className="h-5 w-32 rounded-lg" />
              <Skeleton className="mt-2 h-3 w-48 rounded" />
              <Skeleton className="mt-4 h-3 w-24 rounded" />
              <div className="mt-4 flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full transition-opacity duration-150 ease-in-out ${viewFading ? 'opacity-0' : 'opacity-100'} ${selected ? 'overflow-hidden' : 'overflow-y-auto'}`} onClick={() => cardMenuId && setCardMenuId(null)}>
      {/* ── CASUAL SEARCH MODE (no list selected) ── */}
      {isSearching && !selected ? (
        <div className="mx-auto max-w-screen-2xl px-6 py-8 lg:px-14 xl:px-16 2xl:px-10">
          {/* Search header with context */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={exitSearchMode}
                className="btn-icon h-8 w-8 text-text-secondary hover:bg-surface-subtle"
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
                    <h1 className="font-serif text-page-title text-text">Search & Add</h1>
                  </>
                ) : (
                  <>
                    <h1 className="font-serif text-page-title text-text">Search</h1>
                    <p className="mt-0.5 text-sm text-text-secondary">Find cases, books, and legislation across JADE and your library.</p>
                  </>
                )}
              </div>
            </div>
            {selected && (
              <Button size="sm" variant="secondary" onClick={exitSearchMode}>
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
                <Button
                  key={q}
                  size="sm"
                  variant="secondary"
                  onClick={() => setSearchQuery(q)}
                  className="px-3 py-1.5 text-xs"
                >
                  {q}
                </Button>
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
        </div>
      ) : (
        <>
          {/* ── NORMAL MODE — header handled by AppShell ── */}

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
                        <Button size="sm" variant="secondary" onClick={() => setEditMode(false)}>
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
                  <Button size="sm" variant="secondary" onClick={() => setShowExportPreview(true)}>
                    <Icon name="solar:upload-linear" size={16} />
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
                        <Button size="sm" variant="secondary" onClick={() => setEditMode(false)}>
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
            <section className="relative flex min-w-0 h-full min-h-0 flex-col bg-white">
              <div className="flex-1 overflow-y-auto pl-6 pr-5 lg:pl-8 xl:pl-10">
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
                                    <button type="button" onClick={(e) => { e.stopPropagation(); handleRemoveIssue(group.issue); }} className="rounded p-1 text-text-muted transition-colors hover:bg-red-50 hover:text-red-700" title="Remove section">
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
                                  const cloneBadge = cloneItem.type === 'case' ? 'bg-surface-subtle text-emerald-700' : cloneItem.type === 'legislation' ? 'bg-surface-subtle text-legislation' : 'bg-surface-subtle text-orange-700';
                                  return (
                                    <article
                                      ref={cloneProvided.innerRef}
                                      {...cloneProvided.draggableProps}
                                      {...cloneProvided.dragHandleProps}
                                      className="rounded-xl border-2 border-brand/30 bg-white p-3 shadow-xl ring-2 ring-brand/20"
                                    >
                                      <div className="flex items-center gap-2">
                                        <Icon name="solar:hamburger-menu-linear" size={16} className="text-text-muted/50" />
                                        <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-2xs font-bold uppercase ${cloneBadge}`}>
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
                              <div className="relative border-t border-border/30 px-4 py-3" style={{ zIndex: isFocused && showInlineResults ? 10 : 'auto' }}>
                                <div className={`flex h-11 items-center gap-2 rounded-xl border px-3 transition-all ${isFocused && inlineQuery ? 'border-brand bg-white shadow-sm' : 'border-border bg-surface-muted hover:border-border-strong'}`}>
                                  <Icon name="solar:magnifer-linear" size={16} className={isFocused && inlineQuery ? 'text-brand' : 'text-text-secondary'} />
                                  <input
                                    type="text"
                                    value={isFocused ? inlineQuery : ''}
                                    onChange={(e) => setInlineQuery(e.target.value)}
                                    onFocus={() => { setFocusedIssue(groupKey); if (inlineQuery.trim().length >= 2) setShowInlineResults(true); }}
                                    onClick={(e) => e.stopPropagation()}
                                    placeholder={`Search to add to "${issueLabel || selected.name}"...`}
                                    className="flex-1 border-none bg-transparent text-sm leading-none text-text placeholder:text-text-muted focus:outline-none"
                                  />
                                  {isFocused && inlineQuery && (
                                    <button type="button" onClick={(e) => { e.stopPropagation(); setInlineQuery(''); setShowInlineResults(false); }} className="text-text-muted hover:text-text">
                                      <Icon name="solar:close-circle-linear" size={16} />
                                    </button>
                                  )}
                                </div>

                                {isFocused && showInlineResults && (
                                  <div className="absolute left-0 right-0 z-20 mt-1 overflow-hidden rounded-xl border border-border/60 bg-white py-1 shadow-lg">
                                    {inlineLoading && (
                                      <div className="p-3 text-center text-xs text-text-muted animate-pulse">Searching...</div>
                                    )}
                                    {!inlineLoading && inlineInterleaved.length > 0 && inlineInterleaved.map(({ item, type }) => {
                                      const isAdded = selected.items.some((i) => i.title === item.title);
                                      return (
                                        <div
                                          key={`${type}-${item.id}`}
                                          onClick={(e) => { e.stopPropagation(); if (!isAdded) handleInlineAdd(item, type); }}
                                          className={`flex items-center gap-2 border-b border-border-light px-3 py-2 last:border-b-0 transition-colors ${isAdded ? 'opacity-50 cursor-default' : 'cursor-pointer hover:bg-brand/5'}`}
                                        >
                                          <span className={`rounded-md px-1.5 py-0.5 text-xs font-bold uppercase ${
                                            (type === 'jade' ? item.type : 'book') === 'case' ? 'bg-surface-subtle text-emerald-700'
                                            : (type === 'jade' ? item.type : 'book') === 'legislation' ? 'bg-surface-subtle text-legislation'
                                            : 'bg-surface-subtle text-orange-700'
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
                                            <span className="inline-flex items-center gap-1 shrink-0 rounded-lg bg-success/10 px-2 py-1 text-xs font-medium text-success">
                                              <Icon name="solar:check-circle-bold" size={14} />
                                              Added
                                            </span>
                                          ) : (
                                            <span className="shrink-0 rounded-lg bg-brand/10 px-2 py-1 text-xs font-bold text-brand">
                                              + Add
                                            </span>
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
                                        className="cursor-pointer border-t border-border-light bg-surface-subtle/80 px-3 py-2 text-center text-xs text-text-muted transition-colors hover:bg-surface-subtle hover:text-brand"
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
                      <div className={`flex h-11 items-center gap-2 rounded-xl border px-3 transition-all ${inlineQuery ? 'border-brand bg-white shadow-sm' : 'border-border bg-surface-muted hover:border-border-strong'}`}>
                        <Icon name="solar:magnifer-linear" size={16} className={inlineQuery ? 'text-brand' : 'text-text-secondary'} />
                        <input
                          type="text"
                          value={inlineQuery}
                          onChange={(e) => setInlineQuery(e.target.value)}
                          onFocus={() => { setFocusedIssue('__ungrouped'); if (inlineQuery.trim().length >= 2) setShowInlineResults(true); }}
                          placeholder="Search cases, legislation, books..."
                          className="flex-1 border-none bg-transparent text-sm leading-none text-text placeholder:text-text-muted focus:outline-none"
                        />
                        {inlineQuery && (
                          <button type="button" onClick={() => { setInlineQuery(''); setShowInlineResults(false); }} className="text-text-muted hover:text-text">
                            <Icon name="solar:close-circle-linear" size={16} />
                          </button>
                        )}
                      </div>

                      {showInlineResults && (
                        <div className="absolute left-0 right-0 z-20 mt-1 overflow-hidden rounded-xl border border-border/60 bg-white py-1 shadow-lg">
                          {inlineLoading && (
                            <div className="p-3 text-center text-xs text-text-muted animate-pulse">Searching...</div>
                          )}
                          {!inlineLoading && inlineInterleaved.length > 0 && inlineInterleaved.map(({ item, type }) => {
                            const isAdded = selected.items.some((i) => i.title === item.title);
                            return (
                              <div
                                key={`${type}-${item.id}`}
                                onClick={(e) => { e.stopPropagation(); if (!isAdded) handleInlineAdd(item, type); }}
                                className={`flex items-center gap-2 border-b border-border-light px-3 py-2 last:border-b-0 transition-colors ${isAdded ? 'opacity-50 cursor-default' : 'cursor-pointer hover:bg-brand/5'}`}
                              >
                                <span className={`rounded-md px-1.5 py-0.5 text-xs font-bold uppercase ${
                                  (type === 'jade' ? item.type : 'book') === 'case' ? 'bg-surface-subtle text-emerald-700'
                                  : (type === 'jade' ? item.type : 'book') === 'legislation' ? 'bg-surface-subtle text-legislation'
                                  : 'bg-surface-subtle text-orange-700'
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
                                  <span className="inline-flex items-center gap-1 shrink-0 rounded-lg bg-success/10 px-2 py-1 text-xs font-medium text-success">
                                    <Icon name="solar:check-circle-bold" size={14} />
                                    Added
                                  </span>
                                ) : (
                                  <span className="shrink-0 rounded-lg bg-brand/10 px-2 py-1 text-xs font-bold text-brand">
                                    + Add
                                  </span>
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
                              className="cursor-pointer border-t border-border-light bg-surface-subtle/80 px-3 py-2 text-center text-xs text-text-muted transition-colors hover:bg-surface-subtle hover:text-brand"
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
                            <Button
                              key={q}
                              size="sm"
                              variant="secondary"
                              onClick={() => { setInlineQuery(q); setFocusedIssue('__ungrouped'); }}
                              className="px-2.5 py-1 text-xs"
                            >
                              {q}
                            </Button>
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
              </div>

              {/* Fix issues sticky bar */}
              {showFixBar && problemItems.length > 0 && (
                <div className="shrink-0 border-t border-red-200 bg-red-50 px-6 py-2.5 flex items-center justify-between gap-3 animate-fade-in lg:px-8 xl:px-10">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                    <Icon name="solar:danger-triangle-linear" size={13} />
                    {problemItems.length} {problemItems.length === 1 ? 'issue' : 'issues'} remaining
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        // Blur active input so it saves first
                        const active = document.activeElement;
                        if (active && (active.dataset.pinpointItem || active.dataset.bookciteItem)) {
                          active.blur();
                          await new Promise((r) => setTimeout(r, 500));
                        }
                        const fresh = problemItemsRef.current;
                        if (fresh.length === 0) return;
                        // Pick the first problem item (list is already in Part order)
                        handleFixIssues(fresh[0].id);
                      }}
                      className="px-3 py-1.5 text-xs text-red-600 hover:!text-red-700"
                    >
                      <Icon name="solar:danger-triangle-linear" size={13} />
                      Next issue
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setShowFixBar(false)}
                      className="px-3 py-1.5 text-xs"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              )}
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
                onScrollToItem={handleFixIssues}
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
                            <div key={item.id} id={`auth-item-${item.id}`} className={`rounded-xl border border-border bg-white px-4 py-3 ${highlightedItemId === item.id ? 'animate-issue-flash' : ''}`}>
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
              onScrollToItem={handleFixIssues}
            />
          </div>
        </div>
      ) : (
        /* List overview — 3-column grid with card menus */
        <div className="mx-auto max-w-screen-2xl px-6 py-8 lg:px-14 xl:px-16 2xl:px-10">
        <PageHeader title="Authority Lists" subtitle="Organise citations and export court-ready lists.">
            {selectMode ? (
              <>
                <span className="text-xs text-text-secondary">{selectedCards.size} selected</span>
                <Button size="sm" variant="secondary" onClick={handleBulkDuplicate} disabled={selectedCards.size === 0} loading={bulkBusy === 'duplicate'}>
                  <Icon name="solar:copy-linear" size={16} />
                  Duplicate
                </Button>
                <Button size="sm" variant="danger" onClick={handleBulkDelete} disabled={selectedCards.size === 0}>
                  <Icon name="solar:trash-bin-trash-linear" size={16} />
                  Delete
                </Button>
                <Button size="sm" variant="secondary" onClick={exitSelectMode}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                {lists.length > 0 && (
                  <Button size="sm" variant="secondary" onClick={() => setSelectMode(true)}>
                    <Icon name="solar:check-square-linear" size={16} />
                    Select
                  </Button>
                )}
                <Button size="sm" variant="primary" onClick={handleQuickCreate}>
                  <Icon name="solar:add-circle-linear" size={16} />
                  New List
                </Button>
              </>
            )}
        </PageHeader>
        {!listsLoaded ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <div className="space-y-2">
                <div className="h-4 w-3/5 rounded bg-border" />
                <div className="h-3 w-4/5 rounded bg-surface-subtle" />
                <div className="flex gap-2 mt-1">
                  <div className="h-5 w-14 rounded bg-surface-subtle" />
                  <div className="h-5 w-14 rounded bg-surface-subtle" />
                </div>
              </div>
            </div>
          ))}
        </div>
        ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in">
          {lists.map((list) => {
            const isCardSelected = selectedCards.has(list.id);

            return (
              <AuthorityListCard
                key={list.id}
                list={list}
                onClick={() => {
                  if (selectMode) { toggleCardSelect(list.id); return; }
                  syncSelectedList(list);
                }}
                selected={isCardSelected}
                selectable={selectMode}
                onMenuOpen={() => setCardMenuId(cardMenuId === list.id ? null : list.id)}
                menuOpen={cardMenuId === list.id}
                onDuplicate={() => handleDuplicate(list.id)}
                onDelete={() => {
                  setCardMenuId(null);
                  setDeleteConfirmId(list.id);
                }}
              />
            );
          })}
          {lists.length === 0 && !isNewDraft && (
            <div className="col-span-full mt-4 flex flex-col items-center rounded-2xl border border-dashed border-border bg-white p-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10">
                <Icon name="solar:list-check-linear" size={24} className="text-brand" />
              </span>
              <p className="mt-4 text-sm font-medium text-text">No authority lists yet</p>
              <p className="mt-1 max-w-sm text-sm text-text-secondary">
                Create a list for your case, then search and add authorities.
              </p>
              <Button
                className="mt-4"
                variant="primary"
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
        )}
        </div>
      )}
        </>
      )}

      {/* Casual list picker modal — shown when adding from search without active list */}
      {!selected && pendingItem && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/30 ${closingCasualModal ? 'motion-fade-out' : 'motion-fade'}`}
          onClick={requestCloseCasualModal}
        >
          <div className={`mx-4 w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl ring-1 ring-black/5 ${closingCasualModal ? 'animate-page-out' : 'animate-page-in'}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-card-title text-text">Add to List</h3>
              <button
                type="button"
                onClick={requestCloseCasualModal}
                className="rounded-full p-1.5 text-text-muted transition-colors duration-150 hover:bg-slate-100 hover:text-text"
              >
                <Icon name="solar:close-linear" size={20} />
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

      {/* Create list modal */}
      {showCreateModal && (
        <CreateListModal
          onConfirm={handleCreateListFromModal}
          onCancel={() => setShowCreateModal(false)}
        />
      )}

      {/* Delete confirmation dialog */}
      {deleteConfirmId && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/30 ${closingDeleteConfirm ? 'motion-fade-out' : 'motion-fade'}`}
          onClick={requestCloseDeleteConfirm}
        >
          <div className={`mx-4 w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl ring-1 ring-black/5 ${closingDeleteConfirm ? 'animate-page-out' : 'animate-page-in'}`} onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-card-title text-text">
              {deleteConfirmId === '__bulk' ? `Delete ${selectedCards.size} ${selectedCards.size === 1 ? 'List' : 'Lists'}?` : 'Delete List?'}
            </h3>
            {deleteConfirmId === '__bulk' && (
              <ul className="mt-3 space-y-1">
                {[...selectedCards].map((id) => {
                  const l = lists.find((x) => x.id === id);
                  return l ? (
                    <li key={id} className="flex items-center gap-2 text-sm text-text">
                      <Icon name="solar:folder-open-linear" size={14} className="shrink-0 text-brand" />
                      <span className="truncate">{l.name}</span>
                    </li>
                  ) : null;
                })}
              </ul>
            )}
            <p className="mt-3 text-sm text-text-secondary">
              {deleteConfirmId === '__bulk'
                ? 'All entries in these lists will be permanently deleted. This cannot be undone.'
                : 'This will permanently remove the list and all its entries. This cannot be undone.'}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button size="sm" variant="secondary" onClick={requestCloseDeleteConfirm}>Cancel</Button>
              <Button
                size="sm"
                variant="danger-solid"
                onClick={() => deleteConfirmId === '__bulk' ? confirmBulkDelete() : handleDelete(deleteConfirmId)}
                loading={bulkBusy === 'delete'}
              >
                Delete
              </Button>
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
