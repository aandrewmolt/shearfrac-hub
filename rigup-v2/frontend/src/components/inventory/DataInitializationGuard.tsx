
import React from 'react';

interface DataInitializationGuardProps {
  children: React.ReactNode;
}

const DataInitializationGuard: React.FC<DataInitializationGuardProps> = ({ children }) => {
  // Skip all initialization - only show what's actually in the database
  return <>{children}</>;
};

export default DataInitializationGuard;
