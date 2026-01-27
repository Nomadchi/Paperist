// src/components/Navbar.tsx
'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  // 1. 如果用户没登录（显示 LoginForm 时），或者正在加载，不显示导航栏
  if (!user) return null;

  return (
    <nav className="w-full bg-gray-100 dark:bg-gray-900 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between z-50 shadow-sm h-16">
      <Link href="/" className="text-2xl font-bold text-gray-800 dark:text-gray-200">
        Paperist
      </Link>
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