import {TextInput, View, TouchableOpacity, Text, Alert, ScrollView, KeyboardAvoidingView, Platform} from "react-native";
import {useAppContext} from "../AppContext";
import { useState, useEffect } from "react";
import { loginUser, setCookie, getRegistrationAllowed, verifyTOTPLogin } from "../main-axios";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { User, Lock, ArrowLeft, Shield, UserPlus } from "lucide-react-native";

type LoginDetails = {
    username: string
    password: string
    totpCode?: string
}

type AuthMode = 'login' | 'register' | 'totp'

export default function LoginForm() {
    const { setShowLoginForm, setAuthenticated, setShowServerManager, selectedServer } = useAppContext();
    const insets = useSafeAreaInsets();
    const [formData, setFormData] = useState<LoginDetails>({
        username: '',
        password: '',
        totpCode: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [authMode, setAuthMode] = useState<AuthMode>('login');
    const [tempToken, setTempToken] = useState<string>('');
    const [registrationAllowed, setRegistrationAllowed] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Load registration status
    useEffect(() => {
        const loadAuthConfig = async () => {
            try {
                const registration = await getRegistrationAllowed();
                console.log('Loaded registration status:', registration);
                setRegistrationAllowed(registration.allowed);
            } catch (error) {
                console.warn('Failed to load auth config:', error);
            }
        };
        loadAuthConfig();
    }, []);

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
            
            // Check if 2FA is required
            if (response.requires_totp && response.temp_token) {
                setTempToken(response.temp_token);
                setAuthMode('totp');
                setFormData(prev => ({ ...prev, password: '' }));
            } else if (response.token) {
                await setCookie('jwt', response.token);
                setAuthenticated(true);
                setFormData({ username: '', password: '', totpCode: '' });
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
    };

    const onTOTPSubmit = async () => {
        if (!formData.totpCode?.trim()) {
            Alert.alert('Error', 'Please enter your 2FA code');
            return;
        }

        setIsLoading(true);

        try {
            const response = await verifyTOTPLogin(tempToken, formData.totpCode.trim());
            
            if (response.token) {
                await setCookie('jwt', response.token);
                setAuthenticated(true);
                setFormData({ username: '', password: '', totpCode: '' });
                setShowLoginForm(false);
            } else {
                Alert.alert('2FA Failed', 'Invalid 2FA code. Please try again.');
            }
        } catch (error: any) {
            console.error('Error verifying 2FA:', error);
            const errorMessage = error?.message || 'Failed to verify 2FA code. Please try again.';
            Alert.alert('2FA Failed', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const onRegisterSubmit = async () => {
        if (!formData.username.trim() || !formData.password.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (formData.password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters long');
            return;
        }

        setIsLoading(true);

        try {
            // Import registerUser function
            const { registerUser } = await import('../main-axios');
            await registerUser(formData.username.trim(), formData.password.trim());
            
            // After successful registration, automatically log the user in
            console.log('Account created successfully, now logging in...');
            const loginResponse = await loginUser(formData.username.trim(), formData.password.trim());
            
            // Check if 2FA is required
            if (loginResponse.requires_totp && loginResponse.temp_token) {
                setTempToken(loginResponse.temp_token);
                setAuthMode('totp');
                setFormData(prev => ({ ...prev, password: '' }));
            } else if (loginResponse.token) {
                await setCookie('jwt', loginResponse.token);
                setAuthenticated(true);
                setFormData({ username: '', password: '', totpCode: '' });
                setShowLoginForm(false);
            } else {
                Alert.alert('Auto-Login Failed', 'Account created but automatic login failed. Please log in manually.');
                setAuthMode('login');
                setFormData({ username: '', password: '', totpCode: '' });
            }
        } catch (error: any) {
            console.error('Error during registration or auto-login:', error);
            const errorMessage = error?.message || 'Failed to create account. Please try again.';
            Alert.alert('Registration Failed', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };


    const handleBackToServerConfig = () => {
        setShowLoginForm(false);
        setShowServerManager(true);
    };

    const renderAuthForm = () => {
        switch (authMode) {
            case 'login':
    return (
                    <>
                    <View className="space-y-4">
                        <View>
                                <Text className="text-gray-300 text-sm font-medium mb-1">Username</Text>
                                <View className="relative">
                                    <TextInput
                                        className="bg-dark-bg-input rounded-xl text-white text-base border-2 border-dark-border"
                                        style={{
                                            height: 56,
                                            textAlignVertical: 'center',
                                            includeFontPadding: false,
                                            paddingTop: 0,
                                            paddingBottom: 0,
                                            paddingLeft: 48,
                                            paddingRight: 16,
                                        }}
                                        placeholder="Enter username..."
                                        placeholderTextColor="#9CA3AF"
                                        value={formData.username}
                                        onChangeText={(value) => handleInputChange('username', value)}
                                        autoCapitalize="none"
                                        autoComplete="username"
                                    />
                                    <View className="absolute left-4 top-1/2 -translate-y-1/2">
                                        <User size={20} color="#9CA3AF" />
                                    </View>
                                </View>
                        </View>

                            <View style={{ marginTop: 8 }}>
                                <Text className="text-gray-300 text-sm font-medium mb-1">Password</Text>
                                <View className="relative">
                                    <TextInput
                                        className="bg-dark-bg-input rounded-xl text-white text-base border-2 border-dark-border"
                                        style={{
                                            height: 56,
                                            textAlignVertical: 'center',
                                            includeFontPadding: false,
                                            paddingTop: 0,
                                            paddingBottom: 0,
                                            paddingLeft: 48,
                                            paddingRight: 48,
                                        }}
                                        placeholder="Enter password..."
                                        placeholderTextColor="#9CA3AF"
                                        value={formData.password}
                                        onChangeText={(value) => handleInputChange('password', value)}
                                        secureTextEntry={!showPassword}
                                        autoComplete="current-password"
                                    />
                                    <View className="absolute left-4 top-1/2 -translate-y-1/2">
                                        <Lock size={20} color="#9CA3AF" />
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2"
                                    >
                                        <Text className="text-gray-400 text-sm">
                                            {showPassword ? 'Hide' : 'Show'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                        </View>
                    </View>
                    
                    <TouchableOpacity 
                        onPress={onLoginSubmit}
                        disabled={isLoading}
                            className={`px-6 py-4 rounded-xl mt-6 ${
                                isLoading ? 'bg-gray-600' : 'bg-blue-600'
                            }`}
                    >
                        <Text className="text-white text-center font-semibold text-lg">
                            {isLoading ? 'Logging in...' : 'Login'}
                        </Text>
                    </TouchableOpacity>
                    </>
                );

            case 'register':
                return (
                    <>
                        <View className="space-y-4">
                            <View>
                                <Text className="text-gray-300 text-sm font-medium mb-1">Username</Text>
                                <View className="relative">
                                    <TextInput
                                        className="bg-dark-bg-input rounded-xl text-white text-base border-2 border-dark-border"
                                        style={{
                                            height: 56,
                                            textAlignVertical: 'center',
                                            includeFontPadding: false,
                                            paddingTop: 0,
                                            paddingBottom: 0,
                                            paddingLeft: 48,
                                            paddingRight: 16,
                                        }}
                                        placeholder="Choose a username..."
                                        placeholderTextColor="#9CA3AF"
                                        value={formData.username}
                                        onChangeText={(value) => handleInputChange('username', value)}
                                        autoCapitalize="none"
                                        autoComplete="username"
                                    />
                                    <View className="absolute left-4 top-1/2 -translate-y-1/2">
                                        <User size={20} color="#9CA3AF" />
                                    </View>
                                </View>
                            </View>

                            <View style={{ marginTop: 8 }}>
                                <Text className="text-gray-300 text-sm font-medium mb-1">Password</Text>
                                <View className="relative">
                                    <TextInput
                                        className="bg-dark-bg-input rounded-xl text-white text-base border-2 border-dark-border"
                                        style={{
                                            height: 56,
                                            textAlignVertical: 'center',
                                            includeFontPadding: false,
                                            paddingTop: 0,
                                            paddingBottom: 0,
                                            paddingLeft: 48,
                                            paddingRight: 48,
                                        }}
                                        placeholder="Choose a password..."
                                        placeholderTextColor="#9CA3AF"
                                        value={formData.password}
                                        onChangeText={(value) => handleInputChange('password', value)}
                                        secureTextEntry={!showPassword}
                                        autoComplete="new-password"
                                    />
                                    <View className="absolute left-4 top-1/2 -translate-y-1/2">
                                        <Lock size={20} color="#9CA3AF" />
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2"
                                    >
                                        <Text className="text-gray-400 text-sm">
                                            {showPassword ? 'Hide' : 'Show'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <Text className="text-gray-400 text-xs mt-1">
                                    Password must be at least 6 characters long
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity 
                            onPress={onRegisterSubmit}
                            disabled={isLoading}
                            className={`px-6 py-4 rounded-xl mt-6 ${
                                isLoading ? 'bg-gray-600' : 'bg-blue-600'
                            }`}
                        >
                            <Text className="text-white text-center font-semibold text-lg">
                                {isLoading ? 'Creating Account & Logging In...' : 'Create Account'}
                            </Text>
                        </TouchableOpacity>
                    </>
                );

            case 'totp':
                return (
                    <>
                        <View className="space-y-4">
                            <View className="items-center mb-4">
                                <View className="w-16 h-16 bg-blue-600 rounded-2xl items-center justify-center mb-4">
                                    <Shield size={32} color="#ffffff" />
                                </View>
                                <Text className="text-white text-lg font-semibold mb-2">Two-Factor Authentication</Text>
                                <Text className="text-gray-400 text-sm text-center">
                                    Enter the 6-digit code from your authenticator app
                                </Text>
                            </View>

                            <View>
                                <Text className="text-gray-300 text-sm font-medium mb-3">2FA Code</Text>
                                <TextInput
                                    className="bg-dark-bg-input rounded-xl text-white text-base border-2 border-dark-border text-center text-2xl tracking-widest"
                                    style={{
                                        height: 56,
                                        textAlignVertical: 'center',
                                        includeFontPadding: false,
                                        paddingTop: 0,
                                        paddingBottom: 0,
                                        paddingLeft: 16,
                                        paddingRight: 16,
                                    }}
                                    placeholder="000000"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.totpCode}
                                    onChangeText={(value) => handleInputChange('totpCode', value)}
                                    keyboardType="numeric"
                                    maxLength={6}
                                    autoComplete="one-time-code"
                                />
                            </View>
                        </View>

                        <TouchableOpacity 
                            onPress={onTOTPSubmit}
                            disabled={isLoading}
                            className={`px-6 py-4 rounded-xl mt-6 ${
                                isLoading ? 'bg-gray-600' : 'bg-blue-600'
                            }`}
                        >
                            <Text className="text-white text-center font-semibold text-lg">
                                {isLoading ? 'Verifying...' : 'Verify Code'}
                            </Text>
                        </TouchableOpacity>
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <KeyboardAvoidingView 
            className="flex-1 bg-dark-bg" 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView 
                className="flex-1"
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
            >
                <View className="flex-1 justify-center px-6" style={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }}>
                    {/* Header */}
                    <View className="items-center mb-8">
                        <View className="w-16 h-16 bg-dark-bg-button rounded-2xl items-center justify-center mb-4">
                            <User size={32} color="#ffffff" />
                        </View>
                        <Text className="text-white text-3xl font-bold mb-2">
                            {authMode === 'login' ? 'Welcome Back' : 
                             authMode === 'register' ? 'Create Account' : 
                             authMode === 'totp' ? '2FA Required' : 'Login'}
                        </Text>
                        {selectedServer && (
                            <Text className="text-gray-400 text-sm text-center">
                                {selectedServer.ip}
                            </Text>
                        )}
                    </View>

                    {/* Auth Form Card */}
                    <View className="bg-dark-bg-panel rounded-2xl p-6 border border-dark-border-panel">
                        {renderAuthForm()}
                    </View>

                    {/* Alternative Auth Methods */}
                    {authMode === 'login' && (
                        <View className="mt-6" style={{ gap: 12 }}>
                            {registrationAllowed && (
                                <TouchableOpacity
                                    onPress={() => setAuthMode('register')}
                                    className="flex-row items-center justify-center px-6 py-4 rounded-xl bg-dark-bg-button border border-dark-border"
                                >
                                    <UserPlus size={20} color="#ffffff" style={{ marginRight: 8 }} />
                                    <Text className="text-white font-semibold text-lg">
                                        Create Account
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {/* Back Button */}
                    <TouchableOpacity
                        onPress={authMode === 'login' ? handleBackToServerConfig : () => setAuthMode('login')}
                        className="flex-row items-center justify-center px-6 py-4 rounded-xl bg-dark-bg-button border border-dark-border mt-6"
                    >
                        <ArrowLeft size={20} color="#ffffff" style={{ marginRight: 8 }} />
                        <Text className="text-white font-semibold text-lg">
                            {authMode === 'login' ? 'Back to Server' : 'Back to Login'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}
