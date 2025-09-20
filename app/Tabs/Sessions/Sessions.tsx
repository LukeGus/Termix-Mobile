import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTerminalSessions } from '@/app/contexts/TerminalSessionsContext';
import Terminal from '@/app/Tabs/Sessions/Terminal';
import TabBar from '@/app/Tabs/Sessions/Navigation/TabBar';

export default function Sessions() {
    const insets = useSafeAreaInsets();
    const { sessions, activeSessionId, setActiveSession, removeSession } = useTerminalSessions();

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
                {activeSession ? (
                    <Terminal
                        hostConfig={{
                            id: activeSession.host.id,
                            name: activeSession.host.name,
                            ip: activeSession.host.ip,
                            port: activeSession.host.port,
                            username: activeSession.host.username,
                            authType: activeSession.host.authType,
                            password: activeSession.host.password,
                            key: activeSession.host.key,
                            keyPassword: activeSession.host.keyPassword,
                            keyType: activeSession.host.keyType,
                            credentialId: activeSession.host.credentialId,
                        }}
                        isVisible={true}
                        title={activeSession.title}
                    />
                ) : (
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
            
            <View style={{ height: insets.bottom }} />
        </View>
    );
}