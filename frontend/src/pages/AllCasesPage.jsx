// src/pages/AllCasesPage.jsx
import React, { useState, useEffect } from 'react';
import { getAllActiveCases } from '../services/api';
import CaseCard from '../components/CaseCard';

function AllCasesPage() {
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await getAllActiveCases();
        setCases(response.cases || []);
      } catch (err) {
        setError('Failed to load cases. You may not have admin rights.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCases();
  }, []);

  if (isLoading) return <div className="text-center p-8">Loading All Active Cases...</div>;
  if (error) return <div className="text-center p-8 text-red-400">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-white">All Active Cases</h1>
      {cases.length === 0 ? (
        <p className="text-center text-gray-400">There are no active cases in the system.</p>
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

export default AllCasesPage;