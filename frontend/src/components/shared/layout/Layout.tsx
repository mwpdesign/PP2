import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import SystemHeader from './SystemHeader';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      <div className="pl-[280px]">
        <SystemHeader />
        <main className="min-h-screen p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout; 