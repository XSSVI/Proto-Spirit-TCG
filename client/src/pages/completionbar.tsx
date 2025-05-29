import React from "react";

interface ProgressBarProps {
  allCards: any[];
  inventory: any[];
}

const ProgressBar: React.FC<ProgressBarProps> = ({ allCards, inventory }) => {
  const total = allCards.length;
  const collected = inventory.length;
  const percentage = total > 0 ? Math.round((collected / total) * 100) : 0;

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-white mb-2">Collection Completion</h2>
      <div className="w-full bg-gray-700 rounded-full h-6 overflow-hidden">
        <div
          className="bg-green-500 h-full text-white text-sm font-medium text-center leading-6 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        >
          {percentage}%
        </div>
      </div>
      <p className="text-sm text-gray-400 mt-1">
        {collected} of {total} cards collected
      </p>
    </div>
  );
};

export default ProgressBar;