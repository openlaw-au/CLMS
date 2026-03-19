/**
 * AGLC4 citation formatters for authority list export.
 * Matches actual Australian court filing templates.
 */

import { getCourtStructure, derivePart } from './courtStructures';

// TODO(api): Replace with server-side AGLC formatting service

/**
 * Auto-bracket bare numeric pinpoints for AGLC4 paragraph references.
 * "23" → "[23]", "23-24" → "[23]-[24]", "[23]" → "[23]" (unchanged).
 */
function bracketPinpoint(raw) {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (trimmed.includes('[')) return trimmed;
  return trimmed.replace(/\b(\d+)\b/g, '[$1]');
}

/**
 * Format a case citation in AGLC4 style (plain text).
 * Case name is NOT italicised in plain text but pinpoints use "at [n]".
 */
export function formatCase(item) {
  let out = `${item.title} ${item.citation || ''}`.trim();
  if (item.pageRange) out += ` at ${bracketPinpoint(item.pageRange)}`;
  return out;
}

/**
 * Format a case citation in HTML with italicised case name.
 */
export function formatCaseHtml(item) {
  let out = `<em>${item.title}</em> ${item.citation || ''}`.trim();
  if (item.pageRange) out += ` at ${bracketPinpoint(item.pageRange)}`;
  return out;
}

/**
 * Format a legislation citation in AGLC4 style.
 */
export function formatLegislation(item) {
  if (item.citation) return `${item.title} ${item.citation}`;
  return item.title;
}

/**
 * Format a book citation in AGLC4 style.
 * Full form: Author, Title (Publisher, Nth ed, Year) at [pinpoint]
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

  let out = parts.join(', ');
  if (item.pageRange) out += ` ${item.pageRange}`;

  return out;
}

/**
 * Format a single item based on its type (plain text).
 */
function formatItem(item) {
  if (item.type === 'case') return formatCase(item);
  if (item.type === 'legislation') return formatLegislation(item);
  return formatBook(item);
}

/**
 * Format a single item based on its type (HTML — cases get italics).
 */
function formatItemHtml(item) {
  if (item.type === 'case') return formatCaseHtml(item);
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
 * Build the court filing header lines (plain text).
 */
function buildFilingHeader(list, court) {
  const lines = [];

  // Court name
  lines.push(`IN THE ${court.label.toUpperCase()}`);

  // Registry
  const registry = list.registryCity || court.defaultRegistry || '';
  if (registry) lines.push(`AT ${registry.toUpperCase()}`);

  // Division
  if (list.division) lines.push(list.division.toUpperCase());

  // Case reference
  if (list.caseRef) lines.push(list.caseRef);
  lines.push('');

  // Parties
  if (list.filedOnBehalf) {
    lines.push(`${list.filedOnBehalf.toUpperCase()}${list.partyRole ? `\t${list.partyRole}` : ''}`);
    if (list.otherPartyName) {
      lines.push('and');
      lines.push(`${list.otherPartyName.toUpperCase()}${list.otherPartyRole ? `\t${list.otherPartyRole}` : ''}`);
    }
    lines.push('');
  }

  // Title
  const partyName = (list.filedOnBehalf || '').toUpperCase() || 'PARTY';
  const roleLabel = (list.partyRole || 'Applicant').toUpperCase();
  lines.push(`${roleLabel}'S LIST OF AUTHORITIES`);
  lines.push('');

  // Filing metadata
  lines.push(`Date of document: ${list.filingDate || ''}`);
  lines.push(`Filed on behalf of: ${list.filedOnBehalf || ''}, ${list.partyRole || ''}`);
  const preparer = list.preparedBy || '';
  if (preparer) lines.push(`Prepared by: ${preparer}`);
  lines.push('');

  return lines;
}

/**
 * Build the signature block (plain text).
 */
function buildSignatureBlock(list) {
  const lines = [];
  lines.push('');
  lines.push(`Date: ${list.filingDate || '_______________'}`);
  lines.push('');
  lines.push('Signed');
  lines.push('______________________________');
  const preparer = list.preparedBy || '';
  if (preparer) lines.push(preparer);
  if (list.signatoryCapacity) lines.push(list.signatoryCapacity);
  return lines;
}

/**
 * Generate plain-text version of an authority list.
 * Matches court filing format with continuous numbering and empty-part "None".
 */
export function generateAGLCPlainText(list) {
  const court = getCourtStructure(list.courtStructure || 'vic');
  const lines = [];

  lines.push(...buildFilingHeader(list, court));

  let runningIdx = 0;
  const useContinuous = court.continuousNumbering;

  court.parts.forEach((part) => {
    const partItems = sortAlpha(
      list.items.filter((i) => derivePart(i.type, i.usage, list.courtStructure) === part.key)
    );

    lines.push(`${part.label}\t${part.desc}`);

    if (partItems.length === 0) {
      if (court.showEmptyParts) lines.push('  None');
      lines.push('');
      return;
    }

    partItems.forEach((item, idx) => {
      const num = useContinuous ? runningIdx + idx + 1 : idx + 1;
      lines.push(`  ${num}. ${formatItem(item)}`);
    });
    if (useContinuous) runningIdx += partItems.length;
    lines.push('');
  });

  lines.push(...buildSignatureBlock(list));

  return lines.join('\n').trim();
}

/**
 * Generate printable HTML for an authority list.
 * Court-filing document style with proper formatting.
 */
export function generateAGLCHtml(list) {
  const court = getCourtStructure(list.courtStructure || 'vic');
  const useContinuous = court.continuousNumbering;
  let runningIdx = 0;

  const renderSection = (part) => {
    const partItems = sortAlpha(
      list.items.filter((i) => derivePart(i.type, i.usage, list.courtStructure) === part.key)
    );

    let content;
    if (partItems.length === 0) {
      content = court.showEmptyParts ? '<p style="margin-left:24px;font-style:italic;color:#666">None</p>' : '';
      if (!court.showEmptyParts) return '';
    } else {
      const startNum = useContinuous ? runningIdx + 1 : 1;
      if (useContinuous) runningIdx += partItems.length;
      content = `<ol start="${startNum}" style="padding-left:24px;font-size:12pt;line-height:2">
          ${partItems.map((item) => {
            const text = formatItemHtml(item);
            const needsPinpoint = item.usage === 'read' && !item.pageRange;
            return `<li${needsPinpoint ? ' style="color:#b45309"' : ''}>${text}${needsPinpoint ? ' <span style="color:#d97706;font-size:10pt">[pinpoint missing]</span>' : ''}</li>`;
          }).join('\n          ')}
        </ol>`;
    }

    return `
      <div style="margin-bottom:18pt">
        <p style="margin-bottom:6pt"><strong>${part.label}</strong>&emsp;${part.desc}</p>
        ${content}
      </div>`;
  };

  const roleLabel = (list.partyRole || 'Applicant').toUpperCase();
  const preparer = list.preparedBy || '';
  const registry = list.registryCity || court.defaultRegistry || '';

  // Party block
  let partyBlock = '';
  if (list.filedOnBehalf) {
    partyBlock += `<div style="margin:18pt 0">`;
    partyBlock += `<div style="display:flex;justify-content:space-between"><span style="font-weight:bold">${list.filedOnBehalf.toUpperCase()}</span><span>${list.partyRole || ''}</span></div>`;
    if (list.otherPartyName) {
      partyBlock += `<p style="text-align:center;margin:4pt 0">and</p>`;
      partyBlock += `<div style="display:flex;justify-content:space-between"><span style="font-weight:bold">${list.otherPartyName.toUpperCase()}</span><span>${list.otherPartyRole || ''}</span></div>`;
    }
    partyBlock += `</div>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>List of Authorities - ${list.name}</title>
  <style>
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      max-width: 700px;
      margin: 40px auto;
      color: #1a1a1a;
      line-height: 1.5;
    }
    .court-header { text-align: center; margin-bottom: 6pt; }
    .court-header p { margin: 0; font-size: 12pt; }
    .doc-title { text-align: center; font-size: 14pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1pt; margin: 18pt 0 12pt; }
    .filing-meta { font-size: 11pt; margin: 2pt 0; }
    .filing-meta-block { margin-bottom: 24pt; border-bottom: 1px solid #ccc; padding-bottom: 12pt; }
    .signature-block { margin-top: 48pt; }
    .sig-line { border-top: 1px solid #333; width: 250px; margin-top: 36pt; padding-top: 4pt; }
    @media print { body { margin: 20mm; } }
  </style>
</head>
<body>
  <div class="court-header">
    <p><strong>IN THE ${court.label.toUpperCase()}</strong></p>
    ${registry ? `<p>AT ${registry.toUpperCase()}</p>` : ''}
    ${list.division ? `<p>${list.division.toUpperCase()}</p>` : ''}
    ${list.caseRef ? `<p>${list.caseRef}</p>` : ''}
  </div>
  ${partyBlock}
  <p class="doc-title">${roleLabel}'S LIST OF AUTHORITIES</p>
  <div class="filing-meta-block">
    <p class="filing-meta">Date of document: ${list.filingDate || ''}</p>
    <p class="filing-meta">Filed on behalf of: ${list.filedOnBehalf || ''}, ${list.partyRole || ''}</p>
    ${preparer ? `<p class="filing-meta">Prepared by: ${preparer}</p>` : ''}
  </div>
  ${court.parts.map((part) => renderSection(part)).join('')}
  <div class="signature-block">
    <p>Date: ${list.filingDate || '_______________'}</p>
    <p style="margin-top:24pt">Signed</p>
    <div class="sig-line">
      ${preparer ? `<p>${preparer}</p>` : ''}
      ${list.signatoryCapacity ? `<p>${list.signatoryCapacity}</p>` : ''}
    </div>
  </div>
</body>
</html>`;
}
