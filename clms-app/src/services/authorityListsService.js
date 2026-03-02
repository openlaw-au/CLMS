import { authorityListsMock } from '../mocks/authorityLists';

const delay = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));

// TODO(api): Replace with GET /api/authority-lists — fetch all lists for current user
export async function getLists() {
  await delay();
  return [...authorityListsMock];
}

// TODO(api): Replace with GET /api/authority-lists/:id — fetch single list with items
export async function getList(id) {
  await delay();
  return authorityListsMock.find((l) => l.id === id) || null;
}

// TODO(api): Replace with POST /api/authority-lists/:id/items — add item to list
export async function addItem(listId, item) {
  await delay(200);
  const list = authorityListsMock.find((l) => l.id === listId);
  if (!list) return null;

  const newItem = { id: `ali${Date.now()}`, ...item };
  list.items.push(newItem);
  return newItem;
}

// TODO(api): Replace with DELETE /api/authority-lists/:id/items/:itemId — remove item from list
export async function removeItem(listId, itemId) {
  await delay(200);
  const list = authorityListsMock.find((l) => l.id === listId);
  if (!list) return false;

  const idx = list.items.findIndex((i) => i.id === itemId);
  if (idx === -1) return false;

  list.items.splice(idx, 1);
  return true;
}
