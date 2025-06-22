// src/pages/DashboardPage.jsx
import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import SearchPage from './SearchPage';
import RegisterPersonPage from './RegisterPage';
import MyCasesPage from './MyCases';
import FoundCasesPage from './FoundCasesPage';

function DashboardPage() {
  const [activeTab, setActiveTab] = useState('register');

  const renderContent = () => {
    switch (activeTab) {
      case 'register':
        return <RegisterPersonPage />;
      case 'search':
        return <SearchPage />;
      case 'my-cases':
        return <MyCasesPage />; // 2. Render the new component
      case 'found-cases':
        return <FoundCasesPage />;
      default:
        return <RegisterPersonPage />;
    }
  };

  return (
    // ... same return statement as before
    <div className="flex flex-col min-h-screen">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-grow p-4 md:p-8">
        {renderContent()}
      </main>
    </div>
  );
}

export default DashboardPage;