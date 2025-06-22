// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/api';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const data = await login(username, password);
      localStorage.setItem('accessToken', data.access_token);
      navigate('/');
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center text-white">Log In</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-md" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-md" />
          <button type="submit" disabled={isLoading} className="w-full px-4 py-3 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-500">
            {isLoading ? 'Logging In...' : 'Log In'}
          </button>
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
        </form>
        <p className="text-center text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-blue-400 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;