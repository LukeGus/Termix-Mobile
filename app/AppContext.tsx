import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppContextType {
  showServerManager: boolean;
  setShowServerManager: (show: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [showServerManager, setShowServerManager] = useState(true);

  return (
    <AppContext.Provider value={{ showServerManager, setShowServerManager }}>
      {children}
    </AppContext.Provider>
  );
};
