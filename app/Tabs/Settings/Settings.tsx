import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppContext } from "@/app/AppContext";
import { clearAuth, clearServerConfig } from "@/app/main-axios";

export default function Settings() {
  const {
    setAuthenticated,
    setShowLoginForm,
    setShowServerManager,
    setSelectedServer,
    selectedServer,
  } = useAppContext();
  const insets = useSafeAreaInsets();

  const handleLogout = async () => {
    try {
      // Clear authentication token only (keep server config)
      await clearAuth();

      // Update app state to show login form (not server form)
      setAuthenticated(false);
      setShowLoginForm(true);
      setShowServerManager(false);
    } catch (error) {
      console.error("[Settings] Error during logout:", error);
    }
  };

  return (
    <ScrollView className="flex-1 bg-dark-bg">
      <View className="p-6" style={{ paddingTop: insets.top + 20 }}>
        <Text
          className="text-3xl font-bold text-white mb-6"
          style={{ lineHeight: 36, includeFontPadding: false }}
        >
          Settings
        </Text>

        <TouchableOpacity
          onPress={handleLogout}
          className="bg-red-600 px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">Logout</Text>
        </TouchableOpacity>

        <Text className="text-white mt-5">
          To delete your account, visit your self-hosted Termix instance and log
          in.
        </Text>
      </View>
    </ScrollView>
  );
}
