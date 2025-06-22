// src/pages/SearchPage.jsx
import React, { useState } from 'react';
import { searchByPhoto, markAsFound  } from '../services/api';
import CaseCard from '../components/CaseCard';

function SearchPage() {
  const [file, setFile] = useState(null);
  const [strictness, setStrictness] = useState(0.4);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSearch = async () => {
    if (!file) {
      setError('Please select a photo to search.');
      return;
    }
    setIsLoading(true);
    setError('');
    setMessage('');
    setResults([]);

    const formData = new FormData();
    formData.append('photo', file);
    formData.append('strictness', strictness);

    try {
      const response = await searchByPhoto(formData);
      console.log("API Response:", response); // <<<--- IMPORTANT LOGGING
      
      if (response && response.matches) {
        setResults(response.matches);
        if (response.matches.length === 0) {
          setMessage('No matches found. Try a lower strictness level.');
        }
      } else {
        // This case handles if the API returns an unexpected format
        throw new Error("Received an invalid response format from the server.");
      }

    } catch (err) {
      console.error("Search failed:", err); // <<<--- IMPORTANT LOGGING
      setError(err.response?.data?.detail || err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
   const handleMarkCaseAsFound = async (personId) => {
    try {
      await markAsFound(personId);
      // Remove the found person from the current search results list
      setResults(prevResults => prevResults.filter(p => p.id !== personId));
      alert('Case successfully moved to "Found Cases"!');
    } catch (err) {
      alert('Failed to mark case as found.');
    }
  };


  // The JSX part remains the same as the previous "verified" version
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-white">Search by Photo</h1>
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <label htmlFor="photo-upload" className="block text-sm font-medium text-gray-300 mb-2">Upload photo to search</label>
            <input id="photo-upload" type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
          </div>
          <div>
            <label htmlFor="strictness" className="block text-sm font-medium text-gray-300 mb-2">Match Strictness: {strictness.toFixed(2)}</label>
            <input id="strictness" type="range" min="0.2" max="0.7" step="0.01" value={strictness} onChange={(e) => setStrictness(parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
          </div>
        </div>
        <button onClick={handleSearch} disabled={isLoading || !file} className="w-full py-3 text-lg font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
          {isLoading ? 'Searching...' : '🔎 Search'}
        </button>
      </div>

      {error && <div className="mt-6 p-4 text-center text-red-300 bg-red-900/50 rounded-lg">{error}</div>}
      {message && <div className="mt-6 p-4 text-center text-yellow-300 bg-yellow-900/50 rounded-lg">{message}</div>}

     <div className="mt-8">
      {results.length > 0 && <h2 className="text-2xl font-bold mb-4">Found {results.length} Potential Match(es)</h2>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((person) => (
          // Pass the handler function to the CaseCard
          <CaseCard key={person.id} person={person} onMarkFound={handleMarkCaseAsFound} />
        ))}
      </div>
    </div>
    </div>
  );
}
export default SearchPage;