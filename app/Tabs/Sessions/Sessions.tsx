import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Keyboard, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
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
    const hiddenInputRef = useRef<TextInput>(null);

    // Force keyboard to stay open when in sessions tab (only if there are sessions)
    useFocusEffect(
        React.useCallback(() => {
            // Only show keyboard if there are active sessions
            if (sessions.length > 0) {
                setTimeout(() => {
                    hiddenInputRef.current?.focus();
                }, 500);
            }
            
            return () => {
                // Don't blur the input when leaving - keep keyboard persistent
            };
        }, [sessions.length])
    );

    // Keep keyboard open by refocusing when it gets dismissed
    useEffect(() => {
        if (sessions.length > 0 && !isKeyboardVisible) {
            const timeoutId = setTimeout(() => {
                hiddenInputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timeoutId);
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
            
            {/* Hidden TextInput to maintain keyboard focus - only when there are sessions */}
            {sessions.length > 0 && (
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
                    autoFocus={false}
                    showSoftInputOnFocus={true}
                    keyboardType="default"
                    returnKeyType="done"
                    blurOnSubmit={false}
                    editable={true}
                    onFocus={() => {
                        // Keep focus when focused
                    }}
                    onBlur={() => {
                        // Refocus when blurred to prevent keyboard dismissal
                        setTimeout(() => {
                            if (sessions.length > 0) {
                                hiddenInputRef.current?.focus();
                            }
                        }, 200);
                    }}
                    onSubmitEditing={() => {
                        // Refocus when submitted to prevent keyboard dismissal
                        setTimeout(() => {
                            if (sessions.length > 0) {
                                hiddenInputRef.current?.focus();
                            }
                        }, 200);
                    }}
                />
            )}
        </View>
    );
}