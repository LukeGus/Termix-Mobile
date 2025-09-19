import {TextInput, View, TouchableOpacity, Text, Alert} from "react-native";
import {useAppContext} from "../AppContext";
import { useState } from "react";
import { loginUser, setCookie } from "../main-axios";

type LoginDetails = {
    username: string
    password: string
}

export default function LoginForm() {
    const { setShowLoginForm, setAuthenticated, setShowServerManager, selectedServer } = useAppContext();
    const [formData, setFormData] = useState<LoginDetails>({
        username: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);

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

        setIsLoading(true);

        try {
            const response = await loginUser(formData.username.trim(), formData.password.trim());
            
            if (response.token) {
                await setCookie('jwt', response.token);
                
                setAuthenticated(true);
                setFormData({ username: '', password: '' });
                setShowLoginForm(false);
            } else {
                Alert.alert('Login Failed', 'Invalid response from server. Please try again.');
            }
        } catch (error: any) {
            console.error('Error connecting:', error);
            const errorMessage = error?.message || 'Failed to connect. Please try again.';
            Alert.alert('Login Failed', errorMessage);
        } finally {
            setIsLoading(false);
        }
    }

    const handleBackToServerConfig = () => {
        setShowLoginForm(false);
        setShowServerManager(true);
    };

    return (
        <View className="flex-1 bg-dark-bg">
            <View className="flex-1 justify-center px-6">
                <View className="">
                    <View className="flex-row items-center justify-between mb-4">
                        <View className="flex-1 items-center">
                            <Text className="text-white text-lg font-semibold mb-2">Login Details</Text>
                            {selectedServer && (
                                <Text className="text-gray-400 text-sm mt-1">
                                    {selectedServer.ip}
                                </Text>
                            )}
                        </View>
                    </View>

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
                        disabled={isLoading}
                        className={`px-6 py-4 rounded-lg mt-6 ${isLoading ? 'bg-gray-600' : 'bg-dark-bg-button'}`}
                    >
                        <Text className="text-white text-center font-semibold text-lg">
                            {isLoading ? 'Logging in...' : 'Login'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleBackToServerConfig}
                        className={`px-6 py-4 rounded-lg mt-6 bg-dark-bg-button`}
                    >
                        <Text className="text-white text-center font-semibold text-lg">
                            Back
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
}
