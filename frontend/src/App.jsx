// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage'; // This is for USER registration
import DashboardPage from './pages/DashboardPage';

// This component protects routes that require a user to be logged in.
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('accessToken');
  // If there's a token, show the protected content. Otherwise, redirect to login.
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      <Routes>
        {/* Public routes that anyone can access */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* 
          Protected routes. The "/*" is a wildcard that catches any other path
          (like /, /search, /my-cases) and wraps it with authentication.
        */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;