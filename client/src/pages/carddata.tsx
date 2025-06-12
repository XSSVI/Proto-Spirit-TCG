import { useState } from "react";

// ----- Types -----
type CardData = {
  name: string;
  keywords: string[];
  type: string;
  element: string;
  species: string;
  soul_cost: number | null;
  edge: number | null;
  shield: number | null;
  url: string;
};

type CardImageButtonProps = {
  imageUrl: string;
  cardData: CardData;
  rarity?: string; // Optional and independent of cardData
};

// ----- Rarity Mappings -----
const rarityMap: Record<string, string> = {
  C: "Common",
  R: "Rare",
  SR: "Super Rare",
  UR: "Ultra Rare",
};

const rarityColorMap: Record<string, string> = {
  C: "text-gray-600",
  R: "text-blue-600",
  SR: "text-purple-600",
  UR: "text-yellow-600",
};

// ----- Component -----
export default function CardImageButton({ imageUrl, cardData, rarity }: CardImageButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      {/* Image Button */}
      <img
        src={imageUrl}
        alt={cardData.name}
        onClick={() => setIsModalOpen(true)}
        className="w-40 h-auto cursor-pointer transition-transform duration-150 ease-in-out hover:scale-105 rounded shadow"
      />

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white text-black p-6 rounded-lg shadow-xl max-w-full sm:max-w-3xl w-full flex flex-col sm:flex-row gap-6 sm:gap-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Card Image */}
            <img
              src={imageUrl}
              alt={cardData.name}
              className="w-full sm:w-48 h-auto rounded shadow mb-6 sm:mb-0"
            />

            {/* Card Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-4">{cardData.name}</h2>
              <ul className="space-y-2 text-sm">
                <li><strong>Type:</strong> {cardData.type}</li>
                <li><strong>Element:</strong> {cardData.element}</li>
                <li><strong>Species:</strong> {cardData.species}</li>
                <li><strong>Keywords:</strong> {cardData.keywords.join(", ")}</li>
                <li><strong>Soul Cost:</strong> {cardData.soul_cost ?? "N/A"}</li>
                <li><strong>Edge:</strong> {cardData.edge ?? "N/A"}</li>
                <li><strong>Shield:</strong> {cardData.shield ?? "N/A"}</li>
                {rarity && rarityMap[rarity] && (
                  <li>
                    <strong>Rarity:</strong>{" "}
                    <span className={rarityColorMap[rarity]}>
                      {rarityMap[rarity]}
                    </span>
                  </li>
                )}
              </ul>
              <button
                onClick={() => setIsModalOpen(false)}
                className="mt-6 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}