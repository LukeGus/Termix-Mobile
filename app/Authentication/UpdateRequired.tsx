import {View, Text, TouchableOpacity, Alert, ActivityIndicator} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, AlertTriangle, Download } from 'lucide-react-native';
import { useAppContext } from '../AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getVersionInfo } from '../main-axios';
import { useState, useEffect } from 'react';

export default function UpdateRequired() {
    const insets = useSafeAreaInsets();
    const {  setShowUpdateScreen } = useAppContext();
    const [versionInfo, setVersionInfo] = useState<{localVersion: string, serverVersion: string} | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const currentMobileAppVersion = "1.5.0";

    useEffect(() => {
        const fetchVersionInfo = async () => {
            try {
                const version = await getVersionInfo();
                setVersionInfo(version);
            } catch (error) {
                console.error('Failed to fetch version info:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchVersionInfo();
    }, []);

    const handleDismiss = async () => {
        try {
            await AsyncStorage.setItem('dismissedUpdateVersion', versionInfo?.localVersion || 'unknown');
            setShowUpdateScreen(false);
        } catch (error) {
            setShowUpdateScreen(false);
        }
    };

    if (isLoading) {
        return (
            <View className="flex-1 bg-dark-bg justify-center items-center" style={{ paddingTop: insets.top }}>
                <ActivityIndicator size="large" color="#ffffff" />
                <Text className="text-white text-lg">Loading version information...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-dark-bg" style={{ paddingTop: insets.top }}>
            {/* Header with close button */}
            <View className="flex-row justify-between items-center px-6 py-4 border-b border-dark-border">
                <View className="flex-row items-center gap-3">
                    <AlertTriangle size={24} color="#f59e0b" />
                    <Text className="text-white text-xl font-bold">Update Required</Text>
                </View>
            </View>

            {/* Main content */}
            <View className="flex-1 px-6 py-8">
                <View className="bg-dark-bg-button rounded-lg p-6 border border-dark-border mb-6">
                    <View className="flex-row items-center gap-3 mb-4">
                        <Download size={24} color="#3b82f6" />
                        <Text className="text-white text-lg font-semibold">Version Mismatch Detected</Text>
                    </View>
                    
                    <Text className="text-gray-300 text-base leading-6 mb-6">
                        Your mobile app version does not match with the server version.
                        Some features may not work properly until you update your mobile app or Termix server.
                    </Text>

                    {/* Version information */}
                    <View className="bg-dark-bg rounded-md p-4 border border-dark-border">
                        <Text className="text-white font-semibold mb-3">Version Information:</Text>
                        
                        <View className="space-y-2">
                            <View className="flex-row justify-between">
                                <Text className="text-gray-300">Current Mobile App:</Text>
                                <Text className="text-white font-mono">
                                    {currentMobileAppVersion}
                                </Text>
                            </View>
                            
                            <View className="flex-row justify-between">
                                <Text className="text-gray-300">Server Version:</Text>
                                <Text className="text-red-400 font-mono">
                                    {versionInfo?.localVersion || 'Unknown'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Additional information */}
                <View className="bg-dark-bg-button rounded-lg p-6 border border-dark-border">
                    <Text className="text-gray-300 text-base leading-6 mb-4">
                        <Text className="text-yellow-400 font-semibold">Note:</Text> The server or mobile app may have been updated
                        with changes that don't affect mobile. If you're experiencing issues,
                        please update your mobile app or Termix server to the latest version.
                    </Text>
                </View>
            </View>

            {/* Bottom action */}
            <View className="px-6 pb-6" style={{ paddingBottom: insets.bottom + 24 }}>
                <TouchableOpacity
                    onPress={handleDismiss}
                    className="bg-dark-bg-button border-2 border-dark-border rounded-lg py-4 px-6"
                    activeOpacity={0.7}
                >
                    <Text className="text-white text-center font-semibold text-lg">
                        Continue Anyway
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}