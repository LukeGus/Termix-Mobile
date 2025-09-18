import {TextInput, View, TouchableOpacity, Text, Alert} from "react-native";
import {useAppContext} from "./AppContext";
import { useState } from "react";

type LoginDetails = {
    username: string
    password: string
}

export default function LoginForm() {
    const { setShowLoginForm, selectedServer } = useAppContext();
    const [formData, setFormData] = useState<LoginDetails>({
        username: '',
        password: ''
    });

    const handleInputChange = (field: keyof LoginDetails, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const onLoginSubmit = async () => {
        if (!formData.username.trim() || !formData.password.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            console.log('Login attempt:', {
                server: selectedServer,
                username: formData.username,
                password: formData.password
            });
            
            // Reset form and close - this will take user to main app (sessions)
            setFormData({ username: '', password: '' });
            setShowLoginForm(false);
        } catch (error) {
            console.error('Error connecting:', error);
            Alert.alert('Error', 'Failed to connect. Please try again.');
        }
    }

    const handleClose = () => {
        setShowLoginForm(false);
    };

    return (
        <View className="flex-1 bg-dark-bg">
            <View className="flex-1 justify-center px-6">
                <View className="bg-dark-bg-panel rounded-lg p-6 border border-dark-border-panel">
                    <Text className="text-white text-lg font-semibold mb-4">Login Details</Text>

                    <View className="space-y-4">
                        <View>
                            <Text className="text-gray-300 text-sm mb-2">Username</Text>
                            <TextInput
                                className="bg-dark-bg-input p-4 rounded-lg text-white text-base border border-dark-border"
                                placeholder="Enter username..."
                                placeholderTextColor="#9CA3AF"
                                value={formData.username}
                                onChangeText={(value) => handleInputChange('username', value)}
                                autoCapitalize="none"
                            />
                        </View>

                        <View>
                            <Text className="text-gray-300 text-sm mb-2">Password</Text>
                            <TextInput
                                className="bg-dark-bg-input p-4 rounded-lg text-white text-base border border-dark-border"
                                placeholder="Enter password..."
                                placeholderTextColor="#9CA3AF"
                                value={formData.password}
                                onChangeText={(value) => handleInputChange('password', value)}
                                secureTextEntry
                            />
                        </View>
                    </View>
                    
                    <TouchableOpacity 
                        onPress={onLoginSubmit}
                        className="bg-blue-600 px-6 py-4 rounded-lg mt-6"
                    >
                        <Text className="text-white text-center font-semibold text-lg">Connect</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
}
