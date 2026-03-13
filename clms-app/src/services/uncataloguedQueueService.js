import { uncataloguedQueueMock, persistUncataloguedQueue } from '../mocks/uncataloguedQueue';
import { authorityListsMock, persistAuthorityLists } from '../mocks/authorityLists';

const delay = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));

function cloneEntry(entry) {
  return {
    ...entry,
    resolvedAt: entry.resolvedAt || null,
    linkedBookId: entry.linkedBookId || null,
  };
}

function syncAuthorityListItem(queueEntry, bookId = null) {
  if (!queueEntry?.listId || !queueEntry?.itemId) return;
  const list = authorityListsMock.find((item) => item.id === queueEntry.listId);
  if (!list) return;
  const authorityItem = list.items.find((item) => item.id === queueEntry.itemId);
  if (!authorityItem) return;
  authorityItem.uncatalogued = false;
  if (bookId) authorityItem.linkedBookId = bookId;
}

export async function getQueue(status = 'pending') {
  await delay();
  if (status === 'all') return uncataloguedQueueMock.map(cloneEntry);
  return uncataloguedQueueMock.filter((entry) => entry.status === status).map(cloneEntry);
}

export async function getQueueItem(id) {
  await delay();
  const entry = uncataloguedQueueMock.find((item) => item.id === id);
  return entry ? cloneEntry(entry) : null;
}

export async function addQueueEntry(data) {
  await delay(200);
  const entry = {
    id: `uq${Date.now()}`,
    title: data.title,
    author: data.author || '',
    addedBy: data.addedBy || 'Barrister',
    addedAt: data.addedAt || new Date().toISOString(),
    listId: data.listId || null,
    listName: data.listName || '',
    itemId: data.itemId || null,
    status: 'pending',
    linkedBookId: null,
    resolvedAt: null,
  };
  uncataloguedQueueMock.unshift(entry);
  persistUncataloguedQueue();
  return cloneEntry(entry);
}

export async function markAddedToCatalogue(queueId, bookId) {
  await delay(200);
  const entry = uncataloguedQueueMock.find((item) => item.id === queueId);
  if (!entry) return null;
  entry.status = 'catalogued';
  entry.linkedBookId = bookId;
  entry.resolvedAt = new Date().toISOString();
  syncAuthorityListItem(entry, bookId);
  persistUncataloguedQueue();
  persistAuthorityLists();
  return cloneEntry(entry);
}

export async function linkToExisting(queueId, bookId) {
  await delay(200);
  const entry = uncataloguedQueueMock.find((item) => item.id === queueId);
  if (!entry) return null;
  entry.status = 'linked';
  entry.linkedBookId = bookId;
  entry.resolvedAt = new Date().toISOString();
  syncAuthorityListItem(entry, bookId);
  persistUncataloguedQueue();
  persistAuthorityLists();
  return cloneEntry(entry);
}

export async function dismissQueueItem(queueId) {
  await delay(200);
  const entry = uncataloguedQueueMock.find((item) => item.id === queueId);
  if (!entry) return null;
  entry.status = 'dismissed';
  entry.resolvedAt = new Date().toISOString();
  persistUncataloguedQueue();
  return cloneEntry(entry);
}

export async function dismissQueueItemBySource(listId, itemId) {
  await delay(200);
  const entry = uncataloguedQueueMock.find((item) => item.status === 'pending' && item.listId === listId && item.itemId === itemId);
  if (!entry) return null;
  entry.status = 'dismissed';
  entry.resolvedAt = new Date().toISOString();
  persistUncataloguedQueue();
  return cloneEntry(entry);
}
