import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useAppContext } from '../AppContext';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Server = {
  name: string;
  ip: string;
};

export default function HostsScreen() {
  const { setShowServerManager, setShowLoginForm, setSelectedServer, refreshServers } = useAppContext();
  const [servers, setServers] = useState<Server[]>([]);

  const loadServers = async () => {
    try {
      const savedServers = await AsyncStorage.getItem('servers');
      if (savedServers) {
        setServers(JSON.parse(savedServers));
      }
    } catch (error) {
      console.error('Error loading servers:', error);
    }
  };

  useEffect(() => {
    loadServers();
  }, [refreshServers]);

  const handleOpenServerForm = () => {
    setShowServerManager(true);
  };

  const handleServerPress = (server: Server) => {
    setSelectedServer(server);
    setShowLoginForm(true);
  };

  // If no servers saved, show server form
  if (servers.length === 0) {
    return (
      <View className="flex-1 bg-dark-bg">
        <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <View className="p-6">
            <Text className="text-3xl font-bold text-white mb-4">
              Hosts
            </Text>
            <Text className="text-lg text-gray-300 mb-8">
              Connect to your servers
            </Text>
            
            <TouchableOpacity
              onPress={handleOpenServerForm}
              className="bg-blue-600 px-8 py-4 rounded-lg mb-6"
            >
              <Text className="text-white text-lg font-semibold text-center">
                Connect to Server
              </Text>
            </TouchableOpacity>
            
            <View className="bg-dark-bg-panel rounded-lg p-6 border border-dark-border-panel">
              <Text className="text-white text-center text-lg mb-2">Ready to connect</Text>
              <Text className="text-gray-400 text-center">Enter your server details to get started</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // If servers are saved, show the list
  return (
    <View className="flex-1 bg-dark-bg">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View className="p-6">
          <Text className="text-3xl font-bold text-white mb-4">
            Hosts
          </Text>
          <Text className="text-lg text-gray-300 mb-8">
            Select a server to connect
          </Text>
          
          <TouchableOpacity
            onPress={handleOpenServerForm}
            className="bg-blue-600 px-8 py-4 rounded-lg mb-6"
          >
            <Text className="text-white text-lg font-semibold text-center">
              Add New Server
            </Text>
          </TouchableOpacity>
          
          <View className="space-y-4">
            {servers.map((server, index) => (
              <TouchableOpacity 
                key={index} 
                onPress={() => handleServerPress(server)}
                className="bg-dark-bg-panel rounded-lg p-4 border border-dark-border-panel"
              >
                <Text className="text-lg font-semibold text-white mb-2">
                  {server.name}
                </Text>
                <Text className="text-gray-300">{server.ip}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}