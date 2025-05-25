import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../shared/layout/Sidebar';

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen bg-gray-50">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#375788]" />
  </div>
);

export const MainLayout: React.FC = () => {
  console.log('MainLayout component mounted');

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-grow ml-[280px] min-h-screen bg-gray-50">
        <Suspense fallback={<LoadingFallback />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}; 