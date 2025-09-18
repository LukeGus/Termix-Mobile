import React, {createContext, useContext, useState, ReactNode, useEffect} from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeServerConfig, isAuthenticated as checkAuthStatus } from "./main-axios";

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

    useEffect(() => {
        const initializeApp = async () => {
            try {
                console.log('Initializing app...');
                setIsLoading(true);
                
                // Initialize server configuration
                console.log('Initializing server config...');
                await initializeServerConfig();
                
                // Check if server is configured
                console.log('Checking for server configuration...');
                const serverConfig = await AsyncStorage.getItem('serverConfig');
                const legacyServer = await AsyncStorage.getItem('server');
                
                console.log('Server config found:', !!serverConfig);
                console.log('Legacy server found:', !!legacyServer);
                
                if (serverConfig || legacyServer) {
                    // Server is configured, check authentication
                    console.log('Server configured, checking authentication...');
                    const authStatus = await checkAuthStatus();
                    console.log('Authentication status:', authStatus);
                    
                    if (authStatus) {
                        // User is authenticated, go to main app
                        console.log('User authenticated, showing main app');
                        setAuthenticated(true);
                        setShowServerManager(false);
                        setShowLoginForm(false);
                        
                        // Load server info for display
                        if (legacyServer) {
                            const server = JSON.parse(legacyServer);
                            setSelectedServer(server);
                        }
                    } else {
                        // User not authenticated, show login
                        console.log('User not authenticated, showing login');
                        setAuthenticated(false);
                        setShowServerManager(false);
                        setShowLoginForm(true);
                        
                        // Load server info for display
                        if (legacyServer) {
                            const server = JSON.parse(legacyServer);
                            setSelectedServer(server);
                        }
                    }
                } else {
                    // No server configured, show server manager
                    console.log('No server configured, showing server manager');
                    setAuthenticated(false);
                    setShowServerManager(true);
                    setShowLoginForm(false);
                }
            } catch (error) {
                console.error('Error initializing app:', error);
                // If error, show server manager
                setAuthenticated(false);
                setShowServerManager(true);
                setShowLoginForm(false);
            } finally {
                console.log('App initialization complete');
                setIsLoading(false);
            }
        };

        initializeApp();
    }, []);


    // Debug logging for state changes
    console.log('AppContext state:', {
        showServerManager,
        showLoginForm,
        isAuthenticated,
        isLoading,
        selectedServer: selectedServer?.name || 'none'
    });

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
            isLoading,
            setIsLoading
        }}>
            {children}
        </AppContext.Provider>
    );
};
