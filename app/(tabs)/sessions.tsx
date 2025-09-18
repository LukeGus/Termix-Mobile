import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import TerminalWebView from '../components/TerminalWebView';

export default function SessionsScreen() {
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
      <View className="bg-gray-800 p-4 border-b border-gray-700">
        <View className="flex-row items-center justify-between">
          <Text className="text-white text-lg font-semibold">
            Terminal Sessions
          </Text>
          <TouchableOpacity
            onPress={() => setShowTerminal(!showTerminal)}
            className="bg-blue-600 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-medium">
              {showTerminal ? 'Hide Terminal' : 'Show Terminal'}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mt-2">
          <Text className="text-gray-300 text-sm">
            Connected to: {testHostConfig.name} ({testHostConfig.ip}:{testHostConfig.port})
          </Text>
          <Text className="text-gray-400 text-xs">
            User: {testHostConfig.username} | Auth: {testHostConfig.authType}
          </Text>
        </View>
      </View>

      {showTerminal && (
        <View className="flex-1">
          <TerminalWebView
            hostConfig={testHostConfig}
            isVisible={showTerminal}
            title="Test Terminal"
          />
        </View>
      )}

      {!showTerminal && (
        <ScrollView className="flex-1">
          <View className="p-6">
            <Text className="text-white text-xl font-semibold mb-4">
              Terminal Sessions
            </Text>
            <Text className="text-gray-300 mb-4">
              This is where your terminal sessions will be displayed.
            </Text>
            <View className="bg-gray-800 p-4 rounded-lg">
              <Text className="text-white font-medium mb-2">Test Connection</Text>
              <Text className="text-gray-300 text-sm mb-1">
                Host: {testHostConfig.name}
              </Text>
              <Text className="text-gray-300 text-sm mb-1">
                IP: {testHostConfig.ip}:{testHostConfig.port}
              </Text>
              <Text className="text-gray-300 text-sm mb-1">
                User: {testHostConfig.username}
              </Text>
              <Text className="text-gray-300 text-sm">
                Auth: {testHostConfig.authType}
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}