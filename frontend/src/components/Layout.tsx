import React from 'react';
import Navbar from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="screen flex min-h-screen flex-col">
      <Navbar />
      {/* Single centred column — matches the mobile app in Part 3. */}
      <main className="shell flex-1 pb-16">{children}</main>
    </div>
  );
};

export default Layout;
