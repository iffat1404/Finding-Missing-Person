// src/components/Navbar.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell'; // Import the new notification component

// A reusable sub-component for a single navigation button
const NavItem = ({ label, tabName, activeTab, setActiveTab }) => (
  <button
    onClick={() => setActiveTab(tabName)}
    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors
      ${activeTab === tabName
        ? 'bg-blue-600 text-white' // Style for the active tab
        : 'text-gray-300 hover:bg-gray-700 hover:text-white' // Style for inactive tabs
      }`}
  >
    {label}
  </button>
);

function Navbar({ userRole, activeTab, setActiveTab }) {
  const navigate = useNavigate();

  // Function to handle user logout
  const handleLogout = () => {
    // Clear user data from browser storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userRole');
    // Redirect to the login page
    navigate('/login');
  };

  // If the component renders before the userRole is determined, show nothing.
  // This prevents a "flash" of incorrect buttons.
  if (!userRole) {
    return null; 
  }

  return (
    <header className="bg-gray-800 shadow-md min-w-screen">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Left side of the Navbar */}
        <div className="flex items-center space-x-2">
          <span className="text-xl font-bold text-white">🔍 Finder</span>
          
          {/* Main navigation buttons, hidden on small screens */}
          <div className="hidden md:flex items-center space-x-2 ml-6">
            
            {/* Conditional Rendering: Show different buttons based on user role */}
            {userRole === 'admin' ? (
              // --- Admin View ---
              <>
                <NavItem label="All Cases" tabName="all-cases" activeTab={activeTab} setActiveTab={setActiveTab} />
                <NavItem label="Search by Photo" tabName="search" activeTab={activeTab} setActiveTab={setActiveTab} />
                <NavItem label="Found Cases" tabName="found-cases" activeTab={activeTab} setActiveTab={setActiveTab} />
              </>
            ) : (
              // --- Regular User View ---
              <>
                <NavItem label="Register Case" tabName="register-case" activeTab={activeTab} setActiveTab={setActiveTab} />
                <NavItem label="My Cases" tabName="my-cases" activeTab={activeTab} setActiveTab={setActiveTab} />
              </>
            )}
          </div>
        </div>

        {/* Right side of the Navbar */}
        <div className="flex items-center space-x-4">
          
          {/* The Notification Bell: Only show it for regular users */}
          {userRole === 'user' && <NotificationBell />}
          
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;