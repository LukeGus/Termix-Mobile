import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import Terminal from '@/app/Tabs/Sessions/Terminal';

export default function Sessions() {
    const [showTerminal, setShowTerminal] = useState(true);

    const testHostConfig = {
        id: 1,
        name: 'RackNerd #1',
        ip: '192.210.197.55',
        port: 22,
        username: 'bugattiguy527',
        authType: 'password' as const,
        password: 'bugatti$123',
        key: undefined,
        keyPassword: undefined,
        keyType: undefined,
        credentialId: undefined,
    };

    return (
        <View className="flex-1 bg-dark-bg">
            {showTerminal && (
                <View className="flex-1 mt-[50px]">
                    <Terminal
                        hostConfig={testHostConfig}
                        isVisible={showTerminal}
                        title="Test Terminal"
                    />
                </View>
            )}
        </View>
    );
}