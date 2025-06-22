// src/components/CaseCard.jsx
import React from 'react';

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/400x400.png?text=No+Image';

function CaseCard({ person, onMarkFound }) { // Added onMarkFound prop
  if (!person) return null;

  const handleImageError = (e) => { e.target.src = PLACEHOLDER_IMAGE; };

  const handleMarkFoundClick = (e) => {
    e.stopPropagation(); // Prevents any parent click events
    if (window.confirm(`Are you sure you want to mark "${person.name}" as found?`)) {
      onMarkFound(person.id);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden transition hover:shadow-blue-500/50 hover:-translate-y-1 flex flex-col">
      <img src={person.photo_url || PLACEHOLDER_IMAGE} alt={person.name || 'Unknown'} className="w-full h-64 object-cover" onError={handleImageError} />
      <div className="p-4 flex-grow flex flex-col">
        <h3 className="text-xl font-bold text-white">{person.name || 'No Name'}</h3>
        <p className="text-gray-400">{person.age ? `${person.age} years old` : 'Unknown Age'} — {person.gender || 'Unknown Gender'}</p>
        <div className="mt-4 border-t border-gray-700 pt-2 flex-grow">
          <p className="text-sm text-gray-300"><span className="font-semibold">Last Seen:</span> {person.loc || 'N/A'}</p>
          {person.similarity && <p className="text-sm text-blue-300 mt-1"><span className="font-semibold">Match Score:</span> {person.similarity}</p>}
        </div>
        
        {/* Conditionally render the button */}
        {onMarkFound && (
          <button
            onClick={handleMarkFoundClick}
            className="mt-4 w-full py-2 px-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition"
          >
            🟢 Mark as Found
          </button>
        )}
      </div>
    </div>
  );
}

export default CaseCard;