/**
 * AGLC4 citation formatters for authority list export.
 * Supports Part-based court structure grouping.
 */

import { getCourtStructure, derivePart } from './courtStructures';

// TODO(api): Replace with server-side AGLC formatting service

/**
 * Format a case citation in AGLC4 style.
 * @param {{ title: string, citation: string, pageRange?: string }} item
 * @returns {string}
 */
export function formatCase(item) {
  let out = `${item.title} ${item.citation || ''}`.trim();
  if (item.pageRange) out += `, ${item.pageRange}`;
  return out;
}

/**
 * Format a legislation citation in AGLC4 style.
 * @param {{ title: string, citation?: string }} item
 * @returns {string}
 */
export function formatLegislation(item) {
  if (item.citation) return `${item.title} ${item.citation}`;
  return item.title;
}

/**
 * Format a book citation in AGLC4 style.
 * @param {{ title: string, author?: string, publisher?: string, edition?: string, year?: number, pageRange?: string }} item
 * @returns {string}
 */
export function formatBook(item) {
  const parts = [];
  if (item.author) parts.push(item.author);
  parts.push(item.title);

  const pubParts = [];
  if (item.publisher) pubParts.push(item.publisher);
  if (item.edition) pubParts.push(`${item.edition} ed`);
  if (item.year) pubParts.push(String(item.year));
  if (pubParts.length > 0) parts.push(`(${pubParts.join(', ')})`);

  if (item.pageRange) parts.push(item.pageRange);

  return parts.join(', ');
}

/**
 * Format a single item based on its type.
 */
function formatItem(item) {
  if (item.type === 'case') return formatCase(item);
  if (item.type === 'legislation') return formatLegislation(item);
  return formatBook(item);
}

/**
 * Sort items alphabetically by title within a section.
 */
function sortAlpha(items) {
  return [...items].sort((a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }));
}

/**
 * Generate plain-text version of an authority list in AGLC4 format.
 * Uses Part-based structure with alphabetical sorting within each Part.
 * @param {{ name: string, caseRef: string, courtStructure?: string, items: Array }} list
 * @returns {string} Plain text string
 */
export function generateAGLCPlainText(list) {
  const court = getCourtStructure(list.courtStructure || 'vic');
  const lines = [];

  lines.push('TABLE OF AUTHORITIES');
  lines.push(list.name);
  lines.push(list.caseRef);
  lines.push(`(${court.label})`);
  lines.push('');

  court.parts.forEach((part) => {
    const partItems = sortAlpha(
      list.items.filter((i) => derivePart(i.type, i.usage, list.courtStructure) === part.key)
    );
    if (partItems.length === 0) return;

    lines.push(`${part.label}: ${part.desc}`);
    partItems.forEach((item, idx) => {
      lines.push(`  ${idx + 1}. ${formatItem(item)}`);
    });
    lines.push('');
  });

  return lines.join('\n').trim();
}

/**
 * Generate printable HTML for an authority list in AGLC4 format.
 * Uses Part-based structure with alphabetical sorting within each Part.
 * @param {{ name: string, caseRef: string, courtStructure?: string, items: Array }} list
 * @returns {string} Full HTML document string
 */
export function generateAGLCHtml(list) {
  const court = getCourtStructure(list.courtStructure || 'vic');

  const renderSection = (part) => {
    const partItems = sortAlpha(
      list.items.filter((i) => derivePart(i.type, i.usage, list.courtStructure) === part.key)
    );
    if (partItems.length === 0) return '';

    return `
      <div style="margin-bottom:24px">
        <h2 style="font-size:14px;font-weight:bold;margin-bottom:4px">${part.label}: ${part.desc}</h2>
        <ol style="padding-left:24px;font-size:13px;line-height:1.8">
          ${partItems.map((item) => {
            const text = formatItem(item);
            const needsPinpoint = item.usage === 'read' && !item.pageRange;
            return `<li${needsPinpoint ? ' style="color:#b45309"' : ''}>${text}${needsPinpoint ? ' <span style="color:#d97706;font-size:11px">[pinpoint missing]</span>' : ''}</li>`;
          }).join('\n          ')}
        </ol>
      </div>`;
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Table of Authorities - ${list.name}</title>
  <style>
    body {
      font-family: 'Times New Roman', Times, serif;
      max-width: 700px;
      margin: 40px auto;
      color: #1a1a1a;
      line-height: 1.6;
    }
    h1 { font-size: 18px; text-align: center; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px; }
    .matter-name { font-size: 14px; text-align: center; font-weight: bold; margin-bottom: 4px; }
    .case-ref { font-size: 12px; text-align: center; color: #666; margin-bottom: 4px; }
    .court-label { font-size: 11px; text-align: center; color: #999; margin-bottom: 32px; }
    h2 { border-bottom: 1px solid #ccc; padding-bottom: 4px; }
    @media print { body { margin: 20mm; } }
  </style>
</head>
<body>
  <h1>Table of Authorities</h1>
  <p class="matter-name">${list.name}</p>
  <p class="case-ref">${list.caseRef}</p>
  <p class="court-label">${court.label}</p>
  ${court.parts.map((part) => renderSection(part)).join('')}
</body>
</html>`;
}
