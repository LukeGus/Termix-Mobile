import React, {createContext, useContext, useState, ReactNode, useEffect} from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";
import {getVersionInfo, initializeServerConfig, isAuthenticated as checkAuthStatus} from "./main-axios";
import Constants from 'expo-constants';

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
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};

interface AppProviderProps {
    children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({children}) => {
    const [showServerManager, setShowServerManager] = useState(false);
    const [showLoginForm, setShowLoginForm] = useState(false);
    const [selectedServer, setSelectedServer] = useState<Server | null>(null);
    const [isAuthenticated, setAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const currentMobileAppVersion = "1.5.0";
    const [showUpdateScreen, setShowUpdateScreen] = useState<boolean>(false);

    const checkShouldShowUpdateScreen = async (serverVersion: string): Promise<boolean> => {
        try {
            // If mobile app version matches server version, don't show update screen
            if (currentMobileAppVersion === serverVersion) {
                return false;
            }

            // Check if user has dismissed this version before
            const dismissedVersion = await AsyncStorage.getItem('dismissedUpdateVersion');
            
            // If user has dismissed this specific server version, don't show again
            if (dismissedVersion === serverVersion) {
                return false;
            }

            // Show update screen for version mismatch that hasn't been dismissed
            return true;
        } catch (error) {
            console.error('Error checking update screen status:', error);
            // Default to showing update screen if there's an error
            return true;
        }
    };

    useEffect(() => {
        const initializeApp = async () => {
            try {
                setIsLoading(true);

                await initializeServerConfig();

                const serverConfig = await AsyncStorage.getItem('serverConfig');
                const legacyServer = await AsyncStorage.getItem('server');

                const version = await getVersionInfo();

                // Check if update screen should be shown
                const shouldShowUpdateScreen = await checkShouldShowUpdateScreen(version.localVersion);
                setShowUpdateScreen(shouldShowUpdateScreen);
                
                if (serverConfig || legacyServer) {
                    const authStatus = await checkAuthStatus();

                    let serverInfo = null;
                    if (legacyServer) {
                        serverInfo = JSON.parse(legacyServer);
                    } else if (serverConfig) {
                        const config = JSON.parse(serverConfig);
                        serverInfo = {
                            name: 'Server',
                            ip: config.serverUrl
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
        <AppContext.Provider value={{
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
            setIsLoading
        }}>
            {children}
        </AppContext.Provider>
    );
};
