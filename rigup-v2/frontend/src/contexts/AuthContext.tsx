import React, { createContext, useContext, useState } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Always use a default user - no auth needed
  const defaultUser: User = {
    id: 'local-user',
    email: 'user@rigup.com',
    name: 'RigUp User'
  };

  const [user] = useState<User>(defaultUser);
  const [loading] = useState(false);

  const signOut = async () => {
    // No-op since we don't have auth
    console.log('Sign out called - no auth enabled');
  };

  const value = {
    user,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};