// src/pages/FoundCasesPage.jsx
import React, { useState, useEffect } from 'react';
import { getFoundCases } from '../services/api';
import CaseCard from '../components/CaseCard';

function FoundCasesPage() {
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await getFoundCases();
        if (response && response.cases) {
          setCases(response.cases);
        }
      } catch (err) {
        setError('Failed to load found cases.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCases();
  }, []);

  if (isLoading) return <div className="text-center p-8">Loading...</div>;
  if (error) return <div className="text-center p-8 text-red-400">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-white">Resolved Cases (Found)</h1>
      {cases.length === 0 ? (
        <p className="text-center text-gray-400">No cases have been marked as found yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cases.map((person) => (
            // Note: We don't pass onMarkFound here because these are already found
            <CaseCard key={person.id} person={person} />
          ))}
        </div>
      )}
    </div>
  );
}

export default FoundCasesPage;