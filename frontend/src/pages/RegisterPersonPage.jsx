// src/pages/RegisterPersonPage.jsx

import React, { useState } from 'react';
import { registerPerson } from '../services/api';

function RegisterPersonPage() {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Other',
    loc: '',
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('A reference photo is required.');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccess('');

    // We use FormData because we are sending a file
    const data = new FormData();
    data.append('photo', file);
    data.append('name', formData.name);
    data.append('age', formData.age);
    data.append('gender', formData.gender);
    data.append('loc', formData.loc);
    // Add other fields to FormData if you have them in your backend

    try {
      const response = await registerPerson(data);
      setSuccess(response.message || 'Case registered successfully!');
      // Clear the form on success
      setFormData({ name: '', age: '', gender: 'Other', loc: '' });
      setFile(null);
      e.target.reset(); // Resets the file input
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to register case.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-white">Register Missing Person</h1>
      <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-lg shadow-lg space-y-6">
        {/* Photo Upload */}
        <div>
          <label htmlFor="photo" className="block text-sm font-medium text-gray-300 mb-2">Reference Photo (Frontal)*</label>
          <input type="file" id="photo" name="photo" onChange={handleFileChange} required className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
        </div>

        {/* Text Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300">Full Name*</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
          </div>
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-300">Age*</label>
            <input type="number" id="age" name="age" value={formData.age} onChange={handleChange} required className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
          </div>
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-300">Gender*</label>
            <select id="gender" name="gender" value={formData.gender} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="loc" className="block text-sm font-medium text-gray-300">Last Seen Location*</label>
            <input type="text" id="loc" name="loc" value={formData.loc} onChange={handleChange} required className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button type="submit" disabled={isLoading} className="w-full py-3 text-lg font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-600">
            {isLoading ? 'Saving Record...' : '💾 Save Record'}
          </button>
        </div>

        {/* Status Messages */}
        {error && <p className="text-center text-red-400 mt-4">{error}</p>}
        {success && <p className="text-center text-green-400 mt-4">{success}</p>}
      </form>
    </div>
  );
}

export default RegisterPersonPage;