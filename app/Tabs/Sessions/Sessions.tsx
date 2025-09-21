import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Keyboard, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTerminalSessions } from '@/app/contexts/TerminalSessionsContext';
import Terminal from '@/app/Tabs/Sessions/Terminal';
import TabBar from '@/app/Tabs/Sessions/Navigation/TabBar';

export default function Sessions() {
    const insets = useSafeAreaInsets();
    const { sessions, activeSessionId, setActiveSession, removeSession } = useTerminalSessions();
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const hiddenInputRef = useRef<TextInput>(null);

    // Keyboard event listeners
    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
            setKeyboardHeight(e.endCoordinates.height);
            setIsKeyboardVisible(true);
        });

        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardHeight(0);
            setIsKeyboardVisible(false);
        });

        return () => {
            keyboardDidShowListener?.remove();
            keyboardDidHideListener?.remove();
        };
    }, []);

    // Force keyboard to stay open when in sessions tab
    useFocusEffect(
        React.useCallback(() => {
            // Focus the hidden input to keep keyboard open
            setTimeout(() => {
                hiddenInputRef.current?.focus();
            }, 100);
            
            return () => {
                // Don't blur the input when leaving - keep keyboard persistent
            };
        }, [])
    );

    // Keep focus on hidden input when keyboard is dismissed
    useEffect(() => {
        if (!isKeyboardVisible && sessions.length > 0) {
            setTimeout(() => {
                hiddenInputRef.current?.focus();
            }, 100);
        }
    }, [isKeyboardVisible, sessions.length]);

    const handleTabPress = (sessionId: string) => {
        setActiveSession(sessionId);
    };

    const handleTabClose = (sessionId: string) => {
        removeSession(sessionId);
    };

    const activeSession = sessions.find(session => session.id === activeSessionId);

    return (
        <KeyboardAvoidingView 
            className="flex-1 bg-dark-bg" 
            style={{ 
                paddingTop: insets.top,
                paddingBottom: keyboardHeight > 0 ? 0 : insets.bottom
            }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <View 
                className="flex-1"
                style={{
                    marginBottom: keyboardHeight > 0 ? keyboardHeight : 0
                }}
            >
                {sessions.map((session) => (
                    <Terminal
                        key={session.id}
                        hostConfig={{
                            id: session.host.id,
                            name: session.host.name,
                            ip: session.host.ip,
                            port: session.host.port,
                            username: session.host.username,
                            authType: session.host.authType,
                            password: session.host.password,
                            key: session.host.key,
                            keyPassword: session.host.keyPassword,
                            keyType: session.host.keyType,
                            credentialId: session.host.credentialId,
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
            
            <TabBar
                sessions={sessions}
                activeSessionId={activeSessionId}
                onTabPress={handleTabPress}
                onTabClose={handleTabClose}
            />
            
            {/* Hidden TextInput to maintain keyboard focus */}
            <TextInput
                ref={hiddenInputRef}
                style={{
                    position: 'absolute',
                    top: -1000,
                    left: -1000,
                    width: 1,
                    height: 1,
                    opacity: 0,
                    color: 'transparent',
                    backgroundColor: 'transparent',
                }}
                autoFocus={true}
                showSoftInputOnFocus={true}
                keyboardType="default"
                returnKeyType="done"
                blurOnSubmit={false}
                onSubmitEditing={() => {
                    // Refocus immediately to prevent keyboard dismissal
                    setTimeout(() => {
                        hiddenInputRef.current?.focus();
                    }, 10);
                }}
                onBlur={() => {
                    // Refocus immediately when blurred to prevent keyboard dismissal
                    setTimeout(() => {
                        hiddenInputRef.current?.focus();
                    }, 10);
                }}
            />
        </KeyboardAvoidingView>
    );
}