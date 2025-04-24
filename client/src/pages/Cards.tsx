import React, { useState, useEffect } from "react";
import Card from "./card.tsx";

function Cards() {
  // Card data state
  const [cards, setCards] = useState([
    {
      id: 1,
      name: "Fire Warrior",
      keywords: ["aggressive", "melee", "berserker"],
      type: "Warrior",
      element: "Fire",
      species: "Human",
      imageUrl: "/king_of_hearts2.png"
    },
    {
      id: 2,
      name: "Water Mage",
      keywords: ["spell", "control", "tactical"],
      type: "Mage",
      element: "Water",
      species: "Elf",
      imageUrl: "/queen_of_hearts2.png"
    },
    {
      id: 3,
      name: "Earth Guardian",
      keywords: ["defensive", "tanky", "protector"],
      type: "Guardian",
      element: "Earth",
      species: "Dwarf",
      imageUrl: "/jack_of_hearts2.png"
    },
    {
      id: 4,
      name: "Wind Assassin",
      keywords: ["stealth", "speed", "critical"],
      type: "Assassin",
      element: "Wind",
      species: "Orc",
      imageUrl: "/10_of_hearts.png"
    },
    {
      id: 5,
      name: "Lightning Shaman",
      keywords: ["shock", "area", "support"],
      type: "Shaman",
      element: "Lightning",
      species: "Goblin",
      imageUrl: "/ace_of_hearts.png"
    },
    {
      id: 6,
      name: "Shadow Necromancer",
      keywords: ["summon", "curse", "darkness"],
      type: "Necromancer",
      element: "Shadow",
      species: "Undead",
      imageUrl: "/2_of_spades.png"
    },
    {
      id: 7,
      name: "Ice Archer",
      keywords: ["ranged", "slow", "precision"],
      type: "Archer",
      element: "Ice",
      species: "Elf",
      imageUrl: "/8_of_spades.png"
    },
    {
      id: 8,
      name: "Storm Paladin",
      keywords: ["holy", "charge", "resilience"],
      type: "Paladin",
      element: "Storm",
      species: "Human",
      imageUrl: "/10_of_spades.png"
    }
  ]);

  // Filter state
  const [filter, setFilter] = useState({
    element: "",
    type: "",
    species: ""
  });

  // Filtered cards state
  const [filteredCards, setFilteredCards] = useState(cards);

  // Apply filters whenever filter state changes
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
      <h1 className="text-4xl font-bold text-indigo-400 mb-6">War Spirit cards</h1>
      
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
              <option value="Fire">Fire</option>
              <option value="Water">Water</option>
              <option value="Earth">Earth</option>
              <option value="Air">Air</option>
              <option value="Light">Light</option>
              <option value="Dark">Dark</option>
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
              <option value="Warrior">Warrior</option>
              <option value="Mage">Mage</option>
              <option value="Guardian">Guardian</option>
              <option value="Scout">Scout</option>
              <option value="Support">Support</option>
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
              <option value="Human">Human</option>
              <option value="Elf">Elf</option>
              <option value="Dwarf">Dwarf</option>
              <option value="Dragon">Dragon</option>
              <option value="Beast">Beast</option>
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
      
      {/* Card grid - using filteredCards instead of cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {filteredCards.map((card) => (
          <div key={card.id} className="flex justify-center">
            <Card
              imageUrl={card.imageUrl}
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