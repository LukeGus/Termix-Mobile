import {TextInput, View, TouchableOpacity, Text, Alert} from "react-native";
import {useAppContext} from "./AppContext";
import { useState, useEffect } from "react";
import { saveServerConfig, testServerConnection, getCurrentServerUrl } from "./main-axios";

type ServerDetails = {
    ip: string
}

export default function ServerForm() {
    const { setShowServerManager, setShowLoginForm, setSelectedServer, selectedServer } = useAppContext();
    const [formData, setFormData] = useState<ServerDetails>({
        ip: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    // Prefill form with existing server config
    useEffect(() => {
        const loadExistingConfig = async () => {
            try {
                const currentUrl = getCurrentServerUrl();
                if (currentUrl) {
                    // Extract IP/port from URL for display
                    const url = new URL(currentUrl);
                    const displayUrl = url.port ? `${url.hostname}:${url.port}` : url.hostname;
                    setFormData({ ip: displayUrl });
                } else if (selectedServer?.ip) {
                    // Use selected server IP if available
                    setFormData({ ip: selectedServer.ip });
                }
            } catch (error) {
                console.error('Error loading existing config:', error);
            }
        };

        loadExistingConfig();
    }, [selectedServer]);

    const handleInputChange = (field: keyof ServerDetails, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const normalizeServerUrl = (input: string): string => {
        let url = input.trim();
        
        // Remove trailing slash if present
        url = url.replace(/\/$/, '');
        
        // Add protocol if not present
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = `http://${url}`;
        }
        
        return url;
    };

    const onServerDetailsSubmit = async () => {
        if (!formData.ip.trim()) {
            Alert.alert('Error', 'Please enter a server address');
            return;
        }

        setIsLoading(true);

        try {
            console.log('Starting server configuration...');
            
            // Normalize server URL
            const serverUrl = normalizeServerUrl(formData.ip);
            console.log('Normalized server URL:', serverUrl);
            
            // Test server connection first
            console.log('Testing server connection...');
            const connectionTest = await testServerConnection(serverUrl);
            console.log('Connection test result:', connectionTest);
            
            if (!connectionTest.success) {
                Alert.alert('Connection Failed', `Could not connect to the server at ${serverUrl}. Please check the address and try again.`);
                return;
            }

            // Save server configuration
            console.log('Saving server configuration...');
            const serverConfig = {
                serverUrl,
                lastUpdated: new Date().toISOString()
            };

            const success = await saveServerConfig(serverConfig);
            console.log('Save result:', success);
            
            if (!success) {
                Alert.alert('Error', 'Failed to save server configuration. Please try again.');
                return;
            }

            // Update context with server info for display
            const serverInfo = {
                name: 'Server', // Default name since we removed the name field
                ip: formData.ip.trim()
            };

            console.log('Updating context and navigating to login...');
            setSelectedServer(serverInfo);
            setShowServerManager(false);
            setShowLoginForm(true);
        } catch (error: any) {
            console.error('Error saving server:', error);
            Alert.alert('Error', `Failed to save server: ${error?.message || 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <View className="flex-1 bg-dark-bg">
            <View className="flex-1 justify-center px-6">
                <View className="">
                    <Text className="text-white text-4xl font-bold text-center mb-[50px]">Termix</Text>
                    <Text className="text-white text-lg font-semibold mb-4">Server Configuration</Text>

                    <View className="space-y-4">
                        <View>
                            <Text className="text-gray-300 text-sm mb-2">Server Address</Text>
                            <TextInput
                                className="bg-dark-bg-input p-4 rounded-lg text-white text-base border border-dark-border"
                                placeholder="192.168.1.1:8080 or https://server.com"
                                placeholderTextColor="#9CA3AF"
                                value={formData.ip}
                                onChangeText={(value) => handleInputChange('ip', value)}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            <Text className="text-gray-400 text-xs mt-1">
                                Examples: 192.168.1.100:8080, server.com:8080, https://termix.example.com
                            </Text>
                        </View>
                    </View>
                    
                    <TouchableOpacity 
                        onPress={onServerDetailsSubmit}
                        disabled={isLoading}
                        className={`px-6 py-4 rounded-lg mt-6 ${isLoading ? 'bg-gray-600' : 'bg-dark-bg-button'}`}
                    >
                        <Text className="text-white text-center font-semibold text-lg">
                            {isLoading ? 'Connecting...' : 'Use Server'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
}