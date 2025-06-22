// src/components/Navbar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const NavItem = ({ label, tabName, activeTab, setActiveTab }) => (
  <button
    onClick={() => setActiveTab(tabName)}
    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors
      ${activeTab === tabName
        ? 'bg-blue-600 text-white'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
  >
    {label}
  </button>
);

function Navbar({ activeTab, setActiveTab }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    navigate('/login');
  };

  return (
    <header className="bg-gray-800 shadow-md">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-xl font-bold text-white">🔍 Finder</span>
          <div className="hidden md:flex items-center space-x-2 ml-6">
            <NavItem label="Register Case" tabName="register" activeTab={activeTab} setActiveTab={setActiveTab} />
            <NavItem label="Search by Photo" tabName="search" activeTab={activeTab} setActiveTab={setActiveTab} />
            <NavItem label="My Cases" tabName="my-cases" activeTab={activeTab} setActiveTab={setActiveTab} />
            <NavItem label="Found Cases" tabName="found-cases" activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
        >
          Logout
        </button>
      </nav>
    </header>
  );
}

export default Navbar;