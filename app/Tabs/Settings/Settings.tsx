import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAppContext } from "@/app/AppContext";
import { clearAuth, clearServerConfig } from "@/app/main-axios";

export default function Settings() {
  const router = useRouter();
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
      await clearAuth();

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

        {/* Keyboard Customization */}
        <View className="mb-6">
          <Text className="text-white text-lg font-semibold mb-3">Keyboard</Text>
          <TouchableOpacity
            onPress={() => router.push("/Tabs/Settings/KeyboardCustomization" as any)}
            className="bg-[#1a1a1a] border border-[#303032] px-6 py-4 rounded-lg flex-row items-center justify-between"
          >
            <View>
              <Text className="text-white font-semibold text-base">Customize Keyboard</Text>
              <Text className="text-gray-400 text-sm mt-1">
                Layouts, keys, and preferences
              </Text>
            </View>
            <Text className="text-green-500 text-xl">→</Text>
          </TouchableOpacity>
        </View>

        {/* Account */}
        <View className="mb-6">
          <Text className="text-white text-lg font-semibold mb-3">Account</Text>
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-red-600 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Logout</Text>
          </TouchableOpacity>

          <Text className="text-gray-400 text-sm mt-3">
            To delete your account, visit your self-hosted Termix instance and log
            in.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
