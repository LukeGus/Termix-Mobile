import { View, Text, ScrollView, TouchableOpacity } from 'react-native';

export default function SettingsScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-6">
        <Text className="text-2xl font-bold text-gray-800 mb-6">
          Settings
        </Text>
        
        <View className="space-y-4">
          <View className="bg-white rounded-lg p-4 shadow-sm">
            <Text className="text-lg font-semibold text-gray-800 mb-2">
              Account
            </Text>
            <Text className="text-gray-600">
              Manage your account settings
            </Text>
          </View>
          
          <View className="bg-white rounded-lg p-4 shadow-sm">
            <Text className="text-lg font-semibold text-gray-800 mb-2">
              Notifications
            </Text>
            <Text className="text-gray-600">
              Configure notification preferences
            </Text>
          </View>
          
          <View className="bg-white rounded-lg p-4 shadow-sm">
            <Text className="text-lg font-semibold text-gray-800 mb-2">
              Appearance
            </Text>
            <Text className="text-gray-600">
              Customize the app appearance
            </Text>
          </View>
          
          <View className="bg-white rounded-lg p-4 shadow-sm">
            <Text className="text-lg font-semibold text-gray-800 mb-2">
              About
            </Text>
            <Text className="text-gray-600">
              App version and information
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
