import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppContext } from './AppContext';

export default function AuthCallback() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { setAuthenticated, setShowLoginForm } = useAppContext();

    useEffect(() => {
        // This route handles OIDC callbacks
        // The actual OIDC handling is done in LoginForm.tsx
        // This route just redirects back to the main app
        
        // If we have a code parameter, it means OIDC callback was successful
        if (params.code) {
            // Redirect to the main app
            router.replace('/');
        } else {
            // No code means error or cancellation
            router.replace('/');
        }
    }, [params.code, router]);

    return (
        <View style={{ 
            flex: 1, 
            justifyContent: 'center', 
            alignItems: 'center', 
            backgroundColor: '#09090b' 
        }}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={{ 
                color: '#ffffff', 
                marginTop: 16, 
                fontSize: 16 
            }}>
                Processing authentication...
            </Text>
        </View>
    );
}
