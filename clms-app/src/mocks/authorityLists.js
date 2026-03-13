const STORAGE_KEY = 'clms-authority-lists';

const SEED_DATA = [
  {
    id: 'al1',
    name: 'Smith v Jones [2024]',
    caseRef: 'Smith v Jones [2024] NSWSC 412',
    courtStructure: 'vic',
    createdAt: '2024-11-15',
    issues: ['Admissibility of Expert Evidence', 'Hearsay Exception'],
    items: [
      { id: 'ali1', type: 'book', title: 'Cross on Evidence', citation: null, pageRange: '4.1-4.35', part: 'c', issue: 'Admissibility of Expert Evidence', usage: 'read' },
      { id: 'ali2', type: 'case', title: 'Palmer v Cross', citation: '[2019] NSWCA 58', pageRange: null, part: 'a', issue: 'Admissibility of Expert Evidence', usage: 'referred' },
      { id: 'ali3', type: 'legislation', title: 'Evidence Act 1995 (Cth)', citation: 'ss 135-137', pageRange: null, part: 'a', issue: 'Hearsay Exception', usage: 'read' },
      { id: 'ali4', type: 'case', title: 'Dasreef Pty Ltd v Hawchar', citation: '[2011] HCA 21', pageRange: null, part: 'b', issue: null, usage: 'referred' },
    ],
  },
  {
    id: 'al2',
    name: 'Re Thompson Trust',
    caseRef: 'Re Thompson Trust [2025] VSC 88',
    courtStructure: 'vic',
    createdAt: '2025-01-22',
    issues: ['Breach of Trust', 'Equitable Remedies'],
    items: [
      { id: 'ali5', type: 'book', title: 'Jacobs\' Law of Trusts in Australia', citation: null, pageRange: 'Ch 12', part: 'c', issue: 'Breach of Trust', usage: 'read' },
      { id: 'ali6', type: 'book', title: 'Meagher, Gummow & Lehane\'s Equity', citation: null, pageRange: '38.01-38.15', part: 'c', issue: 'Equitable Remedies', usage: 'read' },
      { id: 'ali7', type: 'case', title: 'Lee v The Queen', citation: '[1998] HCA 60', pageRange: null, part: 'a', issue: null, usage: 'referred' },
    ],
  },
  {
    id: 'al3',
    name: 'Building Corp Appeal',
    caseRef: 'Building Corp Pty Ltd v Minister [2025] FCAFC 201',
    courtStructure: 'federal',
    createdAt: '2025-02-10',
    issues: ['Jurisdictional Error'],
    items: [
      { id: 'ali8', type: 'book', title: 'Aronson\'s Judicial Review of Administrative Action', citation: null, pageRange: '5.10-5.40', part: '1', issue: 'Jurisdictional Error', usage: 'read' },
      { id: 'ali9', type: 'legislation', title: 'ADJR Act 1977 (Cth)', citation: 'ss 5-6', pageRange: null, part: '2', issue: 'Jurisdictional Error', usage: 'referred' },
    ],
  },
];

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore corrupt data */ }
  return null;
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* storage full — silent fail */ }
}

// Initialize: use localStorage if available, otherwise seed
const stored = loadFromStorage();
export const authorityListsMock = stored || JSON.parse(JSON.stringify(SEED_DATA));

// Persist after every mutation — called by the service layer
export function persistAuthorityLists() {
  saveToStorage(authorityListsMock);
}

// Reset to seed data (for dev panel)
export function resetAuthorityLists() {
  authorityListsMock.length = 0;
  authorityListsMock.push(...JSON.parse(JSON.stringify(SEED_DATA)));
  saveToStorage(authorityListsMock);
}
