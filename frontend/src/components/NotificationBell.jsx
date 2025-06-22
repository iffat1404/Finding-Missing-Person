// src/components/NotificationBell.jsx

import React, { useState, useEffect } from 'react';
import { getNotifications, markNotificationAsRead } from '../services/api';

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState('');

  // Function to fetch notifications from the API
  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      // For debugging: see what the API returns
      console.log("Fetched notifications:", data); 
      // Safely set the notifications, defaulting to an empty array
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Could not fetch notifications:', error);
      setError('Could not load notifications.');
    }
  };

  // Fetch notifications only when the component first mounts (loads)
  useEffect(() => {
    fetchNotifications();
  }, []); // The empty array [] means this effect runs only once

  // Calculate the number of unread notifications
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Function to handle marking a single notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      // Update the state locally for instant UI feedback without a full re-fetch
      setNotifications(prevNotifications => 
        prevNotifications.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read', error);
      // Optionally, set an error message to show the user
    }
  };
  
  // Handle clicking the bell icon
  const handleBellClick = () => {
    // When opening the dropdown, it's a good idea to re-fetch the notifications
    if (!isOpen) {
        fetchNotifications();
    }
    // Toggle the dropdown's visibility
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      {/* The Bell Icon Button */}
      <button onClick={handleBellClick} className="relative text-gray-300 hover:text-white p-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {/* The Red Badge for unread notifications */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-xs font-semibold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* The Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-w-sm bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20">
          <div className="p-3 font-bold border-b border-gray-700 text-white">
            Notifications
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {error && <li className="p-3 text-center text-red-400">{error}</li>}
            
            {!error && notifications.length > 0 ? (
              notifications.map(n => (
                <li key={n.id} className={`p-3 border-b border-gray-700 last:border-b-0 ${!n.is_read ? 'bg-blue-900/40' : ''}`}>
                  <p className="text-sm text-gray-200">{n.message}</p>
                  <div className="text-xs text-gray-400 mt-1 flex justify-between items-center">
                    <span>{new Date(n.created_at).toLocaleString()}</span>
                    {!n.is_read && (
                      <button 
                        onClick={() => handleMarkAsRead(n.id)} 
                        className="text-blue-400 hover:underline font-semibold"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </li>
              ))
            ) : (
              !error && <li className="p-4 text-center text-gray-400">You have no notifications.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;