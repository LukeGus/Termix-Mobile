import {TextInput, View, TouchableOpacity, Text, Alert, ScrollView, KeyboardAvoidingView, Platform} from "react-native";
import {useAppContext} from "../AppContext";
import { useState, useEffect } from "react";
import { loginUser, setCookie, getOIDCConfig, getRegistrationAllowed, verifyTOTPLogin } from "../main-axios";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { User, Lock, ArrowLeft, Shield, UserPlus, ExternalLink } from "lucide-react-native";
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

type LoginDetails = {
    username: string
    password: string
    totpCode?: string
}

type AuthMode = 'login' | 'register' | 'totp' | 'oidc'

export default function LoginForm() {
    const { setShowLoginForm, setAuthenticated, setShowServerManager, selectedServer } = useAppContext();
    const insets = useSafeAreaInsets();
    const [formData, setFormData] = useState<LoginDetails>({
        username: '',
        password: '',
        totpCode: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isOIDCLoading, setIsOIDCLoading] = useState(false);
    const [authMode, setAuthMode] = useState<AuthMode>('login');
    const [tempToken, setTempToken] = useState<string>('');
    const [oidcConfig, setOidcConfig] = useState<any>(null);
    const [registrationAllowed, setRegistrationAllowed] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Load OIDC config and registration status
    useEffect(() => {
        const loadAuthConfig = async () => {
            try {
                const [oidc, registration] = await Promise.all([
                    getOIDCConfig(),
                    getRegistrationAllowed()
                ]);
                console.log('Loaded OIDC config:', oidc);
                console.log('Loaded registration status:', registration);
                
                // Set OIDC as configured if we get a response (like your web version)
                if (oidc) {
                    setOidcConfig(true); // Just set to true like your web version
                } else {
                    setOidcConfig(false);
                }
                setRegistrationAllowed(registration.allowed);
            } catch (error) {
                console.warn('Failed to load auth config:', error);
                setOidcConfig(false);
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

    /**
     * Handles OIDC login flow:
     * 1. Opens the OIDC provider's authorization URL in the device browser
     * 2. User authenticates with the OIDC provider
     * 3. OIDC provider redirects back to our app with an authorization code
     * 4. We exchange the authorization code for a JWT token via our server
     * 5. User is logged in with the JWT token
     */
    const handleOIDCLogin = async () => {
        console.log('OIDC Config:', oidcConfig);
        
        if (!oidcConfig) {
            Alert.alert('OIDC Not Available', 'OIDC configuration not loaded from server.');
            return;
        }

        setIsOIDCLoading(true);

        try {
            // Use the same approach as your web version - get the auth URL from server
            const { getOIDCAuthorizeUrl } = await import('../main-axios');
            const authResponse = await getOIDCAuthorizeUrl();
            const { auth_url: authUrl } = authResponse;

            if (!authUrl || authUrl === "undefined") {
                throw new Error('Invalid authorization URL received from server');
            }

            console.log('Starting OIDC flow with URL:', authUrl);

            // Try different redirect URI formats
            const redirectUri1 = AuthSession.makeRedirectUri(); // Default format
            const redirectUri2 = AuthSession.makeRedirectUri({ scheme: 'termix-mobile' }); // Custom scheme
            const redirectUri3 = AuthSession.makeRedirectUri({ scheme: 'exp' }); // Expo scheme
            
            console.log('OIDC Redirect URI (default):', redirectUri1);
            console.log('OIDC Redirect URI (termix-mobile):', redirectUri2);
            console.log('OIDC Redirect URI (exp):', redirectUri3);
            console.log('Try adding one of these to your OIDC provider:');
            console.log('1. Default:', redirectUri1);
            console.log('2. Custom:', redirectUri2);
            console.log('3. Expo:', redirectUri3);
            
            // Use the default format first
            const redirectUri = redirectUri1;

            // Open the browser for OAuth
            const result = await WebBrowser.openAuthSessionAsync(
                authUrl,
                redirectUri,
                {
                    showInRecents: true,
                    preferEphemeralSession: false
                }
            );

            console.log('OIDC result:', result);

            if (result.type === 'success' && result.url) {
                // Parse the authorization code from the URL manually
                const urlParts = result.url.split('?');
                const queryString = urlParts[1] || '';
                const codeMatch = queryString.match(/[?&]code=([^&]+)/);
                const code = codeMatch ? decodeURIComponent(codeMatch[1]) : null;
                
                if (code) {
                    // Exchange the authorization code for tokens
                    await handleOIDCCallback(code, redirectUri);
                } else {
                    Alert.alert('OIDC Login Failed', 'No authorization code received');
                }
            } else if (result.type === 'cancel') {
                console.log('OIDC cancelled by user');
            } else {
                console.error('OIDC error:', result);
                
                // Show error with redirect URI options
                console.log('OIDC failed, showing redirect URI options...');
                Alert.alert(
                    'Redirect URI Error', 
                    `The redirect URI "${redirectUri}" is not configured in your OIDC provider.\n\nPlease add one of these URIs to your OIDC provider:\n\n1. ${redirectUri1}\n2. ${redirectUri2}\n3. ${redirectUri3}\n\nThen try again.`,
                    [
                        { text: 'OK', style: 'default' }
                    ]
                );
            }
        } catch (error: any) {
            console.error('OIDC login error:', error);
            Alert.alert('OIDC Login Failed', error?.message || 'Failed to start OIDC login');
        } finally {
            setIsOIDCLoading(false);
        }
    };

    const handleOIDCCallback = async (code: string, redirectUri: string) => {
        try {
            console.log('Handling OIDC callback with code:', code);
            
            // Call the server's OIDC callback endpoint
            const { authApi } = await import('../main-axios');
            const response = await authApi.post('/users/oidc/callback', {
                code,
                redirect_uri: redirectUri
            });

            console.log('OIDC callback response:', response.data);

            if (response.data.token) {
                await setCookie('jwt', response.data.token);
                setAuthenticated(true);
                setFormData({ username: '', password: '', totpCode: '' });
                setShowLoginForm(false);
            } else {
                Alert.alert('OIDC Login Failed', 'No token received from server');
            }
        } catch (error: any) {
            console.error('OIDC callback error:', error);
            Alert.alert('OIDC Login Failed', error?.message || 'Failed to complete OIDC login');
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
                                        className="bg-dark-bg-input pl-12 pr-4 rounded-xl text-white text-base border-2 border-dark-border"
                                        style={{
                                            height: 56,
                                            textAlignVertical: 'center',
                                            includeFontPadding: false,
                                            paddingVertical: 16,
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
                                        className="bg-dark-bg-input pl-12 pr-12 rounded-xl text-white text-base border-2 border-dark-border"
                                        style={{
                                            height: 56,
                                            textAlignVertical: 'center',
                                            includeFontPadding: false,
                                            paddingVertical: 16,
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
                                        className="bg-dark-bg-input pl-12 pr-4 rounded-xl text-white text-base border-2 border-dark-border"
                                        style={{
                                            height: 56,
                                            textAlignVertical: 'center',
                                            includeFontPadding: false,
                                            paddingVertical: 16,
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
                                        className="bg-dark-bg-input pl-12 pr-12 rounded-xl text-white text-base border-2 border-dark-border"
                                        style={{
                                            height: 56,
                                            textAlignVertical: 'center',
                                            includeFontPadding: false,
                                            paddingVertical: 16,
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
                                        paddingVertical: 16,
                                        paddingHorizontal: 16,
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
                            {oidcConfig === true && (
                                <TouchableOpacity
                                    onPress={handleOIDCLogin}
                                    disabled={isOIDCLoading}
                                    className={`flex-row items-center justify-center px-6 py-4 rounded-xl border border-dark-border ${
                                        isOIDCLoading ? 'bg-gray-600' : 'bg-dark-bg-button'
                                    }`}
                                >
                                    <ExternalLink size={20} color="#ffffff" style={{ marginRight: 8 }} />
                                    <Text className="text-white font-semibold text-lg">
                                        {isOIDCLoading ? 'Opening Browser...' : 'Login with OIDC'}
                                    </Text>
                                </TouchableOpacity>
                            )}

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
