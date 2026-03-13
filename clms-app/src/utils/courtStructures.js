/**
 * Court structure definitions for authority list Part groupings.
 *
 * Key insight: each item's "part" is DERIVED from type + usage + court,
 * not stored per-item. The barrister only sets type and usage.
 *
 * Sources:
 *   Federal Court:   GPN-AUTH Practice Note
 *   High Court:      Practice Direction No 2 of 2024
 *   VIC Supreme:     SC Gen 3 + Court of Appeal template
 *   NSW Supreme:     Practice Note SC CA 1 + template
 *   FCFCOA:          Rules 2021, Rule 13.23
 */

export const COURT_STRUCTURES = {
  vic: {
    id: 'vic',
    label: 'Supreme Court of Victoria',
    shortLabel: 'VIC Supreme',
    parts: [
      { key: 'a', label: 'Part A', desc: 'Cases and legislation read in full' },
      { key: 'b', label: 'Part B', desc: 'Cases and legislation referred to' },
      { key: 'c', label: 'Part C', desc: 'Textbooks and articles' },
    ],
  },
  federal: {
    id: 'federal',
    label: 'Federal Court of Australia',
    shortLabel: 'Federal Court',
    parts: [
      { key: '1', label: 'Part 1', desc: 'Authorities to be read' },
      { key: '2', label: 'Part 2', desc: 'Authorities referred to' },
    ],
  },
  hca: {
    id: 'hca',
    label: 'High Court of Australia',
    shortLabel: 'High Court',
    parts: [
      { key: 'a', label: 'Part A', desc: 'Cases' },
      { key: 'b', label: 'Part B', desc: 'Legislation' },
      { key: 'c', label: 'Part C', desc: 'Secondary sources' },
    ],
  },
  nsw: {
    id: 'nsw',
    label: 'Supreme Court of NSW',
    shortLabel: 'NSW Supreme',
    parts: [
      { key: 'legislation', label: 'Legislation', desc: 'Statutes and regulations' },
      { key: 'cases-read', label: 'Cases to be Read', desc: 'Passages read during oral submissions' },
      { key: 'cases-referred', label: 'Cases Not Intended to be Read', desc: 'Cited but not read aloud' },
    ],
  },
  fcfcoa: {
    id: 'fcfcoa',
    label: 'Federal Circuit and Family Court',
    shortLabel: 'FCFCOA',
    parts: [
      { key: 'cases', label: 'Cases', desc: 'Case authorities' },
      { key: 'legislation', label: 'Legislation', desc: 'Statutes and regulations' },
    ],
  },
};

/**
 * Derive the part key for an item based on its type, usage, and court.
 * This replaces the old getDefaultPart — part is never stored, always derived.
 *
 * @param {string} type - 'case' | 'legislation' | 'book'
 * @param {'read' | 'referred'} usage
 * @param {string} courtId
 * @returns {string} The derived part key
 */
export function derivePart(type, usage, courtId = 'vic') {
  switch (courtId) {
    case 'federal':
      return usage === 'read' ? '1' : '2';

    case 'hca':
      if (type === 'legislation') return 'b';
      if (type === 'book') return 'c';
      return 'a'; // case

    case 'nsw':
      if (type === 'legislation') return 'legislation';
      return usage === 'read' ? 'cases-read' : 'cases-referred';

    case 'fcfcoa':
      return type === 'legislation' ? 'legislation' : 'cases';

    default: // vic
      if (type === 'book') return 'c';
      return usage === 'read' ? 'a' : 'b';
  }
}

// Backwards-compatible alias
export function getDefaultPart(type, courtId = 'vic') {
  return derivePart(type, 'read', courtId);
}

/**
 * Get the court structure object by ID.
 */
export function getCourtStructure(courtId) {
  return COURT_STRUCTURES[courtId] || COURT_STRUCTURES.vic;
}

/**
 * Get all available court structure options for dropdowns.
 */
export function getCourtOptions() {
  return Object.values(COURT_STRUCTURES).map(({ id, label, shortLabel }) => ({ id, label, shortLabel }));
}

/**
 * Derive the default usage ('read' | 'referred') based on item type and court.
 * Most items default to 'read'. Federal legislation defaults to 'referred'.
 */
export function getDefaultUsage(type, courtId = 'vic') {
  // Federal Court: legislation is typically "referred to" (Part 2)
  if (courtId === 'federal' && type === 'legislation') return 'referred';
  return 'read';
}
