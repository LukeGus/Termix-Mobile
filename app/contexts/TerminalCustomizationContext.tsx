import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "terminalCustomization";

export interface TerminalCustomization {
  fontSize: number; // Base font size (will be adjusted based on screen width)
}

const getDefaultConfig = (): TerminalCustomization => {
  return {
    fontSize: 16, // Default base font size
  };
};

interface TerminalCustomizationContextType {
  config: TerminalCustomization;
  isLoading: boolean;
  updateFontSize: (fontSize: number) => Promise<void>;
  resetToDefault: () => Promise<void>;
}

const TerminalCustomizationContext = createContext<
  TerminalCustomizationContextType | undefined
>(undefined);

export const TerminalCustomizationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [config, setConfig] = useState<TerminalCustomization>(getDefaultConfig());
  const [isLoading, setIsLoading] = useState(true);

  // Load configuration from AsyncStorage on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as TerminalCustomization;
          setConfig(parsed);
        }
      } catch (error) {
        console.error("Failed to load terminal configuration:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  // Save configuration to AsyncStorage
  const saveConfig = useCallback(async (newConfig: TerminalCustomization) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
      setConfig(newConfig);
    } catch (error) {
      console.error("Failed to save terminal configuration:", error);
    }
  }, []);

  // Update font size
  const updateFontSize = useCallback(
    async (fontSize: number) => {
      const newConfig = {
        ...config,
        fontSize,
      };
      await saveConfig(newConfig);
    },
    [config, saveConfig]
  );

  // Reset to default
  const resetToDefault = useCallback(async () => {
    await saveConfig(getDefaultConfig());
  }, [saveConfig]);

  const value: TerminalCustomizationContextType = {
    config,
    isLoading,
    updateFontSize,
    resetToDefault,
  };

  return (
    <TerminalCustomizationContext.Provider value={value}>
      {children}
    </TerminalCustomizationContext.Provider>
  );
};

export const useTerminalCustomization = () => {
  const context = useContext(TerminalCustomizationContext);
  if (!context) {
    throw new Error(
      "useTerminalCustomization must be used within a TerminalCustomizationProvider"
    );
  }
  return context;
};