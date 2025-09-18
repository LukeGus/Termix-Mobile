import { View, Text, TouchableOpacity } from 'react-native';
import { useAppContext } from '../AppContext';
import { clearAuth } from '../main-axios';

export default function HostsScreen() {
  const { setAuthenticated, setShowLoginForm, setShowServerManager, selectedServer } = useAppContext();

  return (
    <View className="flex-1 bg-dark-bg p-6">
      <View className="flex-1 justify-center items-center">

      </View>
    </View>
  );
}