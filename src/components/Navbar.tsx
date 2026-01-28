// src/components/Navbar.tsx
'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import SearchBar from '@/components/SearchBar'; 

const Navbar = () => {
  const { user, signOut } = useAuth();

  if (!user) return null;

  return (
    <nav className="w-full bg-gray-100 dark:bg-gray-900 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between z-50 shadow-sm h-16">
      <div className="flex items-center space-x-8 flex-1">
        <Link href="/" className="text-2xl font-bold text-gray-800 dark:text-gray-200 shrink-0">
          Paperist
        </Link>
        
        <div className="max-w-md w-full relative">
           <SearchBar />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={signOut}
          className="text-gray-800 dark:text-gray-200 hover:text-red-600 dark:hover:text-red-400 text-lg font-medium"
        >
          Logout
        </button>
        <Link href="/profile" className="text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 text-lg font-medium">
          Profile
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;