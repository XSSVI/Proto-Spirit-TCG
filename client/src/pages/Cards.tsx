import React, { useState, useEffect } from "react";
import Card from "./carddata.tsx";

function Cards() {
  const [cards, setCards] = useState([]);
  const [filter, setFilter] = useState({
    element: "",
    type: "",
    species: ""
  });
  const [filteredCards, setFilteredCards] = useState([]);
  
  // Dynamic dropdown options
  const [elements, setElements] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [species, setSpecies] = useState<string[]>([]);

  // Fetch cards from server
  useEffect(() => {
    async function fetchCards() {
      try {
        const response = await fetch("http://localhost:8000/cards");
        const data = await response.json();
        setCards(data);

        // Extract unique elements, types, species
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

  // Apply filters whenever cards or filter state changes
  useEffect(() => {
    let result = [...cards];
    
    if (filter.element) {
      result = result.filter(card => card.element === filter.element);
    }
    
    if (filter.type) {
      result = result.filter(card => card.type === filter.type);
    }
    
    if (filter.species) {
      result = result.filter(card => card.species === filter.species);
    }
    
    setFilteredCards(result);
  }, [cards, filter]);

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-4xl font-bold text-indigo-400 mb-6">War Spirit Cards</h1>
      
      {/* Filter controls */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-3">Filter Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Element</label>
            <select 
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
              value={filter.element}
              onChange={(e) => setFilter({...filter, element: e.target.value})}
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
              onChange={(e) => setFilter({...filter, type: e.target.value})}
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
              onChange={(e) => setFilter({...filter, species: e.target.value})}
            >
              <option value="">All Species</option>
              {species.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Reset filters button */}
        <div className="mt-4 text-right">
          <button 
            onClick={() => setFilter({ element: "", type: "", species: "" })}
            className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded text-sm"
          >
            Reset Filters
          </button>
        </div>
      </div>
      
      {/* Card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {filteredCards.map((card) => (
          <div key={card._id?.$oid || card._id} className="flex justify-center">
            <Card
              imageUrl={card.imageUrl || "/ace_of_hearts.png"}
              cardData={{
                name: card.name,
                keywords: card.keywords,
                type: card.type,
                element: card.element,
                species: card.species
              }}
            />
          </div>
        ))}
      </div>
      
      {filteredCards.length === 0 && (
        <div className="text-center py-12">
          <p className="text-xl text-gray-400">No cards found matching your filters.</p>
        </div>
      )}
      
      {/* Add card button */}
      <div className="fixed bottom-8 right-8">
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-full shadow-lg flex items-center justify-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Add Card
        </button>
      </div>
    </div>
  );
}

export default Cards;

