'use client';
import React from 'react';
import Navigation from './Navigation';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100">
      <Navigation />
      <main className="pb-20 md:pb-0">
        {children}
      </main>
    </div>
  );
};

export default Layout;