export function normalizeCode(code: string): string {
  return code.replace(/^OFF/, "OOF");
}

export function filterCardsByInventory(cards: any[], inventory: [number, string, string][]) {
  const inventoryCodes = new Set(inventory.map(([, code]) => normalizeCode(code)));
  return cards.filter((card) => inventoryCodes.has(normalizeCode(card.code)));
}

export function applyCardFilters(cards: any[], filter: { element: string, type: string, species: string }) {
  return cards.filter((card) => {
    if (filter.element && card.element !== filter.element) return false;
    if (filter.type && card.type !== filter.type) return false;
    if (filter.species && card.species !== filter.species) return false;
    return true;
  });
}
