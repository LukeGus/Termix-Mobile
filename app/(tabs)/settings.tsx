import {View, Text, ScrollView, TouchableOpacity} from 'react-native';
import {clearAuth} from "@/app/main-axios";
import {useAppContext} from "@/app/AppContext";

export default function SettingsScreen() {
    const {setAuthenticated, setShowLoginForm, setShowServerManager, selectedServer} = useAppContext();


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
            <View className="p-6">
                <Text className="text-2xl font-bold text-white mb-6">
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
    );
}
