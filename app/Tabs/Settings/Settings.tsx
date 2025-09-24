import {ScrollView, Text, TouchableOpacity, View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useAppContext} from "@/app/AppContext";
import {clearAuth} from "@/app/main-axios";

export default function Settings() {
    const {setAuthenticated, setShowLoginForm, setShowServerManager, selectedServer} = useAppContext();
    const insets = useSafeAreaInsets();


    const handleLogout = async () => {
        try {
            console.log('Logging out...');
            await clearAuth();
            setAuthenticated(false);
            setShowLoginForm(true);
            setShowServerManager(false);
            console.log('Logout complete, showing login form');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    return (
        <ScrollView className="flex-1 bg-dark-bg">
            <View className="p-6" style={{ paddingTop: insets.top + 20 }}>
                <Text className="text-3xl font-bold text-white mb-6" style={{ lineHeight: 36, includeFontPadding: false }}>
                    Settings
                </Text>

                <TouchableOpacity
                    onPress={handleLogout}
                    className="bg-red-600 px-6 py-3 rounded-lg"
                >
                    <Text className="text-white font-semibold">Logout</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    )
}