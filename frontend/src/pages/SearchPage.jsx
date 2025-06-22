// src/pages/SearchPage.jsx

import React, { useState, useEffect } from 'react';
import { searchByPhoto, markAsFound } from '../services/api';
import CaseCard from '../components/CaseCard';

function SearchPage() {
  // State for the form inputs
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [strictness, setStrictness] = useState(0.4);

  // State for managing the UI and results
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // This effect safely creates a preview URL for the selected image
  useEffect(() => {
    // If no file is selected, clear the preview and do nothing else
    if (!file) {
      setPreview(null);
      return;
    }

    // Create a temporary URL for the selected file object
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // This is a cleanup function. It runs when the component is removed
    // from the screen or when the 'file' dependency changes. It's crucial
    // for preventing memory leaks in the browser.
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]); // This effect will re-run only when the 'file' state changes

  const handleFileChange = (e) => {
    // Ensure files were actually selected before trying to access them
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const handleSearch = async () => {
    if (!file) {
      setError('Please select a photo to search.');
      return;
    }
    // Reset state for a new search
    setIsLoading(true);
    setError('');
    setMessage('');
    setResults([]);

    const formData = new FormData();
    formData.append('photo', file);
    formData.append('strictness', strictness);

    try {
      const response = await searchByPhoto(formData);
      setResults(response.matches || []); // Use || [] as a fallback for safety
      if (!response.matches || response.matches.length === 0) {
        setMessage('No matches found. Try lowering the strictness level.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred during the search.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkCaseAsFound = async (personId) => {
    // Show a confirmation dialog to the admin before proceeding
    if (!window.confirm("Are you sure you want to mark this case as found? This action cannot be undone.")) {
      return;
    }

    try {
      await markAsFound(personId);
      // Remove the found person from the current search results for immediate UI feedback
      setResults(prevResults => prevResults.filter(p => p.id !== personId));
      setMessage('Case successfully moved to "Found Cases"!');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update case status.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-white">Search by Photo</h1>
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <label htmlFor="photo-upload" className="block text-sm font-medium text-gray-300 mb-2">Upload photo to search</label>
            <input 
              id="photo-upload" 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            
            {/* Image Preview Section */}
            {preview && (
              <div className="mt-4">
                <p className="text-sm text-gray-400 mb-2">Search Image Preview:</p>
                <img src={preview} alt="Search preview" className="rounded-lg w-32 h-32 object-cover" />
              </div>
            )}
          </div>
          <div>
            <label htmlFor="strictness" className="block text-sm font-medium text-gray-300 mb-2">Match Strictness: {strictness.toFixed(2)}</label>
            <input 
              id="strictness" 
              type="range" 
              min="0.2" max="0.7" 
              step="0.01" value={strictness} 
              onChange={(e) => setStrictness(parseFloat(e.target.value))} 
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" 
            />
          </div>
        </div>
        <button 
          onClick={handleSearch} 
          disabled={isLoading || !file} 
          className="w-full py-3 text-lg font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Searching...' : '🔎 Search'}
        </button>
      </div>

      {/* Status Messages for User Feedback */}
      {error && <div className="mt-6 p-4 text-center text-red-300 bg-red-900/50 rounded-lg">{error}</div>}
      {message && <div className="mt-6 p-4 text-center text-yellow-300 bg-yellow-900/50 rounded-lg">{message}</div>}

      {/* Display Search Results */}
      <div className="mt-8">
        {results.length > 0 && <h2 className="text-2xl font-bold mb-4">Found {results.length} Potential Match(es)</h2>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((person) => (
            <CaseCard 
              key={person.id} 
              person={person} 
              onMarkFound={handleMarkCaseAsFound} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default SearchPage;