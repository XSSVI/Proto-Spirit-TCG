import React, { useState, useEffect } from "react";
import Card from "./carddata.tsx";
import ProgressBar from "./completionbar.tsx";

// Normalize card code to use "OOF" prefix
const normalizeCode = (code: string) => code.replace(/^OFF/, "OOF");

function Inventory() {
  const [cards, setCards] = useState([]);
  const [inventory, setInventory] = useState<Array<[number, string, string]>>([]);
  const [filteredCards, setFilteredCards] = useState([]);

  const [filter, setFilter] = useState({
    element: "",
    type: "",
    species: ""
  });

  const [elements, setElements] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [species, setSpecies] = useState<string[]>([]);

  // Fetch all cards
  useEffect(() => {
    async function fetchCards() {
      try {
        const response = await fetch("http://localhost:8000/cards");
        const data = await response.json();
        setCards(data);

        // Extract filter options
        const elementSet = new Set<string>();
        const typeSet = new Set<string>();
        const speciesSet = new Set<string>();

        data.forEach((card: any) => {
          if (card.element) elementSet.add(card.element);
          if (card.type) typeSet.add(card.type);
          if (card.species) speciesSet.add(card.species);
        });

        setElements(Array.from(elementSet).sort());
        setTypes(Array.from(typeSet).sort());
        setSpecies(Array.from(speciesSet).sort());
      } catch (error) {
        console.error("Error fetching cards:", error);
      }
    }

    fetchCards();
  }, []);

  // Fetch current user's inventory
  useEffect(() => {
    async function fetchInventory() {
      // ⬇️ read the saved user object
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      const userId = user?._id;
    
      console.log("User ID from localStorage:", userId);   // should now be 24-char hex
    
      if (!userId) return;                     // not logged in
      if (!/^[0-9a-fA-F]{24}$/.test(userId)) { // sanity-check
        console.warn("Bad userId:", userId);
        return;
      }
    
      try {
        const res = await fetch(`http://localhost:8000/users/${userId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const userData = await res.json();
      
        if (Array.isArray(userData.inventory)) {
          setInventory(userData.inventory);
        }
      } catch (err) {
        console.error("Error fetching inventory:", err);
      }
    }
  
    fetchInventory();
  }, []);

  // Filter cards based on inventory codes and filters
  useEffect(() => {
    if (!cards.length || !inventory.length) {
      setFilteredCards([]);
      return;
    }

    const inventoryCodes = new Set(inventory.map(([, code]) => normalizeCode(code)));
    let result = cards.filter((card) =>
      inventoryCodes.has(normalizeCode(card.code))
    );

    if (filter.element) {
      result = result.filter((card) => card.element === filter.element);
    }
    if (filter.type) {
      result = result.filter((card) => card.type === filter.type);
    }
    if (filter.species) {
      result = result.filter((card) => card.species === filter.species);
    }

    setFilteredCards(result);
  }, [cards, inventory, filter]);

  // Stats based only on inventory cards
  const totalCards = filteredCards.length;
  const spiritCards = filteredCards.filter(card => card.type === "Spirit").length;
  const beyonderCards = filteredCards.filter(card => card.type === "Beyonder").length;
  const evocationCards = filteredCards.filter(card => card.type === "Evocation").length;

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-4xl font-bold text-indigo-400 mb-6">Your Spirit War Inventory</h1>

      {/* Stats */}
      <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-2xl p-8 mb-16 border border-indigo-500/30">
        <h2 className="text-3xl font-bold text-indigo-300 mb-6">Your Collection at a Glance</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">{totalCards}</div>
            <div className="text-gray-400">Total Cards</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-400 mb-2">{spiritCards}</div>
            <div className="text-gray-400">Spirits</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">{beyonderCards}</div>
            <div className="text-gray-400">Beyonders</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-cyan-400 mb-2">{evocationCards}</div>
            <div className="text-gray-400">Evocations</div>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-3">Filter Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Element</label>
            <select
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
              value={filter.element}
              onChange={(e) => setFilter({ ...filter, element: e.target.value })}
            >
              <option value="">All Elements</option>
              {elements.map((el) => (
                <option key={el} value={el}>{el}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            >
              <option value="">All Types</option>
              {types.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Species</label>
            <select
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
              value={filter.species}
              onChange={(e) => setFilter({ ...filter, species: e.target.value })}
            >
              <option value="">All Species</option>
              {species.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Reset Button */}
        <div className="mt-4 text-right">
          <button
            onClick={() => setFilter({ element: "", type: "", species: "" })}
            className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded text-sm"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Completion Progress Bar */}
      <ProgressBar allCards={cards} inventory={filteredCards} />

      {/* Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 pb-6">
        {filteredCards.map((card) => {
          const rarity = inventory.find(([, code]) =>
            normalizeCode(code) === normalizeCode(card.code)
          )?.[2] || "";

          return (
            <div key={card._id?.$oid || card._id} className="flex justify-center">
              <Card
                imageUrl={card.code ? `/${normalizeCode(card.code)}.png` : "/ace_of_hearts.png"}
                cardData={{
                  name: card.name,
                  keywords: card.keywords,
                  type: card.type,
                  element: card.element,
                  species: card.species,
                  soul_cost: card.soul_cost,
                  edge: card.edge,
                  shield: card.shield
                }}
                rarity={rarity}
              />
            </div>
          );
        })}
      </div>

      {/* No cards message */}
      {filteredCards.length === 0 && (
        <div className="text-center py-12">
          <p className="text-xl text-gray-400">No cards found matching your filters.</p>
        </div>
      )}

      {/* Add Card Button */}
      <div className="fixed bottom-8 right-8">
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-full shadow-lg flex items-center justify-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Add Card
        </button>
      </div>
    </div>
  );
}

export default Inventory;