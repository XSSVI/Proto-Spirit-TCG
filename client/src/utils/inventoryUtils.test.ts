import {
  normalizeCode,
  filterCardsByInventory,
  applyCardFilters,
} from "./inventoryUtils.ts";

//positive tests
Deno.test("normalizeCode replaces OFF with OOF", () => {
  const result = normalizeCode("OFF123");
  if (result !== "OOF123") {
    throw new Error(`Expected "OOF123", got "${result}"`);
  }
});

Deno.test("filterCardsByInventory returns only cards present in inventory", () => {
  const cards = [
    { code: "OOF001" },
    { code: "OOF002" },
    { code: "OOF003" },
  ];

  const inventory: [number, string, string][] = [
    [1, "OOF001", "Common"],
    [2, "OOF003", "Rare"],
  ];

  const result = filterCardsByInventory(cards, inventory);
  if (result.length !== 2 || result[0].code !== "OOF001" || result[1].code !== "OOF003") {
    throw new Error(`Unexpected filtered result: ${JSON.stringify(result)}`);
  }
});

Deno.test("applyCardFilters correctly filters cards", () => {
  const cards = [
    { code: "C1", element: "Fire", type: "Spirit", species: "Dragon" },
    { code: "C2", element: "Water", type: "Beyonder", species: "Fish" },
    { code: "C3", element: "Fire", type: "Evocation", species: "Dragon" },
  ];

  const filter = { element: "Fire", type: "", species: "Dragon" };
  const result = applyCardFilters(cards, filter);

  if (result.length !== 2) {
    throw new Error(`Expected 2 cards, got ${result.length}`);
  }

  if (!result.every(c => c.element === "Fire" && c.species === "Dragon")) {
    throw new Error(`Filtering failed: ${JSON.stringify(result)}`);
  }
});

// Fail test
Deno.test("normalizeCode does not change codes incorrectly", () => {
  const result = normalizeCode("OOF999");
  if (result !== "OFF999") {
    throw new Error(`Expected "OFF999", got "${result}"`);
  }
});