import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useAppContext } from '../AppContext';

export default function HostsScreen() {
  const { setShowServerManager } = useAppContext();

  const handleOpenServerManager = () => {
    setShowServerManager(true);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        <View className="p-6">
          <Text className="text-3xl font-bold text-gray-800 mb-4">
            Hosts
          </Text>
          <Text className="text-lg text-gray-600 mb-8">
            Manage your server connections
          </Text>
          
          <TouchableOpacity
            onPress={handleOpenServerManager}
            className="bg-blue-500 px-8 py-4 rounded-lg mb-6"
          >
            <Text className="text-white text-lg font-semibold text-center">
              Add New Host
            </Text>
          </TouchableOpacity>
          
          <View className="space-y-4">
            <View className="bg-white rounded-lg p-4 shadow-sm">
              <Text className="text-lg font-semibold text-gray-800 mb-2">
                Local Development
              </Text>
              <Text className="text-gray-600 mb-2">localhost:3000</Text>
              <View className="flex-row space-x-2">
                <View className="w-3 h-3 bg-green-500 rounded-full"></View>
                <Text className="text-green-600 text-sm">Connected</Text>
              </View>
            </View>
            
            <View className="bg-white rounded-lg p-4 shadow-sm">
              <Text className="text-lg font-semibold text-gray-800 mb-2">
                Production Server
              </Text>
              <Text className="text-gray-600 mb-2">prod.example.com</Text>
              <View className="flex-row space-x-2">
                <View className="w-3 h-3 bg-red-500 rounded-full"></View>
                <Text className="text-red-600 text-sm">Disconnected</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}