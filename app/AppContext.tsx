import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppContextType {
  showServerManager: boolean;
  setShowServerManager: (show: boolean) => void;
  showLoginForm: boolean;
  setShowLoginForm: (show: boolean) => void;
  selectedServer: any;
  setSelectedServer: (server: any) => void;
  refreshServers: number;
  triggerRefreshServers: () => void;
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
  const [showServerManager, setShowServerManager] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [selectedServer, setSelectedServer] = useState(null);
  const [refreshServers, setRefreshServers] = useState(0);

  const triggerRefreshServers = () => {
    setRefreshServers(prev => prev + 1);
  };

  return (
    <AppContext.Provider value={{ 
      showServerManager, 
      setShowServerManager,
      showLoginForm,
      setShowLoginForm,
      selectedServer,
      setSelectedServer,
      refreshServers,
      triggerRefreshServers
    }}>
      {children}
    </AppContext.Provider>
  );
};
