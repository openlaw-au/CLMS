import { generateAGLCHtml } from '../utils/aglcFormatter';

// TODO(api): Replace with POST /api/authority-lists/:id/export — server-side PDF generation

/**
 * Export an authority list as a printable AGLC4-formatted HTML page.
 * Opens in a new tab for browser print/PDF save.
 * @param {{ name: string, caseRef: string, items: Array }} list
 */
export function exportAGLC(list) {
  const html = generateAGLCHtml(list);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
