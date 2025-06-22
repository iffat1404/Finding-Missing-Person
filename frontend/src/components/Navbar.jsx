// src/components/Navbar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const NavItem = ({ label, tabName, activeTab, setActiveTab }) => (
  <button
    onClick={() => setActiveTab(tabName)}
    className={`relative px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 transform hover:scale-105
      ${
        activeTab === tabName
          ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25"
          : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
      }`}
  >
    {label}
    {activeTab === tabName && (
      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-300 rounded-full"></div>
    )}
  </button>
)

function Navbar({ activeTab, setActiveTab }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem("accessToken")
    navigate("/login")
  }

  return (
    <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-2xl border-b border-slate-700/50 min-w-screen">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-xl">🔍</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Finder
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-2 bg-slate-800/50 rounded-2xl p-2 backdrop-blur-sm">
            <NavItem label="Register Case" tabName="register" activeTab={activeTab} setActiveTab={setActiveTab} />
            <NavItem label="Search by Photo" tabName="search" activeTab={activeTab} setActiveTab={setActiveTab} />
            <NavItem label="My Cases" tabName="my-cases" activeTab={activeTab} setActiveTab={setActiveTab} />
            <NavItem label="Found Cases" tabName="found-cases" activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-500 rounded-xl hover:from-red-500 hover:to-red-400 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-red-500/25 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
              clipRule="evenodd"
            />
          </svg>
          Logout
        </button>
      </nav>
    </header>
  )
}

export default Navbar