// src/components/layout/MainLayout.tsx
import React from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="app">
      <header>
        <h1>Maxi'Learning</h1>
      </header>
      <main>{children}</main>
      <footer>© Maxi'Learning</footer>
    </div>
  );
};

export default MainLayout;
