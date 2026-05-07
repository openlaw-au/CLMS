import FilterPill from './FilterPill';
import { getBooks } from '../../services/booksService';
import { useEffect, useState } from 'react';

export default function FilterPillBar({ filters, onChange }) {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    getBooks().then(setBooks);
  }, []);

  // IX-5: Derive filter options dynamically from current books state every render
  const subjectOptions = [...new Set(
    books.filter((b) => b.enrichment?.subject).map((b) => b.enrichment.subject)
  )].map((s) => ({
    value: s,
    label: s,
    count: books.filter((b) => b.enrichment?.subject === s).length,
  }));

  const jurisdictionOptions = [...new Set(
    books.filter((b) => b.enrichment?.jurisdiction?.length > 0).flatMap((b) => b.enrichment.jurisdiction)
  )].map((j) => ({
    value: j,
    label: j,
    count: books.filter((b) => b.enrichment?.jurisdiction?.includes(j)).length,
  }));

  const typeOptions = [
    { value: 'book', label: 'Books', count: null },
    { value: 'jade', label: 'JADE', count: null },
  ];

  const availabilityOptions = [
    { value: 'available', label: 'Available', count: null },
    { value: 'on-loan', label: 'On Loan', count: null },
  ];

  const sourceOptions = [
    { value: 'book', label: 'Books only', count: null },
    { value: 'jade', label: 'JADE only', count: null },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      <FilterPill
        label="Source: All"
        options={sourceOptions}
        value={filters.source}
        onChange={(v) => onChange({ ...filters, source: v })}
      />
      <FilterPill
        label="Subject"
        options={subjectOptions}
        value={filters.subject}
        onChange={(v) => onChange({ ...filters, subject: v })}
        disabled={subjectOptions.length === 0}
        disabledMessage="Filters available when your clerk enriches the library"
      />
      <FilterPill
        label="Jurisdiction"
        options={jurisdictionOptions}
        value={filters.jurisdiction}
        onChange={(v) => onChange({ ...filters, jurisdiction: v })}
        disabled={jurisdictionOptions.length === 0}
        disabledMessage="Filters available when your clerk enriches the library"
      />
      <FilterPill
        label="Type"
        options={typeOptions}
        value={filters.type}
        onChange={(v) => onChange({ ...filters, type: v })}
      />
      <FilterPill
        label="Availability"
        options={availabilityOptions}
        value={filters.availability}
        onChange={(v) => onChange({ ...filters, availability: v })}
      />
    </div>
  );
}
