import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getVersionInfo,
  initializeServerConfig,
  isAuthenticated as checkAuthStatus,
  getLatestGitHubRelease,
} from "./main-axios";
import Constants from "expo-constants";

interface Server {
  name: string;
  ip: string;
}

interface AppContextType {
  showServerManager: boolean;
  setShowServerManager: (show: boolean) => void;
  showLoginForm: boolean;
  setShowLoginForm: (show: boolean) => void;
  selectedServer: Server | null;
  setSelectedServer: (server: Server | null) => void;
  isAuthenticated: boolean;
  setAuthenticated: (auth: boolean) => void;
  showUpdateScreen: boolean;
  setShowUpdateScreen: (show: boolean) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [showServerManager, setShowServerManager] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [showUpdateScreen, setShowUpdateScreen] = useState<boolean>(false);

  const checkShouldShowUpdateScreen = async (): Promise<boolean> => {
    try {
      const currentAppVersion = Constants.expoConfig?.version || "1.0.0";

      const latestRelease = await getLatestGitHubRelease();

      if (!latestRelease) {
        return false;
      }

      if (currentAppVersion === latestRelease.version) {
        return false;
      }

      const dismissedVersion = await AsyncStorage.getItem(
        "dismissedUpdateVersion",
      );

      if (dismissedVersion === latestRelease.version) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true);

        await initializeServerConfig();

        const serverConfig = await AsyncStorage.getItem("serverConfig");
        const legacyServer = await AsyncStorage.getItem("server");

        const version = await getVersionInfo();

        const shouldShowUpdateScreen = await checkShouldShowUpdateScreen();
        setShowUpdateScreen(shouldShowUpdateScreen);

        if (serverConfig || legacyServer) {
          const authStatus = await checkAuthStatus();

          let serverInfo = null;
          if (legacyServer) {
            serverInfo = JSON.parse(legacyServer);
          } else if (serverConfig) {
            const config = JSON.parse(serverConfig);
            serverInfo = {
              name: "Server",
              ip: config.serverUrl,
            };
          }

          if (authStatus) {
            setAuthenticated(true);
            setShowServerManager(false);
            setShowLoginForm(false);
            setSelectedServer(serverInfo);
          } else {
            setAuthenticated(false);
            setShowServerManager(false);
            setShowLoginForm(true);
            setSelectedServer(serverInfo);
          }
        } else {
          setAuthenticated(false);
          setShowServerManager(true);
          setShowLoginForm(false);
        }
      } catch (error) {
        setAuthenticated(false);
        setShowServerManager(true);
        setShowLoginForm(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  return (
    <AppContext.Provider
      value={{
        showServerManager,
        setShowServerManager,
        showLoginForm,
        setShowLoginForm,
        selectedServer,
        setSelectedServer,
        isAuthenticated,
        setAuthenticated,
        showUpdateScreen,
        setShowUpdateScreen,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
