import { authorityListsMock, persistAuthorityLists } from '../mocks/authorityLists';
import { getDefaultUsage } from '../utils/courtStructures';
import { isMockEmpty } from '../context/DevContext';

const delay = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));

// TODO(api): Replace with GET /api/authority-lists — fetch all lists for current user
export async function getLists() {
  await delay();
  if (isMockEmpty()) return [];
  return authorityListsMock.map((l) => ({ ...l, items: [...l.items], issues: [...(l.issues || [])] }));
}

// TODO(api): Replace with GET /api/authority-lists/:id — fetch single list with items
export async function getList(id) {
  await delay();
  if (isMockEmpty()) return null;
  return authorityListsMock.find((l) => l.id === id) || null;
}

// TODO(api): Replace with POST /api/authority-lists/:id/items — add item to list
export async function addItem(listId, item) {
  await delay(200);
  const list = authorityListsMock.find((l) => l.id === listId);
  if (!list) return null;

  const usage = item.usage || getDefaultUsage(item.type, list.courtStructure);
  const issue = item.issue !== undefined ? item.issue : null;
  const newItem = { id: `ali${Date.now()}`, ...item, usage, issue };
  list.items.push(newItem);
  persistAuthorityLists();
  return newItem;
}

// TODO(api): Replace with PATCH /api/authority-lists/:id/items/:itemId — update item fields (e.g. pageRange, part)
export async function updateItem(listId, itemId, updates) {
  await delay(200);
  const list = authorityListsMock.find((l) => l.id === listId);
  if (!list) return null;
  const item = list.items.find((i) => i.id === itemId);
  if (!item) return null;
  Object.assign(item, updates);
  persistAuthorityLists();
  return item;
}

// TODO(api): Replace with POST /api/authority-lists — create new authority list
export async function createList(name, caseRef, courtStructure = 'vic') {
  await delay(200);
  const newList = {
    id: `al${Date.now()}`,
    name,
    caseRef: caseRef || '',
    courtStructure,
    createdAt: new Date().toISOString().slice(0, 10),
    issues: [],
    items: [],
  };
  authorityListsMock.push(newList);
  persistAuthorityLists();
  return newList;
}

// TODO(api): Replace with PATCH /api/authority-lists/:id — update list metadata (name, caseRef, courtStructure)
export async function updateList(listId, updates) {
  await delay(200);
  const list = authorityListsMock.find((l) => l.id === listId);
  if (!list) return null;
  Object.assign(list, updates);
  persistAuthorityLists();
  return list;
}

// TODO(api): Replace with POST /api/authority-lists/:id/duplicate — duplicate list with all items
export async function duplicateList(listId) {
  await delay(300);
  const list = authorityListsMock.find((l) => l.id === listId);
  if (!list) return null;

  const newList = {
    id: `al${Date.now()}`,
    name: `${list.name} (Copy)`,
    caseRef: list.caseRef,
    courtStructure: list.courtStructure,
    createdAt: new Date().toISOString().slice(0, 10),
    issues: [...(list.issues || [])],
    items: list.items.map((item) => ({
      ...item,
      id: `ali${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
    })),
  };
  authorityListsMock.push(newList);
  persistAuthorityLists();
  return newList;
}

// TODO(api): Replace with DELETE /api/authority-lists/:id — delete list
export async function deleteList(listId) {
  await delay(200);
  const idx = authorityListsMock.findIndex((l) => l.id === listId);
  if (idx === -1) return false;
  authorityListsMock.splice(idx, 1);
  persistAuthorityLists();
  return true;
}

// TODO(api): Replace with DELETE /api/authority-lists/:id/items/:itemId — remove item from list
export async function removeItem(listId, itemId) {
  await delay(200);
  const list = authorityListsMock.find((l) => l.id === listId);
  if (!list) return false;

  const idx = list.items.findIndex((i) => i.id === itemId);
  if (idx === -1) return false;

  list.items.splice(idx, 1);
  persistAuthorityLists();
  return true;
}

// TODO(api): Replace with PATCH /api/authority-lists/:id/items/reorder — reorder items within list
export async function reorderItems(listId, itemIds) {
  await delay(200);
  const list = authorityListsMock.find((l) => l.id === listId);
  if (!list) return false;

  const reordered = itemIds
    .map((id) => list.items.find((i) => i.id === id))
    .filter(Boolean);
  // Append any items not in the reorder set
  const remaining = list.items.filter((i) => !itemIds.includes(i.id));
  list.items.length = 0;
  list.items.push(...reordered, ...remaining);
  persistAuthorityLists();
  return true;
}

// TODO(api): Replace with POST /api/authority-lists/:id/issues — add a new issue group
export async function addIssue(listId, issueName) {
  await delay(200);
  const list = authorityListsMock.find((l) => l.id === listId);
  if (!list) return false;
  if (!list.issues) list.issues = [];
  list.issues.push(issueName);
  persistAuthorityLists();
  return true;
}

// TODO(api): Replace with PATCH /api/authority-lists/:id/issues/:oldName — rename an issue group
export async function renameIssue(listId, oldName, newName) {
  await delay(200);
  const list = authorityListsMock.find((l) => l.id === listId);
  if (!list || !list.issues) return false;
  const idx = list.issues.indexOf(oldName);
  if (idx === -1) return false;
  list.issues[idx] = newName;
  // Update all items referencing this issue
  list.items.forEach((item) => {
    if (item.issue === oldName) item.issue = newName;
  });
  persistAuthorityLists();
  return true;
}

// TODO(api): Replace with DELETE /api/authority-lists/:id/issues/:name — remove an issue group (items become ungrouped)
export async function removeIssue(listId, issueName) {
  await delay(200);
  const list = authorityListsMock.find((l) => l.id === listId);
  if (!list || !list.issues) return false;
  const idx = list.issues.indexOf(issueName);
  if (idx === -1) return false;
  list.issues.splice(idx, 1);
  // Ungroup items that belonged to this issue
  list.items.forEach((item) => {
    if (item.issue === issueName) item.issue = null;
  });
  persistAuthorityLists();
  return true;
}
