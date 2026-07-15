import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const Shell: React.FC = () => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-screen overflow-hidden bg-transparent">
      <Sidebar className="hidden md:flex" />

      {isMobileNavOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setIsMobileNavOpen(false)}
          />
          <Sidebar mobile onClose={() => setIsMobileNavOpen(false)} className="md:hidden" />
        </>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onOpenSidebar={() => setIsMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto min-w-0 space-y-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
