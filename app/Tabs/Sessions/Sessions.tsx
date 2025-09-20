import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTerminalSessions } from '@/app/contexts/TerminalSessionsContext';
import Terminal from '@/app/Tabs/Sessions/Terminal';
import TabBar from '@/app/Tabs/Sessions/Navigation/TabBar';

export default function Sessions() {
    const insets = useSafeAreaInsets();
    const { sessions, activeSessionId, setActiveSession, removeSession } = useTerminalSessions();

    // Force keyboard to stay open when in sessions tab
    useFocusEffect(
        React.useCallback(() => {
            // Keep keyboard open for terminal input
            // The WebView will handle keyboard input automatically
            
            return () => {
                // Hide keyboard when leaving sessions tab
                Keyboard.dismiss();
            };
        }, [])
    );

    const handleTabPress = (sessionId: string) => {
        setActiveSession(sessionId);
    };

    const handleTabClose = (sessionId: string) => {
        removeSession(sessionId);
    };

    const activeSession = sessions.find(session => session.id === activeSessionId);

    return (
        <View className="flex-1 bg-dark-bg" style={{ paddingTop: insets.top }}>
            <View className="flex-1">
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
        </View>
    );
}