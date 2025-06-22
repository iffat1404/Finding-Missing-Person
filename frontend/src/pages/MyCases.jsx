// src/pages/MyCasesPage.jsx
import React, { useState, useEffect } from 'react';
import { getMyCases } from '../services/api';
import CaseCard from '../components/CaseCard';

function MyCasesPage() {
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await getMyCases();
        if (response && response.cases) {
          setCases(response.cases);
        }
      } catch (err) {
        setError('Failed to load your cases. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCases();
  }, []); // The empty array [] means this effect runs once when the component mounts

  if (isLoading) {
    return <div className="text-center p-8">Loading your cases...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-400">{error}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-white">My Submitted Cases</h1>
      {cases.length === 0 ? (
        <p className="text-center text-gray-400">You have not registered any cases yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cases.map((person) => (
            <CaseCard key={person.id} person={person} />
          ))}
        </div>
      )}
    </div>
  );
}

export default MyCasesPage;