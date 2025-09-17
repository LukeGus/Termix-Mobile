import {TextInput, View, TouchableOpacity, Text} from "react-native";
import {useAppContext} from "./AppContext";

export default function ServerManager() {
    const { setShowServerManager } = useAppContext();

    const handleClose = () => {
        setShowServerManager(false);
    };

    return (
        <View className="flex-1 bg-blue-100">
            {/* Close button */}
            <View className="absolute top-12 right-4 z-10">
                <TouchableOpacity 
                    onPress={handleClose}
                    className="bg-red-500 px-4 py-2 rounded-lg"
                >
                    <Text className="text-white font-semibold">Close</Text>
                </TouchableOpacity>
            </View>
            
            {/* Main content */}
            <View className="flex-1 justify-center px-5">
                <TextInput 
                    className="bg-white p-4 rounded-lg text-lg"
                    placeholder="Enter server details..."
                />
            </View>
        </View>
    )
}