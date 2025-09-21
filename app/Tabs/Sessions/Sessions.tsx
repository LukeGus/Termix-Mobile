import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useTerminalSessions } from '@/app/contexts/TerminalSessionsContext';
import { useKeyboard } from '@/app/contexts/KeyboardContext';
import Terminal from '@/app/Tabs/Sessions/Terminal';
import TabBar from '@/app/Tabs/Sessions/Navigation/TabBar';
import { ArrowLeft } from 'lucide-react-native';

export default function Sessions() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { sessions, activeSessionId, setActiveSession, removeSession } = useTerminalSessions();
    const { keyboardHeight, isKeyboardVisible } = useKeyboard();

    // Force keyboard to stay open when in sessions tab (only if there are sessions)
    useFocusEffect(
        React.useCallback(() => {
            // Only show keyboard if there are active sessions
            if (sessions.length > 0) {
                // Focus on the terminal WebView instead of hidden input
                setTimeout(() => {
                    // The terminal will handle keyboard focus
                }, 500);
            }
            
            return () => {
                // Don't blur when leaving - keep keyboard persistent
            };
        }, [sessions.length])
    );

    const handleTabPress = (sessionId: string) => {
        setActiveSession(sessionId);
    };

    const handleTabClose = (sessionId: string) => {
        removeSession(sessionId);
    };

    const activeSession = sessions.find(session => session.id === activeSessionId);

    return (
        <View 
            className="flex-1 bg-dark-bg" 
            style={{ 
                paddingTop: insets.top,
            }}
        >

            <View 
                style={{
                    flex: 1,
                    marginBottom: keyboardHeight > 0 ? keyboardHeight + 60 : 60, // Space for keyboard + tab bar
                }}
            >
                {sessions.map((session) => (
                    <Terminal
                        key={session.id}
                        hostConfig={{
                            id: parseInt(session.host.id.toString()),
                            name: session.host.name,
                            ip: session.host.ip,
                            port: parseInt(session.host.port.toString()),
                            username: session.host.username,
                            authType: session.host.authType,
                            password: session.host.password,
                            key: session.host.key,
                            keyPassword: session.host.keyPassword,
                            keyType: session.host.keyType,
                            credentialId: session.host.credentialId ? parseInt(session.host.credentialId.toString()) : undefined,
                        }}
                        isVisible={session.id === activeSessionId}
                        title={session.title}
                        onClose={() => handleTabClose(session.id)}
                    />
                ))}
                
                {sessions.length === 0 && (
                    <View className="flex-1 justify-center items-center">
                        <Text className="text-white text-lg">
                            No active terminal sessions
                        </Text>
                        <Text className="text-white text-sm mt-2">
                            Connect to a host from the Hosts tab to start a terminal session
                        </Text>
                    </View>
                )}
            </View>
            
            <View
                style={{
                    position: 'absolute',
                    bottom: keyboardHeight > 0 ? keyboardHeight : 0,
                    left: 0,
                    right: 0,
                    height: 60,
                }}
            >
                <TabBar
                    sessions={sessions}
                    activeSessionId={activeSessionId}
                    onTabPress={handleTabPress}
                    onTabClose={handleTabClose}
                />
            </View>
            
            
        </View>
    );
}