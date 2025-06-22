// src/pages/DashboardPage.jsx
import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import SearchPage from './SearchPage';
import RegisterPersonPage from './RegisterPersonPage'; // For registering a CASE
import MyCasesPage from './MyCases';
import FoundCasesPage from './FoundCasesPage';
import AllCasesPage from './AllCasesPage'; 

function DashboardPage() {
  // Get the user's role from localStorage
  const userRole = localStorage.getItem('userRole');

  // Set the default active tab based on the user's role
// In DashboardPage.jsx
const [activeTab, setActiveTab] = useState(userRole === 'admin' ? 'all-cases' : 'my-cases');

  const renderContent = () => {
    // Admin View
    if (userRole === 'admin') {
      switch (activeTab) {
        case 'all-cases': // Add the new case
          return <AllCasesPage />;
        case 'search':
          return <SearchPage />;
        case 'found-cases':
          return <FoundCasesPage />;
        // Admins might also want to see all cases, but we'll add that later.
        default:
          return <SearchPage />; // Default view for admin
      }
    } 
    
    // Regular User View
    else {
      switch (activeTab) {
        case 'register-case': // Using a more specific name now
          return <RegisterPersonPage />;
        case 'my-cases':
          return <MyCasesPage />;
        default:
          return <MyCasesPage />; // Default view for user
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar userRole={userRole} activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-grow p-4 md:p-8">
        {renderContent()}
      </main>
    </div>
  );
}

export default DashboardPage;