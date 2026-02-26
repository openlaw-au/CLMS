import { chambersMock } from '../mocks/chambers';

export async function searchChambers(keyword) {
  await new Promise((resolve) => {
    setTimeout(resolve, 180);
  });

  if (!keyword || keyword.trim().length < 3) {
    return [];
  }

  const lower = keyword.toLowerCase();
  return chambersMock.filter((item) => item.name.toLowerCase().includes(lower));
}
