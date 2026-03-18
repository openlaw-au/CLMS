const STORAGE_KEY = 'clms-authority-lists';

const SEED_DATA = [
  {
    id: 'al1',
    name: 'Smith v Jones [2024]',
    caseRef: 'S CI 2024/00412',
    courtStructure: 'vic',
    createdAt: '2024-11-15',
    updatedAt: '2025-03-10',
    registryCity: 'Melbourne',
    division: 'Trial Division',
    filedOnBehalf: 'Smith',
    partyRole: 'Applicant',
    otherPartyName: 'Jones',
    otherPartyRole: 'Respondent',
    preparedBy: '',
    filingDate: '',
    signatoryCapacity: '',
    issues: ['Admissibility of Expert Evidence', 'Hearsay Exception'],
    items: [
      { id: 'ali1', type: 'book', title: 'Cross on Evidence', author: 'J D Heydon', publisher: 'LexisNexis Butterworths', edition: '13th', year: 2021, citation: null, pageRange: '[4.1]-[4.35]', issue: 'Admissibility of Expert Evidence', usage: 'read' },
      { id: 'ali2', type: 'case', title: 'Palmer v Cross', citation: '[2019] NSWCA 58', pageRange: null, issue: 'Admissibility of Expert Evidence', usage: 'referred' },
      { id: 'ali3', type: 'legislation', title: 'Evidence Act 1995 (Cth)', citation: 'ss 135-137', pageRange: null, issue: 'Hearsay Exception', usage: 'read' },
      { id: 'ali4', type: 'case', title: 'Dasreef Pty Ltd v Hawchar', citation: '[2011] HCA 21', pageRange: '[28]-[33]', issue: null, usage: 'referred' },
    ],
  },
  {
    id: 'al2',
    name: 'Re Thompson Trust',
    caseRef: 'S CI 2025/00088',
    courtStructure: 'vic',
    createdAt: '2025-01-22',
    updatedAt: '2025-03-12',
    registryCity: 'Melbourne',
    division: 'Trial Division',
    filedOnBehalf: 'Thompson',
    partyRole: 'Applicant',
    otherPartyName: '',
    otherPartyRole: '',
    preparedBy: '',
    filingDate: '',
    signatoryCapacity: '',
    issues: ['Breach of Trust', 'Equitable Remedies'],
    items: [
      { id: 'ali5', type: 'book', title: 'Jacobs\' Law of Trusts in Australia', author: 'J D Heydon and M J Leeming', publisher: 'LexisNexis Butterworths', edition: '9th', year: 2021, citation: null, pageRange: 'Ch 12', issue: 'Breach of Trust', usage: 'read' },
      { id: 'ali6', type: 'book', title: 'Meagher, Gummow & Lehane\'s Equity: Doctrines and Remedies', author: 'R P Meagher, J D Heydon and M J Leeming', publisher: 'LexisNexis Butterworths', edition: '5th', year: 2015, citation: null, pageRange: '[38.01]-[38.15]', issue: 'Equitable Remedies', usage: 'read' },
      { id: 'ali7', type: 'case', title: 'Lee v The Queen', citation: '[1998] HCA 60', pageRange: null, issue: null, usage: 'referred' },
    ],
  },
  {
    id: 'al3',
    name: 'Building Corp Appeal',
    caseRef: 'VID 201/2025',
    courtStructure: 'federal',
    createdAt: '2025-02-10',
    updatedAt: '2025-03-08',
    registryCity: 'Melbourne',
    division: '',
    filedOnBehalf: 'Building Corp Pty Ltd',
    partyRole: 'Appellant',
    otherPartyName: 'Minister for Planning',
    otherPartyRole: 'Respondent',
    preparedBy: '',
    filingDate: '',
    signatoryCapacity: '',
    issues: ['Jurisdictional Error'],
    items: [
      { id: 'ali8', type: 'book', title: 'Judicial Review of Administrative Action and Government Liability', author: 'M Aronson, M Groves and G Weeks', publisher: 'Thomson Reuters', edition: '7th', year: 2022, citation: null, pageRange: '[5.10]-[5.40]', issue: 'Jurisdictional Error', usage: 'read' },
      { id: 'ali9', type: 'legislation', title: 'Administrative Decisions (Judicial Review) Act 1977 (Cth)', citation: 'ss 5-6', pageRange: null, issue: 'Jurisdictional Error', usage: 'referred' },
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
