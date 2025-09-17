import { View, Text, ScrollView, TouchableOpacity } from 'react-native';

export default function SessionsScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-6">
        <Text className="text-3xl font-bold text-gray-800 mb-4">
          Sessions
        </Text>
        <Text className="text-lg text-gray-600 mb-8">
          Active terminal sessions
        </Text>
        
        <View className="space-y-4">
          <View className="bg-white rounded-lg p-4 shadow-sm">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-lg font-semibold text-gray-800">
                Development Session
              </Text>
              <View className="w-3 h-3 bg-green-500 rounded-full"></View>
            </View>
            <Text className="text-gray-600 mb-2">localhost:3000</Text>
            <Text className="text-sm text-gray-500">Started 2 hours ago</Text>
          </View>
          
          <View className="bg-white rounded-lg p-4 shadow-sm">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-lg font-semibold text-gray-800">
                Database Session
              </Text>
              <View className="w-3 h-3 bg-yellow-500 rounded-full"></View>
            </View>
            <Text className="text-gray-600 mb-2">localhost:5432</Text>
            <Text className="text-sm text-gray-500">Started 1 hour ago</Text>
          </View>
          
          <View className="bg-white rounded-lg p-4 shadow-sm">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-lg font-semibold text-gray-800">
                Production Session
              </Text>
              <View className="w-3 h-3 bg-red-500 rounded-full"></View>
            </View>
            <Text className="text-gray-600 mb-2">prod.example.com</Text>
            <Text className="text-sm text-gray-500">Disconnected</Text>
          </View>
        </View>
        
        <TouchableOpacity className="bg-gray-200 px-6 py-3 rounded-lg mt-6">
          <Text className="text-gray-700 text-center font-semibold">
            Start New Session
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}