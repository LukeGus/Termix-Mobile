import {TextInput, View, TouchableOpacity, Text, Alert} from "react-native";
import {useAppContext} from "./AppContext";
import { useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';

type ServerDetails = {
    name: string
    ip: string
}

export default function ServerForm() {
    const { setShowServerManager, setShowLoginForm, setSelectedServer, triggerRefreshServers } = useAppContext();
    const [formData, setFormData] = useState<ServerDetails>({
        name: '',
        ip: ''
    });

    const handleInputChange = (field: keyof ServerDetails, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const onServerDetailsSubmit = async () => {
        if (!formData.name.trim() || !formData.ip.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            // Save server to storage
            const existingServers = await AsyncStorage.getItem('servers');
            const servers = existingServers ? JSON.parse(existingServers) : [];

            const newServer = {
                name: formData.name.trim(),
                ip: formData.ip.trim()
            };

            const updatedServers = [...servers, newServer];
            await AsyncStorage.setItem('servers', JSON.stringify(updatedServers));
            
            console.log('Server saved:', newServer);

            // Trigger refresh of servers list
            triggerRefreshServers();

            // Set the selected server and go to login form
            setSelectedServer(newServer);
            setShowServerManager(false);
            setShowLoginForm(true);
        } catch (error) {
            console.error('Error saving server:', error);
            Alert.alert('Error', 'Failed to save server. Please try again.');
        }
    }

    return (
        <View className="flex-1 bg-dark-bg">
            <View className="flex-1 justify-center px-6">
                <View className="bg-dark-bg-panel rounded-lg p-6 border border-dark-border-panel">
                    <Text className="text-white text-lg font-semibold mb-4">Server Details</Text>

                    <View className="space-y-4">
                        <View>
                            <Text className="text-gray-300 text-sm mb-2">Server Name</Text>
                            <TextInput
                                className="bg-dark-bg-input p-4 rounded-lg text-white text-base border border-dark-border"
                                placeholder="Enter server name..."
                                placeholderTextColor="#9CA3AF"
                                value={formData.name}
                                onChangeText={(value) => handleInputChange('name', value)}
                            />
                        </View>

                        <View>
                            <Text className="text-gray-300 text-sm mb-2">Host Address</Text>
                            <TextInput
                                className="bg-dark-bg-input p-4 rounded-lg text-white text-base border border-dark-border"
                                placeholder="192.168.1.1:8080"
                                placeholderTextColor="#9CA3AF"
                                value={formData.ip}
                                onChangeText={(value) => handleInputChange('ip', value)}
                            />
                        </View>
                    </View>
                    
                    <TouchableOpacity 
                        onPress={onServerDetailsSubmit}
                        className="bg-dark-bg-button px-6 py-4 rounded-lg mt-6"
                    >
                        <Text className="text-white text-center font-semibold text-lg">Use Server</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
}